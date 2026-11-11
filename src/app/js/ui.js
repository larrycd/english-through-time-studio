/* English Through Time Studio - page - by Larry Dalton */
'use strict';
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var READY = { fonts: false, dict: false };
var PN = { oe: 'Old English', me: 'Middle English', eme: 'Early Modern', mod: 'Modern English' };
var SCRIPT_CLASS = { modern: 'ca', fell: 'fe', black: 'bl', insular: 'un', runes: 'ru' };
async function j(u) { var r = await fetch(u); if (!r.ok) throw new Error(u + ': ' + r.status); return r.json(); }
async function buf(u) { var r = await fetch(u); if (!r.ok) throw new Error(u + ': ' + r.status); return new Uint8Array(await r.arrayBuffer()); }
function download(name, blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
function segOn(id, attr, val) { document.querySelectorAll('#' + id + ' button').forEach(function (b) { b.classList.toggle('on', b.dataset[attr] === val); }); }
function segVal(id, attr) { var b = document.querySelector('#' + id + ' button.on'); return b ? b.dataset[attr] : null; }
function makeSeg(id, items, attr, val, onPick) {
  $(id).innerHTML = items.map(function (x) { return '<button data-' + attr + '="' + x[0] + '"' + (x[0] === val ? ' class="on"' : '') + '>' + esc(x[1]) + '</button>'; }).join('');
  $(id).querySelectorAll('button').forEach(function (b) { b.onclick = function () { segOn(id, attr, b.dataset[attr]); if (onPick) onPick(b.dataset[attr]); }; });
}

/* ---------------- navigation */
document.querySelectorAll('#nav button').forEach(function (b) { b.onclick = function () { show(b.dataset.v); }; });
function show(v) {
  document.querySelectorAll('#nav button').forEach(function (x) { x.classList.toggle('on', x.dataset.v === v); });
  document.querySelectorAll('.view').forEach(function (x) { x.classList.toggle('on', x.id === 'v-' + v); });
  if (v === 'write') updateWrite();
}

/* ---------------- loading */
(async function load() {
  try {
    var hb = hbjs(await createHarfBuzz({ locateFile: function (f) { return 'vendor/' + f; } }));
    ET.setShaper(hb);
    ET.loadGlyphs(await j('data/glyphs.json'));
    for (var k of ['ca', 'fe', 'bl', 'un', 'ru']) ET.loadFont(k, await buf('fonts/ET' + k.toUpperCase() + '.ttf'));
    READY.fonts = true;
    $('ver').textContent = 'loading dictionaries…';
    ET.load('cmu', await (await fetch('data/cmu.tsv')).text());
    ET.load('align', await j('data/align.json'));
    var parts = await j('data/parts.json');
    for (var dn of ['enm', 'ang']) { var rows = []; for (var pi = 1; pi <= parts[dn]; pi++) rows = rows.concat(await j('data/' + dn + pi + '.json')); ET.load(dn, rows); }
    ET.load('parallel', await j('data/parallel.json'));
    ET.load('heldout', await j('data/heldout.json'));
    ET.load('eval', await j('data/eval.json'));
    READY.dict = true;
    $('ver').textContent = 'engine ' + ET.version + ' · ' + ET.D.ang.length.toLocaleString('en-AU') + ' Old English and ' + ET.D.enm.length.toLocaleString('en-AU') + ' Middle English dictionary entries · ' + Object.keys(ET.D.par.v).length.toLocaleString('en-AU') + ' verses in six versions';
    $('foot').textContent = 'loaded ' + new Date().toLocaleString('en-AU');
    $('dcount').textContent = '';
    showAccuracy(); doTranslate(); doDict(); doExamples(); updateWrite();
  } catch (e) { $('ver').innerHTML = '<span style="color:var(--bad)">Could not load: ' + esc(e.message) + '</span>'; console.error(e); }
})();
function needDict(el) { if (READY.dict) return false; $(el).innerHTML = '<span class="loading">Still loading the dictionaries…</span>'; return true; }

/* ---------------- Translate */
var PER = [['mod', 'Modern'], ['eme', 'Early Modern (1500–1700)'], ['me', 'Middle English (1150–1500)'], ['oe', 'Old English (450–1150)']];
makeSeg('tfrom', PER, 'p', 'mod', function (v) { if (v === segVal('tto', 'p')) segOn('tto', 'p', v === 'mod' ? 'eme' : 'mod'); doTranslate(); });
makeSeg('tto', PER, 'p', 'eme', function (v) { if (v === segVal('tfrom', 'p')) segOn('tfrom', 'p', v === 'mod' ? 'eme' : 'mod'); doTranslate(); });
var SAMPLES = [
  ['mod', 'Do you know where the king went? I do not know, but he will come home tomorrow.'],
  ['mod', 'She has a good heart and she loves her children.'],
  ['mod', 'The old man gave his son a sword.'],
  ['mod', 'Why do you weep? Do not be afraid.'],
  ['eme', 'Knowest thou not that I am thy father? Thou hast spoken unto them.'],
  ['eme', 'But, soft! what light through yonder window breaks? It is the east, and Juliet is the sun.'],
  ['me', 'Whan that Aprill with his shoures soote the droghte of March hath perced to the roote'],
  ['me', 'And he seide to hem, Y am the good schepherde.'],
  ['oe', 'Fæder ūre þū þe eart on heofonum, sī þīn nama ġehālgod.'],
  ['oe', 'Hwæt! We Gardena in geardagum þeodcyninga þrym gefrunon.']
];
$('tsample').innerHTML = '<option value="">choose…</option>' + SAMPLES.map(function (s, i) { return '<option value="' + i + '">' + esc(PN[s[0]] + ': ' + s[1].slice(0, 46) + (s[1].length > 46 ? '…' : '')) + '</option>'; }).join('');
$('tsample').onchange = function () { var s = SAMPLES[+$('tsample').value]; if (!s) return; segOn('tfrom', 'p', s[0]); segOn('tto', 'p', s[0] === 'mod' ? 'eme' : 'mod'); $('tsrc').value = s[1]; doTranslate(); };
$('tgo').onclick = doTranslate; $('tyou').onchange = doTranslate; $('tarch').onchange = doTranslate;
var tt = null; $('tsrc').oninput = function () { clearTimeout(tt); tt = setTimeout(doTranslate, 350); };
$('tswap').onclick = function () { var f = segVal('tfrom', 'p'), t = segVal('tto', 'p'); if (LAST_T && LAST_T.text) $('tsrc').value = LAST_T.text; segOn('tfrom', 'p', t); segOn('tto', 'p', f); doTranslate(); };
$('tback').onclick = $('tswap').onclick;
$('tcopy').onclick = function () { navigator.clipboard.writeText($('tout').textContent); };
var LAST_T = null;
var SCRIPT_FOR = { oe: 'insular', me: 'black', eme: 'fell', mod: 'modern' };
$('ttowrite').onclick = function () { if (!LAST_T) return; $('wsrc').value = LAST_T.text; W.script = SCRIPT_FOR[LAST_T.to] || 'modern'; W.opts = {}; segOn('wscript', 's', W.script); show('write'); };
$('ttopron').onclick = function () { if (!LAST_T) return; $('psrc').value = LAST_T.text; segOn('plang', 'p', LAST_T.to); show('pron'); doPron(); };
function doTranslate() {
  if (needDict('tout')) return;
  var from = segVal('tfrom', 'p'), to = segVal('tto', 'p'), src = $('tsrc').value;
  var r = ET.translate(src, from, to, { you: $('tyou').value, archaic: $('tarch').checked });
  LAST_T = r;
  $('tout').textContent = r.text; $('tout').className = 'big ' + (to === 'oe' ? 'ca' : 'ca');
  $('trate').textContent = { draft: 'Draft', rough: 'Rough', unusable: 'Not usable' }[r.rating]; $('trate').className = 'rating ' + r.rating;
  $('trate2').textContent = ET.RATING[r.rating].replace(/^[^:]+: /, '');
  $('tchecks').innerHTML = r.checks.map(function (c) { return '<li class="' + (c.ok === true ? 'ok' : c.ok === false ? 'bad' : '') + '">' + esc(c.t) + '</li>'; }).join('');
  $('tvia').textContent = r.via ? 'Translated through modern English: ' + r.via : '';
  $('twords').innerHTML = r.words.filter(function (w) { return !w.punct; }).map(function (w) {
    return '<tr' + (w.ok ? '' : ' class="miss"') + '><td class="w">' + esc(w.en) + '</td><td class="w">' + (w.skip || w.t === '' ? '<span class="hint">(left out)</span>' : esc(w.t)) + '</td><td>' + esc(w.how || '') + '</td></tr>';
  }).join('');
}
function showAccuracy() {
  var E = ET.D.eval; if (!E) return;
  $('tacc').innerHTML = ['eme', 'me', 'oe'].map(function (p) {
    var e = E[p]; return '<div><div class="hint">' + PN[p] + ' &middot; ' + e.verses + ' test verses</div>' +
      '<div>To modern: <b>' + e.from.score.toFixed(1) + '</b> <span class="hint">(baseline ' + e.from.baseline.toFixed(1) + ')</span></div>' +
      '<div>From modern: <b>' + e.to.score.toFixed(1) + '</b> <span class="hint">(baseline ' + e.to.baseline.toFixed(1) + ')</span></div>' +
      '<div class="hint">' + e.unknownFrom.toFixed(1) + '% of old words not found</div></div>';
  }).join('');
}

/* ---------------- Write */
var W = { script: 'insular', opts: {}, svg: '', text: '', seq: 0 };
makeSeg('wscript', Object.keys(ET.SCRIPTS).map(function (k) { return [k, ET.SCRIPTS[k].name]; }), 's', W.script, function (v) { W.script = v; W.opts = {}; updateWrite(); });
['wtheme', 'wsize', 'wwidth'].forEach(function (id) { $(id).onchange = updateWrite; });
var wt = null; $('wsrc').oninput = function () { clearTimeout(wt); wt = setTimeout(updateWrite, 250); };
function drawOpts() {
  var o = ET.optsFor(W.script, W.opts);
  $('wopts').innerHTML = (ET.SCRIPT_OPTS[W.script] || []).map(function (x) { return '<label class="ck"><input type="checkbox" data-o="' + x[0] + '"' + (o[x[0]] ? ' checked' : '') + '> ' + esc(x[1]) + '</label>'; }).join('');
  $('wopts').querySelectorAll('input').forEach(function (c) { c.onchange = function () { W.opts[c.dataset.o] = c.checked; updateWrite(); }; });
}
function updateWrite() {
  if (!READY.fonts) return;
  drawOpts();
  $('wnote').textContent = ET.SCRIPTS[W.script].note;
  var text = ET.scriptText($('wsrc').value, W.script, W.opts), size = +$('wsize').value, width = +$('wwidth').value;
  W.text = text;
  var miss = ET.missing(text, W.script);
  $('wmiss').textContent = miss.length ? 'Not in this script, left out: ' + miss.join(' ') : '';
  W.svg = ET.render(text, { script: W.script, size: size, width: width, theme: $('wtheme').value });
  $('stage').innerHTML = W.svg;
  $('wtext').textContent = text; $('wtext').className = 'big ' + SCRIPT_CLASS[W.script];
  checkWrite(text);
}
function norm(s) { return String(s).replace(/\s+/g, ' ').trim().replace(/ ?([᛫᛬]) ?/g, '$1'); } // a runic line may break next to a word divider
function checkWrite(text) {
  var seq = ++W.seq, want = norm(text.split('').filter(function (c) { return !ET.missing(c, W.script).length || /\s/.test(c); }).join(''));
  var r = ET.readSVG(W.svg), got = r.ok ? norm(r.text) : '';
  var ok1 = r.ok && got === want && r.script === W.script;
  $('chk1').className = 'badge ' + (ok1 ? 'ok' : 'bad'); $('chk1').textContent = ok1 ? '✓ SVG reads back exactly' : '✗ SVG read-back differs';
  $('wread').textContent = 'SVG: ' + (r.ok ? r.text : r.reason);
  $('chk2').className = 'badge wait'; $('chk2').textContent = 'PNG read-back…';
  rasterOf(W.svg, 'png', 1).then(function (id) {
    if (seq !== W.seq) return;
    var rr = ET.readImage(id, 'auto'), g2 = rr.ok ? norm(rr.text) : '';
    var ok2 = rr.ok && g2 === want;
    $('chk2').className = 'badge ' + (ok2 ? 'ok' : 'bad');
    $('chk2').textContent = ok2 ? '✓ PNG reads back exactly' : rr.ok ? '✗ PNG read-back: ' + diffCount(g2, want) + ' letter(s) differ' : '✗ PNG not read';
    $('wread').textContent += '\nPNG: ' + (rr.ok ? rr.text + '\n(script: ' + ET.SCRIPTS[rr.script].name + ', match ' + Math.round(rr.confidence * 100) + '%)' : rr.reason);
  });
}
function diffCount(a, b) { var A = Array.from(a), B = Array.from(b), n = Math.max(A.length, B.length), d = 0; var dp = []; for (var i = 0; i <= A.length; i++) { dp[i] = [i]; } for (var k = 0; k <= B.length; k++) dp[0][k] = k; for (i = 1; i <= A.length; i++) for (k = 1; k <= B.length; k++) dp[i][k] = Math.min(dp[i - 1][k] + 1, dp[i][k - 1] + 1, dp[i - 1][k - 1] + (A[i - 1] === B[k - 1] ? 0 : 1)); return dp[A.length][B.length]; }
function rasterOf(svg, fmt, scale) {
  return new Promise(function (res, rej) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      var x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
      if (fmt === 'jpeg') { var u = c.toDataURL('image/jpeg', 0.85), im2 = new Image(); im2.onload = function () { x.drawImage(im2, 0, 0); res(x.getImageData(0, 0, c.width, c.height)); }; im2.src = u; }
      else res(x.getImageData(0, 0, c.width, c.height));
    };
    img.onerror = rej;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function fname(ext) { return 'english-through-time-' + W.script + '-' + new Date().toISOString().slice(0, 10) + '.' + ext; }
$('exSvg').onclick = function () { download(fname('svg'), new Blob([W.svg], { type: 'image/svg+xml' })); };
function exportRaster(fmt) { var img = new Image(); img.onload = function () { var c = document.createElement('canvas'); c.width = img.width * 2; c.height = img.height * 2; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(function (b) { download(fname(fmt === 'jpeg' ? 'jpg' : 'png'), b); }, 'image/' + fmt, 0.92); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(W.svg); }
$('exPng').onclick = function () { exportRaster('png'); };
$('exJpg').onclick = function () { exportRaster('jpeg'); };
$('cpText').onclick = function () { navigator.clipboard.writeText(W.text); };

/* ---------------- Dictionary */
makeSeg('dlang', [['oe', 'Old English'], ['me', 'Middle English']], 'l', 'oe', function () { doDict(); });
makeSeg('ddir', [['old', 'Old word → English'], ['en', 'English word → old']], 'd', 'old', function () { doDict(); });
var dt = null; $('dq').oninput = function () { clearTimeout(dt); dt = setTimeout(doDict, 250); };
function entryHTML(r, period, why) {
  var R = ET.ROW, g = r[R.g], forms = r[R.f] || [], ex = r[R.ex] || [];
  var h = '<div class="ent"><span class="hw">' + esc(r[R.w]) + '</span><span class="pos">' + esc(r[R.p]) + (r[R.gen] ? ' · ' + { m: 'masculine', f: 'feminine', n: 'neuter' }[r[R.gen]] : '') + '</span>' +
    (r[R.ipa] ? '<span class="ipa">' + esc(r[R.ipa]) + '</span>' : '') + '<button class="b" data-say="' + esc(r[R.w]) + '" data-p="' + period + '">🔊</button>' + (why ? ' <span class="hint">' + esc(why) + '</span>' : '');
  h += '<ol>' + g.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
  ex.forEach(function (q) { h += '<div class="q">' + esc(q[0]) + (q[1] ? ' <span class="e">— ' + esc(q[1]) + '</span>' : '') + (q[2] ? ' <span class="e">(' + esc(q[2].slice(0, 120)) + ')</span>' : '') + '</div>'; });
  var fs = forms.filter(function (f) { return !/canonical|romanization/.test(f[1]); });
  if (fs.length) h += '<details><summary>' + fs.length + ' forms</summary><table>' + fs.slice(0, 80).map(function (f) { return '<tr><td>' + esc(f[0]) + '</td><td class="hint">' + esc(f[1]) + '</td></tr>'; }).join('') + '</table></details>';
  if (r[R.alt] && r[R.alt].length) h += '<div class="ety">Also spelled or see: ' + esc(r[R.alt].join(', ')) + '</div>';
  if (r[R.et]) h += '<div class="ety">' + esc(r[R.et]) + '</div>';
  return h + '</div>';
}
function doDict() {
  if (needDict('dres')) return;
  var period = segVal('dlang', 'l'), dir = segVal('ddir', 'd'), q = $('dq').value.trim(), dn = ET.dictName(period), I = ET.D.idx[dn], rows = ET.D[dn], R = ET.ROW;
  if (!q) { $('dres').innerHTML = ''; return; }
  var out = [], seen = {};
  if (dir === 'old') {
    var key = (period === 'oe' ? ET.keyOE : ET.keyME)(q.toLowerCase());
    (I.head[key] || []).forEach(function (i) { if (!seen[i]) { seen[i] = 1; out.push([i, '']); } });
    (I.form[key] || []).forEach(function (x) { if (!seen[x[0]]) { seen[x[0]] = 1; out.push([x[0], 'form: ' + x[1]]); } });
    if (!out.length) Object.keys(I.head).forEach(function (k) { if (out.length < 30 && k.indexOf(key) === 0) I.head[k].forEach(function (i) { if (!seen[i]) { seen[i] = 1; out.push([i, 'begins with "' + q + '"']); } }); });
  } else {
    var lw = q.toLowerCase().replace(/^to /, '');
    (I.rev[lw] || []).slice().sort(function (a, b) { return a[1] - b[1]; }).forEach(function (x) { if (!seen[x[0]]) { seen[x[0]] = 1; out.push([x[0], '']); } });
  }
  $('dres').innerHTML = out.length ? '<div class="hint">' + out.length + ' entr' + (out.length === 1 ? 'y' : 'ies') + (out.length > 60 ? ' (first 60 shown)' : '') + '</div>' + out.slice(0, 60).map(function (o) { return entryHTML(rows[o[0]], period, o[1]); }).join('') : '<div class="hint">Nothing found for "' + esc(q) + '" in the ' + PN[period] + ' dictionary.</div>';
  $('dres').querySelectorAll('button[data-say]').forEach(function (b) { b.onclick = function () { sayWord(b.dataset.say, b.dataset.p, b); }; });
}

/* ---------------- Examples */
function doExamples(rand) {
  if (needDict('xres')) return;
  var P = ET.D.par, cols = P.cols;
  if ($('xcol').options.length < 2) $('xcol').innerHTML += cols.map(function (c, i) { return '<option value="' + i + '">in ' + esc(c) + '</option>'; }).join('');
  $('xcount').textContent = Object.keys(P.v).length.toLocaleString('en-AU') + ' verses.';
  var q = $('xq').value.trim(), list;
  if (rand) { var ks = Object.keys(P.v).filter(function (k) { return P.v[k][0]; }); var k = ks[Math.floor(Math.random() * ks.length)]; list = [[k, P.v[k]]]; q = ''; }
  else list = ET.examples(q, $('xcol').value === '' ? undefined : +$('xcol').value, 40);
  var re = q ? new RegExp('(\\b' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b)', 'gi') : null;
  $('xres').innerHTML = list.length ? list.map(function (v) {
    return '<div class="verse"><div class="ref">' + esc(v[0]) + '</div>' + v[1].map(function (t, i) { if (!t) return ''; var h = esc(t); if (re) h = h.replace(re, '<span class="hit">$1</span>'); return '<div class="col"><div class="lab">' + esc(cols[i]) + '</div><div class="tx">' + h + '</div></div>'; }).join('') + '</div>';
  }).join('') + (list.length >= 40 ? '<div class="hint">First 40 verses shown.</div>' : '') : '<div class="hint">No verse contains "' + esc(q) + '".</div>';
}
$('xgo').onclick = function () { doExamples(); }; $('xrand').onclick = function () { doExamples(true); };
$('xq').onkeydown = function (e) { if (e.key === 'Enter') doExamples(); };

/* ---------------- Pronounce */
makeSeg('plang', [['oe', 'Old English (c. 1000)'], ['me', 'Middle English (Chaucer, c. 1390)'], ['eme', 'Early Modern (Shakespeare, c. 1600)'], ['mod', 'Modern (British)']], 'p', 'me', function () { doPron(); });
$('pgo').onclick = function () { doPron(); };
var PR = null;
async function doPron() {
  if (needDict('pipa')) return;
  var period = segVal('plang', 'p'), text = $('psrc').value;
  $('pstat').textContent = 'working…';
  try {
    PR = await ET.textIPA(text, period); PR.period = period;
    $('pipa').textContent = '[' + PR.ipa + ']';
    $('pwords').innerHTML = PR.words.map(function (w) { return '<div class="pw"><div class="t">' + esc(w.w) + '</div><div class="i">' + esc(w.ipa) + '</div><div class="s">' + esc(w.src) + '</div></div>'; }).join('');
    $('pnote').textContent = { oe: 'Old English as reconstructed for around the year 1000: every letter is sounded (cniht has its k), h before a consonant or at the end of a syllable is the "ch" of loch, y is a rounded ü, and long vowels are held. The voice is a Swedish one, which has these sounds.', me: 'Chaucer\'s London English as reconstructed: final -e is a light "uh", gh is the "ch" of loch, vowels have their European values ("name" rhymes with "calmer"), and every r is rolled. The voice is a Swedish one, which has these sounds.', eme: 'Shakespeare\'s English as reconstructed around 1600, starting from today\'s British pronunciation: r is sounded after vowels, "time" and "house" begin near "uh", and "meat" and "name" have a long e. A reconstruction, not a recording.', mod: 'Today\'s British English from eSpeak NG.' }[period];
    $('pstat').textContent = '';
  } catch (e) { $('pstat').textContent = 'Could not make IPA: ' + e.message; }
}
async function speak(ipa, period, statusEl) {
  var r = await ET.speakIPA(ipa, period, +$('pspeed').value);
  var url = URL.createObjectURL(new Blob([r.wav], { type: 'audio/wav' }));
  $('paudio').src = url; $('paudio').style.display = 'block'; await $('paudio').play().catch(function () { });
  if (statusEl) statusEl.textContent = r.dropped.length ? 'Sounds the voice does not have were left out: ' + r.dropped.join(' ') : '';
  return r;
}
$('pplay').onclick = async function () {
  try { if (!PR || PR.period !== segVal('plang', 'p')) await doPron(); $('pstat').textContent = 'making speech (the first time takes a few seconds)…'; await speak(PR.ipa, PR.period, $('pstat')); if (/making/.test($('pstat').textContent)) $('pstat').textContent = ''; }
  catch (e) { $('pstat').textContent = 'Speech failed: ' + e.message; }
};
async function sayWord(w, period, btn) {
  try { btn.disabled = true; var r = ET.wordIPA(w, period); await speak(r.ipa, period, null); } catch (e) { alertLine('Speech failed: ' + e.message); } finally { btn.disabled = false; }
}
function alertLine(t) { $('ver').textContent = t; }

/* ---------------- Read image */
$('rscript').innerHTML += Object.keys(ET.SCRIPTS).map(function (k) { return '<option value="' + k + '">' + esc(ET.SCRIPTS[k].name) + '</option>'; }).join('');
$('drop').onclick = function () { $('rfile').click(); };
$('drop').ondragover = function (e) { e.preventDefault(); $('drop').classList.add('over'); };
$('drop').ondragleave = function () { $('drop').classList.remove('over'); };
$('drop').ondrop = function (e) { e.preventDefault(); $('drop').classList.remove('over'); if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]); };
$('rfile').onchange = function () { if ($('rfile').files[0]) readFile($('rfile').files[0]); };
var LAST_R = null;
function showRead(r) {
  LAST_R = r;
  $('rbadge').style.display = 'inline-flex';
  if (!r.ok) { $('rbadge').className = 'badge bad'; $('rbadge').textContent = 'Not read'; $('rinfo').textContent = r.reason; $('rtext').textContent = ''; $('rplain').textContent = ''; return; }
  $('rbadge').className = 'badge ok'; $('rbadge').textContent = r.how === 'svg' ? 'Read exactly from the letter outlines' : 'Read from the letter shapes';
  $('rinfo').textContent = ET.SCRIPTS[r.script].name + (r.how === 'image' ? ' · average shape match ' + Math.round(r.confidence * 100) + '%' + (r.uncertain ? ' · ' + r.uncertain + ' uncertain letter(s)' : '') + (r.fixed ? ' · ' + r.fixed + ' look-alike letter(s) settled by the dictionaries' : '') : '');
  $('rtext').textContent = r.text; $('rtext').className = 'big ' + SCRIPT_CLASS[r.script]; $('rplain').textContent = r.plain;
}
function readFile(f) {
  if (!READY.fonts) return;
  var fr = new FileReader();
  if (/svg/.test(f.type) || /\.svg$/i.test(f.name)) { fr.onload = function () { $('preview').style.display = 'block'; $('preview').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fr.result); showRead(ET.readSVG(fr.result)); }; fr.readAsText(f); return; }
  fr.onload = function () {
    var img = new Image();
    img.onload = function () {
      $('preview').style.display = 'block'; $('preview').src = fr.result;
      var sc = Math.min(1, 2400 / img.width), c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      var x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
      $('rinfo').textContent = 'reading…';
      setTimeout(function () { showRead(ET.readImage(x.getImageData(0, 0, c.width, c.height), $('rscript').value)); }, 30);
    };
    img.onerror = function () { showRead({ ok: false, reason: 'This file could not be opened as an image.' }); };
    img.src = fr.result;
  };
  fr.readAsDataURL(f);
}
$('rcopy').onclick = function () { if (LAST_R && LAST_R.ok) navigator.clipboard.writeText(LAST_R.plain); };
$('rtotr').onclick = function () { if (!LAST_R || !LAST_R.ok) return; $('tsrc').value = LAST_R.plain; var p = { insular: 'oe', runes: 'oe', black: 'me', fell: 'eme', modern: 'mod' }[LAST_R.script]; segOn('tfrom', 'p', p); segOn('tto', 'p', p === 'mod' ? 'eme' : 'mod'); show('translate'); doTranslate(); };

