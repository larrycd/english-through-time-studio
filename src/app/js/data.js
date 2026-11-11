/* English Through Time Studio engine - by Larry Dalton
   data.js: loading, indexes, spelling normalisation, modern English word forms */
(function (G) {
'use strict';
var ET = G.ET = G.ET || {};
ET.version = '1.0.0';
var D = ET.D = { ang: null, enm: null, align: null, par: null, heldout: null, cmu: null, idx: {} };
ET.PERIODS = {
  oe: { name: 'Old English', dates: 'about 450-1150', dict: 'ang', example: 'Hwæt! We Gardena in geardagum...' },
  me: { name: 'Middle English', dates: 'about 1150-1500', dict: 'enm', example: 'Whan that Aprill with his shoures soote...' },
  eme: { name: 'Early Modern English', dates: 'about 1500-1700', dict: null, example: 'Thou art more lovely and more temperate' },
  mod: { name: 'Modern English', dates: 'today', dict: null }
};

/* ---------------------------------------------------------------- spelling keys used for lookups */
function strip(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC'); }
ET.strip = strip;
ET.keyOE = function (w) {
  return strip(String(w).toLowerCase()).replace(/ð/g, 'þ').replace(/ƿ/g, 'w').replace(/ȝ/g, 'g').replace(/k/g, 'c').replace(/[-·']/g, '').replace(/ę/g, 'e');
};
ET.keyME = function (w) {
  return strip(String(w).toLowerCase()).replace(/[þð]/g, 'th').replace(/ȝ/g, 'y').replace(/ſ/g, 's').replace(/[-·']/g, '')
    .replace(/v/g, 'u').replace(/j/g, 'i').replace(/y/g, 'i').replace(/k/g, 'c').replace(/(.)\1/g, '$1');
};
ET.keyEME = function (w) {
  var s = strip(String(w).toLowerCase()).replace(/ſ/g, 's').replace(/vv/g, 'w').replace(/'/g, '');
  s = s.replace(/^v(?=[^aeiou])/, 'u').replace(/([aeiou])u(?=[aeiouy])/g, '$1v').replace(/^i(?=[aeiou])/, 'j');
  return s;
};
ET.key = function (period, w) { return period === 'oe' ? ET.keyOE(w) : period === 'me' ? ET.keyME(w) : ET.keyEME(w); };

/* ---------------------------------------------------------------- loading and indexes */
var ROW = { w: 0, p: 1, g: 2, f: 3, ipa: 4, ex: 5, et: 6, alt: 7, gen: 8 };
ET.ROW = ROW;
function gheads(gloss) {
  var g = String(gloss).replace(/\s*\([^)]*\)/g, '').split(/[;:]/)[0], out = [];
  g.split(/,| or /).forEach(function (part) {
    var p = part.trim().toLowerCase().replace(/^(to|a|an|the)\s+/, '').replace(/\s+(of|for|with|to|from|in|on)$/, '');
    if (p && p.split(' ').length <= 2 && /^[a-z' -]+$/.test(p)) out.push(p);
  });
  return out.slice(0, 4);
}
ET.gheads = gheads;
function isFormOf(g) { return /^(alternative|obsolete|archaic|dialectal)?\s*(form|spelling) of\b|\b(inflection|plural|singular|past|present|participle|form|genitive|dative|accusative|nominative) of\b/i.test(g); }
ET.isFormOf = isFormOf;
function indexDict(name, rows, keyf) {
  var head = {}, form = {}, rev = {};
  rows.forEach(function (r, i) {
    var k = keyf(r[0]);
    (head[k] = head[k] || []).push(i);
    (r[ROW.f] || []).forEach(function (f) {
      var fk = keyf(f[0]); if (!fk) return;
      (form[fk] = form[fk] || []).push([i, f[1]]);
    });
    var real = r[ROW.g].filter(function (g) { return !isFormOf(g); });
    real.forEach(function (g, si) {
      gheads(g).forEach(function (h, hi) {
        (rev[h] = rev[h] || []).push([i, si * 2 + hi]);
      });
    });
  });
  D.idx[name] = { head: head, form: form, rev: rev };
}
ET.load = function (name, obj) {
  if (name === 'ang') { D.ang = obj; indexDict('ang', obj, ET.keyOE); }
  else if (name === 'enm') { D.enm = obj; indexDict('enm', obj, ET.keyME); }
  else if (name === 'align') D.align = obj;
  else if (name === 'parallel') D.par = obj;
  else if (name === 'heldout') D.heldout = obj;
  else if (name === 'cmu') { D.cmu = {}; String(obj).split('\n').forEach(function (l) { var p = l.split('\t'); if (p.length === 2) D.cmu[p[0]] = p[1]; }); }
  else if (name === 'eval') D.eval = obj;
  return true;
};
ET.rows = function (period) { return period === 'oe' ? D.ang : D.enm; };
ET.dictName = function (period) { return period === 'oe' ? 'ang' : 'enm'; };

/* ---------------------------------------------------------------- modern English word forms */
var IRR = 'arise arose arisen|awake awoke awoken|be was been|bear bore borne|beat beat beaten|become became become|begin began begun|bend bent bent|bet bet bet|bid bade bidden|bind bound bound|bite bit bitten|bleed bled bled|blow blew blown|break broke broken|breed bred bred|bring brought brought|build built built|burn burnt burnt|burst burst burst|buy bought bought|cast cast cast|catch caught caught|choose chose chosen|cling clung clung|come came come|cost cost cost|creep crept crept|cut cut cut|deal dealt dealt|dig dug dug|do did done|draw drew drawn|dream dreamt dreamt|drink drank drunk|drive drove driven|dwell dwelt dwelt|eat ate eaten|fall fell fallen|feed fed fed|feel felt felt|fight fought fought|find found found|flee fled fled|fling flung flung|fly flew flown|forbid forbade forbidden|forget forgot forgotten|forgive forgave forgiven|forsake forsook forsaken|freeze froze frozen|get got gotten|give gave given|go went gone|grind ground ground|grow grew grown|hang hung hung|have had had|hear heard heard|hide hid hidden|hit hit hit|hold held held|hurt hurt hurt|keep kept kept|kneel knelt knelt|know knew known|lay laid laid|lead led led|leap leapt leapt|learn learnt learnt|leave left left|lend lent lent|let let let|lie lay lain|light lit lit|lose lost lost|make made made|mean meant meant|meet met met|pay paid paid|put put put|quit quit quit|read read read|rend rent rent|rid rid rid|ride rode ridden|ring rang rung|rise rose risen|run ran run|say said said|see saw seen|seek sought sought|sell sold sold|send sent sent|set set set|sew sewed sewn|shake shook shaken|shed shed shed|shine shone shone|shoot shot shot|show showed shown|shrink shrank shrunk|shut shut shut|sing sang sung|sink sank sunk|sit sat sat|slay slew slain|sleep slept slept|slide slid slid|sling slung slung|smite smote smitten|sow sowed sown|speak spoke spoken|spend spent spent|spin spun spun|spit spat spat|split split split|spread spread spread|spring sprang sprung|stand stood stood|steal stole stolen|stick stuck stuck|sting stung stung|stink stank stunk|strike struck struck|string strung strung|strive strove striven|swear swore sworn|sweep swept swept|swell swelled swollen|swim swam swum|swing swung swung|take took taken|teach taught taught|tear tore torn|tell told told|think thought thought|throw threw thrown|thrust thrust thrust|tread trod trodden|understand understood understood|wake woke woken|wear wore worn|weave wove woven|weep wept wept|win won won|wind wound wound|withdraw withdrew withdrawn|wring wrung wrung|write wrote written';
var PAST = {}, PP = {}, PASTOF = {}, PPOF = {};
IRR.split('|').forEach(function (t) { var a = t.split(' '); PAST[a[0]] = a[1]; PP[a[0]] = a[2]; (PASTOF[a[1]] = PASTOF[a[1]] || []).push(a[0]); (PPOF[a[2]] = PPOF[a[2]] || []).push(a[0]); });
PASTOF.were = ['be']; PASTOF.was = ['be'];
var NPL = { man: 'men', woman: 'women', child: 'children', foot: 'feet', tooth: 'teeth', goose: 'geese', mouse: 'mice', ox: 'oxen', person: 'people', brother: 'brothers', sheep: 'sheep', fish: 'fish', deer: 'deer', louse: 'lice', die: 'dice', wife: 'wives', knife: 'knives', life: 'lives', wolf: 'wolves', leaf: 'leaves', loaf: 'loaves', half: 'halves', thief: 'thieves', calf: 'calves', shelf: 'shelves', self: 'selves' };
var NSG = {}; Object.keys(NPL).forEach(function (k) { NSG[NPL[k]] = k; });
ET.IRR = { past: PAST, pp: PP };
function known(w) { return !!(D.cmu && D.cmu[w]) || !!D.modPOS && !!D.modPOS[w]; }
ET.knownModern = known;
var VOW = /[aeiou]/;
function cvc(w) { return /[^aeiou][aeiou][^aeiouwxy]$/.test(w) && w.length <= 5; }
ET.inflect = function (lemma, f) {
  var w = lemma;
  if (f === 'base' || !f) return w;
  if (f === 'pl') { if (NPL[w]) return NPL[w]; if (/(s|x|z|ch|sh)$/.test(w)) return w + 'es'; if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies'; return w + 's'; }
  if (f === '3sg') { if (w === 'be') return 'is'; if (w === 'have') return 'has'; if (w === 'do') return 'does'; if (w === 'go') return 'goes'; if (/(s|x|z|ch|sh|o)$/.test(w)) return w + 'es'; if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies'; return w + 's'; }
  if (f === 'past' || f === 'pp') {
    var t = f === 'past' ? PAST : PP; if (t[w]) return t[w];
    if (/e$/.test(w)) return w + 'd'; if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ied'; if (cvc(w)) return w + w.slice(-1) + 'ed'; return w + 'ed';
  }
  if (f === 'ing') { if (w === 'be') return 'being'; if (/ie$/.test(w)) return w.slice(0, -2) + 'ying'; if (/[^e]e$/.test(w)) return w.slice(0, -1) + 'ing'; if (cvc(w)) return w + w.slice(-1) + 'ing'; return w + 'ing'; }
  if (f === 'cmp') { if (/e$/.test(w)) return w + 'r'; if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ier'; return w + 'er'; }
  if (f === 'sup') { if (/e$/.test(w)) return w + 'st'; if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'iest'; return w + 'est'; }
  return w;
};
/* every way a modern word could be read: [{lemma, f}] */
ET.analyze = function (w0) {
  var w = String(w0).toLowerCase(), out = [], add = function (l, f) { if (l && !out.some(function (o) { return o.lemma === l && o.f === f; })) out.push({ lemma: l, f: f }); };
  add(w, 'base');
  if (NSG[w]) add(NSG[w], 'pl');
  (PASTOF[w] || []).forEach(function (l) { add(l, 'past'); });
  (PPOF[w] || []).forEach(function (l) { add(l, 'pp'); });
  if (w === 'is' || w === 'am' || w === 'are') add('be', w === 'is' ? '3sg' : 'base');
  if (w === 'has') add('have', '3sg'); if (w === 'does') add('do', '3sg');
  var tries = [];
  if (/ies$/.test(w)) tries.push([w.slice(0, -3) + 'y', 's']);
  if (/es$/.test(w)) tries.push([w.slice(0, -2), 's']);
  if (/s$/.test(w) && !/ss$/.test(w)) tries.push([w.slice(0, -1), 's']);
  if (/ied$/.test(w)) tries.push([w.slice(0, -3) + 'y', 'ed']);
  if (/ed$/.test(w)) { tries.push([w.slice(0, -2), 'ed']); tries.push([w.slice(0, -1), 'ed']); if (/([^aeiou])\1ed$/.test(w)) tries.push([w.slice(0, -3), 'ed']); }
  if (/ing$/.test(w)) { tries.push([w.slice(0, -3), 'ing']); tries.push([w.slice(0, -3) + 'e', 'ing']); if (/([^aeiou])\1ing$/.test(w)) tries.push([w.slice(0, -4), 'ing']); if (/ying$/.test(w)) tries.push([w.slice(0, -4) + 'ie', 'ing']); }
  if (/ier$/.test(w)) tries.push([w.slice(0, -3) + 'y', 'cmp']); if (/er$/.test(w)) { tries.push([w.slice(0, -2), 'cmp']); tries.push([w.slice(0, -1), 'cmp']); }
  if (/iest$/.test(w)) tries.push([w.slice(0, -4) + 'y', 'sup']); if (/est$/.test(w)) { tries.push([w.slice(0, -3), 'sup']); tries.push([w.slice(0, -2), 'sup']); }
  tries.forEach(function (t) {
    if (t[0].length < 2 || !known(t[0])) return;
    if (t[1] === 's') { add(t[0], 'pl'); add(t[0], '3sg'); } else if (t[1] === 'ed') { add(t[0], 'past'); add(t[0], 'pp'); } else add(t[0], t[1]);
  });
  return out;
};

/* ---------------------------------------------------------------- tokenising */
ET.tokens = function (s) {
  var out = [], re = /([A-Za-zÀ-ÿĀ-ſƀ-ɏþðæȝƿÞÐÆȜǷꝥ⁊ſ]+(?:['’][A-Za-z]+)?|\d+|[^\sA-Za-z\d])|(\s+)/g, m;
  while ((m = re.exec(s))) { if (m[2]) { if (out.length) out[out.length - 1].sp = m[2]; continue; } out.push({ t: m[1], sp: '' }); }
  return out;
};
ET.isWord = function (t) { return /[A-Za-zÀ-ÿĀ-ſƀ-ɏþðæȝƿÞÐÆȜǷꝥ]/.test(t); };
ET.caseLike = function (src, w) { if (!w) return w; if (src === src.toUpperCase() && src.length > 1 && /[A-Z]/.test(src)) return w.toUpperCase(); if (/^[A-ZÞÐÆǷȜ]/.test(src)) return w.charAt(0).toUpperCase() + w.slice(1); return w; };

if (typeof module !== 'undefined') module.exports = ET;
})(typeof window !== 'undefined' ? window : globalThis);
