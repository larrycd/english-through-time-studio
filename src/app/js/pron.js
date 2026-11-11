/* English Through Time Studio engine - by Larry Dalton
   pron.js: pronunciation in IPA for each period, and speech through eSpeak NG phoneme input */
(function (G) {
'use strict';
var ET = G.ET, D = ET.D, ROW = ET.ROW;

/* ================================================================ Wiktionary first */
/* the commonest Middle English words, whose Wiktionary entries are often a different word with the same spelling */
var MEFN = { the: 'ðə', þe: 'ðə', that: 'ðat', þat: 'ðat', this: 'ðɪs', þis: 'ðɪs', thou: 'ðuː', þou: 'ðuː', thee: 'ðeː', thy: 'ðiː', thi: 'ðiː', thei: 'ðɛi', they: 'ðɛi', thanne: 'ˈðanə', than: 'ðan', ther: 'ðɛːr', there: 'ˈðɛːrə', thise: 'ˈðiːzə',
  of: 'ɔf', to: 'toː', and: 'and', a: 'a', an: 'an', i: 'iː', y: 'iː', is: 'ɪs', was: 'was', with: 'wɪθ', wiþ: 'wɪθ', in: 'ɪn', he: 'heː', she: 'ʃeː', sche: 'ʃeː', his: 'hɪs', hir: 'hɪr', it: 'ɪt', we: 'weː', ye: 'jeː', hem: 'hɛm', him: 'hɪm', hym: 'hɪm', not: 'nɔt', nat: 'nat', but: 'but', for: 'fɔr', so: 'soː', as: 'as', at: 'at', by: 'biː', bi: 'biː' };
function plainKey(w) { return String(w).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC'); }
function dictIPA(word, period) {
  if (period !== 'oe' && period !== 'me') return null;
  if (period === 'me' && MEFN[plainKey(word)]) return { ipa: MEFN[plainKey(word)], src: 'common word (Chaucer\'s London)' };
  var dn = ET.dictName(period), I = D.idx[dn], rows = D[dn]; if (!I) return null;
  var k = (period === 'oe' ? ET.keyOE : ET.keyME)(word), ids = (I.head[k] || []).filter(function (i) { return rows[i][ROW.ipa] && !/^-|-$/.test(rows[i][ROW.w]); });
  // the entry spelled exactly like this word comes first, then entries with long-vowel marks that match the word's own marks
  var pw = plainKey(word);
  ids.sort(function (a, b) { return (plainKey(rows[b][ROW.w]) === pw) - (plainKey(rows[a][ROW.w]) === pw); });
  for (var i = 0; i < ids.length; i++) {
    var r = rows[ids[i]], ipa = r[ROW.ipa];
    if (period === 'oe' && /[āēīōūȳǣ]/.test(word) && /[āēīōūȳǣ]/.test(r[ROW.w]) && word.toLowerCase().replace(/[ċġ]/g, function (c) { return c === 'ċ' ? 'c' : 'g'; }) !== r[ROW.w].toLowerCase()) continue;
    ipa = ipa.replace(/^[\/\[]|[\/\]]$/g, '').split(/[\/\]],? *[\/\[]|, /)[0];
    ipa = ipa.replace(/\(ː\)/g, '').replace(/\(([^)]*)\)/g, '$1').replace(/\./g, '');
    return { ipa: ipa, src: 'Wiktionary: ' + r[ROW.w] };
  }
  return null;
}

/* ================================================================ Old English spelling rules (West Saxon, c. 1000) */
var OEV = { a: 'ɑ', 'ā': 'ɑː', 'æ': 'æ', 'ǣ': 'æː', e: 'e', 'ē': 'eː', i: 'i', 'ī': 'iː', o: 'o', 'ō': 'oː', u: 'u', 'ū': 'uː', y: 'y', 'ȳ': 'yː' };
var OEDI = { ea: 'æɑ', 'ēa': 'æːɑ', eo: 'eo', 'ēo': 'eːo', ie: 'iy', 'īe': 'iːy', io: 'io', 'īo': 'iːo' };
function voiced(c) { return c && /[aeiouyæāēīōūȳǣlrmnwjðv]/.test(c); }
function oeRules(w0) {
  var w = w0.toLowerCase().normalize('NFD').replace(/\u0308/g, '').normalize('NFC').replace(/qu/g, 'cw').replace(/q/g, 'c').replace(/ð/g, 'þ').replace(/ƿ/g, 'w').replace(/k/g, 'c').replace(/-/g, '');
  var out = '', i = 0, n = w.length, V = /[aeiouyæāēīōūȳǣ]/;
  var vowelAt = function (j) { return j >= 0 && j < n && V.test(w[j]); };
  var prefix = /^(ġe|ge|be|for|on|tō|ā)(?=..)/.exec(w); var stressAt = prefix && prefix[1].length < n - 2 ? prefix[1].length : 0;
  while (i < n) {
    var c = w[i], c2 = w.substr(i, 2), c3 = w.substr(i, 3), prev = w[i - 1], next = w[i + 1];
    if (i === stressAt && i > 0) out += 'ˈ'; else if (i === 0 && !prefix) out += 'ˈ';
    if (OEDI[c3.slice(0, 2)] === undefined && OEDI[c2] === undefined && OEV[c] !== undefined) { out += OEV[c]; i++; continue; }
    if (OEDI[c2] !== undefined && !(c2 === 'ie' && false)) { var lng = /[āēī]/.test(c); out += OEDI[c2]; i += 2; continue; }
    if (c3 === 'sċ' || c2 === 'sc' && (/[eiyæ]/.test(w[i + 2] || '') || i === n - 2) || c3 === 'sch') { out += 'ʃ'; i += c3 === 'sch' ? 3 : 2; continue; }
    if (c3 === 'cġ' || c2 === 'cg' || c2 === 'gg' && false) { out += 'dʒ'; i += 2; continue; }
    if (c === 'ċ') { out += 'tʃ'; i++; continue; }
    if (c === 'ġ') { out += 'j'; i++; continue; }
    if (c2 === 'ng') { out += 'ŋɡ'; i += 2; continue; }
    if (c === 'n' && /[cgk]/.test(next || '')) { out += 'ŋ'; i++; continue; }
    if (c === 'g') { out += (i > 0 && vowelAt(i - 1) && (vowelAt(i + 1) || i === n - 1) || prev === 'r' || prev === 'l') ? 'ɣ' : 'ɡ'; i++; continue; }
    if (c === 'c') { if (next === 'c') { out += 'kk'; i += 2; continue; } out += 'k'; i++; continue; }
    if (c === 'h') {
      if (i === 0 || prev === undefined) { out += next === 'w' ? 'x' : 'h'; i++; continue; }
      if (next === 'h') { out += 'xx'; i += 2; continue; }
      out += /[eiyæēīȳǣ]/.test(prev) ? 'ç' : 'x'; i++; continue;
    }
    if (c === 'f' || c === 's' || c === 'þ') {
      var T = { f: ['f', 'v'], s: ['s', 'z'], 'þ': ['θ', 'ð'] }[c];
      if (next === c) { out += T[0] + T[0]; i += 2; continue; }
      out += (i > 0 && voiced(prev) && voiced(next) && i - stressAt > 0) ? T[1] : T[0]; i++; continue;
    }
    if (c === 'x') { out += 'ks'; i++; continue; }
    if (c === 'r') { out += 'r'; i++; continue; }
    if (c === 'w') { out += 'w'; i++; continue; }
    if (/[bdlmnpt]/.test(c)) { out += c; i++; continue; }
    if (c === 'j') { out += 'j'; i++; continue; }
    if (c === 'z') { out += 'ts'; i++; continue; }
    if (c === 'v') { out += 'v'; i++; continue; }
    if (c === '̄' || c === '̇') { i++; continue; }
    out += c; i++;
  }
  return out.replace(/ˈˈ/g, 'ˈ');
}

/* ================================================================ Middle English spelling rules (Chaucer's London, c. 1390) */
function meRules(w0) {
  var w = w0.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
  w = w.replace(/þ/g, 'th').replace(/ð/g, 'th').replace(/ſ/g, 's');
  var out = 'ˈ', i = 0, n = w.length, V = /[aeiouy]/;
  var syl = (w.match(/[aeiouy]+/g) || []).length;
  while (i < n) {
    var c = w[i], c2 = w.substr(i, 2), c3 = w.substr(i, 3), prev = w[i - 1], next = w[i + 1], rest = w.slice(i + 1);
    var open = /^[bcdfgklmnprstvz]e?[aeiouy]/.test(rest) || /^[bcdfgklmnprstvz]e$/.test(rest);
    if (c3 === 'igh' || c3 === 'ygh') { out += 'iːç'; i += 3; continue; }
    if (c2 === 'gh' || c2 === 'ȝ') { out += /[ei]/.test(prev || '') ? 'ç' : 'x'; i += 2; continue; }
    if (c === 'ȝ') { out += i === 0 || V.test(next || '') && !V.test(prev || '') ? 'j' : /[ei]/.test(prev || '') ? 'ç' : 'x'; i++; continue; }
    if (c3 === 'sch') { out += 'ʃ'; i += 3; continue; }
    if (c2 === 'sh') { out += 'ʃ'; i += 2; continue; }
    if (c2 === 'ch') { out += 'tʃ'; i += 2; continue; }
    if (c2 === 'th') { out += (i === 0 && /^th(e|ou|ow|is|at|an|en|er|ei|ey|o|us|i|y)?$/.test(w) || i > 0 && V.test(prev || '') && V.test(w[i + 2] || '')) ? 'ð' : 'θ'; i += 2; continue; }
    if (c2 === 'wh') { out += 'ʍ'; i += 2; continue; }
    if (c2 === 'ng') { out += 'ŋɡ'; i += 2; continue; }
    if (c2 === 'qu') { out += 'kw'; i += 2; continue; }
    if (c2 === 'ee') { out += 'eː'; i += 2; continue; }
    if (c2 === 'oo') { out += 'oː'; i += 2; continue; }
    if (c2 === 'ou' || c2 === 'ow') { out += 'uː'; i += 2; continue; }
    if (c2 === 'ai' || c2 === 'ay' || c2 === 'ei' || c2 === 'ey') { out += 'ɛi'; i += 2; continue; }
    if (c2 === 'au' || c2 === 'aw') { out += 'au'; i += 2; continue; }
    if (c2 === 'ew' || c2 === 'eu') { out += 'ɛu'; i += 2; continue; }
    if (c2 === 'oi' || c2 === 'oy') { out += 'ɔi'; i += 2; continue; }
    if (c === 'e' && i === n - 1 && syl > 1) { out += 'ə'; i++; continue; }
    if (c === 'e' && i === n - 2 && /[sn]/.test(w[n - 1]) && syl > 1) { out += 'ə'; i++; continue; }
    if (c === 'a') { out += open ? 'aː' : 'a'; i++; continue; }
    if (c === 'e') { out += open ? 'ɛː' : 'ɛ'; i++; continue; }
    if (c === 'i' || c === 'y' && !V.test(next || '')) { out += open ? 'iː' : 'ɪ'; i++; continue; }
    if (c === 'y') { out += i === 0 ? 'j' : 'ɪ'; i++; continue; }
    if (c === 'o') { out += open ? 'ɔː' : 'ɔ'; i++; continue; }
    if (c === 'u') { out += V.test(next || '') && i > 0 && V.test(prev || '') ? 'v' : open ? 'yː' : 'u'; i++; continue; }
    if (c === 'c') { out += /[eiy]/.test(next || '') ? 's' : 'k'; if (next === 'k') i++; i++; continue; }
    if (c === 'g') { out += /[eiy]/.test(next || '') && i > 0 && !/^g[eiy]/.test(w.slice(i - 1)) ? 'dʒ' : 'ɡ'; i++; continue; }
    if (c === 'j') { out += 'dʒ'; i++; continue; }
    if (c === 's') { out += V.test(prev || '') && V.test(next || '') ? 'z' : 's'; i++; continue; }
    if (c === 'f') { out += 'f'; i++; continue; }
    if (c === 'x') { out += 'ks'; i++; continue; }
    if (c === 'h') { out += i === 0 ? 'h' : ''; i++; continue; }
    if (next === c && /[bdfklmnprst]/.test(c)) { out += c + c; i += 2; continue; }
    if (/[bdklmnprtvwz]/.test(c)) { out += c; i++; continue; }
    out += c; i++;
  }
  return out;
}

/* ================================================================ Early Modern (Shakespeare's London, c. 1600): modern RP from eSpeak, adjusted */
function emeAdjust(ipa, word) {
  var w = word.toLowerCase(), s = ipa;
  var notes = [];
  // r was still sounded after vowels
  if (/r/.test(w)) { s = s.replace(/ɑː(?=$|[^ɹr])/g, 'ɑːɹ').replace(/ɔː(?=$|[^ɹr])/g, /or|our|oar|ar/.test(w) ? 'ɔːɹ' : 'ɔː').replace(/ɜː/g, 'ɐɹ').replace(/ɪə/g, 'iːɹ').replace(/eə/g, 'ɛːɹ').replace(/ʊə/g, 'uːɹ'); if (/ər$|ɚ$|ə$/.test(s) && /(er|or|ar|our|re)$/.test(w)) s = s.replace(/ə$/, 'əɹ'); notes.push('r sounded after vowels'); }
  // the diphthongs of "time" and "house" began nearer schwa
  s = s.replace(/aɪ/g, 'əɪ').replace(/aʊ/g, 'əʊ');
  // "meat", "speak": ea words still had a long e
  if (/ea/.test(w) && /iː/.test(s) && !/ee/.test(w)) { s = s.replace(/iː/, 'eː'); notes.push('ea as long e'); }
  // "name", "day" had a long monophthong
  s = s.replace(/eɪ/g, 'ɛː').replace(/əʊ(?=.*)/g, function (m, o) { return m; });
  if (/o[^aeiou]e$|oa|ow$/.test(w)) s = s.replace(/əʊ/, 'oː');
  // -tion, -sion: two syllables
  if (/tion$|sion$/.test(w)) s = s.replace(/tʃən$/, 'tɪən').replace(/ʃən$|ʒən$/, 'sɪən');
  // -eth, -est, -ed endings as written
  if (/eth$/.test(w)) s = s.replace(/θ?$/, '').replace(/[ɪə]?$/, '') + 'əθ';
  return { ipa: s, notes: notes };
}

/* ================================================================ IPA to eSpeak NG phoneme mnemonics */
var MN = [
  ['tʃ', 'tS'], ['t͡ʃ', 'tS'], ['dʒ', 'dZ'], ['d͡ʒ', 'dZ'], ['ts', 'ts'],
  ['ɑː', 'a:'], ['aː', 'a:'], ['æː', 'E:'], ['eː', 'e:'], ['ɛː', 'E:'], ['iː', 'i:'], ['oː', 'o:'], ['ɔː', 'O:'], ['uː', 'u:'], ['yː', 'y:'], ['øː', 'W:'], ['ɜː', '3:'],
  ['ɑ', 'a'], ['a', 'a'], ['æ', 'E'], ['e', 'e'], ['ɛ', 'E'], ['i', 'i'], ['ɪ', 'I'], ['o', 'o'], ['ɔ', 'O'], ['ɒ', 'O'], ['u', 'u'], ['ʊ', 'U'], ['y', 'y'], ['ʏ', 'y'], ['ø', 'W'], ['œ', 'W'], ['ə', '@'], ['ɐ', '@'], ['ʌ', '@'], ['ɚ', '@r'], ['ɝ', '3:r'],
  ['θ', 'T'], ['ð', 'D'], ['x', 'x'], ['χ', 'x'], ['ç', 'C'], ['ɣ', 'Q'], ['ʃ', 'S'], ['ʒ', 'Z'], ['ŋ', 'N'], ['ɡ', 'g'], ['g', 'g'], ['ɹ', 'r'], ['ɾ', 'r'], ['r', 'r'], ['ʍ', 'hw'],
  ['ɫ', 'l'], ['l', 'l'], ['m', 'm'], ['n', 'n'], ['p', 'p'], ['b', 'b'], ['t', 't'], ['d', 'd'], ['k', 'k'], ['f', 'f'], ['v', 'v'], ['s', 's'], ['z', 'z'], ['h', 'h'], ['w', 'w'], ['j', 'j'], ['ʋ', 'v'],
  ['ˈ', "'"], ['ˌ', ','], ['ː', ':']
];
var MN_EN = { 'a': 'a', 'æ': 'a', 'ʌ': 'V', 'ɑː': 'A:', 'ɒ': '0', 'ɜː': '3:', 'ɔɪ': 'OI', 'eɪ': 'eI', 'aɪ': 'aI', 'aʊ': 'aU', 'əʊ': 'oU', 'oʊ': 'oU', 'əɪ': '@I' };
ET.toEspeak = function (ipa, voice) {
  var s = String(ipa).normalize('NFC').replace(/[\/\[\]()‿.̯̥̩̝̞̆͜͡]/g, '').replace(/ ̃/g, ''), out = '', dropped = [], i = 0;
  while (i < s.length) {
    var hit = null;
    if (voice === 'en') for (var k in MN_EN) if (s.substr(i, k.length) === k && (!hit || k.length > hit[0].length)) hit = [k, MN_EN[k]];
    if (!hit) for (var j = 0; j < MN.length; j++) if (s.substr(i, MN[j][0].length) === MN[j][0] && (!hit || MN[j][0].length > hit[0].length)) hit = MN[j];
    if (hit) { out += hit[1]; i += hit[0].length; continue; }
    if (s[i] === ' ') { out += ' '; i++; continue; }
    if (dropped.indexOf(s[i]) < 0) dropped.push(s[i]); i++;
  }
  return { ph: out, dropped: dropped };
};

/* ================================================================ eSpeak NG (WebAssembly, loaded on first use) */
var esMod = null, esWasm = null;
function espeakModule() {
  if (esMod) return esMod;
  var url = (G.location ? new URL('vendor/espeak-ng.js', G.location.href).href : 'file://' + require('path').join(__dirname, '..', 'vendor', 'espeak-ng.js'));
  esMod = import(url).then(function (m) { return m.default; });
  return esMod;
}
function wasmBinary() {
  if (esWasm) return esWasm;
  // the WebAssembly file is kept in two halves (each small enough to upload through a web page) and joined here
  var names = ['espeak-ng.wasm.part1', 'espeak-ng.wasm.part2'];
  if (G.fetch && G.location) esWasm = Promise.all(names.map(function (n) { return fetch('vendor/' + n).then(function (r) { if (!r.ok) throw new Error(n + ' ' + r.status); return r.arrayBuffer(); }); }));
  else esWasm = Promise.resolve(names.map(function (n) { return require('fs').readFileSync(require('path').join(__dirname, '..', 'vendor', n)); }));
  esWasm = esWasm.then(function (bufs) { var len = 0; bufs.forEach(function (b) { len += b.byteLength; }); var out = new Uint8Array(len), at = 0; bufs.forEach(function (b) { out.set(new Uint8Array(b.buffer ? b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) : b), at); at += b.byteLength; }); return out; });
  return esWasm;
}
function runEspeak(args, outFile, enc) {
  return Promise.all([espeakModule(), wasmBinary()]).then(function (a) {
    var printed = [];
    return a[0]({ arguments: args, wasmBinary: a[1], print: function (t) { printed.push(t); }, printErr: function (t) { printed.push(t); } }).then(function (es) {
      try { return es.FS.readFile(outFile, enc ? { encoding: enc } : undefined); } catch (e) { throw new Error('eSpeak produced no output: ' + printed.join(' ')); }
    });
  });
}
ET.VOICE = { oe: 'sv', me: 'sv', eme: 'en', mod: 'en' };
/* speech for an IPA string: WAV bytes */
ET.speakIPA = function (ipa, period, speed) {
  var v = ET.VOICE[period] || 'en', m = ET.toEspeak(ipa, v);
  var words = m.ph.split(/\s+/).filter(Boolean).map(function (w) { return '[[' + w + ']]'; }).join(' ');
  return runEspeak(['-v', v, '-s', String(speed || 140), '-w', '/out.wav', words], '/out.wav').then(function (b) { return { wav: b, ph: m.ph, dropped: m.dropped, voice: v }; });
};
/* eSpeak's own IPA for modern English text (British voice) */
ET.espeakIPA = function (text) {
  return runEspeak(['-q', '--ipa', '--phonout', '/o.txt', '-v', 'en', String(text)], '/o.txt', 'utf8').then(function (s) { return s.trim().replace(/\s+/g, ' '); });
};

/* ================================================================ IPA for a word or a text in a period */
ET.wordIPA = function (word, period) {
  // synchronous part: Old and Middle English
  var d = dictIPA(word, period);
  if (d) return d;
  if (period === 'oe') return { ipa: oeRules(word), src: 'spelling rules (Old English, c. 1000)' };
  if (period === 'me') return { ipa: meRules(word), src: 'spelling rules (Chaucer\'s London, c. 1390)' };
  return null;
};
ET.textIPA = function (text, period) {
  var words = ET.tokens(text).filter(function (t) { return ET.isWord(t.t); }).map(function (t) { return t.t; });
  if (period === 'oe' || period === 'me') {
    var parts = words.map(function (w) { var r = ET.wordIPA(w, period); return { w: w, ipa: r.ipa, src: r.src }; });
    return Promise.resolve({ ipa: parts.map(function (p) { return p.ipa; }).join(' '), words: parts });
  }
  // Early Modern and modern: eSpeak's British reading, word by word, then Early Modern adjustments
  var norm = words.map(function (w) { return period === 'eme' ? ET.keyEME(w.toLowerCase()) : w.toLowerCase(); });
  return ET.espeakIPA(norm.join(' , ')).then(function (s) {
    var got = s.split(/\s*,\s*|\s+/).filter(Boolean), out = [];
    // eSpeak may join or split words; fall back to whole-text when counts disagree
    if (got.length !== words.length) {
      var whole = period === 'eme' ? emeAdjust(s, text).ipa : s;
      return { ipa: whole, words: [{ w: text, ipa: whole, src: period === 'eme' ? 'eSpeak NG (British) + Early Modern adjustments' : 'eSpeak NG (British)' }] };
    }
    words.forEach(function (w, i) {
      var ipa = got[i].replace(/^ˈ?/, function (m) { return m; }), src = 'eSpeak NG (British)';
      if (period === 'eme') { var a = emeAdjust(ipa, w); ipa = a.ipa; src = 'eSpeak NG (British) + Early Modern adjustments' + (a.notes.length ? ': ' + a.notes.join(', ') : ''); }
      out.push({ w: w, ipa: ipa, src: src });
    });
    return { ipa: out.map(function (p) { return p.ipa; }).join(' '), words: out };
  });
};
ET.oeRules = oeRules; ET.meRules = meRules; ET.emeAdjust = emeAdjust;
})(typeof window !== 'undefined' ? window : globalThis);
