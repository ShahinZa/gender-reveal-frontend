// Render the code-native SVG favicon and social card. Requires Playwright Chromium.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch(fs.existsSync(chrome) ? { executablePath: chrome } : {});
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const svg = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf8');
  const icons = [];
  for (const size of [16, 32, 180]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:#0f172a}svg{display:block;width:100%;height:100%}</style>${svg}`);
    const png = await page.screenshot();
    if (size === 32 || size === 180) fs.writeFileSync(path.join(root, 'public', size === 32 ? 'favicon-32.png' : 'apple-touch-icon.png'), png);
    if (size < 180) icons.push({ size, png });
  }
  const header = Buffer.alloc(6 + icons.length * 16);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(icons.length, 4);
  let offset = header.length;
  icons.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = size; header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  fs.writeFileSync(path.join(root, 'public/favicon.ico'), Buffer.concat([header, ...icons.map(icon => icon.png)]));
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:radial-gradient(ellipse at 85% 45%,#343064,transparent 65%),#0f172a;color:white;font-family:Arial,sans-serif;padding:64px 76px}.brand{font-size:25px;font-weight:700;color:#e2e8f0}.brand span{color:#f9a8d4}h1{font-size:72px;line-height:1.1;letter-spacing:-2.5px;margin:62px 0 25px}h1 span{color:#d8b4fe}.sub{font-size:25px;color:#cbd5e1;line-height:1.5}.tags{display:flex;gap:14px;margin-top:34px}.tags span{font-size:18px;padding:11px 17px;border:1px solid #6b5e8c;border-radius:24px;color:#f5d0fe}.icon{position:absolute;right:85px;top:165px;width:250px;height:250px}.icon svg{width:100%;height:100%}</style><div class="brand">babyreveal<span>.party</span></div><h1>Keep the secret.<br><span>Share the surprise.</span></h1><div class="sub">Free online gender reveals.<br>One special moment, wherever your family is.</div><div class="tags"><span>100% free</span><span>Encrypted answer</span><span>No guest account</span></div><div class="icon">${svg}</div>`);
  await page.screenshot({ path: path.join(root, 'public/social-card.png') });
  console.log('Generated 16/32px ICO, 32px PNG, 180px Apple icon, and 1200×630 social card.');
} finally { await browser.close(); }
