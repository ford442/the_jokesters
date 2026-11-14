# tools/verification — manual Playwright checks

Ad-hoc Playwright scripts used to eyeball modes and UI in a running dev
server (`npm run dev`). They are not part of CI. Screenshots and videos they
write land in this folder and are git-ignored — attach them to the PR instead
of committing them.

```bash
pip install playwright && playwright install chromium
python tools/verification/verify_modes.py
```

`screenshot.js` is the Node equivalent for a single page capture.
