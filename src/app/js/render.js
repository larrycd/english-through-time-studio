/* English Through Time Studio engine - by Larry Dalton
   render.js: writing in period scripts (SVG through HarfBuzz outlines), and reading the studio's SVG, PNG and JPEG back */
(function (G) {
'use strict';
var ET = G.ET;
var HB = null, FONTS = {}, GL = null, PATHS = {}, BBOX = {}, DMAP = null;

/* ================================================================ scripts */
ET.SCRIPTS = {
  modern: { font: 'ca', name: 'Modern edition', note: 'Cardo: today\'s editions of old texts, with every special letter' },
  fell: { font: 'fe', name: 'Early Modern print', note: 'IM Fell English (c. 1670 type): long s, u/v and i/j as printers used them before about 1630' },
  black: { font: 'bl', name: 'Blackletter', note: 'UnifrakturMaguntia: the Gothic hand and type of late Middle English, with thorn (þ) and yogh (ȝ)' },
  insular: { font: 'un', name: 'Insular uncial', note: 'Uncial Antiqua: a rounded book hand in the spirit of Anglo-Saxon manuscripts, with wynn (ƿ) and the Tironian et (⁊)' },
  runes: { font: 'ru', name: 'Anglo-Saxon runes', note: 'Noto Sans Runic: the futhorc, spelled letter by letter from Old English, words divided by ᛫' }
};
ET.SCRIPT_OPTS = {
  fell: [['longs', 'Long s (ſ) inside words', true], ['uv', 'v at the start of words, u inside (vnto, haue)', true], ['ij', 'i for j (Iesus, iudge)', true]],
  black: [['thorn', 'þ for th', true], ['yogh', 'ȝ for gh and for y before a vowel', true], ['uv', 'v at the start of words, u inside', true], ['et', '⁊ for "and"', false]],
  insular: [['wynn', 'ƿ for w', true], ['thorn', 'þ for th', true], ['et', '⁊ for "and"', true], ['marks', 'Keep the editors\' marks (ā, ċ, ġ)', false]],
  runes: [['sep', 'Divide words with ᛫', true]],
  modern: []
};
function optsFor(script, o) { var r = {}; (ET.SCRIPT_OPTS[script] || []).forEach(function (x) { r[x[0]] = o && o[x[0]] !== undefined ? !!o[x[0]] : x[2]; }); return r; }
ET.optsFor = optsFor;
function mapWords(text, f) { return text.replace(/[A-Za-zÀ-ÿĀ-ſƀ-ɏþðæȝƿÞÐÆȜǷꝥꝤ]+/g, f); }
function stripMarks(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC').replace(/ċ/g, 'c').replace(/ġ/g, 'g').replace(/Ċ/g, 'C').replace(/Ġ/g, 'G'); }
var RUNE = [['th', 'ᚦ'], ['ng', 'ᛝ'], ['ea', 'ᛠ'], ['eo', 'ᛇ'], ['io', 'ᛡ'], ['oe', 'ᛟ'], ['qu', 'ᚳᚹ'], ['þ', 'ᚦ'], ['ð', 'ᚦ'], ['æ', 'ᚫ'], ['œ', 'ᛟ'], ['ƿ', 'ᚹ'], ['ȝ', 'ᚷ'],
  ['f', 'ᚠ'], ['u', 'ᚢ'], ['o', 'ᚩ'], ['r', 'ᚱ'], ['c', 'ᚳ'], ['g', 'ᚷ'], ['w', 'ᚹ'], ['h', 'ᚻ'], ['n', 'ᚾ'], ['i', 'ᛁ'], ['j', 'ᛄ'], ['p', 'ᛈ'], ['x', 'ᛉ'], ['s', 'ᛋ'], ['t', 'ᛏ'], ['b', 'ᛒ'], ['e', 'ᛖ'], ['m', 'ᛗ'], ['l', 'ᛚ'], ['d', 'ᛞ'], ['a', 'ᚪ'], ['y', 'ᚣ'], ['k', 'ᛣ'], ['v', 'ᚠ'], ['z', 'ᛋ']];
var UNRUNE = { 'ᚦ': 'þ', 'ᛝ': 'ng', 'ᛠ': 'ea', 'ᛇ': 'eo', 'ᛡ': 'io', 'ᛟ': 'œ', 'ᚫ': 'æ', 'ᚠ': 'f', 'ᚢ': 'u', 'ᚩ': 'o', 'ᚱ': 'r', 'ᚳ': 'c', 'ᚷ': 'g', 'ᚹ': 'w', 'ᚻ': 'h', 'ᚾ': 'n', 'ᛁ': 'i', 'ᛄ': 'j', 'ᛈ': 'p', 'ᛉ': 'x', 'ᛋ': 's', 'ᛏ': 't', 'ᛒ': 'b', 'ᛖ': 'e', 'ᛗ': 'm', 'ᛚ': 'l', 'ᛞ': 'd', 'ᚪ': 'a', 'ᚣ': 'y', 'ᛣ': 'k', '᛫': ' ', '᛬': ' ', '᛭': '+' };
/* the text as it is written in a script */
ET.scriptText = function (text, script, o) {
  o = optsFor(script, o); var s = String(text).replace(/\r/g, '');
  if (script === 'fell') {
    if (o.ij) s = s.replace(/j/g, 'i').replace(/J/g, 'I');
    if (o.uv) s = mapWords(s, function (w) { return w.replace(/^u/, 'v').replace(/^U/, 'V').replace(/(.)v/g, '$1u'); });
    if (o.longs) s = mapWords(s, function (w) { var c = w.split(''); for (var i = 0; i < c.length - 1; i++) if (c[i] === 's' && c[i + 1] !== 'f' && c[i + 1] !== 'b' && c[i + 1] !== 'k' && c[i - 1] !== 'f') c[i] = 'ſ'; return c.join(''); });
    return s;
  }
  if (script === 'black') {
    if (o.et) s = s.replace(/\b[Aa]nd\b/g, '⁊');
    if (o.thorn) s = s.replace(/Th/g, 'Þ').replace(/TH/g, 'Þ').replace(/th/g, 'þ');
    if (o.yogh) s = mapWords(s, function (w) { return w.replace(/gh/g, 'ȝ').replace(/^y(?=[aeiou])/, 'ȝ').replace(/^Y(?=[aeiou])/, 'Ȝ'); });
    if (o.uv) s = mapWords(s, function (w) { return w.replace(/^u/, 'v').replace(/(.)v/g, '$1u'); });
    return s;
  }
  if (script === 'insular') {
    if (!o.marks) s = stripMarks(s);
    if (o.et) s = s.replace(/\b[Aa]nd\b|\b[Oo]nd\b|&/g, '⁊');
    if (o.thorn) s = s.replace(/Th/g, 'Þ').replace(/TH/g, 'Þ').replace(/th/g, 'þ');
    if (o.wynn) s = s.replace(/w/g, 'ƿ').replace(/W/g, 'Ƿ');
    return s;
  }
  if (script === 'runes') {
    var t = stripMarks(s.toLowerCase()), out = '';
    t = t.replace(/&|⁊/g, 'and');
    for (var i = 0; i < t.length;) {
      var hit = null; for (var k = 0; k < RUNE.length; k++) if (t.substr(i, RUNE[k][0].length) === RUNE[k][0]) { hit = RUNE[k]; break; }
      if (hit) { out += hit[1]; i += hit[0].length; continue; }
      var ch = t[i]; i++;
      if (/\s/.test(ch)) { out += ch === '\n' ? '\n' : (o.sep ? '᛫' : ' '); continue; }
      if (/[.!?;:]/.test(ch)) { out += '᛬'; continue; }
      if (/[,]/.test(ch)) { out += '᛫'; continue; }
      // other marks are left out of a runic text
    }
    return out.replace(/᛫+/g, '᛫').replace(/᛫?᛬᛫?/g, '᛬').replace(/^᛫|᛫$/g, '');
  }
  return s;
};
/* writing in a script back to ordinary letters */
ET.plainText = function (text, script) {
  var s = String(text);
  if (script === 'runes') return s.split('').map(function (c) { return UNRUNE[c] !== undefined ? UNRUNE[c] : c; }).join('').replace(/ {2,}/g, ' ');
  return s.replace(/ſ/g, 's').replace(/ƿ/g, 'w').replace(/Ƿ/g, 'W').replace(/⁊/g, 'and');
};
/* letters each script's reader looks for */
var PUNCT = '.,;:!?\'’‘"“”()-–—·`';
var SPECIAL = 'þÞðÐæÆƿǷȝȜ⁊';
ET.READ_ALPHABET = {
  modern: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzþÞðÐæÆƿǷȝȜāēīōūȳǣĀĒĪŌŪȲǢċġĊĠ⁊ſ0123456789&' + PUNCT,
  fell: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzſœŒ0123456789&' + SPECIAL + PUNCT,
  black: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&' + SPECIAL + PUNCT,
  insular: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzāēīōūȳǣĀĒĪŌŪȲǢċġ0123456789' + SPECIAL + PUNCT,
  runes: 'ᚠᚢᚦᚩᚱᚳᚷᚹᚻᚾᛁᛄᛇᛈᛉᛋᛏᛒᛖᛗᛚᛝᛟᛞᚪᚫᚣᛡᛠᛣ᛫᛬'
};

/* ================================================================ fonts and shaping (HarfBuzz) */
ET.setShaper = function (hb) { HB = hb; };
ET.loadGlyphs = function (g) { GL = g; return true; };
ET.loadFont = function (key, bytes) {
  var blob = HB.createBlob(bytes), face = HB.createFace(blob, 0), font = HB.createFont(face);
  FONTS[key] = { font: font, face: face, blob: blob }; PATHS[key] = {}; BBOX[key] = {}; DMAP = null; return true;
};
ET.fontsReady = function () { return !!HB && Object.keys(FONTS).length >= 5; };
ET.THEMES = {
  vellum: { bg: '#f4ead2', ink: '#2a1d12', red: '#9b2d20' },
  paper: { bg: '#fbf8f0', ink: '#1b1b1b', red: '#a3261d' },
  oak: { bg: '#e8dcc4', ink: '#3a2414', red: '#7a2a14' },
  night: { bg: '#141820', ink: '#efe6d2', red: '#e0a458' }
};
function pathOf(key, g) { var c = PATHS[key]; if (c[g] === undefined) c[g] = FONTS[key].font.glyphToPath(g) || ''; return c[g]; }
function bboxOf(key, g) {
  var c = BBOX[key]; if (c[g] !== undefined) return c[g];
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  flatten(pathOf(key, g)).forEach(function (p) { p.forEach(function (q) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }); });
  return (c[g] = x0 > x1 ? null : [x0, y0, x1, y1]);
}
function shapeText(key, text) {
  var buf = HB.createBuffer(); buf.addText(text); buf.guessSegmentProperties(); buf.setDirection('ltr');
  HB.shape(FONTS[key].font, buf, ''); var o = buf.json(); buf.destroy();
  var cps = Array.from(text), offs = [], k = 0; cps.forEach(function (c) { offs.push(k); k += c.length; });
  o.forEach(function (g) { var i = offs.indexOf(g.cl); g.ci = i < 0 ? 0 : i; g.ch = cps[g.ci]; });
  return o;
}
ET.shape = shapeText;
/* letters that would touch are moved apart by the smallest step that leaves a clear gap (about 1/25 em), so every
   letter stays a separate shape for the image reader; the spacing otherwise follows the font and its kerning */
var CUTPEN = 0.15, SEP = {}, SEPRES = 96;
// clear paper left by a word space, and the gap the readers take as a space (runes stand further apart, so both are wider)
function spaceInk(key) { return key === 'ru' ? 0.6 : 0.34; }
function spaceRead(key) { return key === 'ru' ? 0.45 : 0.27; }
function maskOf(key, gid) {
  var ck = key + ':' + gid; if (SEP[ck]) return SEP[ck];
  var bb = bboxOf(key, gid), u = GL[key].upm, k = SEPRES / u; if (!bb) return (SEP[ck] = null);
  var W = Math.ceil((bb[2] - bb[0]) * k) + 3, H = Math.ceil((bb[3] - bb[1]) * k) + 3, img = new Uint8Array(W * H);
  rasterInto(img, W, H, flatten(pathOf(key, gid)).map(function (p) { return p.map(function (q) { return [(q[0] - bb[0]) * k + 1, (bb[3] - q[1]) * k + 1]; }); }));
  return (SEP[ck] = { W: W, H: H, img: img, x0: bb[0] * k - 1, y1: bb[3] * k + 1 });
}
function clearance(key, a, b, dxU, dyU) { // smallest distance in pixels (at SEPRES per em) between the two letters, up to 8
  var A = maskOf(key, a), B = maskOf(key, b); if (!A || !B) return 99;
  var k = SEPRES / GL[key].upm, ox = Math.round(B.x0 + dxU * k - A.x0), oy = Math.round(A.y1 - (B.y1 + dyU * k)), best = 99;
  for (var y = 0; y < B.H; y++) for (var x = 0; x < B.W; x++) {
    if (!B.img[y * B.W + x]) continue;
    var ax = x + ox, ay = y + oy;
    for (var r = 0; r <= 8 && r < best; r++) for (var yy = ay - r; yy <= ay + r; yy++) for (var xx = ax - r; xx <= ax + r; xx++) {
      if (yy < 0 || xx < 0 || yy >= A.H || xx >= A.W) continue;
      if (A.img[yy * A.W + xx]) { if (r < best) best = r; }
    }
  }
  return best;
}
var SEPC = {};
/* the extra space the writer puts between two letters set side by side without kerning (for reading SVG back) */
function sepExtra(key, a, b) {
  var adv = (GL[key].glyphs[a] || [0, 0])[1];
  return separate(key, [{ g: a, ax: adv, dx: 0, dy: 0, ch: 'x' }, { g: b, ax: 0, dx: 0, dy: 0, ch: 'x' }])[0].ax - adv;
}
function separate(key, gs) {
  var need = 7, stepU = GL[key].upm / 100;
  for (var i = 1; i < gs.length; i++) {
    var a = gs[i - 1], b = gs[i]; if (/\s/.test(a.ch || '') || /\s/.test(b.ch || '')) continue;
    var ck = key + ':' + a.g + ':' + b.g + ':' + a.ax + ':' + (b.dx - a.dx) + ':' + (b.dy - a.dy);
    if (SEPC[ck] === undefined) {
      var extra = 0; while (extra < GL[key].upm * 0.2 && clearance(key, a.g, b.g, a.ax + extra + b.dx - a.dx, b.dy - a.dy) < need) extra += stepU;
      SEPC[ck] = extra;
    }
    if (SEPC[ck]) a.ax += SEPC[ck];
  }
  return gs;
}
/* which characters a font cannot draw */
ET.missing = function (text, script) {
  var key = ET.SCRIPTS[script].font, have = {}; Object.keys(GL[key].glyphs).forEach(function (id) { have[GL[key].glyphs[id][0]] = 1; });
  var miss = {}; Array.from(text).forEach(function (c) { if (!/\s/.test(c) && !have[c]) miss[c] = 1; }); return Object.keys(miss);
};
/* lines of text: words wrapped at spaces */
ET.layout = function (text, opts) {
  opts = opts || {};
  var script = opts.script || 'modern', key = ET.SCRIPTS[script].font, upm = GL[key].upm, size = opts.size || 48, s = size / upm;
  var margin = Math.round(size * 0.8), W = opts.width || 900, lineGap = size * 1.5, maxLen = W - 2 * margin;
  var paras = String(text).replace(/\r/g, '').replace(/\t/g, ' ').split('\n'), lines = [];
  paras.forEach(function (para) {
    var words = [], cur = [], curW = 0;
    var widthOf = function (t) { return separate(key, shapeText(key, t)).reduce(function (a, g) { return a + g.ax; }, 0) * s; };
    para.split(/( +)/).forEach(function (w) {
      if (/^ +$/.test(w) || !w) { words.push(w); return; }
      w.split(/(?<=[᛫᛬])/).forEach(function (x) {
        if (widthOf(x) <= maxLen) { words.push(x); return; }
        // a word longer than the line: break after its hyphens, and if a piece is still too long, between letters
        x.split(/(?<=-)/).forEach(function (piece) {
          if (widthOf(piece) <= maxLen) { words.push(piece); return; }
          var cs = Array.from(piece), cur2 = '';
          cs.forEach(function (c) { if (cur2 && widthOf(cur2 + c) > maxLen) { words.push(cur2); cur2 = ''; } cur2 += c; });
          if (cur2) words.push(cur2);
        });
      });
    });
    words.forEach(function (w) {
      if (!w) return;
      var gs = separate(key, shapeText(key, w)), ww = gs.reduce(function (a, g) { return a + g.ax; }, 0) * s, sp = /^ +$/.test(w);
      if (sp) ww = Math.max(ww, spaceInk(key) * size + ww); // room for a widened word space
      if (!sp && curW + ww > maxLen && cur.length) { while (cur.length && cur[cur.length - 1].sp) { curW -= cur[cur.length - 1].w; cur.pop(); } lines.push(cur); cur = []; curW = 0; }
      if (sp && !cur.length) return;
      cur.push({ gs: gs, w: ww, sp: sp }); curW += ww;
    });
    while (cur.length && cur[cur.length - 1].sp) cur.pop();
    lines.push(cur);
  });
  var H = Math.round(margin * 2 + lineGap * Math.max(1, lines.length) - size * 0.3), out = [];
  lines.forEach(function (ln, li) {
    var pen = margin, base = margin + lineGap * li + size * 0.95;
    var lastRight = null, afterSpace = false;
    ln.forEach(function (w) { w.gs.forEach(function (g) {
      if (/\s/.test(g.ch || '')) { afterSpace = true; pen += g.ax * s; return; }
      var bb = bboxOf(key, g.g);
      // a word space always leaves a wider gap of clear paper than any two letters inside a word
      if (afterSpace && lastRight !== null && bb) { var gap = pen + (g.dx + bb[0]) * s - lastRight; if (gap < spaceInk(key) * size) pen += spaceInk(key) * size - gap; }
      out.push({ key: key, g: g.g, ch: g.ch, x: pen + g.dx * s, y: base - g.dy * s, s: s, line: li });
      if (bb) lastRight = Math.max(lastRight === null ? -1e9 : lastRight, pen + (g.dx + bb[2]) * s);
      afterSpace = false; pen += g.ax * s;
    }); });
  });
  return { glyphs: out, W: W, H: H, size: size, script: script, lines: lines.length };
};
function f6(n) { return Math.round(n * 1e4) / 1e4; }
/* SVG of a text in a script: every letter is its outline, nothing depends on fonts being installed */
ET.render = function (text, opts) {
  opts = opts || {}; var th = ET.THEMES[opts.theme || 'vellum'], L = ET.layout(text, opts), paths = [];
  L.glyphs.forEach(function (g) { var d = pathOf(g.key, g.g); if (d) paths.push('<path d="' + d + '" transform="matrix(' + f6(g.s) + ' 0 0 ' + f6(-g.s) + ' ' + f6(g.x) + ' ' + f6(g.y) + ')"/>'); });
  var meta = '<metadata>' + JSON.stringify({ generator: 'English Through Time Studio ' + ET.version, author: 'Larry Dalton', script: L.script, note: 'provenance only; the reader uses the letter outlines' }).replace(/</g, '&lt;') + '</metadata>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + L.W + '" height="' + L.H + '" viewBox="0 0 ' + L.W + ' ' + L.H + '">' + meta + '<rect width="' + L.W + '" height="' + L.H + '" fill="' + th.bg + '"/><g fill="' + th.ink + '">' + paths.join('') + '</g></svg>';
};
function scriptOfKey(key) { for (var k in ET.SCRIPTS) if (ET.SCRIPTS[k].font === key) return k; return 'modern'; }
function buildDmap() {
  if (DMAP) return DMAP; DMAP = {};
  Object.keys(FONTS).forEach(function (key) {
    Object.keys(GL[key].glyphs).forEach(function (g) { var d = pathOf(key, +g); if (d) (DMAP[d] = DMAP[d] || []).push([key, +g, GL[key].glyphs[g][0]]); });
  });
  return DMAP;
}
/* read an SVG written by this studio, from the letter outlines (the metadata is ignored) */
ET.readSVG = function (svg) {
  svg = String(svg).replace(/<metadata>[\s\S]*?<\/metadata>/g, '');
  var dm = buildDmap(), re = /<path[^>]*?\sd="([^"]+)"[^>]*?transform="matrix\(([^)]+)\)"/g, m, items = [], unknown = 0, votes = {};
  while ((m = re.exec(svg))) {
    var hits = dm[m[1]], t = m[2].split(/[\s,]+/).map(Number);
    if (!hits) { unknown++; continue; }
    hits.forEach(function (h) { votes[h[0]] = (votes[h[0]] || 0) + 1 / hits.length; });
    items.push({ hits: hits, s: Math.abs(t[0]), x: t[4], y: t[5] });
  }
  if (!items.length) return { ok: false, reason: unknown ? 'This SVG uses outlines that are not from this studio\'s fonts.' : 'No letters were found in this SVG.' };
  var key = Object.keys(votes).sort(function (a, b) { return votes[b] - votes[a]; })[0], upm = GL[key].upm;
  var alpha = ET.READ_ALPHABET[scriptOfKey(key)];
  items.forEach(function (it) { var mine = it.hits.filter(function (x) { return x[0] === key; }), h = mine.filter(function (x) { return alpha.indexOf(x[2]) >= 0; })[0] || mine[0] || it.hits[0]; it.key = h[0]; it.g = h[1]; it.t = h[2]; it.adv = (GL[it.key].glyphs[it.g] || [0, upm / 2])[1] * it.s; it.em = it.s * GL[it.key].upm; });
  var size = Math.max.apply(null, items.map(function (i) { return i.em; })), spaceAdv = spaceOf(key) * size;
  var lines = [];
  items.sort(function (a, b) { return a.y - b.y || a.x - b.x; }).forEach(function (it) {
    var ln = null; for (var i = 0; i < lines.length; i++) if (Math.abs(lines[i].y - it.y) < size * 0.4) { ln = lines[i]; break; }
    if (!ln) { ln = { y: it.y, items: [] }; lines.push(ln); } ln.items.push(it);
  });
  lines.sort(function (a, b) { return a.y - b.y; });
  var text = lines.map(function (ln) {
    var o = ''; ln.items.sort(function (a, b) { return a.x - b.x; }).forEach(function (it, i) { if (i) { var p = ln.items[i - 1], ba = bboxOf(p.key, p.g), bb2 = bboxOf(it.key, it.g); if (ba && bb2 && (it.x + bb2[0] * it.s) - (p.x + ba[2] * p.s) > spaceRead(key) * size && !/[᛫᛬]/.test(p.t + it.t)) o += ' '; } o += it.t; }); return o;
  }).join('\n').replace(/-\n/g, '-');
  var script = scriptOfKey(key);
  return { ok: true, text: text, plain: ET.plainText(text, script), script: script, how: 'svg', unknown: unknown, confidence: 1 };
};
function spaceOf(key) { var g = GL[key].glyphs, u = GL[key].upm; for (var id in g) if (g[id][0] === ' ') return g[id][1] / u; return 0.25; }

