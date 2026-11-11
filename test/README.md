# Tests

Engine tests (Node, no browser):
- `node test/tr.js`: 51 translation cases in every direction.
- `node test/eval.js`: accuracy on the held-out Gospel verses (`--save` writes `src/app/data/eval.json`).
- `node test/robust.js`: every 7th verse through every direction, plus odd input; `robust2.js`: IPA for every word, odd text in every script, speech.
- `node test/svg.js`, `img.js`: SVG and image read-back in every script.

Browser tests (serve `src/app` on port 8772 first, e.g. `python3 test/serve.py src/app`; Playwright):
- `ui.js`: loads the studio and runs the Self-test page (108 checks).
- `exhaustive.js [n]`: n real verses per script, 4 sizes, 4 styles, PNG and JPEG at 1x and 2x, read back and compared.
- `shots.js`: screenshots of every view.
