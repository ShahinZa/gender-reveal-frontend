# Baby Reveal frontend

React and Vite frontend for babyreveal.party. Use Node 22, run `npm ci`, then `npm run dev`. Set `VITE_API_URL` to the API origin; production defaults to `https://backend.babyreveal.party`.

## Checks

- `npm run build` produces the `build/` directory.
- `npm audit` checks application and development dependencies.
- `npm run test:e2e` runs Chrome and mobile WebKit flows against an isolated MongoDB/API. Clone `baby-reveal-backend` beside this repository and run `npm ci` there first. Install browser binaries using `npx playwright install chromium webkit` (the suite also recognizes locally installed macOS Chrome).

The browser suite covers signup, both sample demos, secret selection and locking, preview isolation, password gates, host/guest synchronization, late joins, reconnects, delayed responses, settings save/retry, themes, timers, emojis, custom music, sound/mute, clipboard fallback, keyboard dialogs and narrow screens. The tests create temporary accounts only in the local test database.

## Release

Build and deploy with Wrangler using `wrangler.json`. The production Worker is `gender-reveal-frontend`. Deploy this frontend before the matching backend: reveal status negotiates legacy string WebSocket joins or protocol 2 authenticated joins. Keep the previous Worker version available for rollback.

Signup loads its own route chunk without reveal animations or audio code. The dashboard prioritizes sharing the Secret Keeper link; sample previews never select or reveal the real answer. Settings saves are serialized and awaited before opening a reveal or preview. Transient API failures keep the saved login and show retry actions.

Automated WebKit checks support Safari compatibility but do not replace testing on physical iPhones and party networks.
