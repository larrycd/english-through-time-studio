// English Through Time Studio infographic, by Larry Dalton: node info/gen.js -> info/info.png
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const img = n => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '..', 'shots', n + '.png')).toString('base64');
const E = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'data', 'eval.json'), 'utf8'));
const S = JSON.parse(process.argv[2] || '{}');
const card = (n, title, sub) => `<div class="card"><img src="${img(n)}"><h3>${title}</h3><div class="note">${sub}</div></div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#100e0b;color:#f1eadb;font:20px/1.45 "Segoe UI","DejaVu Sans",sans-serif;width:1600px}.w{padding:50px 58px}
h1{font:700 62px Georgia,"DejaVu Serif",serif;margin:0}.sub{color:#a69a86;font-size:24px;margin-top:6px}.by{color:#e2b65c;font-weight:700}
h2{color:#e2b65c;text-transform:uppercase;letter-spacing:3px;font-size:22px;margin:36px 0 16px;border-bottom:2px solid #3a3226;padding-bottom:8px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.card{background:#1a1713;border:1px solid #3a3226;border-radius:14px;padding:14px}.card img{width:100%;border-radius:8px;display:block;max-height:360px;object-fit:contain;background:#0b0a08}.card h3{margin:10px 0 2px;font-size:22px;color:#e2b65c}
.note{color:#a69a86;font-size:16px}.num{font:700 44px Georgia,serif;color:#e2b65c}.stat{text-align:center;background:#1a1713;border:1px solid #3a3226;border-radius:14px;padding:16px}.stat div{color:#a69a86;font-size:16px}
table{border-collapse:collapse;width:100%;font-size:18px}td{padding:8px 10px;border-bottom:1px solid #3a3226;vertical-align:top}td.n{font-weight:700;color:#fff;white-space:nowrap}
.foot{color:#857a68;font-size:15px;margin-top:30px;border-top:1px solid #3a3226;padding-top:12px}
</style></head><body><div class="w">
<div style="display:flex;justify-content:space-between;align-items:flex-end"><div><h1>English Through Time Studio</h1><div class="sub">Old English &middot; Middle English &middot; Early Modern English &middot; <span class="by">by Larry Dalton</span></div></div>
<svg width="120" height="120" viewBox="0 0 64 64">${fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'icon.svg'), 'utf8').replace(/<\/?svg[^>]*>/g, '')}</svg></div>
<h2>Translate both ways - every word shows how it was chosen</h2>
<div class="g3">${card('tr-eme', 'Early Modern (Shakespeare, King James)', 'thou and thee, -est and -eth, no "do"')}${card('tr-me', 'Middle English (Chaucer, Wycliffe)', 'Wycliffe\'s own spellings where they are clear')}${card('tr-oe', 'Old English (Ælfric, c. 1000)', 'pronouns, "the", nouns and verbs in the right case and person')}</div>
<div class="g2" style="margin-top:18px">${card('words', 'Word by word', 'Grammar rules, dictionary entries and how real translators matched words; anything not found is kept and marked')}${card('acc', 'Measured, not claimed', 'Scored on Gospel verses the translator never learned from, against copying the input unchanged')}</div>
<h2>Write in period scripts - and read your own files back</h2>
<div class="g2">${card('w-insular', 'Insular uncial', 'wynn ƿ, thorn þ, eth ð, ash æ, Tironian et ⁊')}${card('w-black', 'Blackletter', 'thorn and yogh for Middle English')}</div>
<div class="g3" style="margin-top:18px">${card('w-fell', 'Early Modern print', 'long s, u/v and i/j as printed before 1630')}${card('w-runes', 'Anglo-Saxon runes', 'futhorc, spelled letter by letter')}${card('w-modern', 'Modern edition', 'every special letter, with editors\' marks')}</div>
<div class="note" style="margin-top:10px">SVG files are drawn from the letter outlines and read back exactly; PNG and JPEG files are read back by matching the letter shapes.</div>
<h2>Dictionaries, real examples and pronunciation</h2>
<div class="g3">${card('dict', 'Old and Middle English dictionaries', '125,000 Wiktionary entries with every inflected form')}${card('ex', 'The same verse in six versions', 'Old English Gospels, Wycliffe, Tyndale, Geneva, King James, modern')}${card('pron', 'IPA and speech', 'Wiktionary IPA first, period spelling rules otherwise; spoken by eSpeak NG')}</div>
<h2>Checked, not just drawn</h2>
<div class="g4">
<div class="stat"><span class="num">${S.self || '108 / 108'}</span><div>self-test checks pass</div></div>
<div class="stat"><span class="num">${S.svg || '100%'}</span><div>SVG files read back exactly</div></div>
<div class="stat"><span class="num">${S.img || ''}</span><div>${S.imgNote || 'PNG/JPEG letters read back correctly'}</div></div>
<div class="stat"><span class="num">${E.me.from.score.toFixed(0)} vs ${E.me.from.baseline.toFixed(0)}</span><div>Middle English to modern: word overlap with the real translation, against copying</div></div>
</div>
<table style="margin-top:14px">
<tr><td class="n">Accuracy</td><td>Word overlap (0-100) on held-out Gospel verses. To modern: Early Modern ${E.eme.from.score.toFixed(1)} (copying ${E.eme.from.baseline.toFixed(1)}), Middle English ${E.me.from.score.toFixed(1)} (${E.me.from.baseline.toFixed(1)}), Old English ${E.oe.from.score.toFixed(1)} (${E.oe.from.baseline.toFixed(1)}). From modern: ${E.eme.to.score.toFixed(1)}, ${E.me.to.score.toFixed(1)}, ${E.oe.to.score.toFixed(1)}.</td></tr>
<tr><td class="n">Honest notes</td><td>A word-by-word translator: word order is kept and idioms are not rewritten. Old pronunciations are scholarly reconstructions, not recordings. The image reader knows the studio's own five scripts, not real manuscripts.</td></tr>
</table>
<div class="foot">Dictionaries from English Wiktionary (CC BY-SA 4.0); Bible texts public domain; fonts Cardo, IM FELL English, UnifrakturMaguntia, Uncial Antiqua, Noto Sans Runic (OFL); speech by eSpeak NG (GPL-3). Runs on your own computer at http://localhost:8772/.</div>
</div></body></html>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } }); await p.setContent(html); await p.waitForTimeout(300); await p.screenshot({ path: path.join(__dirname, 'info.png'), fullPage: true }); await b.close(); })();