/* ---------------- Self-test */
$('runTest').onclick = runTests;
async function runTests() {
  var log = [], pass = 0, fail = 0;
  function check(name, ok, detail) { if (ok) pass++; else fail++; log.push((ok ? '✓ ' : '✗ ') + name + (ok ? '' : '   → ' + (detail === undefined ? '' : detail))); $('tlog').textContent = log.join('\n'); $('tstat').textContent = pass + ' passed, ' + fail + ' failed'; }
  $('runTest').disabled = true; $('tlog').textContent = '';
  try {
    if (!READY.dict) { check('dictionaries loaded', false, 'still loading'); return; }
    var T = [
      ['mod','eme','I love you.','I love thee.'],
      ['mod','eme','You love me.','Thou lovest me.'],
      ['mod','eme','He loves her.','He loveth her.'],
      ['mod','eme','She has a book.','She hath a book.'],
      ['mod','eme','You have a book.','Thou hast a book.'],
      ['mod','eme','You are my friend.','Thou art my friend.'],
      ['mod','eme','You were there.','Thou wast there.'],
      ['mod','eme','Do you know him?','Knowest thou him?'],
      ['mod','eme','I do not know him.','I know him not.'],
      ['mod','eme','He does not know.','He knoweth not.'],
      ['mod','eme','Did you see it?','Sawest thou it?'],
      ['mod','eme','Can you hear me?','Canst thou hear me?'],
      ['mod','eme','You will go.','Thou wilt go.'],
      ['mod','eme','You shall not pass.','Thou shalt not pass.'],
      ['mod','eme','Where are you going?','Where art thou going?'],
      ['mod','eme','Your father is here.','Thy father is here.'],
      ['mod','eme','Your eyes are blue.','Thine eyes are blue.'],
      ['mod','eme','Do not be afraid.','Be not afraid.'],
      ['mod','eme','Go home.','Go home.'],
      ['mod','eme','The king says that he will come.','The king saith that he will come.'],
      ['mod','eme','We often walk together.','We oft walk together.'],
      ['mod','eme','Why do you weep?','Wherefore weepest thou?'],
      ['mod','eme','I cannot come.','I cannot come.'],
      ['mod','me','I love you.','I loue thee.'],
      ['mod','me','He is a good man.','He is a good man.'],
      ['mod','me','They have bread.','Thei han breed.'],
      ['mod','me','We will go home.','We wolen go hoom.'],
      ['mod','me','She said that she was glad.','Sche seide that sche was glad.'],
      ['mod','oe','I love you.','Iċ lufiġe þē.'],
      ['mod','oe','He loves her.','Hē lufaþ hīe.'],
      ['mod','oe','We are good men.','Wē sindon gōde menn.'],
      ['mod','oe','The king is old.','Se cyning is eald.'],
      ['mod','oe','The queen is old.','Sēo cwēn is eald.'],
      ['mod','oe','I saw the king.','Iċ seah þone cyning.'],
      ['mod','oe','I gave the sword to the king.','Iċ ġeaf þæt sweord tō þǣm cyninge.'],
      ['mod','oe','I do not know.','Iċ nāt.'],
      ['mod','oe','He was not here.','Hē næs hēr.'],
      ['eme','mod','Thou art my son.','You are my son.'],
      ['eme','mod','He hath spoken unto them.','He has spoken to them.'],
      ['eme','mod','Knowest thou not that I am thy father?','Do you not know that I am your father?'],
      ['eme','mod','I know not.','I do not know.'],
      ['eme','mod','Wherefore art thou Romeo?','Why are you Romeo?'],
      ['eme','mod','The Lord is my shepherd; I shall not want.','The Lord is my shepherd; I shall not want.'],
      ['eme','mod','He saith unto him, Feed my sheep.','He says to him, Feed my sheep.'],
      ['me','mod','Whan that Aprill with his shoures','When that April with his rainfall'],
      ['me','mod','And he seide to hem, Y am the good schepherde.','And he said to them, I am the good shepherd.'],
      ['me','mod','the kyng yaf the swerd to his sone','The king gave the sword to his son'],
      ['oe','mod','Se cyning is eald.','The king is old.'],
      ['oe','mod','Iċ lufiġe þē.','I love you.'],
      ['oe','mod','Fæder ūre þū þe eart on heofonum','Father our you who are in skies'],
    ];
    T.forEach(function (t) { var r = ET.translate(t[2], t[0], t[1], { you: 'thou' }); check('translate ' + PN[t[0]] + ' → ' + PN[t[1]] + ': ' + t[2], r.text === t[3], r.text); });
    // dictionary lookups
    var I = ET.D.idx;
    check('Old English: heofonum is a form of heofon', (I.ang.form[ET.keyOE('heofonum')] || []).some(function (x) { return ET.D.ang[x[0]][0] === 'heofon'; }));
    check('Old English: cyning means king', (I.ang.head[ET.keyOE('cyning')] || []).some(function (i) { return /king/.test(ET.D.ang[i][2].join(' ')); }));
    check('Middle English: knyght means knight', (I.enm.head[ET.keyME('knyght')] || []).some(function (i) { return /knight/.test(ET.D.enm[i][2].join(' ')); }));
    check('English → Old English: love finds lufian', (I.ang.rev.love || []).some(function (x) { return ET.D.ang[x[0]][0] === 'lufian'; }));
    check('examples: "shepherd" is found in verses', ET.examples('shepherd', undefined, 5).length === 5);
    // held-out accuracy recomputed now
    ['eme', 'me', 'oe'].forEach(function (p) {
      var H = ET.D.heldout[p], s = 0, b = 0; H.forEach(function (v) { s += ET.overlap(ET.translate(v[1], p, 'mod').text, v[2], 'eme'); b += ET.overlap(v[1], v[2], 'eme'); });
      var sc = s / H.length * 100, bl = b / H.length * 100, e = ET.D.eval[p].from;
      check(PN[p] + ' → modern on ' + H.length + ' held-out verses: ' + sc.toFixed(1) + ' vs baseline ' + bl.toFixed(1) + ' (published ' + e.score + ')', sc > bl && Math.abs(sc - e.score) < 0.15, sc.toFixed(1));
    });
    // pronunciation
    check('IPA: Old English cyning from Wiktionary', /kyni[nŋ]/.test(ET.wordIPA('cyning', 'oe').ipa), ET.wordIPA('cyning', 'oe').ipa);
    check('IPA: Middle English soote by the rules', ET.wordIPA('soote', 'me').ipa === 'ˈsoːtə', ET.wordIPA('soote', 'me').ipa);
    check('IPA: Old English sċip has sh', /ʃ/.test(ET.wordIPA('sċip', 'oe').ipa), ET.wordIPA('sċip', 'oe').ipa);
    var em = await ET.textIPA('speak the speech', 'eme'); check('IPA: Early Modern speak has a long e', /speːk/.test(em.ipa.replace(/ˈ/g, '')), em.ipa);
    var au = await ET.speakIPA('ˈhwæt weː ˈɡɑrdenɑ', 'oe'); check('speech: eSpeak NG made audio (' + au.wav.length.toLocaleString('en-AU') + ' bytes)', au.wav.length > 20000 && String.fromCharCode(au.wav[0], au.wav[1], au.wav[2], au.wav[3]) === 'RIFF', au.wav.length);
    // writing and reading back
    var S = ['Hwæt! We Gardena in geardagum þeodcyninga þrym gefrunon.', 'Whan that Aprill with his shoures soote the droghte of March hath perced to the roote', 'To be, or not to be, that is the question: whether tis nobler in the mind to suffer'];
    for (var sc2 of Object.keys(ET.SCRIPTS)) for (var s of S) {
      var st = ET.scriptText(s, sc2), svg = ET.render(st, { script: sc2, size: 40, width: 900 }), r = ET.readSVG(svg);
      check('SVG read-back, ' + ET.SCRIPTS[sc2].name + ': ' + s.slice(0, 30) + '…', r.ok && norm(r.text) === norm(st) && r.script === sc2, r.text);
      for (var fmt of ['png', 'jpeg']) {
        var id = await rasterOf(svg, fmt, 1), ri = ET.readImage(id, 'auto');
        check(fmt.toUpperCase() + ' read-back, ' + ET.SCRIPTS[sc2].name + ': ' + s.slice(0, 30) + '…', ri.ok && norm(ri.text) === norm(st), ri.ok ? ri.text + ' (' + diffCount(norm(ri.text), norm(st)) + ' differ, read as ' + ri.script + ')' : ri.reason);
      }
    }
  } catch (e) { check('self-test ran to the end', false, e.message); console.error(e); }
  finally { $('runTest').disabled = false; log.push(''); log.push(pass + ' passed, ' + fail + ' failed'); $('tlog').textContent = log.join('\n'); }
}
