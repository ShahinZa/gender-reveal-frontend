import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const api = 'http://127.0.0.1:5101';
const password = 'test-password';
async function create(request, settings = {}) {
  const response = await request.post(`${api}/api/auth/register`, { data: { email: `browser-${crypto.randomUUID()}@example.test`, password } });
  expect(response.status()).toBe(201);
  const data = await response.json();
  const headers = { Authorization: `Bearer ${data.token}` };
  expect((await request.put(`${api}/api/auth/preferences`, { headers, data: { soundEnabled: false, countdownDuration: 3, animationIntensity: 'low', ...settings } })).ok()).toBeTruthy();
  return { ...data.user, token: data.token, headers };
}
async function login(page, user) { await page.addInitScript(token => localStorage.setItem('token', token), user.token); }
async function select(request, user, gender = 'girl') { expect((await request.post(`${api}/api/set-gender`, { data: { code: user.doctorCode, gender } })).ok()).toBeTruthy(); }
async function status(request, user) { return (await request.get(`${api}/api/status/${user.revealCode}`, { headers: user.headers })).json(); }
async function noOverflow(page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy(); }
async function reviewScreenshot(page, name) {
  if (!process.env.REVIEW_SCREENSHOTS) return;
  fs.mkdirSync(process.env.REVIEW_SCREENSHOTS, { recursive: true });
  await page.screenshot({ path: `${process.env.REVIEW_SCREENSHOTS}/${test.info().project.name}-${name}.png`, fullPage: true, animations: 'disabled' });
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.__errors = errors;
});
test.afterEach(async ({ page }) => { expect(page.__errors || []).toEqual([]); });

async function watchAudio(page) {
  await page.addInitScript(() => {
    window.__audio = [];
    window.Audio = new Proxy(window.Audio, { construct(Target, args) {
      const audio = new Target(...args); window.__audio.push(audio); return audio;
    } });
  });
}

test('enabled sound actually plays during countdown and celebration; muted mode stays silent', async ({ page, request }) => {
  const user = await create(request, { soundEnabled: true, countdownDuration: 5 });
  await select(request, user, 'boy');
  await watchAudio(page);
  await page.goto(`/reveal/${user.revealCode}`);
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await page.getByRole('button', { name: 'Reveal Now' }).click();
  await expect.poll(() => page.evaluate(() => window.__audio.some(audio => audio.dataset.source === '/drumroll.mp3' && !audio.paused && !audio.muted && audio.currentTime > 0))).toBe(true);
  await expect(page.getByRole('heading', { name: 'BOY!', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__audio.some(audio => audio.dataset.source === '/celebration.mp3' && !audio.paused && !audio.muted && audio.currentTime > 0))).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'Stay muted' }).click();
  await page.getByRole('button', { name: 'Reveal Now' }).click();
  await expect(page.getByRole('heading', { name: 'BOY!', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__audio.every(audio => audio.paused))).toBe(true);
});