/* ================================================================ outlines to pixels */
function flatten(d) {
  var polys = [], cur = [], x = 0, y = 0, tok = d.match(/[MLQCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) || [], i = 0, cmd = '';
  function num() { return parseFloat(tok[i++]); }
  while (i < tok.length) {
    if (/[MLQCZ]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === 'M') { if (cur.length) polys.push(cur); x = num(); y = num(); cur = [[x, y]]; cmd = 'L'; }
    else if (cmd === 'L') { x = num(); y = num(); cur.push([x, y]); }
    else if (cmd === 'Q') { var qx = num(), qy = num(), ex = num(), ey = num(); for (var k = 1; k <= 6; k++) { var t = k / 6, mt = 1 - t; cur.push([mt * mt * x + 2 * mt * t * qx + t * t * ex, mt * mt * y + 2 * mt * t * qy + t * t * ey]); } x = ex; y = ey; }
    else if (cmd === 'C') { var c1x = num(), c1y = num(), c2x = num(), c2y = num(), ex2 = num(), ey2 = num(); for (var k2 = 1; k2 <= 8; k2++) { var u = k2 / 8, mu = 1 - u; cur.push([mu * mu * mu * x + 3 * mu * mu * u * c1x + 3 * mu * u * u * c2x + u * u * u * ex2, mu * mu * mu * y + 3 * mu * mu * u * c1y + 3 * mu * u * u * c2y + u * u * u * ey2]); } x = ex2; y = ey2; }
    else if (cmd === 'Z') { if (cur.length) polys.push(cur); cur = []; cmd = ''; }
    else i++;
  }
  if (cur.length) polys.push(cur);
  return polys;
}
function rasterInto(img, W, H, polys) {
  var y0 = H, y1 = 0;
  polys.forEach(function (p) { p.forEach(function (q) { if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }); });
  y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(H - 1, Math.ceil(y1));
  for (var yy = y0; yy <= y1; yy++) {
    var sy = yy + 0.5, xs = [];
    polys.forEach(function (p) { for (var k = 0; k < p.length; k++) { var a = p[k], b = p[(k + 1) % p.length]; if ((a[1] <= sy) !== (b[1] <= sy)) xs.push({ x: a[0] + (sy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]), w: b[1] > a[1] ? 1 : -1 }); } });
    xs.sort(function (a, b) { return a.x - b.x; });
    var wind = 0;
    for (var q = 0; q < xs.length - 1; q++) { wind += xs[q].w; if (wind !== 0) { var xa = Math.max(0, Math.ceil(xs[q].x - 0.5)), xb = Math.min(W - 1, Math.floor(xs[q + 1].x - 0.5)); for (var xx = xa; xx <= xb; xx++) img[yy * W + xx] = 1; } }
  }
}
ET.renderMask = function (text, opts) {
  var L = ET.layout(text, opts), W = L.W, H = L.H, img = new Uint8Array(W * H);
  L.glyphs.forEach(function (g) { var d = pathOf(g.key, g.g); if (d) rasterInto(img, W, H, flatten(d).map(function (p) { return p.map(function (q) { return [g.x + q[0] * g.s, g.y - q[1] * g.s]; }); })); });
  return { W: W, H: H, data: img, val: img, layout: L };
};

