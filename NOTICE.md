# Notices

English Through Time Studio is by Larry Dalton.

- `src/app/data/ang*.json`, `enm*.json`: Old English and Middle English entries of English Wiktionary, extracted by
  Wiktextract and published by kaikki.org, under CC BY-SA 4.0 (details and changes in `src/app/licenses/Wiktionary-CC-BY-SA-4.0.txt`).
  These files are shared under the same licence.
- `src/app/data/parallel.json`, `align.json`, `heldout.json`: Wycliffe, Tyndale, Geneva and King James Bibles and the
  Berean Standard Bible (public domain; scrollmapper bible_databases), and the West Saxon Gospels (public domain text).
- `src/app/data/cmu.tsv`: CMU Pronouncing Dictionary (BSD licence).
- `src/app/fonts/`: subsets of Cardo, IM FELL English, UnifrakturMaguntia, Uncial Antiqua and Noto Sans Runic
  (SIL Open Font Licence 1.1); letters missing from a face are copied in from Cardo.
- `src/app/vendor/hb.js`, `hb.wasm`, `hbjs.js`: HarfBuzz / harfbuzzjs (MIT).
- `src/app/vendor/espeak-ng.js`, `espeak-ng.wasm.part1/2`: npm package espeak-ng 1.0.2, a WebAssembly build of eSpeak NG
  (GPL-3.0). The two parts are the unmodified espeak-ng.wasm cut in half so each fits a web upload; the studio joins them
  when it loads. Source: https://github.com/espeak-ng/espeak-ng and https://github.com/ianmarmour/espeak-ng.js.
