# Tools

- `build_data.py`: builds `src/app/data` from the source downloads in `sources/` (not in the repository):
  `wiktionary-ang.json`, `wiktionary-enm.json` (kaikki.org compact exports), the scrollmapper Bible JSON files
  (`KJV`, `Wycliffe`, `Tyndale`, `Geneva1599`, `BSB`) and `wessex-gospels-full.json`. Pass `--align` to retrain the word alignment (about 4 minutes).
- `build_fonts.py`: subsets the five fonts in `sources/fonts/` and fills missing letters from Cardo; writes `src/app/fonts` and `glyphs.json`.
- `shots.js`, `infographic.js`: screenshots and the infographic.