/* ================================================================ reading PNG and JPEG */
var FG = 16, FR = 32;
function fitGrid(get, x0, y0, x1, y1, g) {
  var w = x1 - x0, h = y1 - y0, side = Math.max(w, h), ox = x0 - (side - w) / 2, oy = y0 - (side - h) / 2, out = new Uint8Array(g * g), cell = side / g;
  var sub = Math.max(1, Math.min(4, Math.ceil(4 / Math.max(0.25, cell))));
  for (var gy = 0; gy < g; gy++) for (var gx = 0; gx < g; gx++) {
    var acc = 0, n = 0;
    for (var sy = 0; sy < sub; sy++) for (var sx = 0; sx < sub; sx++) { acc += get(ox + (gx + (sx + 0.5) / sub) * cell, oy + (gy + (sy + 0.5) / sub) * cell); n++; }
    out[gy * g + gx] = Math.round(acc / n * 255);
  }
  return out;
}
var GCACHE = {};
function glyphGrid(key, gid, g) {
  var ck = key + gid + ':' + g; if (GCACHE[ck]) return GCACHE[ck];
  var bb = bboxOf(key, gid); if (!bb) return null;
  var R = 96, side = Math.max(bb[2] - bb[0], bb[3] - bb[1]) || 1, sc = R / side, W = Math.ceil((bb[2] - bb[0]) * sc) + 2, H = Math.ceil((bb[3] - bb[1]) * sc) + 2, img = new Uint8Array(W * H);
  rasterInto(img, W, H, flatten(pathOf(key, gid)).map(function (p) { return p.map(function (q) { return [(q[0] - bb[0]) * sc + 1, (bb[3] - q[1]) * sc + 1]; }); }));
  return (GCACHE[ck] = fitGrid(function (x, y) { var xi = Math.floor(x), yi = Math.floor(y); return xi >= 0 && yi >= 0 && xi < W && yi < H ? img[yi * W + xi] : 0; }, 1, 1, W - 1, H - 1, g));
}
/* templates for a script: every letter its reader looks for, with its 16x16 drawing and its size and height above the baseline */
var TDB = {};
function templates(script) {
  if (TDB[script]) return TDB[script];
  var key = ET.SCRIPTS[script].font, u = GL[key].upm, want = Array.from(ET.READ_ALPHABET[script]), T = { key: key, items: [] };
  var byChar = {}; Object.keys(GL[key].glyphs).forEach(function (id) { byChar[GL[key].glyphs[id][0]] = +id; });
  want.forEach(function (ch) {
    var gid = byChar[ch]; if (gid === undefined) return;
    var bb = bboxOf(key, gid); if (!bb) return;
    var mk = maskOf(key, gid), colsOn = []; for (var cx = 0; cx < mk.W; cx++) { var on = 0; for (var cy = 0; cy < mk.H; cy++) if (mk.img[cy * mk.W + cx]) on = 1; colsOn.push(on); }
    var first = colsOn.indexOf(1), last = colsOn.lastIndexOf(1), split = false; for (var cx2 = first; cx2 <= last; cx2++) if (!colsOn[cx2]) split = true;
    T.items.push({ ch: ch, gid: gid, split: split, adv: GL[key].glyphs[gid][1] / u, lsb: bb[0] / u, g16: glyphGrid(key, gid, FG), w: (bb[2] - bb[0]) / u, h: (bb[3] - bb[1]) / u, cy: ((bb[1] + bb[3]) / 2) / u, top: bb[3] / u, bot: bb[1] / u });
  });
  T.maxW = Math.max.apply(null, T.items.map(function (t) { return t.w; }));
  T.space = spaceOf(key);
  calibrate(script, T);
  return (TDB[script] = T);
}
/* the reader measures each line's x-height band in the same way on a known sample, to learn the size of the letters */
var SAMPLE = { runes: 'ᚠᚢᚦᚩ ᚱᚳᚷᚹ ᚻᚾᛁᛄ ᛇᛈᛉᛋ ᛏᛒᛖᛗ ᛚᛝᛟᛞ ᚪᚫᚣᛠ᛫ᚦᚩᚱᚾ᛫ᛋᛏᚪᚾ', other: 'the quick brown fox jumps over the lazy dog and hears a song' };
function zoneOf(M, a0, a1, x0, x1) {
  var prof = [], mx = 0;
  for (var y = a0; y <= a1; y++) { var c = 0; for (var x = x0; x <= x1; x++) if (M.data[y * M.W + x]) c++; prof.push(c); if (c > mx) mx = c; }
  var lo = -1, hi = -1; prof.forEach(function (c, i) { if (c >= mx * 0.4) { if (lo < 0) lo = i; hi = i; } });
  return [a0 + lo, a0 + hi];
}
/* the left and right ends of a letter's ink between the baseline and the x-height (hooks above and tails below left out) */
function coreOf(key, gid, zb, zt) {
  var x0 = 1e9, x1 = -1e9;
  flatten(pathOf(key, gid)).forEach(function (p) { for (var k = 0; k < p.length; k++) { var a = p[k], b = p[(k + 1) % p.length];
    for (var t = 0; t <= 1; t += 0.25) { var x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; if (y >= zb && y <= zt) { if (x < x0) x0 = x; if (x > x1) x1 = x; } } } });
  if (x0 > x1) { var bb = bboxOf(key, gid); return bb ? [bb[0], bb[2]] : null; }
  return [x0, x1];
}
function calibrate(script, T) {
  var txt = script === 'runes' ? SAMPLE.runes : ET.scriptText(SAMPLE.other, script), size = 100;
  var M = ET.renderMask(txt, { script: script, size: size, width: 6000 }), L = M.layout, base = L.glyphs[0].y;
  var rows = new Int32Array(M.H); for (var y = 0; y < M.H; y++) for (var x = 0; x < M.W; x++) if (M.data[y * M.W + x]) rows[y]++;
  var b = bands(rows, 3)[0], z = zoneOf(M, b[0], b[1], 0, M.W - 1);
  T.zone = (z[1] - z[0] + 1) / size; T.zoneBase = (base - (z[1] + 1)) / size;
  // gaps between the ink of neighbouring letters, and across word spaces, in em
  var gl = L.glyphs, inner = [], words = [], after = [], prevSp = false;
  Array.from(txt).forEach(function (c) { if (/\s/.test(c)) prevSp = true; else { after.push(prevSp); prevSp = false; } });
  var u = GL[gl[0].key].upm, zb = T.zoneBase * u, zt = (T.zoneBase + T.zone) * u;
  var ink = gl.map(function (g) { var c = coreOf(g.key, g.g, zb, zt); return c ? [g.x + c[0] * g.s, g.x + c[1] * g.s] : null; });
  for (var i = 1; i < gl.length; i++) {
    if (!ink[i] || !ink[i - 1] || gl[i].line !== gl[i - 1].line) continue;
    (after[i] ? words : inner).push((ink[i][0] - ink[i - 1][1]) / size);
  }
  inner.sort(function (p, q) { return p - q; }); words.sort(function (p, q) { return p - q; });
  var hi = inner[inner.length - 1] || 0.1, lo = words.length ? words[words.length >> 1] : hi + T.space;
  T.gap = Math.max(hi + 0.03, (hi + lo) / 2); T._cal = { inner: inner, words: words };
}
function inkMask(id) {
  var W = id.width, H = id.height, d = id.data, hist = {}, best = 0, bg = 0;
  for (var i = 0; i < W * H; i += 7) { var k = ((d[i * 4] >> 4) << 8) | ((d[i * 4 + 1] >> 4) << 4) | (d[i * 4 + 2] >> 4); hist[k] = (hist[k] || 0) + 1; if (hist[k] > best) { best = hist[k]; bg = k; } }
  var br = ((bg >> 8) << 4) + 8, bgc = (((bg >> 4) & 15) << 4) + 8, bb = ((bg & 15) << 4) + 8, far = 0;
  for (var j = 0; j < W * H; j++) { var dr = d[j * 4] - br, dg = d[j * 4 + 1] - bgc, db = d[j * 4 + 2] - bb, dist = Math.sqrt(dr * dr + dg * dg + db * db); if (dist > far) far = dist; }
  var thr = Math.max(40, far * 0.45), m = new Uint8Array(W * H), v = new Float32Array(W * H), ink = 0;
  for (var q = 0; q < W * H; q++) {
    var er = d[q * 4] - br, eg = d[q * 4 + 1] - bgc, eb = d[q * 4 + 2] - bb, dd = Math.sqrt(er * er + eg * eg + eb * eb);
    v[q] = Math.max(0, Math.min(1, (dd - far * 0.15) / (far * 0.7)));
    if (dd > thr && d[q * 4 + 3] > 64) { m[q] = 1; ink++; }
  }
  return { W: W, H: H, data: m, val: v, ink: ink / (W * H) };
}
function bands(prof, minGap) {
  var out = [], s = -1, last = -1;
  for (var i = 0; i < prof.length; i++) if (prof[i]) { if (s < 0) s = i; else if (i - last - 1 > minGap) { out.push([s, last]); s = i; } last = i; }
  if (s >= 0) out.push([s, last]);
  return out;
}
function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }
function simGrid(a, b) {
  var num = 0, den = 0, bi = 0, bu = 0;
  for (var i = 0; i < a.length; i++) { num += Math.min(a[i], b[i]); den += Math.max(a[i], b[i]); var A = a[i] >= 128, B = b[i] >= 128; if (A && B) bi++; if (A || B) bu++; }
  return (den ? num / den : 0) * 0.5 + (bu ? bi / bu : 0) * 0.5;
}
/* one ink box against every template: drawing, width, height and height above the baseline */
function recognise(T, M, x0, y0, x1, y1, em, base, get, onlySplit) {
  var g16 = fitGrid(get, x0, y0, x1 + 1, y1 + 1, FG), g32 = null;
  var w = (x1 - x0 + 1) / em, h = (y1 - y0 + 1) / em, cy = (base - (y0 + y1 + 1) / 2) / em;
  var cand = T.items.filter(function (t) { return !onlySplit || t.split; }).map(function (t) {
    var d = 0; for (var q = 0; q < 256; q++) { var e = t.g16[q] - g16[q]; d += e * e; }
    var gw = t.w - w, gh = t.h - h, gc = t.cy - cy;
    return { t: t, d: d / (256 * 65025) + (gw * gw + gh * gh) * 2 + gc * gc * 3 };
  }).sort(function (a, b) { return a.d - b.d; }).slice(0, 10);
  g32 = fitGrid(get, x0, y0, x1 + 1, y1 + 1, FR);
  if (!cand.length) return { ch: '?', score: -1, adv: w, lsb: 0, alt: [] };
  var dmin = cand[0].d;
  var scored = cand.map(function (c) {
    var t = c.t, s = simGrid(glyphGrid(T.key, t.gid, FR), g32), gw = t.w - w, gh = t.h - h, gc = t.cy - cy;
    return { ch: t.ch, score: s - gw * gw * 4 - gh * gh * 8 - gc * gc * 10 - 2 * (c.d - dmin) };
  }).sort(function (a, b) { return b.score - a.score; });
  var top = cand.filter(function (c) { return c.t.ch === scored[0].ch; })[0].t;
  return { ch: scored[0].ch, score: scored[0].score, adv: top.adv, lsb: top.lsb, alt: scored.slice(1, 5).map(function (x) { return [x.ch, x.score]; }) };
}
/* one line: the ink is cut into connected pieces (a letter whose stroke reaches over its neighbour stays separate);
   pieces that stand over one another (i and its dot, the two dots of a colon) go together, wide pieces are cut at their
   thinnest columns, and the pieces are joined into letters by dynamic programming over the best-matching groups */