test('failed settings save offers retry and preview waits for the latest settings', async ({ page, request }) => {
  const user = await create(request); await login(page, user);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /Customize The Big Reveal/ }).click();
  await page.route('**/api/auth/preferences', route => route.request().method() === 'PUT' ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Could not save"}' }) : route.continue());
  await page.getByRole('button', { name: 'Gold', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save');
  await page.unroute('**/api/auth/preferences');
  await page.getByRole('button', { name: 'Retry save' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  expect((await status(request,user)).preferences.theme).toBe('gold');
  await page.getByRole('button', { name: 'Rainbow', exact: true }).click();
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /Preview Boy/ }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/preview=true&gender=boy/);
  expect((await status(request,user)).preferences.theme).toBe('rainbow');
  await popup.close();
  await page.getByRole('button', { name: 'Purple', exact: true }).click();
  const cardPopupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Girl preview' }).click();
  const cardPopup = await cardPopupPromise;
  await expect(cardPopup).toHaveURL(/preview=true&gender=girl/);
  expect((await status(request,user)).preferences.theme).toBe('purple');
  await cardPopup.close();
});

test('guest catches up when a synchronized reveal starts before sound is enabled', async ({ page, request }) => {
  const user = await create(request, { soundEnabled: true, syncedReveal: true, countdownDuration: 5 });
  await select(request,user);
  await page.goto(`/reveal/${user.revealCode}`);
  await expect(page.getByRole('button', { name: 'Stay muted' })).toBeVisible();
  await request.post(`${api}/api/reveal`, { headers: user.headers, data: { code: user.revealCode } });
  await page.waitForTimeout(1500);
  await expect(page.getByRole('button', { name: 'Stay muted' })).toBeVisible();
  await page.getByRole('button', { name: 'Stay muted' }).click();
  await expect(page.getByRole('heading', { name: 'GIRL!', exact: true })).toBeVisible();
});

test('reveal mode keeps the latest choice during a slow save and supports keyboard selection', async ({ page, request }) => {
  const user = await create(request, { syncedReveal: true, theme: 'gold' });
  await login(page, user);
  await page.goto('/dashboard');
  const mode = page.getByRole('group', { name: 'How should guests reveal?' });
  const together = mode.getByRole('radio', { name: 'Everyone together' });
  const individual = mode.getByRole('radio', { name: 'At their own pace' });
  await expect(together).toBeChecked();
  let releaseFirst, firstSaved;
  const release = new Promise(resolve => { releaseFirst = resolve; });
  const saved = new Promise(resolve => { firstSaved = resolve; });
  let writes = 0;
  await page.route('**/api/auth/preferences', async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    const response = await route.fetch();
    if (++writes === 1) { firstSaved(); await release; }
    await route.fulfill({ response });
  });
  await individual.check();
  await expect(individual).toBeChecked();
  await saved;
  await expect(mode).toContainText('Saving…');
  await together.check();
  await expect(together).toBeChecked();
  releaseFirst();
  await expect(mode).toContainText('Saved automatically');
  await expect(together).toBeChecked();
  expect((await status(request, user)).preferences.syncedReveal).toBe(true);
  await page.unroute('**/api/auth/preferences');
  await page.reload();
  await expect(together).toBeChecked();
  await reviewScreenshot(page, 'reveal-mode-together');
  await together.focus();
  await page.keyboard.press('ArrowDown');
  await expect(individual).toBeChecked();
  await expect(mode).toContainText('Saved automatically');
  const preferences = (await status(request, user)).preferences;
  expect(preferences.syncedReveal).toBe(false);
  expect(preferences.theme).toBe('gold');
  await page.getByRole('button', { name: /Customize The Big Reveal/ }).click();
  await expect(page.getByRole('radio')).toHaveCount(2);
  await page.setViewportSize({ width: 320, height: 568 });
  await noOverflow(page);
});

test('reveal mode recovers from load and save failures without pretending a change saved', async ({ page, request }) => {
  const user = await create(request, { syncedReveal: true });
  await login(page, user);
  await page.route('**/api/auth/preferences', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Temporarily unavailable"}' }));
  await page.goto('/dashboard');
  const mode = page.getByRole('group', { name: 'How should guests reveal?' });
  await expect(mode).toContainText('Your saved choice couldn’t load.');
  await expect(mode.getByRole('radio').first()).toBeDisabled();
  await expect(mode.getByRole('radio').last()).toBeDisabled();
  await page.unroute('**/api/auth/preferences');
  await mode.getByRole('button', { name: 'Load again' }).click();
  await expect(mode.getByRole('radio', { name: 'Everyone together' })).toBeChecked();
  await page.route('**/api/auth/preferences', route => route.request().method() === 'PUT' ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Could not save"}' }) : route.continue());
  await mode.getByRole('radio', { name: 'At their own pace' }).check();
  await expect(mode).toContainText('Your changes haven’t saved.');
  expect((await status(request, user)).preferences.syncedReveal).toBe(true);
  await page.unroute('**/api/auth/preferences');
  await mode.getByRole('button', { name: 'Try saving again' }).click();
  await expect(mode).toContainText('Saved automatically');
  expect((await status(request, user)).preferences.syncedReveal).toBe(false);
  await page.reload();
  await expect(mode.getByRole('radio', { name: 'At their own pace' })).toBeChecked();
});

test('home explains the two links, and both demos can be played and closed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Keep the secret/ })).toBeVisible();
  await noOverflow(page);
  await reviewScreenshot(page, 'home');
  for (const gender of ['boy', 'girl']) {
    await page.getByRole('button', { name: `Try ${gender} demo` }).click();
    await expect(page.getByRole('heading', { name: `${gender.toUpperCase()}!`, exact: true })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Close Demo', exact: true }).last().click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.waitForTimeout(200);
    expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1);
  }
});

test('signup is lightweight, keyboard-accessible, and leads to the secret keeper action', async ({ page }) => {
  const scripts=[]; page.on('request', req => { if (req.resourceType() === 'script') scripts.push(req.url()); });
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: 'Create your free reveal' })).toBeVisible();
  expect(scripts.some(url => /RevealPage|useAudio/.test(url))).toBeFalsy();
  expect(await page.getByLabel('Email', {exact:true}).evaluate(node => getComputedStyle(node).backdropFilter)).toBe('none');
  await reviewScreenshot(page, 'signup');
  await page.getByLabel('Email', {exact:true}).fill(`signup-${crypto.randomUUID()}@example.test`);
  await page.getByLabel('Password', {exact:true}).fill(password);
  await page.getByRole('button', { name: 'Show password', exact:true }).first().click();
  await expect(page.getByLabel('Password', {exact:true})).toHaveAttribute('type', 'text');
  await page.getByLabel('Confirm password', {exact:true}).fill(password);
  await page.getByRole('button', {name:'Create my reveal',exact:true}).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading',{name:'Send this to your secret keeper'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Boy preview'})).toBeVisible();
  await noOverflow(page);
  await reviewScreenshot(page, 'dashboard');
});

