/* English Through Time Studio engine - by Larry Dalton
   translate.js: modern English <-> Early Modern, Middle and Old English, word by word with reasons */
(function (G) {
'use strict';
var ET = G.ET, D = ET.D, ROW = ET.ROW;

/* ================================================================ modern English word classes */
var PRON = {
  i: [1, 's', 'nom'], me: [1, 's', 'acc'], my: [1, 's', 'gen'], mine: [1, 's', 'gena'], myself: [1, 's', 'refl'],
  you: [2, '?', 'nom'], your: [2, '?', 'gen'], yours: [2, '?', 'gena'], yourself: [2, 's', 'refl'], yourselves: [2, 'p', 'refl'],
  thou: [2, 's', 'nom'], thee: [2, 's', 'acc'], thy: [2, 's', 'gen'], thine: [2, 's', 'gena'], ye: [2, 'p', 'nom'],
  he: [3, 'm', 'nom'], him: [3, 'm', 'acc'], his: [3, 'm', 'gen'], himself: [3, 'm', 'refl'],
  she: [3, 'f', 'nom'], her: [3, 'f', 'acc'], hers: [3, 'f', 'gena'], herself: [3, 'f', 'refl'],
  it: [3, 'n', 'nom'], its: [3, 'n', 'gen'], itself: [3, 'n', 'refl'],
  we: [1, 'p', 'nom'], us: [1, 'p', 'acc'], our: [1, 'p', 'gen'], ours: [1, 'p', 'gena'], ourselves: [1, 'p', 'refl'],
  they: [3, 'p', 'nom'], them: [3, 'p', 'acc'], their: [3, 'p', 'gen'], theirs: [3, 'p', 'gena'], themselves: [3, 'p', 'refl']
};
var DET = { the: 1, a: 1, an: 1, this: 1, that: 1, these: 1, those: 1, every: 1, each: 1, some: 1, any: 1, no: 1, all: 1, both: 1, many: 1, much: 1, few: 1, other: 1, another: 1, such: 1 };
var PREP = 'of to in on at by for with from into onto upon over under through across after before behind beside besides between among against about around without within toward towards unto near off up down since until till during beyond above below beneath along'.split(' ');
var CONJ = 'and or but nor so yet because if when while though although that than as unless whether where whereas'.split(' ');
var MODAL = { will: 1, would: 1, shall: 1, should: 1, can: 1, could: 1, may: 1, might: 1, must: 1 };
var BE = { be: 'base', am: '1sg', is: '3sg', are: 'pl', was: 'past', were: 'pastpl', been: 'pp', being: 'ing' };
var HAVE = { have: 'base', has: '3sg', had: 'past', having: 'ing' };
var DO = { do: 'base', does: '3sg', did: 'past', done: 'pp', doing: 'ing' };
var WH = 'who whom whose what which where when why how'.split(' ');
var ADV = 'here there now then very too also never always often again soon still just only even ever not once twice already almost quite rather perhaps maybe today tomorrow yesterday tonight together away home back forth out up down well indeed truly yes no'.split(' ');
var NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, hundred: 100, thousand: 1000, first: 'o1', second: 'o2', third: 'o3' };
function inList(l, w) { return l.indexOf(w) >= 0; }

/* modern part of speech for an open word, from what the period dictionaries say it means */
var MODPOS = null;
function modPOS() {
  if (MODPOS) return MODPOS; MODPOS = {};
  ['ang', 'enm'].forEach(function (n) {
    var I = D.idx[n], rows = D[n]; if (!I) return;
    Object.keys(I.rev).forEach(function (h) {
      if (h.indexOf(' ') >= 0) return;
      var m = MODPOS[h] = MODPOS[h] || {};
      I.rev[h].forEach(function (x) { var p = rows[x[0]][ROW.p]; m[p] = (m[p] || 0) + (x[1] < 2 ? 2 : 1); });
    });
  });
  D.modPOS = MODPOS; return MODPOS;
}
ET.modPOS = modPOS;

/* ================================================================ tagging a modern sentence */
var EXPAND = { "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', "cannot": 'can not', "won't": 'will not', "wouldn't": 'would not', "shouldn't": 'should not', "couldn't": 'could not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not', "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "that's": 'that is', "there's": 'there is', "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have', "i'll": 'i will', "you'll": 'you will', "he'll": 'he will', "she'll": 'she will', "we'll": 'we will', "they'll": 'they will', "i'd": 'i would', "you'd": 'you would', "let's": 'let us' };
function tagModern(text) {
  var raw = ET.tokens(text.replace(/[’]/g, "'")), toks = [];
  raw.forEach(function (t, ri) {
    var lw = t.t.toLowerCase(), before = ri ? raw[ri - 1].sp : '';
    if (!ET.isWord(t.t)) { toks.push({ t: t.t, sp: t.sp, before: before }); return; }
    if (EXPAND[lw]) { var parts = EXPAND[lw].split(' '); parts.forEach(function (p, i) { toks.push({ t: i === 0 ? ET.caseLike(t.t, p) : p, sp: i < parts.length - 1 ? ' ' : t.sp }); }); return; }
    var m = /^(.+)'s$/i.exec(t.t); if (m && ET.isWord(m[1])) { toks.push({ t: m[1], sp: '', gen: true }); toks[toks.length - 1].sp = t.sp; return; }
    toks.push({ t: t.t, sp: t.sp });
  });
  var P = modPOS();
  toks.forEach(function (k, i) {
    var w = k.t.toLowerCase(); k.w = w;
    if (!ET.isWord(k.t)) { k.c = /\d/.test(k.t) ? 'NUM' : 'PUNCT'; return; }
    if (w === 'not') k.c = 'NOT';
    else if (PRON[w]) { k.c = 'PRON'; k.pr = PRON[w].slice(); }
    else if (BE[w]) { k.c = 'AUX'; k.lemma = 'be'; k.f = BE[w]; }
    else if (HAVE[w]) { k.c = 'AUX'; k.lemma = 'have'; k.f = HAVE[w]; }
    else if (DO[w]) { k.c = 'AUX'; k.lemma = 'do'; k.f = DO[w]; }
    else if (MODAL[w]) { k.c = 'MODAL'; k.lemma = w; }
    else if (DET[w]) k.c = 'DET';
    else if (inList(WH, w)) k.c = 'WH';
    else if (inList(PREP, w)) k.c = 'PREP';
    else if (inList(CONJ, w)) k.c = 'CONJ';
    else if (NUM[w]) k.c = 'NUM';
    else if (inList(ADV, w)) k.c = 'ADV';
    else k.c = 'OPEN';
  });
  // "that" joins clauses when a subject follows it ("rejoice that the spirits ...")
  toks.forEach(function (k, i) {
    var n = toks[i + 1] || {};
    if (k.w === 'that' && (n.c === 'DET' || n.c === 'PRON' && n.pr[2] === 'nom' || /^[A-Z]/.test(n.t || '') && n.c === 'OPEN')) k.c = 'CONJ';
  });
  // open words: noun, verb, adjective or adverb from form, neighbours and dictionary evidence
  toks.forEach(function (k, i) {
    if (k.c !== 'OPEN') return;
    var prev = toks[i - 1] || {}, next = toks[i + 1] || {}, an = ET.analyze(k.w), pos = {};
    an.forEach(function (a) { var p = P[a.lemma] || {}; Object.keys(p).forEach(function (q) { pos[q] = (pos[q] || 0) + p[q]; }); });
    var lg = function (x) { return x ? Math.log(1 + x) / Math.LN2 : 0; };
    var score = { noun: lg(pos.noun) + 0.5, verb: lg(pos.verb), adj: lg(pos.adj), adv: lg(pos.adv), name: 0 };
    if (/ly$/.test(k.w) && k.w.length > 4) score.adv += 4;
    if ((next.c === 'AUX' || next.c === 'MODAL') && (i === 0 || prev.c === 'DET' || prev.c === 'PUNCT' || prev.c === 'CONJ')) { score.noun += 3; score.verb -= 3; }
    if (/^[A-Z]/.test(k.t) && i > 0 && !/^[.!?]$/.test(prev.t || '')) score.name += 6;
    if (prev.c === 'DET' || prev.c === 'PRON' && prev.pr && /gen/.test(prev.pr[2]) || prev.c === 'NUM') { score.noun += 4; score.adj += 3; score.verb -= 4; }
    if (prev.c === 'PREP') { score.noun += 3; score.verb -= 2; }
    if (prev.w === 'to' || prev.c === 'MODAL' || (prev.c === 'AUX' && prev.lemma === 'do') || prev.c === 'NOT') { score.verb += 5; score.noun -= 2; }
    if (prev.c === 'PRON' && prev.pr && prev.pr[2] === 'nom') { score.verb += 5; score.noun -= 3; }
    if (prev.c === 'AUX' && prev.lemma === 'be') { score.adj += 3; if (!/ly$/.test(k.w)) score.adv -= 3; if (/ing$|ed$/.test(k.w)) score.verb += 3; }
    if (prev.c === 'AUX' && prev.lemma === 'have' && /ed$|en$/.test(k.w)) score.verb += 4;
    if (prev.c === 'OPEN' && prev.cls === 'noun' && (k.w.match(/s$/) || an.some(function (a) { return a.f === 'past'; }))) score.verb += 2;
    if (next.c === 'OPEN' && !(prev.c === 'PRON' && prev.pr[2] === 'nom')) score.adj += 1;
    if (an.some(function (a) { return a.f === 'past' || a.f === 'pp'; }) && (i === 0 || prev.c === 'PRON' || prev.c === 'NOUN' || prev.cls === 'noun' || prev.cls === 'name')) score.verb += 3;
    var best = 'noun'; Object.keys(score).forEach(function (q) { if (score[q] > score[best]) best = q; });
    k.cls = best; k.c = best === 'name' ? 'NAME' : best.toUpperCase();
    var pick = an.filter(function (a) { return best === 'noun' ? /^(base|pl)$/.test(a.f) : best === 'verb' ? !/^(pl|cmp|sup)$/.test(a.f) : best === 'adj' ? /^(base|cmp|sup)$/.test(a.f) : a.f === 'base'; });
    pick.sort(function (a, b) { return (b.f !== 'base') - (a.f !== 'base') || (ET.knownModern(b.lemma) - ET.knownModern(a.lemma)) || b.lemma.length - a.lemma.length; });
    var ch = pick.filter(function (a) { return a.lemma !== k.w; })[0] || pick[0] || an[0];
    if (best === 'verb' && ch.f === 'pl') ch = { lemma: ch.lemma, f: '3sg' };
    k.lemma = ch.lemma; k.f = ch.f;
    if (best === 'verb' && ch.f === 'base' && prev.c === 'PRON' && prev.pr && prev.pr[2] === 'nom') k.f = 'pres';
  });
  // clause roles: subject before the first verb, object after it, after a preposition: prepositional object
  var seenVerb = false, afterPrep = false, subj = null, lastBe = false;
  var FIN = function (x) { return x && (x.c === 'VERB' && !/^(ing|pp)$/.test(x.f) || x.c === 'AUX' || x.c === 'MODAL'); };
  toks.forEach(function (k, i) {
    var n = toks[i + 1];
    if (k.c === 'CONJ' && n && (n.c === 'VERB' || n.c === 'MODAL' || n.c === 'AUX' && n.lemma !== 'do')) { if (n.c === 'VERB' && !n.subj) n.subj = subj; afterPrep = false; return; }
    if (k.c === 'PUNCT' && /[.!?;:‘“"(]/.test(k.t) || k.c === 'CONJ' || k.c === 'WH') { seenVerb = false; afterPrep = false; subj = null; return; }
    if (k.c === 'PREP') { afterPrep = true; return; }
    if (k.c === 'VERB' || k.c === 'AUX' || k.c === 'MODAL') {
      if (!k.subj && (!seenVerb || subj && subj.late)) k.subj = subj;
      var p1 = toks[i - 1], p2 = toks[i - 2];
      if (k.c === 'VERB' && p1 && p2 && (p1.c === 'PRON' || p1.c === 'NOUN' || p1.c === 'NAME') && p2.c === 'VERB' && /^(let|make|see|hear|help|bid|watch|feel)$/.test(p2.lemma)) { k.bare = true; k.subj = null; }
      if (!/^(ing|pp)$/.test(k.f || '')) { seenVerb = true; lastBe = k.lemma === 'be'; }
      afterPrep = false; return;
    }
    if (k.c === 'PRON' && /gen/.test(k.pr[2])) return;
    var pv = toks[i - 1];
    if ((k.c === 'PRON' && k.pr[2] !== 'acc' || k.c === 'NOUN' || k.c === 'NAME') && pv && (pv.c === 'AUX' || pv.c === 'MODAL') && !pv.subj && (i < 2 || /^(WH|PUNCT|CONJ|ADV)$/.test(toks[i - 2].c) || i === 1)) {
      pv.subj = k; k.role = 'subj'; subj = k; return;
    }
    if (k.c === 'NOUN' || k.c === 'PRON' || k.c === 'NAME') {
      var nomOnly = k.c === 'PRON' && k.pr[2] === 'nom' && !/^(you|it)$/.test(k.w);
      if (k.c !== 'PRON' && n && n.t === ',' && !seenVerb && (i === 0 || /[‘“"(]/.test(toks[i - 1].t))) { k.role = 'voc'; return; }
      if (afterPrep && !nomOnly) k.role = 'pobj';
      else if (nomOnly || !seenVerb || FIN(n) && !afterPrep) { k.role = 'subj'; if (seenVerb) k.late = true; subj = k; }
      else k.role = lastBe ? 'pred' : 'obj';
      if (k.c === 'PRON' && k.w === 'her' && n && (n.c === 'NOUN' || n.c === 'ADJ')) { k.pr = [3, 'f', 'gen']; k.role = undefined; }
      afterPrep = false;
    }
  });
  return toks;
}
ET.tagModern = tagModern;

/* person and number of the subject that goes with a verb */
function agree(k) {
  var s = k.subj, w = k.dof || k.w || '';
  if (s && s.c === 'PRON') return { p: s.pr[0], n: s.pr[1] === 'p' ? 'p' : s.pr[1] === '?' ? '?' : 's' };
  // otherwise the modern verb form itself says who does it
  if (/^(is|was|has|does)$/.test(w) || k.f === '3sg') return { p: 3, n: 's' };
  if (w === 'am') return { p: 1, n: 's' };
  if (/^(are|were)$/.test(w)) return { p: 3, n: 'p' };
  if (!s) return (k.f === 'base' || w === 'do') && !/past/.test(k.tense || '') && w !== 'did' ? { p: 2, n: '?', imp: true } : { p: 3, n: 's' };
  if (/past/.test(k.f || '') || w === 'did') return { p: 3, n: s.f === 'pl' ? 'p' : 's' };
  return { p: 3, n: 'p' };
}

/* ================================================================ choosing a period word for a modern word */
function W(out, text, en, how, ok) { out.push({ t: text, en: en || '', how: how || '', ok: ok !== false }); return text; }
var POSMAP = { noun: ['noun', 'name'], verb: ['verb'], adj: ['adj', 'participle'], adv: ['adv'], name: ['name', 'noun'] };
function choose(period, lemma, cls) {
  var dn = ET.dictName(period), I = D.idx[dn], rows = D[dn]; if (!I) return null;
  var cands = (I.rev[lemma] || []).filter(function (x) { var p = rows[x[0]][ROW.p]; return !cls || (POSMAP[cls] || [cls]).indexOf(p) >= 0; });
  if (!cands.length) return null;
  var al = D.align && D.align[period] ? D.align[period].m2o[lemma] || [] : [], fo = D.align && D.align[period] ? D.align[period].freqO : {};
  var keyf = period === 'oe' ? ET.keyOE : ET.keyME;
  var best = null, bs = -1e9;
  cands.forEach(function (x) {
    var r = rows[x[0]], s = -x[1] * 1.2;
    if (r[ROW.f] && r[ROW.f].length) s += 1.5;
    if (r[ROW.ipa]) s += 1;
    if (r[ROW.ex] && r[ROW.ex].length) s += 0.8;
    if (/^-|-$/.test(r[ROW.w]) || /\s/.test(r[ROW.w])) s -= 6;
    if (keyf(r[ROW.w]) === keyf(lemma)) s += 2.5; // the same word has come down to us
    var nreal = r[ROW.g].filter(function (g) { return !ET.isFormOf(g); }).length; if (!nreal) s -= 5;
    if (ET.isFormOf(r[ROW.g][0] || '')) s -= 3;
    // texts of the period agree: the headword or one of its forms is what the aligned translations used
    var forms = [keyf(r[ROW.w])].concat((r[ROW.f] || []).map(function (f) { return keyf(f[0]); }));
    al.forEach(function (a) { if (forms.indexOf(keyf(a[0])) >= 0) s += 6 * a[1]; });
    forms.slice(0, 1).forEach(function (f) { if (fo[f]) s += Math.min(2, Math.log(1 + fo[f]) / 3); });
    if (s > bs) { bs = s; best = r; }
  });
  return best;
}
ET.choose = choose;
/* the form of a dictionary entry carrying all the wanted tags */
function formOf(r, want, avoid) {
  var fs = (r[ROW.f] || []).filter(function (f) { return !/alternative|canonical|romanization/.test(f[1]); });
  for (var i = 0; i < fs.length; i++) {
    var tg = ' ' + fs[i][1] + ' ';
    if (want.every(function (t) { return tg.indexOf(' ' + t + ' ') >= 0; }) && !(avoid || []).some(function (t) { return tg.indexOf(' ' + t + ' ') >= 0; })) return fs[i][0];
  }
  return null;
}
ET.formOf = formOf;
function head(r) { var c = (r[ROW.f] || []).filter(function (f) { return /canonical/.test(f[1]); })[0]; return c ? c[0] : r[ROW.w]; }

/* ================================================================ Old English */
var OEP = {
  '1s': ['iċ', 'mē', 'mē', 'mīn'], '2s': ['þū', 'þē', 'þē', 'þīn'], '3m': ['hē', 'hine', 'him', 'his'], '3f': ['hēo', 'hīe', 'hire', 'hire'], '3n': ['hit', 'hit', 'him', 'his'],
  '1p': ['wē', 'ūs', 'ūs', 'ūre'], '2p': ['ġē', 'ēow', 'ēow', 'ēower'], '3p': ['hīe', 'hīe', 'him', 'hiera']
};
var OEDET = { // the / that by gender and case: nom, acc, dat, gen
  m: ['se', 'þone', 'þǣm', 'þæs'], f: ['sēo', 'þā', 'þǣre', 'þǣre'], n: ['þæt', 'þæt', 'þǣm', 'þæs'], p: ['þā', 'þā', 'þǣm', 'þāra'] };
var OETHIS = { m: ['þes', 'þisne', 'þissum', 'þisses'], f: ['þēos', 'þās', 'þisse', 'þisse'], n: ['þis', 'þis', 'þissum', 'þisses'], p: ['þās', 'þās', 'þissum', 'þissa'] };
var OEFIX = {
  and: 'and', or: 'oþþe', but: 'ac', so: 'swā', because: 'forþǣm þe', if: 'ġif', while: 'þā hwīle þe', though: 'þēah', although: 'þēah', than: 'þonne', as: 'swā', nor: 'ne', yet: 'ġīet', whether: 'hwæþer', unless: 'būton',
  of: 'of', to: 'tō', in: 'on', on: 'on', at: 'æt', by: 'be', for: 'for', with: 'mid', from: 'fram', into: 'intō', onto: 'on', upon: 'uppan', over: 'ofer', under: 'under', through: 'þurh', across: 'ofer', after: 'æfter', before: 'beforan', behind: 'behindan', beside: 'be', between: 'betweox', among: 'betwux', against: 'onġēan', about: 'ymbe', around: 'ymbūtan', without: 'būtan', within: 'binnan', toward: 'tōweard', towards: 'tōweard', unto: 'tō', near: 'nēah', since: 'siþþan', until: 'oþ', till: 'oþ', during: 'on', above: 'bufan', below: 'beneoþan', beneath: 'beneoþan', along: 'andlang', off: 'of', up: 'ūp', down: 'nyþer',
  here: 'hēr', there: 'þǣr', now: 'nū', then: 'þā', very: 'swīþe', too: 'ēac', also: 'ēac', never: 'nǣfre', always: 'ǣfre', often: 'oft', again: 'eft', soon: 'sōna', still: 'ġīet', just: 'rihte', only: 'ānlīċe', even: 'furþum', ever: 'ǣfre', once: 'ǣne', already: 'ǣr', almost: 'nēah', perhaps: 'wēnunga', maybe: 'wēnunga', today: 'tōdæġ', tomorrow: 'tōmorgen', yesterday: 'ġeostran dæġ', together: 'tōgædere', away: 'onweġ', home: 'hām', back: 'eft', forth: 'forþ', out: 'ūt', well: 'wel', indeed: 'witodlīċe', truly: 'sōþlīċe', yes: 'ġēa', no: 'nā',
  who: 'hwā', whom: 'hwone', whose: 'hwæs', what: 'hwæt', which: 'hwilċ', where: 'hwǣr', when: 'hwonne', why: 'hwȳ', how: 'hū',
  someone: 'sum mann', somebody: 'sum mann', anyone: 'ǣniġ mann', everyone: 'ǣlċ mann', nothing: 'nāwiht', something: 'sum þing', everything: 'ǣlċ þing', every: 'ǣlċ', each: 'ǣlċ', some: 'sum', any: 'ǣniġ', no_det: 'nān', all: 'eall', both: 'bēġen', many: 'maniġ', much: 'miċel', few: 'fēawe', other: 'ōþer', another: 'ōþer', such: 'swilċ',
  one: 'ān', two: 'twēġen', three: 'þrīe', four: 'fēower', five: 'fīf', six: 'siex', seven: 'seofon', eight: 'eahta', nine: 'nigon', ten: 'tīen', eleven: 'endleofan', twelve: 'twelf', twenty: 'twēntiġ', hundred: 'hund', thousand: 'þūsend', first: 'forma', second: 'ōþer', third: 'þridda'
};
var OEVERB = { be: 'wesan', have: 'habban', do: 'dōn', go: 'gān', will: 'willan', would: 'willan', shall: 'sculan', should: 'sculan', can: 'cunnan', could: 'cunnan', may: 'magan', might: 'magan', must: 'mōtan', say: 'secgan', come: 'cuman', see: 'sēon', know: 'witan', make: 'macian', give: 'ġiefan', take: 'niman', speak: 'sprecan', hear: 'hīeran', love: 'lufian', live: 'libban', think: 'þenċan', find: 'findan', tell: 'tellan', let: 'lǣtan', stand: 'standan', sit: 'sittan', eat: 'etan', drink: 'drincan', sing: 'singan', write: 'wrītan', fight: 'feohtan', run: 'irnan', want: 'willan', get: 'begietan', bring: 'bringan', send: 'sendan', call: 'clipian', ask: 'āscian', answer: 'andswarian', die: 'sweltan', kill: 'ofslēan', help: 'helpan', keep: 'healdan', hold: 'healdan', work: 'wyrċan', walk: 'gangan', leave: 'forlǣtan', put: 'settan', seek: 'sēċan', fall: 'feallan', grow: 'weaxan', sleep: 'slǣpan', fly: 'flēogan', fear: 'ondrǣdan', believe: 'ġelīefan', learn: 'leornian', teach: 'tǣċan', read: 'rǣdan' };
var OENOUN = { man: 'mann', woman: 'wīf', king: 'cyning', god: 'god', lord: 'hlāford', day: 'dæġ', night: 'niht', house: 'hūs', word: 'word', world: 'woruld', land: 'land', water: 'wæter', heaven: 'heofon', earth: 'eorþe', sun: 'sunne', moon: 'mōna', hand: 'hand', heart: 'heorte', mind: 'mōd', child: 'ċild', son: 'sunu', daughter: 'dohtor', father: 'fæder', mother: 'mōdor', brother: 'brōþor', sister: 'sweostor', friend: 'frēond', name: 'nama', time: 'tīd', year: 'ġēar', life: 'līf', death: 'dēaþ', sword: 'sweord', ship: 'scip', sea: 'sǣ', book: 'bōc', bread: 'hlāf', people: 'folc', horse: 'hors', dog: 'hund', wolf: 'wulf', tree: 'trēow', stone: 'stān', fire: 'fȳr', way: 'weġ', home: 'hām', town: 'tūn', city: 'burg', hall: 'heall', war: 'wīġ', peace: 'friþ', love: 'lufu', truth: 'sōþ', eye: 'ēage', head: 'hēafod', body: 'līċhama', soul: 'sāwol', blood: 'blōd', song: 'sang', story: 'spell', king_s: 'cyning' };
var OEADJ = { good: 'gōd', bad: 'yfel', evil: 'yfel', great: 'grēat', big: 'miċel', small: 'lytel', little: 'lytel', old: 'eald', young: 'ġeong', new: 'nīwe', long: 'lang', short: 'sceort', high: 'hēah', deep: 'dēop', wise: 'wīs', strong: 'strang', holy: 'hāliġ', dear: 'dēore', bright: 'beorht', dark: 'deorc', true: 'sōþ', black: 'sweart', white: 'hwīt', red: 'rēad', green: 'grēne', cold: 'ċeald', warm: 'wearm', happy: 'blīþe', sad: 'unrōt', free: 'frēo', full: 'full', dead: 'dēad', alive: 'cwic' };
function entryByHead(period, hw, cls) {
  var dn = ET.dictName(period), I = D.idx[dn], rows = D[dn]; if (!I) return null;
  var k = (period === 'oe' ? ET.keyOE : ET.keyME)(hw), ids = I.head[k] || [];
  var ok = ids.map(function (i) { return rows[i]; }).filter(function (r) { return !cls || (POSMAP[cls] || [cls]).indexOf(r[ROW.p]) >= 0; });
  ok.sort(function (a, b) { return (b[ROW.f] || []).length - (a[ROW.f] || []).length; });
  return ok[0] || null;
}
var OECASE = { nom: 'nominative', acc: 'accusative', dat: 'dative', gen: 'genitive' };
function impForm(r, a) { return formOf(r, ['imperative', a.n === 'p' ? 'plural' : 'singular']) || formOf(r, ['imperative']) || head(r); }
function oeVerbForm(r, a, tense, f) {
  if (a && a.imp && f === 'fin') return impForm(r, a);
  if (f === 'inf' || f === 'base' && !a) return formOf(r, ['infinitive']) || head(r);
  if (f === 'pp') { var pp = (r[ROW.f] || []).filter(function (x) { return /past/.test(x[1]) && /^ġe/.test(x[0]); })[0]; return pp ? pp[0] : formOf(r, ['imperative', 'past']) || head(r); }
  if (f === 'ing') { var pr = (r[ROW.f] || []).filter(function (x) { return /ende$/.test(x[0]); })[0]; return pr ? pr[0] : head(r); }
  var past = tense === 'past';
  if (a.n === 'p') return formOf(r, past ? ['past', 'plural'] : ['plural', 'present'], ['imperative']) || head(r);
  if (a.p === 1) return formOf(r, past ? ['first-person', 'past', 'singular'] : ['first-person', 'present', 'singular']) || head(r);
  if (a.p === 2) return formOf(r, past ? ['past', 'second-person', 'singular'] : ['present', 'second-person', 'singular']) || head(r);
  return formOf(r, past ? ['past', 'singular', 'third-person'] : ['present', 'singular', 'third-person']) || head(r);
}
function oeNounForm(r, num, cas) {
  return formOf(r, [OECASE[cas] || 'nominative', num === 'p' ? 'plural' : 'singular'], ['adjective']) || (num === 'p' ? formOf(r, ['nominative', 'plural']) : null) || head(r);
}
function oeAdjForm(r, gen, num, cas) {
  var g = { m: 'masculine', f: 'feminine', n: 'neuter' }[gen] || 'masculine';
  return formOf(r, [OECASE[cas] || 'nominative', g, num === 'p' ? 'plural' : 'singular']) || head(r);
}

/* ================================================================ Middle English (Chaucer and Wycliffe spellings) */
var MEP = { '1s': ['I', 'me', 'me', 'my', 'myn'], '2s': ['thou', 'thee', 'thee', 'thy', 'thyn'], '3m': ['he', 'hym', 'hym', 'his', 'his'], '3f': ['sche', 'hir', 'hir', 'hir', 'hires'], '3n': ['it', 'it', 'it', 'his', 'his'],
  '1p': ['we', 'us', 'us', 'oure', 'oures'], '2p': ['ye', 'yow', 'yow', 'youre', 'youres'], '3p': ['thei', 'hem', 'hem', 'her', 'heres'] };
var MEFIX = {
  someone: 'sum man', somebody: 'sum man', anyone: 'ony man', everyone: 'ech man', nothing: 'no thing', something: 'sum thing', everything: 'alle thingis', the: 'the', a: 'a', an: 'an', this: 'this', that: 'that', these: 'thise', those: 'tho', every: 'euery', each: 'ech', some: 'summe', any: 'ony', no: 'no', all: 'alle', both: 'bothe', many: 'manye', much: 'moche', few: 'fewe', other: 'othere', another: 'another', such: 'swich',
  and: 'and', or: 'or', but: 'but', nor: 'ne', so: 'so', yet: 'yit', because: 'for', if: 'if', when: 'whanne', while: 'while', though: 'though', although: 'al though', that: 'that', than: 'than', as: 'as', unless: 'but if', whether: 'whether', where: 'where',
  of: 'of', to: 'to', in: 'in', on: 'on', at: 'at', by: 'bi', for: 'for', with: 'with', from: 'fro', into: 'in to', onto: 'on', upon: 'vpon', over: 'ouer', under: 'vndur', through: 'thorou', across: 'ouer', after: 'aftir', before: 'bifore', behind: 'bihynde', beside: 'biside', between: 'bitwixe', among: 'among', against: 'ayens', about: 'aboute', around: 'aboute', without: 'with outen', within: 'with ynne', toward: 'toward', towards: 'toward', unto: 'to', near: 'nyy', since: 'sith', until: 'til', till: 'til', during: 'in', above: 'aboue', below: 'bynethe', beneath: 'bynethe', along: 'along', off: 'of', up: 'vp', down: 'doun',
  here: 'heere', there: 'there', now: 'now', then: 'thanne', very: 'ful', too: 'to', also: 'also', never: 'neuere', always: 'euere', often: 'ofte', again: 'ayen', soon: 'soone', still: 'stille', just: 'riyt', only: 'oonli', even: 'euene', ever: 'euere', once: 'oones', already: 'now', almost: 'almoost', perhaps: 'perauenture', maybe: 'perauenture', today: 'to dai', tomorrow: 'to morewe', yesterday: 'yistirdai', together: 'togidere', away: 'awei', home: 'hoom', back: 'ayen', forth: 'forth', out: 'out', well: 'wel', indeed: 'sotheli', truly: 'treuli', yes: 'yhe', no_adv: 'nay', not: 'not',
  who: 'who', whom: 'whom', whose: 'whos', what: 'what', which: 'which', why: 'whi', how: 'hou',
  one: 'oon', two: 'tweyne', three: 'thre', four: 'foure', five: 'fyue', six: 'sixe', seven: 'seuene', eight: 'eiyte', nine: 'nyne', ten: 'ten', twelve: 'twelue', twenty: 'twenti', hundred: 'hundrid', thousand: 'thousynde', first: 'firste', second: 'secounde', third: 'thridde'
};
var MEVERB = { be: 'been', have: 'haven', do: 'doon', go: 'goon', say: 'seyen', come: 'comen', see: 'seen', know: 'knowen', make: 'maken', give: 'yeven', take: 'taken', love: 'loven', speak: 'speken', hear: 'heren', think: 'thynken', tell: 'tellen', find: 'fynden', let: 'leten', write: 'writen', sing: 'syngen' };
var MEMOD = { will: ['wole', 'wolt', 'wole', 'wolen', 'wolde'], would: ['wolde', 'woldest', 'wolde', 'wolden', 'wolde'], shall: ['schal', 'schalt', 'schal', 'schulen', 'schulde'], should: ['schulde', 'schuldist', 'schulde', 'schulden', 'schulde'], can: ['can', 'canst', 'can', 'connen', 'coude'], could: ['coude', 'coudist', 'coude', 'couden', 'coude'], may: ['may', 'mayst', 'may', 'mowen', 'myyte'], might: ['myyte', 'myytist', 'myyte', 'myyten', 'myyte'], must: ['moot', 'most', 'moot', 'moten', 'moste'] };
var MEBE = { '1s': 'am', '2s': 'art', '3s': 'is', p: 'ben', past1: 'was', past2: 'were', past3: 'was', pastp: 'weren', inf: 'be', pp: 'be', ing: 'beynge' };
var MEHAVE = { '1s': 'haue', '2s': 'hast', '3s': 'hath', p: 'han', past1: 'hadde', past2: 'haddist', past3: 'hadde', pastp: 'hadden', inf: 'haue', pp: 'had', ing: 'hauynge' };
var MEDO = { '1s': 'do', '2s': 'doist', '3s': 'doith', p: 'doen', past1: 'dide', past2: 'didist', past3: 'dide', pastp: 'diden', inf: 'do', pp: 'don', ing: 'doynge' };
var OEBE = { '1s': 'eom', '2s': 'eart', '3s': 'is', p: 'sindon', past1: 'wæs', past2: 'wǣre', past3: 'wæs', pastp: 'wǣron', inf: 'wesan', pp: 'ġebēon', ing: 'wesende', imps: 'wes', impp: 'wesaþ' };
function meParadigm(T, a, tense, f) {
  if (a && a.imp && T.imps) return a.n === 'p' ? T.impp : T.imps;
  if (f === 'inf' || f === 'base' && !a || a && a.imp) return T.inf; if (f === 'pp') return T.pp; if (f === 'ing') return T.ing;
  if (tense === 'past') return a.n === 'p' ? T.pastp : T['past' + a.p];
  return a.n === 'p' ? T.p : T[a.p + 's'];
}
function meVerbForm(r, a, tense, f) {
  if (a && a.imp && f === 'fin') return impForm(r, a);
  if (f === 'inf' || f === 'base' && !a) return formOf(r, ['infinitive']) || head(r);
  if (f === 'pp') return formOf(r, ['participle', 'past']) || formOf(r, ['past']) || head(r);
  if (f === 'ing') return formOf(r, ['participle', 'present']) || head(r);
  var past = tense === 'past';
  if (a.n === 'p') return formOf(r, past ? ['past', 'plural'] : ['plural', 'present']) || head(r);
  if (a.p === 2) return formOf(r, past ? ['past', 'second-person', 'singular'] : ['present', 'second-person', 'singular']) || head(r);
  if (a.p === 1) return formOf(r, past ? ['first-person', 'past', 'singular'] : ['first-person', 'present', 'singular']) || head(r);
  return formOf(r, past ? ['past', 'singular', 'third-person'] : ['present', 'singular', 'third-person']) || head(r);
}

/* ================================================================ Early Modern English */
var EME2 = { // second person singular (thou ...)
  be: ['art', 'wast'], have: ['hast', 'hadst'], do: ['dost', 'didst'], will: ['wilt', 'wouldst'], would: ['wouldst', 'wouldst'], shall: ['shalt', 'shouldst'], should: ['shouldst', 'shouldst'], can: ['canst', 'couldst'], could: ['couldst', 'couldst'], may: ['mayest', 'mightest'], might: ['mightest', 'mightest'], must: ['must', 'must'], say: ['sayest', 'saidst'], go: ['goest', 'wentest']
};
var EME3 = { be: 'is', have: 'hath', do: 'doth', say: 'saith', go: 'goeth' };
var EMEWORDS = { often: 'oft', before_: 'ere', perhaps: 'perchance', nothing: 'naught', between: 'betwixt', while: 'whilst', truly: 'verily', yes: 'yea', why: 'wherefore', anything: 'aught', farewell: 'fare thee well', goodbye: 'God be with you' };
function emeV(lemma, a, tense) {
  if (a && a.imp) return null;
  if (a && a.p === 2 && a.n !== 'p') {
    if (EME2[lemma]) return EME2[lemma][tense === 'past' ? 1 : 0];
    if (tense === 'past') { var p = ET.inflect(lemma, 'past'); return /e$/.test(p) ? p + 'st' : /ed$/.test(p) ? p + 'st' : p + 'est'; }
    return /e$/.test(lemma) ? lemma + 'st' : /[^aeiou]y$/.test(lemma) ? lemma.slice(0, -1) + 'iest' : /(s|x|z|ch|sh)$/.test(lemma) ? lemma + 'est' : lemma + 'est';
  }
  if (tense !== 'past' && a && a.p === 3 && a.n !== 'p') {
    if (EME3[lemma]) return EME3[lemma];
    if (MODAL[lemma]) return lemma;
    return /e$/.test(lemma) ? lemma + 'th' : /[^aeiou]y$/.test(lemma) ? lemma.slice(0, -1) + 'ieth' : lemma + 'eth';
  }
  return null;
}

/* ================================================================ modern -> period */
function pronKey(pr, you) { if (pr[0] === 2) return you === 'ye' || pr[1] === 'p' ? '2p' : '2s'; if (pr[0] === 3) return pr[1] === 'p' ? '3p' : '3' + pr[1]; return pr[0] + (pr[1] === 'p' ? 'p' : 's'); }
function toPeriod(text, period, opts) {
  opts = opts || {}; var you = opts.you || 'thou', archaic = opts.archaic !== false;
  var toks = tagModern(text), out = [], words = [], i;
  // do-support: "do not V" / "do you V" become "V not" / "V you" in every older period
  for (i = 0; i < toks.length; i++) {
    var k = toks[i];
    if (k.c === 'AUX' && k.lemma === 'do') {
      var n1 = toks[i + 1], n2 = toks[i + 2], n3 = toks[i + 3];
      if (n1 && n1.c === 'NOT' && n2 && (n2.c === 'VERB' || n2.c === 'AUX' && n2.lemma === 'be')) { n2.tense = /past/.test(k.f) ? 'past' : 'pres'; n2.subj = k.subj; n2.dof = k.w; n2.fromDo = true; toks.splice(i, 1); toks.splice(i + 1, 0, toks.splice(i, 1)[0]); continue; }
      if (n1 && (n1.c === 'PRON' || n1.c === 'NOUN' || n1.c === 'NAME') && n2 && n2.c === 'VERB') { n2.tense = /past/.test(k.f) ? 'past' : 'pres'; n2.subj = n1; n2.dof = k.w; n2.fromDo = true; toks.splice(i, 1); var v = toks.splice(i + 1, 1)[0]; toks.splice(i, 0, v); continue; }
      if (n1 && n1.c === 'PRON' && n2 && n2.c === 'NOT' && n3 && n3.c === 'VERB') { n3.tense = /past/.test(k.f) ? 'past' : 'pres'; n3.subj = n1; n3.dof = k.w; n3.fromDo = true; toks.splice(i, 1); var v2 = toks.splice(i + 2, 1)[0]; toks.splice(i, 0, v2); continue; }
    }
  }
  // "know not him" -> "know him not": an object pronoun comes before "not"
  for (i = 0; i + 2 < toks.length; i++) if (toks[i].fromDo && toks[i + 1].c === 'NOT' && toks[i + 2].c === 'PRON' && toks[i + 2].role !== 'subj') { var nt = toks[i + 1]; toks[i + 1] = toks[i + 2]; toks[i + 2] = nt; }
  var lastNoun = {};
  toks.forEach(function (k, idx) {
    var prev = toks[idx - 1] || {}, next = toks[idx + 1] || {}, t;
    if (k.c === 'PUNCT' || k.c === 'NUM' && /\d/.test(k.t)) { out.push({ t: k.t, sp: k.sp, before: k.before, en: k.t, how: '', ok: true, punct: true }); return; }
    var rec = function (text, how, ok) { out.push({ t: ET.caseLike(k.t, text), sp: k.sp, en: k.t, how: how, ok: ok !== false, c: k.c }); };
    var tense = k.tense || (/past/.test(k.f || '') ? 'past' : 'pres'), a = k.fromDo ? agree(k) : (k.c === 'VERB' || k.c === 'AUX' || k.c === 'MODAL') ? agree(k) : null;
    if (a && a.n === '?' ) a.n = you === 'ye' ? 'p' : 's';
    var modalBefore = false;
    if ((k.f === 'base' || k.f === 'pres' || k.f === 'pp' && ET.inflect(k.lemma, 'pp') === k.lemma) && !k.fromDo) for (var mb = idx - 1; mb >= 0 && mb >= idx - 3; mb--) { var tb = toks[mb]; if (tb.c === 'MODAL' || tb.c === 'AUX' && tb.lemma === 'do' && !tb.fromDo) { modalBefore = true; break; } if (tb.c === 'VERB' || tb.c === 'PUNCT' || tb.c === 'CONJ' || tb.c === 'AUX') break; }
    var vf = modalBefore || prev.w === 'to' && k.f !== 'ing' || k.bare ? 'inf' : k.f === 'pp' ? 'pp' : k.f === 'ing' ? 'ing' : 'fin';
    if (period === 'eme') {
      if (k.c === 'PRON') {
        var pr = k.pr, w = k.w;
        if (pr[0] === 2 && (w === 'you' || w === 'your' || w === 'yours' || w === 'yourself')) {
          var pl = you === 'ye';
          if (w === 'you') t = pl ? (k.role === 'subj' || next.c === 'VERB' || next.c === 'AUX' || next.c === 'MODAL' || k.role === undefined && idx < toks.length - 1 && (next.c === 'VERB') ? 'ye' : 'you') : (k.role === 'subj' || toks.some(function (x) { return x.subj === k; }) ? 'thou' : 'thee');
          else if (w === 'your') t = pl ? 'your' : (/^[aeiouh]/i.test(next.t || '') ? 'thine' : 'thy');
          else if (w === 'yours') t = pl ? 'yours' : 'thine'; else t = pl ? 'yourselves' : 'thyself';
          return rec(t, pl ? 'several people: ye (subject), you (object)' : 'one person, familiar: thou, thee, thy, thine');
        }
        if (w === 'its') return rec('its', 'kept (the King James Bible still often writes "his" for "its")');
        if (w === 'my' && /^[aeiouh]/i.test(next.t || '')) return rec('mine', '"mine" before a vowel');
        return rec(k.t, 'unchanged');
      }
      if (k.c === 'AUX' || k.c === 'MODAL' || k.c === 'VERB') {
        if (vf === 'fin') { var e = emeV(k.lemma, a, tense); if (e && e !== k.w) return rec(e, a.p === 2 ? 'thou-form of the verb (-est, -st)' : 'he/she/it form of the verb (-eth, -th)'); }
        if (k.fromDo) return rec(tense === 'past' ? ET.inflect(k.lemma, 'past') : k.lemma, 'without "do": Early Modern English put the verb first or before "not"');
        return rec(k.t, 'unchanged');
      }
      if (archaic) {
        if (k.w === 'to' && prev.c === 'VERB' && /^(say|speak|come|go|cry|pray|answer|reply)$/.test(prev.lemma) && (next.c === 'PRON' || next.c === 'NAME' || next.c === 'DET')) return rec('unto', '"unto" after verbs of speaking and moving, as in the King James Bible');
        var ar = EMEWORDS[k.w]; if (ar && !/_/.test(k.w)) return rec(ar, 'older word for "' + k.w + '"');
      }
      return rec(k.t, 'unchanged');
    }
    if (period === 'me' || period === 'oe') {
      var OE = period === 'oe', FIX = OE ? OEFIX : MEFIX;
      if (k.c === 'NOT') { return rec(OE ? 'ne' : 'not', OE ? '"ne" goes before the verb' : 'negation'); }
      if (k.c === 'PRON') {
        var pk = pronKey(k.pr, you), cas = k.pr[2], tab = OE ? OEP[pk] : MEP[pk];
        if (/^(you|it)$/.test(k.w)) cas = k.role === 'subj' || !k.role ? 'nom' : 'acc';
        if (k.pr[2] === 'refl') return rec((OE ? tab[1] : tab[1]) + (OE ? ' selfne' : ' silf'), 'pronoun with "self"');
        var ci = cas === 'nom' ? 0 : cas === 'acc' ? (k.role === 'pobj' ? 2 : 1) : 3;
        if (!OE && cas === 'gen') ci = /^[aeiouh]/i.test(next.t || '') ? 4 : 3; if (!OE && cas === 'gena') ci = 4;
        if (OE && cas === 'gena') ci = 3;
        return rec(tab[ci], (OE ? ['nominative (subject)', 'accusative (object)', 'dative (after a preposition)', 'genitive (possessive)'][ci] : ['subject', 'object', 'object', 'possessive', 'possessive'][ci]) + ' pronoun');
      }
      if (k.c === 'DET') {
        // find the noun this belongs to
        var nn = null; for (var j = idx + 1; j < toks.length && j < idx + 4; j++) if (toks[j].c === 'NOUN' || toks[j].c === 'NAME') { nn = toks[j]; break; }
        if (OE && (k.w === 'the' || k.w === 'that' || k.w === 'this' || k.w === 'these' || k.w === 'those')) {
          var ne = nn ? (OEFIX[nn.lemma] ? null : (OENOUN[nn.lemma] ? entryByHead('oe', OENOUN[nn.lemma], 'noun') : choose('oe', nn.lemma, 'noun'))) : null;
          var gen = nn && nn.f === 'pl' || /these|those/.test(k.w) ? 'p' : ne && ne[ROW.gen] || 'm';
          var cs = nn ? caseOf(nn) : 'nom', T = /this|these/.test(k.w) ? OETHIS : OEDET;
          if (nn) nn.oeGen = gen;
          return rec(T[gen][['nom', 'acc', 'dat', 'gen'].indexOf(cs)], 'agrees with the noun: ' + ({ m: 'masculine', f: 'feminine', n: 'neuter', p: 'plural' })[gen] + ', ' + OECASE[cs]);
        }
        if (OE && (k.w === 'a' || k.w === 'an')) { out.push({ t: '', sp: '', en: k.t, how: 'Old English usually had no word for "a"', ok: true, skip: true }); return; }
        if (OE && k.w === 'no') return rec('nān', 'no, none');
        return rec(FIX[k.w] || k.t, FIX[k.w] ? 'function word' : 'kept', !!FIX[k.w]);
      }
      if (k.c === 'PREP' || k.c === 'CONJ' || k.c === 'ADV' || k.c === 'WH' || k.c === 'NUM') {
        if (k.w === 'that' && k.c === 'CONJ') return rec(OE ? 'þæt' : 'that', 'that (joining words)');
        if (k.w === 'no' && !OE) return rec('nay', 'no (answer)');
        if (k.w === 'when' && OE) return rec(tense === 'past' || toks.some(function (x) { return /past/.test(x.f || ''); }) ? 'þā' : 'þonne', '"when": þā for the past, þonne for now');
        if (FIX[k.w]) return rec(FIX[k.w], 'function word');
      }
      if (k.c === 'AUX' || k.c === 'MODAL') {
        if (k.lemma === 'do' && !k.fromDo && (next.c === 'VERB' || next.c === 'NOT')) { out.push({ t: '', sp: '', en: k.t, how: 'no "do" in ' + ET.PERIODS[period].name, ok: true, skip: true }); return; }
        if (OE && k.lemma === 'be') return rec(meParadigm(OEBE, a, tense, vf === 'fin' ? 'fin' : vf), 'wesan/bēon "be", agreeing with the subject');
        if (!OE && (k.lemma === 'be' || k.lemma === 'have' || k.lemma === 'do')) {
          var Tm = k.lemma === 'be' ? MEBE : k.lemma === 'have' ? MEHAVE : MEDO; return rec(meParadigm(Tm, a, tense, vf === 'fin' ? 'fin' : vf), k.lemma + ', agreeing with the subject');
        }
        if (!OE && MEMOD[k.lemma]) { var mm = MEMOD[k.lemma]; return rec(a.n === 'p' ? mm[3] : a.p === 2 ? mm[1] : a.p === 1 ? mm[0] : mm[2], 'helping verb'); }
        if (OE) {
          var oev = entryByHead('oe', OEVERB[k.lemma], 'verb'); if (oev) return rec(oeVerbForm(oev, a, /would|should|could|might/.test(k.w) ? 'past' : tense, vf === 'fin' ? 'fin' : vf), OEVERB[k.lemma] + ', agreeing with the subject');
        }
      }
      if (/^(someone|somebody|anyone|everyone|nothing|something|everything)$/.test(k.w) && FIX[k.w]) return rec(FIX[k.w], 'indefinite pronoun');
      // open words
      var cls = k.c === 'VERB' ? 'verb' : k.c === 'ADJ' ? 'adj' : k.c === 'ADV' ? 'adv' : k.c === 'NAME' ? 'name' : 'noun';
      if (k.c === 'NAME') return rec(k.t, 'name kept');
      var r = null, how = '';
      // Middle English: the spelling a 14th-century translator actually used for this very word, if it is clear
      if (!OE && D.align && D.align.me) {
        var al = D.align.me.m2o[k.w] || [], top = al[0], fm = D.align.me.freqM[k.w] || 0;
        if (top && top[1] >= 0.35 && fm >= 3 && /^[a-z]+$/.test(top[0]) && !MEFIX[top[0]]) return rec(top[0], 'as Wycliffe\'s translators wrote it (' + Math.round(top[1] * 100) + '% of ' + fm + ' times)');
      }
      var fixed = OE ? (cls === 'verb' ? OEVERB : cls === 'adj' ? OEADJ : OENOUN)[k.lemma] : cls === 'verb' ? MEVERB[k.lemma] : null;
      if (fixed) { r = entryByHead(period, fixed, cls); how = 'core word'; }
      if (!r && !OE && cls !== 'verb') { var same = entryByHead('me', k.lemma, cls); if (same && same[ROW.w].toLowerCase() === k.lemma) { r = same; how = 'the same word in Middle English'; } }
      if (!r) { r = choose(period, k.lemma, cls); how = 'from the dictionary'; }
      if (!r) { r = choose(period, k.lemma, cls === 'noun' ? 'adj' : null); how = 'from the dictionary (listed as another part of speech)'; }
      if (!r) {
        // Old English: the Gospels translation, when it is clear
        var al2 = D.align && D.align[period] ? D.align[period].m2o[k.w] || [] : [];
        if (al2[0] && al2[0][1] >= 0.45) return rec(al2[0][0], 'as the period translators wrote it');
        return rec(k.t, 'not found: kept in modern spelling', false);
      }
      var form;
      if (cls === 'verb') form = OE ? oeVerbForm(r, a, tense, vf === 'fin' ? 'fin' : vf) : meVerbForm(r, a, tense, vf === 'fin' ? 'fin' : vf);
      else if (cls === 'noun') form = OE ? oeNounForm(r, k.f === 'pl' ? 'p' : 's', k.gen ? 'gen' : caseOf(k)) : (k.f === 'pl' ? formOf(r, ['plural']) || head(r) + 'es' : head(r));
      else if (cls === 'adj' && OE) {
        var noun = toks.slice(idx + 1, idx + 3).filter(function (x) { return x.c === 'NOUN'; })[0];
        form = noun ? oeAdjForm(r, noun.oeGen || (choose('oe', noun.lemma, 'noun') || [])[ROW.gen] || 'm', noun.f === 'pl' ? 'p' : 's', caseOf(noun)) : head(r);
      } else form = head(r);
      return rec(form, how + ': ' + r[ROW.w] + ' "' + ET.shortGloss(r) + '"' + (form !== r[ROW.w] && describe(cls, k, a, tense, vf, OE) ? ' (' + describe(cls, k, a, tense, vf, OE) + ')' : ''));
    }
    return rec(k.t, '');
  });
  if (period === 'oe' || period === 'me') moveNe(out, period === 'oe');
  return finish(out, period);
}
function caseOf(k) { if (k.gen) return 'gen'; if (k.role === 'pred') return 'nom'; return k.role === 'pobj' ? 'dat' : k.role === 'obj' ? 'acc' : 'nom'; }
function describe(cls, k, a, tense, vf, OE) {
  if (cls === 'noun') return (k.f === 'pl' ? 'plural' : 'singular') + (OE ? ', ' + OECASE[caseOf(k)] : '');
  if (cls === 'verb') return vf === 'inf' ? 'infinitive' : vf === 'pp' ? 'past participle' : vf === 'ing' ? 'present participle' : tense + ' tense, ' + (a ? (a.n === 'p' ? 'plural' : ['', 'I', 'thou', 'he/she/it'][a.p]) : '');
  return '';
}
/* Old/Middle English negation: "ne" and "not" stand before the verb they deny */
var NEC = { is: 'nis', 'wæs': 'næs', 'wǣron': 'nǣron', 'wǣre': 'nǣre', 'wāt': 'nāt', 'witon': 'nyton', 'hæbbe': 'næbbe', 'hæfþ': 'næfþ', 'hæfst': 'næfst', 'hæfde': 'næfde', 'wille': 'nylle', 'wile': 'nyle', 'eom': 'neom', 'eart': 'neart' };
function moveNe(out, OE) {
  if (!OE) return;
  for (var i = 1; i < out.length; i++) {
    if (out[i].en.toLowerCase() !== 'not' || out[i].t !== 'ne') continue;
    var v = out[i - 1]; if (!/^(VERB|AUX|MODAL)$/.test(v.c || '')) continue;
    var lw = v.t.toLowerCase();
    if (NEC[lw]) { v.t = ET.caseLike(v.t, NEC[lw]); v.how += '; "ne" joined to it (' + NEC[lw] + ')'; out[i].skip = true; out[i].t = ''; continue; }
    out[i - 1] = out[i]; out[i] = v; out[i - 1].t = ET.caseLike(v.t, 'ne'); out[i].t = /^[A-ZÞ]/.test(v.t) && i - 1 === 0 ? v.t : v.t; out[i - 1].how = '"ne" goes before the verb';
  }
}
ET.shortGloss = function (r) { var g = r[ROW.g].filter(function (x) { return !ET.isFormOf(x); })[0] || r[ROW.g][0] || ''; return g.replace(/\s*\([^)]*\)/g, '').split(';')[0].slice(0, 60); };
function finish(out, period) {
  var s = '', items = out.filter(function (o) { return !o.skip && o.t !== ''; });
  items.forEach(function (o, i) {
    if (i) { var a = items[i - 1]; s += o.punct ? (o.before || '') : a.punct ? (a.sp || '') : ' '; }
    s += o.t;
  });
  s = s.replace(/[ \t]+/g, ' ').replace(/ +([.,!?;:])/g, '$1').replace(/^\s+/, '');
  if (period === 'me') s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
  if (period === 'eme') s = s.replace(/\b([Cc])an not\b/g, '$1annot');
  if (s) s = s.charAt(0).toUpperCase() + s.slice(1);
  return { text: s, words: out, period: period, dir: 'to' };
}

/* ================================================================ period -> modern */
var BACK = {
  eme: { thou: 'you', thee: 'you', thy: 'your', thine: 'your', ye: 'you', thyself: 'yourself', art: 'are', wast: 'were', wert: 'were', hast: 'have', hath: 'has', hadst: 'had', dost: 'do', doth: 'does', didst: 'did', wilt: 'will', shalt: 'shall', canst: 'can', couldst: 'could', wouldst: 'would', shouldst: 'should', mayest: 'may', mayst: 'may', mightest: 'might', saith: 'says', quoth: 'said', unto: 'to', oft: 'often', ere: 'before', perchance: 'perhaps', mayhap: 'maybe', naught: 'nothing', nought: 'nothing', aught: 'anything', betwixt: 'between', amongst: 'among', whilst: 'while', verily: 'truly', anon: 'soon', yea: 'yes', nay: 'no', hark: 'listen', behold: 'look', wherefore: 'why', whence: 'from where', whither: 'where', hither: 'here', thither: 'there', enow: 'enough', afeard: 'afraid', peradventure: 'perhaps', lest: 'in case', spake: 'spoke', brake: 'broke', gat: 'got', clave: 'clung', bare: 'bore', sware: 'swore', durst: 'dared', holpen: 'helped', thereof: 'of it', therein: 'in it', thereto: 'to it', whereof: 'of which', wherein: 'in which', hereafter: 'from now on', ye_: 'you', wot: 'know', wist: 'knew', trow: 'believe', methinks: 'I think', prithee: 'please', an: 'if' },
  me: { he: 'he', the: 'the', a: 'a', an: 'an', in: 'in', on: 'on', of: 'of', to: 'to', is: 'is', was: 'was', were: 'were', as: 'as', at: 'at', so: 'so', no: 'no', not: 'not', that: 'that', this: 'this', thise: 'these', tho: 'those', what: 'what', who: 'who', his: 'his', it: 'it', we: 'we', us: 'us', my: 'my', me: 'me', hous: 'house', hoom: 'home', home: 'home', sat: 'sat', seiden: 'said', seyde: 'said', sey: 'say', seie: 'say', ich: 'I', ic: 'I', y: 'I', thou: 'you', thow: 'you', thee: 'you', thi: 'your', thy: 'your', thyn: 'your', thin: 'your', ye: 'you', yow: 'you', yowre: 'your', youre: 'your', hym: 'him', hem: 'them', her: 'their', hir: 'her', hire: 'her', sche: 'she', scho: 'she', thei: 'they', they: 'they', oure: 'our', myn: 'my', eek: 'also', ek: 'also', ech: 'each', swich: 'such', sich: 'such', nat: 'not', noght: 'not', nouyt: 'nothing', ne: 'not', whanne: 'when', whan: 'when', thanne: 'then', than: 'then', ther: 'there', heere: 'here', heer: 'here', fro: 'from', bi: 'by', vpon: 'upon', vp: 'up', ouer: 'over', vndur: 'under', thorou: 'through', aftir: 'after', bifore: 'before', ayen: 'again', ayens: 'against', aboute: 'about', with_outen: 'without', euere: 'ever', neuere: 'never', ofte: 'often', oonli: 'only', soone: 'soon', togidere: 'together', ful: 'very', moche: 'much', manye: 'many', alle: 'all', summe: 'some', ony: 'any', noon: 'none', oon: 'one', tweyne: 'two', thre: 'three', ben: 'are', been: 'be', weren: 'were', art: 'are', han: 'have', hadde: 'had', hath: 'has', hast: 'have', seide: 'said', seith: 'says', wole: 'will', wol: 'will', wolde: 'would', schal: 'shall', schulde: 'should', can: 'can', coude: 'could', myyte: 'might', moot: 'must', schulen: 'shall', schullen: 'shall', schulden: 'should', schuldist: 'shouldest', schalt: 'shall', wolen: 'will', wolt: 'will', moun: 'may', mowen: 'may', mai: 'may', maist: 'may', myyten: 'might', ye_me: 'you', yhe: 'yes', nay: 'no', forsothe: 'truly', sotheli: 'truly', treuli: 'truly', whi: 'why', hou: 'how', whos: 'whose', wher: 'where', yit: 'yet', sith: 'since', til: 'until', and: 'and', for: 'for', perauenture: 'perhaps' },
  oe: { 'þe': 'who', þe: 'who', 'ðe': 'who', ge: 'you', 'iċ': 'I', ic: 'I', 'mē': 'me', me: 'me', 'mīn': 'my', min: 'my', 'þū': 'you', þu: 'you', 'þē': 'you', 'þīn': 'your', þin: 'your', 'hē': 'he', he: 'he', hine: 'him', him: 'him', his: 'his', 'hēo': 'she', heo: 'she', hire: 'her', hit: 'it', 'wē': 'we', we: 'we', 'ūs': 'us', us: 'us', 'ūre': 'our', ure: 'our', 'ġē': 'you', ge: 'you', 'ēow': 'you', eow: 'you', 'ēower': 'your', eower: 'your', 'hīe': 'they', hie: 'they', hi: 'they', hiera: 'their', heora: 'their', hyra: 'their', se: 'the', 'sēo': 'the', seo: 'the', þæt: 'that', 'þā': 'the', þa: 'then', þone: 'the', 'þǣm': 'the', þam: 'the', þæs: 'of the', 'þǣre': 'the', þære: 'the', þara: 'of the', and: 'and', ond: 'and', ac: 'but', ne: 'not', 'nā': 'not', na: 'not', oþþe: 'or', 'swā': 'so', swa: 'so', 'þonne': 'then', þonne: 'then', 'nū': 'now', nu: 'now', 'hēr': 'here', her: 'here', 'þǣr': 'there', þær: 'there', 'hwā': 'who', hwa: 'who', hwæt: 'what', 'hwǣr': 'where', hwær: 'where', 'hū': 'how', hu: 'how', 'hwȳ': 'why', hwi: 'why', 'tō': 'to', to: 'to', of: 'of', on: 'in', in: 'in', mid: 'with', 'æt': 'at', æt: 'at', fram: 'from', for: 'for', be: 'by', ofer: 'over', under: 'under', þurh: 'through', æfter: 'after', eac: 'also', 'ēac': 'also', eft: 'again', 'sōþlīċe': 'truly', soþlice: 'truly', witodlice: 'indeed', 'witodlīċe': 'indeed', soðlice: 'truly', eom: 'am', eart: 'are', is: 'is', ys: 'is', sind: 'are', sindon: 'are', synd: 'are', syndon: 'are', 'wæs': 'was', wæs: 'was', 'wǣron': 'were', wæron: 'were', 'wǣre': 'were', wære: 'were', 'cwæþ': 'said', cwæð: 'said', cwæþ: 'said', 'cwǣdon': 'said', cwædon: 'said', 'ġif': 'if', gif: 'if', 'þæt': 'that', 'ūt': 'out', ut: 'out', 'ūp': 'up', up: 'up' }
};
function backWord(period, w0, ctx) {
  var w = w0.toLowerCase(), B = BACK[period];
  var bk = period === 'oe' ? ET.keyOE(w) : period === 'me' ? ET.keyME(w) : ET.keyEME(w);
  if (B[w]) return { t: B[w], how: 'common word' };
  if (period === 'oe') { var ks = Object.keys(B).filter(function (x) { return x.indexOf('_') < 0 && ET.keyOE(x) === bk; }); if (ks.length) return { t: B[ks[0]], how: 'common word' }; }
  var exactME = period === 'me' && (D.idx.enm.head[bk] || []).some(function (i) { return D.enm[i][ROW.w].toLowerCase() === w; });
  if (period === 'me' && !exactME) {
    var km = Object.keys(B).filter(function (x) { return x.indexOf('_') < 0 && ET.keyME(x) === bk; }); if (km.length) return { t: B[km[0]], how: 'common word' };
  }
  if (period === 'me') {
    // already today's word: the Wycliffe-to-modern alignment keeps it, or the dictionary glosses it as itself
    var o = D.align && D.align.me && D.align.me.o2m[w];
    if (D.cmu && D.cmu[w] && o && o.some(function (a) { return a[0] === w && a[1] >= 0.1; })) return { t: w, how: 'same word today' };
    var sp = meSpell(w);
  }
  if (period === 'eme') {
    var ew = ET.keyEME(w);
    if (BACK.eme[ew]) return { t: BACK.eme[ew], how: 'common word' };
    if (D.cmu && D.cmu[ew]) return { t: ew, how: ew === w ? 'same today' : 'modern spelling' };
    // -eth / -est verb endings
    var m = /^(.+?)(eth|th)$/.exec(ew); if (m) { var b = baseOf(m[1]); if (b) return { t: ET.inflect(b, '3sg'), how: '-eth ending is today\'s -s' }; }
    m = /^(.+?)(est|st)$/.exec(ew); if (m) { var b2 = baseOf(m[1]); if (b2) return { t: b2, how: '-est ending (thou form)', thou: true }; var b3 = pastBase(m[1]); if (b3) return { t: b3, how: '-est ending on a past tense (thou form)', thou: true }; }
    m = /^(.+?)edst$/.exec(ew); if (m) { var b4 = baseOf(m[1]); if (b4) return { t: ET.inflect(b4, 'past'), how: 'past tense, thou form' }; }
    // spelling: -ie for -y, final -e, doubled consonants, vowel swaps
    var tries = [ew.replace(/ie$/, 'y'), ew.replace(/e$/, ''), ew.replace(/([^aeiou])\1e?$/, '$1'), ew.replace(/our$/, 'or'), ew.replace(/ck$/, 'c'), ew.replace(/^(.*)ll$/, '$1l'), ew.replace(/ee/g, 'e'), ew.replace(/y/g, 'i'), ew.replace(/i/g, 'y'), ew.replace(/u/g, 'v'), ew.replace(/v/g, 'u'), ew.replace(/ie/g, 'y')];
    for (var i = 0; i < tries.length; i++) if (tries[i] !== ew && D.cmu && D.cmu[tries[i]]) return { t: tries[i], how: 'modern spelling' };
    var al = D.align && D.align.eme && D.align.eme.o2m[w]; if (al && al[0] && al[0][1] >= 0.5) return { t: al[0][0], how: 'King James usage' };
    return { t: w, how: 'kept as written', ok: false };
  }
  // Middle and Old English: the dictionary (by headword and by inflected form), then period texts
  var dn = ET.dictName(period), I = D.idx[dn], rows = D[dn], hits = [];
  (I.form[bk] || []).forEach(function (x) { hits.push({ r: rows[x[0]], tags: x[1] }); });
  (I.head[bk] || []).forEach(function (i) { hits.push({ r: rows[i], tags: 'canonical' }); });
  // entries spelled exactly like the word come before entries that only match loosely
  var exact = hits.filter(function (h) { return h.r[ROW.w].toLowerCase() === w || (h.r[ROW.f] || []).some(function (f) { return f[0].toLowerCase() === w; }); });
  exact.sort(function (a, b) { return (b.r[ROW.w].toLowerCase() === w) - (a.r[ROW.w].toLowerCase() === w); });
  if (exact.length && period === 'me') hits = exact;
  // follow "alternative form of" links
  hits = hits.map(function (h) {
    if (!h.r[ROW.g].every(ET.isFormOf) || !(h.r[ROW.alt] || []).length) return h;
    var tgt = (I.head[(period === 'oe' ? ET.keyOE : ET.keyME)(h.r[ROW.alt][0])] || [])[0];
    return tgt !== undefined ? { r: rows[tgt], tags: h.tags, via: h.r[ROW.w] } : h;
  });
  var al2 = D.align && D.align[period] ? (D.align[period].o2m[w] || D.align[period].o2m[bk] || []) : [];
  var best = null, bs = -1e9, allHeads = {}, allText = '';
  hits.forEach(function (h) {
    var gl = h.r[ROW.g].filter(function (g) { return !ET.isFormOf(g); }); if (!gl.length) return;
    var hs = ET.gheads(gl[0]); if (!hs.length) return;
    if (h === hits[0] || !hits[0].r[ROW.g].some(function (g) { return !ET.isFormOf(g); })) gl.forEach(function (g) { ET.gheads(g).forEach(function (x) { allHeads[x] = 1; }); allText += ' ' + g.toLowerCase(); });
    var s = (h.r[ROW.f] || []).length ? 1 : 0;
    // how modern Bibles translate the headword itself (its other forms count too)
    var alh = D.align && D.align[period] ? D.align[period].o2m[h.r[ROW.w].toLowerCase()] || [] : [];
    alh.forEach(function (a) { if (hs.indexOf(a[0]) >= 0) s += 3 * a[1]; }); if (h.r[ROW.ipa]) s += 0.5; if (h.tags !== 'canonical') s += 0.5;
    if (ctx && ctx.prevDet && h.r[ROW.p] === 'noun') s += 1.5; if (ctx && ctx.prevPron && h.r[ROW.p] === 'verb') s += 1.5;
    al2.forEach(function (a) { if (hs.indexOf(a[0]) >= 0 || ET.analyze(a[0]).some(function (x) { return hs.indexOf(x.lemma) >= 0; })) s += 6 * a[1]; });
    if (h.r[ROW.p] === 'name') s -= 1;
    if (s > bs) { bs = s; best = { h: h, head: hs[0] }; }
  });
  // Middle English: a regular respelling that is one of the dictionary's own meanings wins (kynde -> kind, not "nature")
  if (period === 'me' && sp) {
    var spl = [sp.t].concat(ET.analyze(sp.t).map(function (x) { return x.lemma; }));
    var bib = (D.align && D.align.me && D.align.me.o2m[w]) || [];
    if (!best || spl.some(function (x) { return allHeads[x] || new RegExp('\\b' + x + '\\b').test(allText) || bib.reduce(function (t, a) { return t + (a[0] === x || ET.analyze(a[0]).some(function (z) { return z.lemma === x; }) ? a[1] : 0); }, 0) >= 0.1; })) return sp;
  }
  if (best) {
    var t = best.head, tg = ' ' + best.h.tags + ' ', pos = best.h.r[ROW.p];
    if (pos === 'verb' && t.indexOf(' ') < 0) {
      if (/ past /.test(tg) && /participle/.test(tg)) t = ET.inflect(t, 'pp');
      else if (/ past /.test(tg) && !/imperative/.test(tg)) t = ET.inflect(t, 'past');
      else if (/participle present|present participle/.test(best.h.tags) || /ende$|ynge$|inge$/.test(w)) t = ET.inflect(t, 'ing');
      else if (/third-person/.test(tg) && /singular/.test(tg) && /present/.test(tg)) t = ET.inflect(t, '3sg');
    } else if (pos === 'noun' && / plural /.test(tg) && t.indexOf(' ') < 0) t = ET.inflect(t, 'pl');
    return { t: t, how: best.h.r[ROW.w] + (best.h.via ? ' (via ' + best.h.via + ')' : '') + ' "' + ET.shortGloss(best.h.r) + '"' + (best.h.tags !== 'canonical' ? ', ' + best.h.tags : '') };
  }
  if (al2[0] && al2[0][1] >= 0.35) return { t: al2[0][0], how: 'as modern Bibles translate it (' + Math.round(al2[0][1] * 100) + '%)' };
  // Middle English spelling that is already modern, or nearly
  if (period === 'me') {
    var mt = [w, w.replace(/^v/, 'u').replace(/u(?=[aeiou])/g, 'v'), w.replace(/y/g, 'i'), w.replace(/e$/, ''), w.replace(/ie$/, 'y'), w.replace(/ee/, 'e')];
    for (var q = 0; q < mt.length; q++) if (D.cmu && D.cmu[mt[q]]) return { t: mt[q], how: 'same word today' };
  }
  return { t: w, how: 'not found: kept as written', ok: false };
}
/* Middle English spellings that become a modern word by regular sound-and-spelling changes */
var MESP = [
  [/ynge?$/, 'ing', 'present participle'], [/inge$/, 'ing', 'present participle'], [/iden$/, 'ed', 'past'], [/ide$/, 'ed', 'past tense'], [/id$/, 'ed', 'past participle'], [/eden$/, 'ed', 'past'],
  [/res$/, 'ers', 'plural (-res is today\'s -ers)'], [/ith$/, 's', 'he/she/it form'], [/eth$/, 's', 'he/she/it form'], [/en$/, '', 'plural or infinitive ending'], [/is$/, 's', 'plural'], [/e$/, '', 'final -e no longer written']];
function meVariants(w) {
  var v = [w], add = function (x) { if (v.indexOf(x) < 0) v.push(x); };
  [function (x) { return x.replace(/y/g, 'i'); }, function (x) { return x.replace(/sch/g, 'sh'); }, function (x) { return x.replace(/^v/, 'u').replace(/([aeiou])u([aeiou])/g, '$1v$2'); },
   function (x) { return x.replace(/yy|iy/g, 'igh'); }, function (x) { return x.replace(/ou/g, 'ow'); }, function (x) { return x.replace(/oo/g, 'o'); }, function (x) { return x.replace(/ee/g, 'e'); },
   function (x) { return x.replace(/ei|ey/g, 'ay'); }, function (x) { return x.replace(/i/g, 'y'); }, function (x) { return x.replace(/([^aeiou])\1/g, '$1'); }]
    .forEach(function (f) { v.slice().forEach(function (x) { add(f(x)); }); });
  return v;
}
function meSpell(w) {
  if (w.length < 3 || !D.cmu) return null;
  var vs = meVariants(w);
  for (var i = 1; i < vs.length; i++) if (D.cmu[vs[i]] && vs[i].length > 2) return { t: vs[i], how: 'modern spelling of ' + w };
  for (var r = 0; r < MESP.length; r++) {
    var R = MESP[r]; if (!R[0].test(w)) continue;
    var vv = meVariants(w.replace(R[0], R[1]));
    for (var j = 0; j < vv.length; j++) {
      var c = vv[j]; if (!D.cmu[c] || c.length < 3) continue;
      if (R[1] === 'ed') { var b = baseOf(c.replace(/ed$/, '')) || baseOf(c.replace(/d$/, '')); if (b) return { t: ET.inflect(b, 'past'), how: R[2] + ': -id/-ide became -ed' }; }
      return { t: c, how: R[2] + ' (' + w + ')' };
    }
  }
  return null;
}
function baseOf(stem) { var c = [stem, stem + 'e', stem.replace(/i$/, 'y'), stem.replace(/([^aeiou])\1$/, '$1')]; for (var i = 0; i < c.length; i++) if (D.cmu && D.cmu[c[i]] && c[i].length > 1) return c[i]; return null; }
function pastBase(stem) { var b = ET.analyze(stem).filter(function (a) { return a.f === 'past'; })[0]; return b ? ET.inflect(b.lemma, 'past') : null; }
function fromPeriod(text, period) {
  if (period === 'oe') text = String(text).replace(/([A-Za-zþðæƿȝāēīōūȳǣċġ])-([a-zþðæƿȝāēīōūȳǣċġ])/g, '$1$2').replace(/&/g, 'and').replace(/\bþt\b/g, 'þæt');
  var toks = ET.tokens(text), out = [];
  toks.forEach(function (k, i) {
    if (!ET.isWord(k.t)) { out.push({ t: k.t, sp: k.sp, before: i ? toks[i - 1].sp : '', en: k.t, punct: true, ok: true }); return; }
    var prev = toks[i - 1] || {}, r = backWord(period, k.t, { prevDet: /^(the|se|seo|þæt|þa|þe|a|an|this|that)$/i.test(prev.t || ''), prevPron: /^(I|he|she|we|they|ic|iċ|he|heo|we|hie|thei)$/i.test(prev.t || '') });
    out.push({ t: ET.caseLike(k.t, r.t), sp: k.sp, en: k.t, how: r.how, ok: r.ok !== false, thou: r.thou });
  });
  // "knowest thou" -> "do you know"; "I know not" -> "I do not know" (Early Modern only, where the forms are clear)
  if (period === 'eme') {
    for (var i = 0; i + 1 < out.length; i++) {
      var a = out[i], b = out[i + 1];
      if (a.thou && /^you$/i.test(b.t)) {
        var vb = a.t, c = out[i + 2], neg = c && /^not$/i.test(c.t);
        a.t = ET.caseLike(a.en, 'do'); b.t = 'you' + (neg ? ' not ' : ' ') + vb.toLowerCase(); if (neg) { c.t = ''; c.skip = true; }
        a.how = 'question: verb before "thou" becomes "do you ..."'; continue;
      }
      if (b && /^not$/i.test(b.t) && a.how && !/common word/.test(a.how) && ET.analyze(a.t).some(function (x) { return x.f !== 'base' || true; }) && i > 0 && /^(I|you|he|she|it|we|they)$/i.test(out[i - 1].t) && !/^(am|is|are|was|were|have|has|had|can|will|shall|may|must|do|does|did|could|would|should|might)$/i.test(a.t)) {
        var an = ET.analyze(a.t.toLowerCase())[0], past = ET.analyze(a.t.toLowerCase()).some(function (x) { return x.f === 'past'; });
        var lem = (ET.analyze(a.t.toLowerCase()).filter(function (x) { return x.lemma !== a.t.toLowerCase(); })[0] || an).lemma;
        a.t = past ? 'did' : /s$/.test(a.t) && /^(he|she|it)$/i.test(out[i - 1].t) ? 'does' : 'do'; b.t = 'not ' + lem; a.how = 'verb + "not" becomes "do not" + verb';
      }
    }
  }
  var res = finish(out, period); res.dir = 'from'; return res;
}

/* ================================================================ rating */
function judge(r) {
  var words = r.words.filter(function (w) { return !w.punct && !w.skip; }), bad = words.filter(function (w) { return !w.ok; });
  var checks = [];
  if (bad.length) checks.push({ ok: false, t: bad.length + ' of ' + words.length + ' words could not be found and were kept as written: ' + bad.map(function (w) { return w.en; }).join(', ') });
  else checks.push({ ok: true, t: 'Every word was found in the dictionaries, the period texts or the grammar rules' });
  var guessed = words.filter(function (w) { return /as modern Bibles|translators wrote|King James usage/.test(w.how || ''); }).length;
  if (guessed) checks.push({ ok: true, t: guessed + ' word' + (guessed > 1 ? 's were' : ' was') + ' chosen from how real period translators matched words (statistics, not a dictionary)' });
  checks.push({ ok: null, t: 'Word order is kept from the input; idioms and sentence structure are not rewritten' });
  var rating = !words.length ? 'unusable' : bad.length > words.length * 0.34 ? 'unusable' : bad.length ? 'rough' : 'draft';
  return { rating: rating, checks: checks };
}
ET.RATING = { draft: 'Draft: every word placed by dictionary, period texts or grammar rules - not checked for natural wording', rough: 'Rough: some words could not be translated and were kept', unusable: 'Not usable: too many words could not be translated' };
ET.translate = function (text, from, to, opts) {
  var r;
  if (from === 'mod' && to !== 'mod') r = toPeriod(text, to, opts);
  else if (to === 'mod' && from !== 'mod') r = fromPeriod(text, from);
  else if (from !== 'mod' && to !== 'mod') { var m = fromPeriod(text, from); r = toPeriod(m.text, to, opts); r.via = m.text; }
  else r = { text: text, words: [], period: 'mod' };
  var j = judge(r); r.rating = j.rating; r.checks = j.checks; r.from = from; r.to = to;
  return r;
};
/* real period sentences that contain the word(s) */
ET.examples = function (q, col, max) {
  if (!D.par) return [];
  q = String(q).toLowerCase().trim(); if (!q) return [];
  var out = [], re = new RegExp('\\b' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'), ks = Object.keys(D.par.v);
  for (var i = 0; i < ks.length && out.length < (max || 30); i++) { var v = D.par.v[ks[i]]; var hay = col === undefined ? v.join(' ') : v[col]; if (re.test(ET.strip(hay))) out.push([ks[i], v]); }
  return out;
};

/* unigram overlap with a reference (the measure used in the studio's accuracy figures) */
ET.overlap = function (a, b, period) {
  var key = function (w) { return period === 'oe' ? ET.keyOE(w) : period === 'me' ? ET.keyME(w) : ET.keyEME(w); };
  var ta = (String(a).match(/[A-Za-zÀ-ÿĀ-ſƀ-ɏþðæȝƿ]+/g) || []).map(key), tb = (String(b).match(/[A-Za-zÀ-ÿĀ-ſƀ-ɏþðæȝƿ]+/g) || []).map(key);
  if (!ta.length || !tb.length) return 0;
  var cb = {}; tb.forEach(function (w) { cb[w] = (cb[w] || 0) + 1; }); var hit = 0; ta.forEach(function (w) { if (cb[w] > 0) { hit++; cb[w]--; } });
  var p = hit / ta.length, r = hit / tb.length; return p + r ? 2 * p * r / (p + r) : 0;
};

})(typeof window !== 'undefined' ? window : globalThis);