function lineUnits(M, a0, a1, em) {
  var W = M.W, H = a1 - a0 + 1, lab = new Int32Array(W * H), comps = [], stack = [];
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    if (!M.data[(a0 + y) * W + x] || lab[y * W + x]) continue;
    var id = comps.length + 1, c = { id: id, x0: x, x1: x, y0: y, y1: y, n: 0, cols: {} }; comps.push(c);
    lab[y * W + x] = id; stack.push(y * W + x);
    while (stack.length) {
      var q = stack.pop(), qy = (q / W) | 0, qx = q - qy * W; c.n++;
      if (qx < c.x0) c.x0 = qx; if (qx > c.x1) c.x1 = qx; if (qy < c.y0) c.y0 = qy; if (qy > c.y1) c.y1 = qy; c.cols[qx] = (c.cols[qx] || 0) + 1;
      // neighbours up to two pixels away belong together, so a hairline broken by the pixel grid stays one stroke
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
        var ny = qy + dy, nx = qx + dx; if (ny < 0 || ny >= H || nx < 0 || nx >= W) continue;
        var k = ny * W + nx; if (M.data[(a0 + ny) * W + nx] && !lab[k]) { lab[k] = id; stack.push(k); }
      }
    }
  }
  comps = comps.filter(function (c) { return c.n >= 2 || c.x1 - c.x0 > 0; });
  // pieces mostly inside another piece's columns join it (dots, accents, colons)
  comps.sort(function (a, b) { return (b.x1 - b.x0) - (a.x1 - a.x0); });
  var units = [];
  comps.forEach(function (c) {
    var w = c.x1 - c.x0 + 1, host = null, best = 0;
    units.forEach(function (u) {
      var ov = Math.min(u.x1, c.x1) - Math.max(u.x0, c.x0) + 1, uw = u.x1 - u.x0 + 1;
      var yov = Math.min(u.y1, c.y1) - Math.max(u.y0, c.y0) + 1, mh = Math.min(u.y1 - u.y0, c.y1 - c.y0) + 1;
      if (ov >= Math.min(w, uw) * 0.6 && (yov <= mh * 0.3 || ov >= w * 0.9 && c.n < u.n * 0.6) && ov > best) { best = ov; host = u; }
    });
    if (host) { host.parts.push([c.id, c.x0, c.x1]); host.x0 = Math.min(host.x0, c.x0); host.x1 = Math.max(host.x1, c.x1); host.y0 = Math.min(host.y0, c.y0); host.y1 = Math.max(host.y1, c.y1); host.n += c.n; }
    else units.push({ parts: [[c.id, c.x0, c.x1]], x0: c.x0, x1: c.x1, y0: c.y0, y1: c.y1, n: c.n, comp: c });
  });
  // wide pieces (letters that touch) are cut at their thinnest columns
  var out = [];
  units.forEach(function (u) {
    var c = u.comp, w = u.x1 - u.x0 + 1;
    if (u.parts.length > 1 || w < em * 0.62) { out.push(u); return; }
    var cols = [], mx = 0; for (var x = c.x0; x <= c.x1; x++) { cols.push(c.cols[x] || 0); if (cols[cols.length - 1] > mx) mx = cols[cols.length - 1]; }
    var cuts = [], minW = Math.max(2, Math.round(em * 0.06)), lim = mx * 0.55, k = 0;
    // stretches of thin columns (between two letters, or inside one, like the bar of H): a cut at each end, and at the thinnest point
    while (k < cols.length) {
      if (cols[k] > lim) { k++; continue; }
      var r0 = k; while (k < cols.length && cols[k] <= lim) k++; var r1 = k - 1, am = r0;
      for (var q = r0; q <= r1; q++) if (cols[q] < cols[am]) am = q;
      (r1 - r0 + 1 <= em * 0.1 ? [am] : [r0, am, r1 + 1]).forEach(function (c) { if (c >= minW && c <= cols.length - minW && (!cuts.length || c - cuts[cuts.length - 1] >= minW) && cuts.indexOf(c) < 0) cuts.push(c); });
      cuts.sort(function (x, y) { return x - y; });
    }
    if (!cuts.length) { out.push(u); return; }
    var st = 0; cuts.concat([cols.length]).forEach(function (ck) { out.push({ parts: [[c.id, c.x0 + st, c.x0 + ck - 1]], x0: c.x0 + st, x1: c.x0 + ck - 1, n: 0, cut: true }); st = ck; });
  });
  out.sort(function (a, b) { return (a.x0 + a.x1) - (b.x0 + b.x1); });
  return { units: out, lab: lab, a0: a0 };
}
function readLine(T, M, band, em, base) {
  var a0 = band[0], L = lineUnits(M, a0, band[1], em), U = L.units, W = M.W; if (!U.length) return { items: [], scores: [] };
  var maxW = T.maxW * em * 1.1 + 2;
  var groupBox = function (i, j) {
    var parts = []; for (var k = i; k <= j; k++) parts = parts.concat(U[k].parts);
    var x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    parts.forEach(function (p) { for (var x = p[1]; x <= p[2]; x++) for (var y = 0; y < M.H - a0 && y <= band[1] - a0; y++) if (L.lab[y * W + x] === p[0]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } });
    return { parts: parts, x0: x0, x1: x1, y0: y0 + a0, y1: y1 + a0 };
  };
  var rec = {}, recOf = function (i, j) {
    var k = i + ':' + j; if (rec[k]) return rec[k];
    var g = groupBox(i, j), parts = g.parts;
    var V = M.val, get = function (x, y) {
      var xi = Math.floor(x), yi = Math.floor(y); if (xi < g.x0 || xi > g.x1 || yi < g.y0 || yi > g.y1) return 0;
      var l = L.lab[(yi - a0) * W + xi];
      if (!l) { // an anti-aliased edge pixel: count it when a neighbour belongs to this letter
        if (V[yi * W + xi] <= 0) return 0;
        // neighbours up to two pixels away belong together, so a hairline broken by the pixel grid stays one stroke
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) { var yy = yi + dy - a0, xx = xi + dx; if (yy < 0 || xx < 0 || xx >= W || yy > band[1] - a0) continue; var l2 = L.lab[yy * W + xx]; if (l2 && inParts(l2, xx)) return V[yi * W + xi]; }
        return 0;
      }
      return inParts(l, xi) ? V[yi * W + xi] : 0;
    };
    function inParts(l, x) { for (var q = 0; q < parts.length; q++) if (parts[q][0] === l && x >= parts[q][1] && x <= parts[q][2]) return true; return false; }
    var gapped = false; for (var q2 = i; q2 < j; q2++) if (!(U[q2].cut && U[q2 + 1].cut && U[q2 + 1].x0 === U[q2].x1 + 1)) gapped = true;
    var r = recognise(T, M, g.x0, g.y0, g.x1, g.y1, em, base, get, gapped); r.x0 = g.x0; r.x1 = g.x1;
    var zy0 = Math.round(base - (T.zoneBase + T.zone) * em), zy1 = Math.round(base - T.zoneBase * em), c0 = 1e9, c1 = -1;
    for (var yy = Math.max(g.y0, zy0); yy <= Math.min(g.y1, zy1); yy++) for (var xx = g.x0; xx <= g.x1; xx++) if (get(xx + 0.5, yy + 0.5) > 0.5) { if (xx < c0) c0 = xx; if (xx > c1) c1 = xx; }
    r.c0 = c1 >= 0 ? c0 : g.x0; r.c1 = c1 >= 0 ? c1 : g.x1;
    return (rec[k] = r);
  };
  // dynamic programme: a state is the last letter (units st..e-1); moving on adds the next letter's match, and a cost when
  // the next letter does not start where the last one's advance width puts it (allowing for kerning, or a word space)
  var n = U.length, segOK = function (st, e) {
    var x0 = 1e9, x1 = -1; for (var k = st; k < e; k++) { x0 = Math.min(x0, U[k].x0); x1 = Math.max(x1, U[k].x1); }
    if (st < e - 1 && x1 - x0 + 1 > maxW) return false;
    for (var k2 = st; k2 < e - 1; k2++) if (U[k2 + 1].x0 - U[k2].x1 > em * T.gap) return false;
    return true;
  };
  var segVal = function (st, e) { var r = recOf(st, e - 1), w = r.x1 - r.x0 + 1; return r.score * w / em - 0.05; };
  var step = function (a, b) { // a, b recognised letters; returns [cost, space]
    // where b's ink should start: after a's advance width, or just clear of a's ink when the writer moved b apart
    var exp = Math.max(a.x0 - a.lsb * em + a.adv * em + b.lsb * em, a.x1 + 1 + em * 0.07);
    var d = (b.x0 - exp) / em, dAdv = (b.x0 - (a.x0 - a.lsb * em + a.adv * em + b.lsb * em)) / em, inkGap = (b.x0 - a.x1 - 1) / em;
    if (inkGap > spaceRead(T.key)) return [0, true];
    if (d < -0.15) return [(-0.15 - d) * 6, false];
    if (d > 0.08) return [(d - 0.08) * 3, false];
    return [0, false];
  };
  var MAXJ = 12, best = {}, from = {};
  for (var e = 1; e <= n; e++) for (var st = Math.max(0, e - MAXJ); st < e; st++) {
    if (!segOK(st, e)) continue;
    var k = st + ':' + e, sv = segVal(st, e), rb = recOf(st, e - 1);
    if (st === 0) { best[k] = sv; from[k] = null; continue; }
    var bv = -1e9, bf = null;
    for (var s2 = Math.max(0, st - MAXJ); s2 < st; s2++) {
      var k2 = s2 + ':' + st; if (best[k2] === undefined) continue;
      // the writer never lets two letters touch, so a cut through one piece of ink is rarely a boundary between letters
      var cutJoin = U[st - 1].cut && U[st].cut && U[st].x0 === U[st - 1].x1 + 1 ? CUTPEN : 0;
      var v = best[k2] + sv - step(recOf(s2, st - 1), rb)[0] - cutJoin;
      if (v > bv) { bv = v; bf = k2; }
    }
    if (bf !== null) { best[k] = bv; from[k] = bf; }
  }
  var endK = null, ev = -1e9; for (var s3 = Math.max(0, n - MAXJ); s3 < n; s3++) { var kk = s3 + ':' + n; if (best[kk] !== undefined && best[kk] > ev) { ev = best[kk]; endK = kk; } }
  var segs = []; while (endK) { var pr = endK.split(':').map(Number); segs.unshift([pr[0], pr[1] - 1]); endK = from[endK]; }
  var items = [], prev = null, scores = [];
  if (ET._dbgKeep) {
    ET._recOf = recOf; ET._dbg = ET._dbgKeep ? ET._dbg || [] : []; ET._dbg = ET._dbg.concat(['units: ' + U.map(function (u) { return u.x0 + '-' + u.x1 + (u.cut ? 'c' : ''); }).join(' ')]);
    segs.forEach(function (sg) { var q = recOf(sg[0], sg[1]); ET._dbg.push(sg.join('-') + ' ' + q.ch + ' ' + q.score.toFixed(3) + ' x' + q.x0 + '-' + q.x1 + ' alt ' + q.alt.slice(0, 3).map(function (a) { return a[0] + a[1].toFixed(2); }).join(','));
    });
  }
  segs.forEach(function (sg) {
    var r3 = recOf(sg[0], sg[1]);
    if (prev && step(prev, r3)[1] && !/[᛫᛬]/.test(prev.ch + r3.ch)) items.push({ ch: ' ', alt: [], score: 1 });
    items.push({ ch: r3.ch, alt: r3.alt, score: r3.score }); scores.push(r3.score); prev = r3;
  });
  return { items: items, scores: scores };
}
/* near ties are settled by the dictionaries: keep the letters that make a known word */
function knownWord(w, script) {
  var p = ET.plainText(w, script).toLowerCase().replace(/[^a-zþðæȝƿāēīōūȳǣċġœ]/g, ''); if (!p) return true;
  var D = ET.D; if (D.cmu && D.cmu[p]) return true;
  if (D.idx.ang && (D.idx.ang.head[ET.keyOE(p)] || D.idx.ang.form[ET.keyOE(p)])) return true;
  if (D.idx.enm && (D.idx.enm.head[ET.keyME(p)] || D.idx.enm.form[ET.keyME(p)])) return true;
  if (D.cmu && D.cmu[ET.keyEME(p)]) return true;
  return false;
}
var FREQ = null;
function freqOf(w) {
  if (!FREQ) { FREQ = {}; var P = ET.D.par; if (P) Object.keys(P.v).forEach(function (k) { P.v[k].forEach(function (t) { (t.toLowerCase().match(/[a-zþðæȝƿſāēīōūȳǣċġ]+/g) || []).forEach(function (x) { x = x.replace(/ſ/g, 's'); FREQ[x] = (FREQ[x] || 0) + 1; }); }); }); }
  return FREQ[w] || 0;
}
function repair(items, script) {
  var fixed = 0, i = 0;
  while (i < items.length) {
    if (items[i].ch === ' ') { i++; continue; }
    var j = i; while (j < items.length && items[j].ch !== ' ') j++;
    var word = items.slice(i, j), amb = [];
    word.forEach(function (it, k) { var c = (it.alt || []).filter(function (a) { return a[1] > it.score - 0.2; }).slice(0, 3); if (c.length) amb.push({ k: k, c: [[it.ch, 0]].concat(c.map(function (a) { return [a[0], it.score - a[1]]; })) }); });
    amb = amb.slice(0, 5);
    if (amb.length) {
      var combos = [[]]; amb.forEach(function (a) { var nx = []; combos.forEach(function (cb) { a.c.forEach(function (ch) { nx.push(cb.concat([[a.k, ch[0], ch[1]]])); }); }); combos = nx; });
      var value = function (cb) {
        var chars = word.map(function (x) { return x.ch; }); cb.forEach(function (z) { chars[z[0]] = z[1]; });
        var w = chars.join(''), core = ET.plainText(w, script).toLowerCase().replace(/^[^a-zþðæȝƿāēīōūȳǣċġ]+|[^a-zþðæȝƿāēīōūȳǣċġ]+$/g, '');
        var f = freqOf(core), kn = knownWord(w, script);
        // how often the word occurs in the studio's texts, whether a dictionary knows it, and how far the shapes are from first choice
        return { v: Math.log(1 + f) + (kn ? 2 : 0) - cb.reduce(function (a, z) { return a + z[2] * 25; }, 0), known: kn || f > 0 };
      };
      // a word the dictionaries already know is changed only for a much commoner word
      var b0 = value([]), bestC = null, bestV = b0.v + (b0.known ? 2.5 : 0.5);
      combos.forEach(function (cb) { if (!cb.some(function (z) { return z[2] > 0; })) return; var r = value(cb); if (r.known && r.v > bestV) { bestV = r.v; bestC = cb; } });
      if (bestC) bestC.forEach(function (z) { if (word[z[0]].ch !== z[1]) { word[z[0]].ch = z[1]; fixed++; } });
    }
    i = j;
  }
  return fixed;
}
/* the letter forms each script uses decide small look-alikes: long s only inside words, u/v by position */
function contextFix(text, script) {
  if (script === 'fell') text = text.replace(/ſ(?=$|[^A-Za-zſ])/g, 's');
  if (script === 'runes') text = text.replace(/[^ᚠ-᛬\n ]/g, '');
  text = text.replace(/([^\s])[–—](?=[^\s]|\n|$)/g, '$1-'); // a dash joining two letters (or ending a line inside a word) is a hyphen
  return text.replace(/ +\n/g, '\n').replace(/ +$/gm, '');
}
/* read an image written in one of the studio's scripts; script 'auto' tries each on the first line */
ET.readImage = function (id, script) {
  var t0 = Date.now(), M = inkMask(id);
  if (M.ink > 0.35) return { ok: false, reason: 'Too much of the image is ink for written text (it looks like a photograph or texture).' };
  if (M.ink < 0.0005) return { ok: false, reason: 'No writing was found in this image.' };
  var rows = new Int32Array(M.H); for (var y = 0; y < M.H; y++) for (var x = 0; x < M.W; x++) if (M.data[y * M.W + x]) rows[y]++;
  var lines = bands(rows, 1).filter(function (b) { return b[1] - b[0] >= 2; });
  // dots, accents and the tails of letters can make thin bands of their own: join each to its nearest line
  var th = lines.map(function (b) { return b[1] - b[0] + 1; }), big = median(th.filter(function (t) { return t >= Math.max.apply(null, th) * 0.5; }));
  for (var li = 0; li < lines.length; li++) {
    if (lines[li][1] - lines[li][0] + 1 >= big * 0.45) continue;
    var up = lines[li - 1], dn = lines[li + 1], gu = up ? lines[li][0] - up[1] : 1e9, gd = dn ? dn[0] - lines[li][1] : 1e9;
    if (Math.min(gu, gd) > big * 0.5) continue;
    if (gd <= gu) { dn[0] = lines[li][0]; } else { up[1] = lines[li][1]; }
    lines.splice(li, 1); li--;
  }
  var scripts = script && script !== 'auto' ? [script] : Object.keys(ET.SCRIPTS), F = {};
  scripts.forEach(function (s) { F[s] = templates(s); });
  // letter size from each line's x-height band (runes: from the height of the staves); the text is all one size, so the
  // middle value over the lines is used for every line
  var geo0 = function (T, b) {
    if (T.key === 'ru') { var hR = median(T.items.filter(function (t) { return t.h > 0.5; }).map(function (t) { return t.h; })), emR = (b[1] - b[0] + 1) / hR; return { em: emR, zb: b[1] + 1 }; }
    var z = zoneOf(M, b[0], b[1], 0, M.W - 1), em = (z[1] - z[0] + 1) / T.zone; return { em: em, zb: z[1] + 1 };
  };
  var emCache = {};
  var lineGeo = function (T, b) {
    if (!emCache[T.key]) emCache[T.key] = median(lines.map(function (x) { return geo0(T, x).em; }));
    var em = emCache[T.key], g = geo0(T, b);
    // baseline: bottom of the x-height band (Latin) or of the staves (runes)
    return { em: em, base: T.key === 'ru' ? g.zb : g.zb + T.zoneBase * em };
  };
  var pick = scripts[0];
  if (scripts.length > 1) {
    var votes = {};
    scripts.forEach(function (s) { var g = lineGeo(F[s], lines[0]), r = readLine(F[s], M, lines[0], g.em, g.base); votes[s] = r.scores.length ? r.scores.reduce(function (a, b) { return a + b; }, 0) / r.scores.length : 0; });
    pick = Object.keys(votes).sort(function (a, b) { return votes[b] - votes[a]; })[0];
  }
  var T = F[pick], out = [], all = [], fixed = 0;
  ET._lines = lines.map(function (b) { var g = lineGeo(T, b); return b.join('-') + ' em ' + g.em.toFixed(1) + ' base ' + g.base.toFixed(1); });
  lines.forEach(function (b) { var g = lineGeo(T, b), r = readLine(T, M, b, g.em, g.base); fixed += repair(r.items, pick); out.push(r.items.map(function (it) { return it.ch; }).join('')); all = all.concat(r.scores); });
  var conf = all.length ? all.reduce(function (a, b) { return a + b; }, 0) / all.length : 0;
  if (conf < 0.55) return { ok: false, reason: 'The shapes do not match the studio\'s letters closely enough (' + Math.round(conf * 100) + '%).', confidence: conf };
  var text = contextFix(out.join('\n'), pick).replace(/-\n/g, '-');
  return { ok: true, text: text, plain: ET.plainText(text, pick), script: pick, how: 'image', confidence: Math.round(conf * 100) / 100, uncertain: all.filter(function (s) { return s < 0.6; }).length, fixed: fixed, ms: Date.now() - t0 };
};
ET._inkMask = inkMask; ET._templates = templates; ET.flatten = flatten;
})(typeof window !== 'undefined' ? window : globalThis);