test('secret selection supports confirmation, back, saving, and permanent locking', async ({ page, request }) => {
  const user=await create(request);
  await page.goto(`/secret/${user.doctorCode}`);
  await page.getByRole('button', { name: /Boy$/ }).click();
  await expect(page.getByRole('heading', { name:'Is this correct?' })).toBeVisible();
  await page.getByRole('button', {name:'Back', exact:true}).click();
  await page.getByRole('button', {name:/Girl$/}).click();
  await page.getByRole('button',{name:'Yes, lock it'}).click();
  await expect(page.getByRole('heading',{name:'Done!'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Already Done'})).toBeVisible();
  expect((await status(request,user)).gender).toBeUndefined();
});

test('preview never changes the real secret or reveal status', async ({ page, request }) => {
  const user=await create(request, { customMessage: "It's our little surprise & joy" });
  await login(page,user);
  await select(request,user,'girl');
  await page.goto(`/reveal/${user.revealCode}?preview=true&gender=boy`);
  await page.getByRole('button',{name:'Reveal Now'}).click();
  await expect(page.getByRole('heading',{name:'BOY!',exact:true})).toBeVisible();
  await expect(page.getByText("It's our little surprise & joy",{exact:true})).toBeVisible();
  expect((await status(request,user)).isRevealed).toBe(false);
  await page.goto(`/reveal/${user.revealCode}`);
  await page.getByRole('button',{name:'Reveal Now'}).click();
  await expect(page.getByRole('heading',{name:'GIRL!',exact:true})).toBeVisible();
  await noOverflow(page);
});

test('password gate stays closed on errors, then allows the reveal and survives reload', async ({ page, request }) => {
  const user=await create(request);
  await select(request,user);
  await request.put(`${api}/api/auth/reveal-password`, {headers:user.headers,data:{enabled:true,password:'guest-pass'}});
  await page.goto(`/reveal/${user.revealCode}`);
  await expect(page.getByRole('heading',{name:'Password Protected'})).toBeVisible();
  await page.getByLabel('Reveal password').fill('wrong');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Invalid password');
  await page.getByLabel('Reveal password').fill('guest-pass');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Reveal Now'}).click();
  await expect(page.getByRole('heading',{name:'GIRL!',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Reveal Now'})).toBeVisible();
});

test('host and guests reveal together, and late guests join the completed reveal', async ({ page, browser, request }) => {
  const user=await create(request,{syncedReveal:true,countdownDuration:5});
  await select(request,user,'boy');
  await login(page,user);
  const guestContext=await browser.newContext(); const guest=await guestContext.newPage();
  try {
    await page.goto(`/reveal/${user.revealCode}`);
    await guest.goto(`http://127.0.0.1:3000/reveal/${user.revealCode}`);
    await expect(guest.getByRole('button',{name:'Reveal Now'})).toHaveCount(0);
    await expect(guest.getByText('Are you the host?')).toBeVisible();
    await page.getByRole('button',{name:'Reveal Now'}).click();
    await expect(page.getByRole('heading',{name:'BOY!',exact:true})).toBeVisible();
    await expect(guest.getByRole('heading',{name:'BOY!',exact:true})).toBeVisible();
    await guest.reload();
    await expect(guest.getByRole('heading',{name:'BOY!',exact:true})).toBeVisible();
  } finally { await guestContext.close(); }
});

test('a delayed host response does not restart the synchronized countdown', async ({ page, request }) => {
  const user = await create(request, { syncedReveal: true, countdownDuration: 5 });
  await select(request, user, 'boy');
  await login(page, user);
  let joined = false;
  page.on('websocket', socket => socket.on('framereceived', event => {
    if (String(event.payload).includes('viewer-count')) joined = true;
  }));
  await page.route('**/api/reveal', async route => {
    const response = await route.fetch();
    await new Promise(resolve => setTimeout(resolve, 2500));
    await route.fulfill({ response });
  });
  await page.goto(`/reveal/${user.revealCode}`);
  await expect.poll(() => joined).toBe(true);
  const started = Date.now();
  await page.getByRole('button', { name: 'Reveal Now' }).click();
  await expect(page.getByRole('heading', { name: 'BOY!', exact: true })).toBeVisible({ timeout: 8000 });
  expect(Date.now() - started).toBeLessThan(8000);
});

test('settings save rapid changes, all themes and durations, emojis, and a custom message', async ({ page, request }) => {
  const user=await create(request); await login(page,user);
  await page.goto('/dashboard');
  await page.getByRole('button',{name:/Customize The Big Reveal/}).click();
  for(const name of ['Classic','Purple','Gold','Rainbow']) await page.getByRole('button',{name,exact:true}).click();
  for(const name of ['3 seconds','5 seconds','10 seconds']) await page.getByRole('button',{name,exact:true}).click();
  await page.getByRole('button',{name:'Skin tone Medium', exact:true}).click();
  await page.getByRole('button',{name:'Boy emoji 🚀',exact:true}).click();
  await page.getByRole('button',{name:'Girl emoji 🌸',exact:true}).click();
  for (const name of ['Low Best for phones', 'Medium Most devices', 'High Fast devices']) await page.getByRole('button',{name, exact:true}).click();
  await page.locator('input[maxlength="100"]').fill("Mom & Dad can't wait!");
  await expect(page.getByText('Saved',{exact:true})).toBeVisible();
  const data=await status(request,user);
  expect(data.preferences.theme).toBe('rainbow'); expect(data.preferences.countdownDuration).toBe(10); expect(data.preferences.customMessage).toBe("Mom & Dad can't wait!");
  expect(data.preferences.boyEmoji).toBe('🚀'); expect(data.preferences.girlEmoji).toBe('🌸'); expect(data.preferences.animationIntensity).toBe('high');
  await page.reload();
  await page.getByRole('button',{name:/Customize The Big Reveal/}).click();
  await expect(page.locator('input[maxlength="100"]')).toHaveValue("Mom & Dad can't wait!");
});

test('music upload survives settings edits and can be deleted', async ({ page, request }) => {
  const user=await create(request, { soundEnabled: true }); await login(page,user);
  await page.goto('/dashboard');
  await page.getByRole('button',{name:/Customize The Big Reveal/}).click();
  const upload = page.locator('input[type=file]').first();
  await upload.setInputFiles({name:'test-drumroll.mp3',mimeType:'audio/mpeg',buffer:fs.readFileSync('public/drumroll.mp3')});
  await expect(page.locator('[title="test-drumroll.mp3"]')).toBeVisible();
  await page.getByRole('button',{name:'Purple',exact:true}).click();
  await expect(page.getByText('Saved',{exact:true})).toBeVisible();
  const data=await status(request,user);
  expect(data.preferences.customAudio.countdown.fileName).toBe('test-drumroll.mp3');
  const audio=await request.get(`${api}${data.preferences.customAudio.countdown.url}`); expect(audio.ok()).toBeTruthy();
  expect((await audio.body()).length).toBe(fs.statSync('public/drumroll.mp3').size);
  await page.getByRole('button', {name:'Remove countdown audio'}).click();
  await expect(page.getByText('Using default drumroll', {exact:true})).toBeVisible();
  expect((await status(request,user)).preferences.customAudio.countdown).toBeNull();
});

test('custom music plays through a password-protected reveal', async ({ page, request }) => {
  const user = await create(request, { soundEnabled: true, countdownDuration: 5 });
  for (const [type, file] of [['countdown', 'drumroll.mp3'], ['celebration', 'celebration.mp3']]) {
    const response = await request.post(`${api}/api/auth/audio/${type}`, { headers: user.headers, data: { fileName: file, audioData: `data:audio/mpeg;base64,${fs.readFileSync(`public/${file}`).toString('base64')}` } });
    expect(response.ok()).toBeTruthy();
  }
  await select(request,user);
  await request.put(`${api}/api/auth/reveal-password`, { headers:user.headers, data:{ enabled:true, password:'music-pass' } });
  await watchAudio(page);
  await page.goto(`/reveal/${user.revealCode}`);
  await page.getByLabel('Reveal password').fill('music-pass');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Enable sound',exact:true}).click();
  await page.getByRole('button',{name:'Reveal Now'}).click();
  await expect.poll(() => page.evaluate(() => window.__audio.some(audio => audio.dataset.source?.includes('/countdown?') && !audio.paused && audio.currentTime > 0))).toBe(true);
  await expect(page.getByRole('heading',{name:'GIRL!',exact:true})).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__audio.some(audio => audio.dataset.source?.includes('/celebration?') && !audio.paused && !audio.muted && audio.currentTime > 0))).toBe(true);
});

test('disconnected guest resynchronizes when the connection returns', async ({ page, request, context }) => {
  const user = await create(request, { syncedReveal:true, countdownDuration:5 });
  await select(request,user);
  await page.goto(`/reveal/${user.revealCode}`);
  await expect(page.getByRole('heading',{name:'Get ready...'})).toBeVisible();
  await context.setOffline(true);
  await request.post(`${api}/api/reveal`, {headers:user.headers,data:{code:user.revealCode}});
  await page.waitForTimeout(1500);
  await context.setOffline(false);
  await expect(page.getByRole('heading',{name:'GIRL!',exact:true})).toBeVisible({timeout:20000});
});

test('rollout stays compatible with legacy string-only WebSocket joins', async ({ page, request }) => {
  const user = await create(request, { syncedReveal:true });
  await select(request,user);
  await page.route('**/api/status/*',async route => {
    const response=await route.fetch(); const data=await response.json(); delete data.realtimeProtocol;
    await route.fulfill({response,json:data});
  });
  await page.goto(`/reveal/${user.revealCode}`);
  await expect(page.getByRole('heading',{name:'Get ready...'})).toBeVisible();
  await request.post(`${api}/api/reveal`, {headers:user.headers,data:{code:user.revealCode}});
  await expect(page.getByRole('heading',{name:'GIRL!',exact:true})).toBeVisible();
});

test('temporary backend failure preserves sign-in and provides a working retry', async ({ page, request }) => {
  const user=await create(request); await login(page,user);
  await page.route('**/api/auth/me',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporarily unavailable'})}));
  await page.goto('/dashboard');
  await expect(page.getByRole('heading',{name:'Let’s reconnect'})).toBeVisible();
  expect(await page.evaluate(()=>!!localStorage.getItem('token'))).toBe(true);
  await page.unroute('**/api/auth/me');
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Your Gender Reveal'})).toBeVisible();
});

test('QR dialog and clipboard failure have useful feedback, and keyboard dismissal works', async ({ page, request }) => {
  const user=await create(request); await login(page,user);
  await page.goto('/dashboard');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedLink=text;}}}));
  await page.getByRole('button',{name:'Copy Secret Keeper link'}).click();
  await expect(page.getByRole('button',{name:'Link copied',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.__copiedLink)).toBe(`http://127.0.0.1:3000/secret/${user.doctorCode}`);
  await expect(page.getByRole('button',{name:'Open for someone beside me'})).toBeVisible();
  await reviewScreenshot(page, 'copied-link');
  await page.getByRole('button',{name:'Copy guest link'}).click();
  expect(await page.evaluate(()=>window.__copiedLink)).toBe(`http://127.0.0.1:3000/reveal/${user.revealCode}`);
  await expect(page.getByRole('button',{name:'Copy Secret Keeper link'})).toBeVisible();
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Not allowed'))}}));
  await page.getByRole('button',{name:'Copy Secret Keeper link'}).click();
  await expect(page.getByRole('status')).toContainText('Copying is unavailable');
  await expect(page.getByRole('dialog')).toBeVisible();
  await noOverflow(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('small screens and unknown or invalid links never produce a blank page', async ({ page, request }) => {
  await page.setViewportSize({width:320,height:568});
  for(const path of ['/','/auth','/missing-page','/reveal/INVALIDCODE']) { await page.goto(path); await expect(page.locator('h1')).toBeVisible(); await noOverflow(page); }
  const user=await create(request); await page.goto(`/secret/${user.doctorCode}`); await expect(page.getByRole('button',{name:/Girl$/})).toBeVisible(); await noOverflow(page);
});
