#!/usr/bin/env python3
"""English Through Time Studio - data build (by Larry Dalton).
Inputs in ../src: Wiktionary Old/Middle English (kaikki.org compact exports), Bible editions (scrollmapper),
Wessex Gospels. Outputs in ../app/data."""
import json, re, os, unicodedata, collections, math, random
SRC = os.path.join(os.path.dirname(__file__), '..', 'sources')
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'app', 'data')
os.makedirs(OUT, exist_ok=True)

def dump(name, obj):
    p = os.path.join(OUT, name)
    with open(p, 'w', encoding='utf8') as f: json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
    print('wrote', name, os.path.getsize(p))

# ---------------------------------------------------------------- dictionaries
def short_gloss(g):
    g = re.sub(r'\s*\([^)]*\)', '', g).strip()
    g = g.split(';')[0].split(':')[0]
    return g.strip()

def heads(gloss):
    """English head words of a gloss: 'to love, cherish' -> ['love', 'cherish']"""
    out = []
    for part in re.split(r'[,;]| or ', short_gloss(gloss)):
        p = part.strip().lower()
        p = re.sub(r'^(to|a|an|the)\s+', '', p)
        p = re.sub(r'\s+(of|for|with|to|from|in|on)$', '', p)
        if p and len(p.split()) <= 2 and re.match(r"^[a-z' -]+$", p): out.append(p)
    return out[:4]

def build_dict(fn, lang):
    d = json.load(open(os.path.join(SRC, fn)))['entries']
    rows = []
    for e in d:
        w = e['w']
        if not w or w.startswith('-') and e['p'] != 'suffix': pass
        gl, alt, ex, tags = [], [], [], []
        for s in e['s']:
            g = s.get('g') or ''
            if s.get('f'):
                alt += s['f']
                if re.match(r'^(alternative|obsolete|archaic)?\s*(form|spelling) of', g, re.I) or re.search(r'\b(inflection|plural|singular|past|present|participle|form) of\b', g, re.I):
                    gl.append(g); continue
            if g: gl.append(g)
            for x in s.get('x') or []:
                if x.get('t') and len(ex) < 2: ex.append([x['t'], x.get('e', ''), x.get('r', '')])
        forms = [f for f in e.get('fm', []) if f[0] and not f[0].startswith('{') and f[0] != '-']
        gender = ''
        for s in e['s']:
            for tg in s.get('t') or []:
                if tg in ('masculine', 'feminine', 'neuter') and not gender: gender = tg[0]
        for f in forms:
            if 'canonical' in f[1]:
                for tg in ('masculine', 'feminine', 'neuter'):
                    if tg in f[1] and not gender: gender = tg[0]
        rows.append([w, e['p'], gl[:5], forms, (e.get('ipa') or [''])[0], ex, (e.get('et') or '')[:240], list(dict.fromkeys(alt))[:3], gender])
    print(lang, len(rows), 'entries')
    return rows

ANG = build_dict('wiktionary-ang.json', 'ang')
ENM = build_dict('wiktionary-enm.json', 'enm')
def dump_parts(name, rows, maxb=6500000):  # parts of at most 6.5 MB, so every file can be uploaded through a web page
    parts, size = [[]], 0
    for r in rows:
        b = len(json.dumps(r, ensure_ascii=False, separators=(',', ':')).encode()) + 1
        if size + b > maxb and parts[-1]: parts.append([]); size = 0
        parts[-1].append(r); size += b
    for i, p in enumerate(parts): dump('%s%d.json' % (name, i + 1), p)
    return len(parts)
dump('parts.json', {'ang': dump_parts('ang', ANG), 'enm': dump_parts('enm', ENM)})

# ---------------------------------------------------------------- Bible texts
def load_bible(t):
    d = json.load(open(os.path.join(SRC, t + '.json')))
    v = {}
    for b in d['books']:
        for c in b['chapters']:
            for x in c['verses']:
                v['%s %d:%d' % (b['name'], c['chapter'], x['verse'])] = x['text'].strip()
    return v
B = {t: load_bible(t) for t in ['KJV', 'Wycliffe', 'Tyndale', 'Geneva1599', 'BSB']}
# Wycliffe names its books like the KJV here except Revelation
B['Wycliffe'] = {k.replace('Revelation of John', 'Revelation of John'): v for k, v in B['Wycliffe'].items()}
wx = json.load(open(os.path.join(SRC, 'wessex-gospels-full.json')))
BOOK = {'40': 'Matthew', '41': 'Mark', '42': 'Luke', '43': 'John'}
OE = {}
for k, t in wx['verses'].items():
    b, c, v = k.split('.')
    t = re.sub(r'^Note:.*?(\bR\.\s*R adds-.*?\.\s*|\bR\.\s*)', '', t).strip()   # editor's notes (Latin incipits, variant readings)
    t = re.sub(r'\(sic\)', '', t)
    if t: OE['%s %s:%s' % (BOOK[b], c, v)] = t
print('Wessex verses', len(OE))

NT = [k for k in B['KJV'] if k.split(' ')[0] in ('Matthew', 'Mark', 'Luke', 'John') or True]
GOSPELS = ('Matthew', 'Mark', 'Luke', 'John')
def is_test(ref):  # held out: every 10th verse of the Gospels
    book = ref.rsplit(' ', 1)[0]
    return book in GOSPELS and int(ref.split(':')[1]) % 10 == 0

# the reader's parallel text: New Testament in all editions, plus the Old English Gospels
ntbooks = list(dict.fromkeys(k.rsplit(' ', 1)[0] for k in B['KJV']))
ntbooks = ntbooks[ntbooks.index('Matthew'):]
par = {}
for k in B['KJV']:
    if k.rsplit(' ', 1)[0] not in ntbooks: continue
    par[k] = [OE.get(k, ''), B['Wycliffe'].get(k, ''), B['Tyndale'].get(k, ''), B['Geneva1599'].get(k, ''), B['KJV'].get(k, ''), B['BSB'].get(k, '')]
dump('parallel.json', {'cols': ['Old English (Wessex Gospels, c.1175)', 'Middle English (Wycliffe, c.1395)', 'Early Modern (Tyndale, 1526)', 'Early Modern (Geneva, 1599)', 'Early Modern (King James, 1611; 1769 text)', 'Modern (Berean Standard Bible)'], 'v': par})

# ---------------------------------------------------------------- word alignment (IBM model 1), trained without the held-out verses
def toks(s, lang):
    s = s.lower().replace('’', "'")
    s = unicodedata.normalize('NFC', s)
    return re.findall(r"[a-zþðæȝƿāēīōūȳǣċġ]+(?:'[a-z]+)?", s)

def ibm1(pairs, iters=6):
    t = collections.defaultdict(lambda: 1e-3)
    # initialise uniformly over co-occurring words
    co = collections.defaultdict(set)
    for f, e in pairs:
        for w in set(f):
            co[w].update(e + ['<null>'])
    for w, es in co.items():
        u = 1.0 / len(es)
        for x in es: t[(w, x)] = u
    for it in range(iters):
        cnt = collections.defaultdict(float); tot = collections.defaultdict(float)
        for f, e in pairs:
            ee = e + ['<null>']
            for w in f:
                z = sum(t[(w, x)] for x in ee)
                if z <= 0: continue
                for x in ee:
                    c = t[(w, x)] / z
                    cnt[(w, x)] += c; tot[x] += c
        t = collections.defaultdict(lambda: 1e-9, {k: v / tot[k[1]] for k, v in cnt.items()})
    return t

def table(t, freqs, top=6, min_p=0.03):
    """for each target word e: the source words f with the highest p(f|e)"""
    by = collections.defaultdict(list)
    for (f, e), p in t.items():
        if p >= min_p and e != '<null>': by[e].append((p, f))
    out = {}
    for e, lst in by.items():
        if freqs.get(e, 0) < 2: continue
        lst.sort(reverse=True)
        out[e] = [[f, round(p, 3)] for p, f in lst[:top]]
    return out

def train(src_name, srcv, tgtv, limit=None):
    keys = [k for k in srcv if k in tgtv and srcv[k] and tgtv[k] and not is_test(k)]
    random.Random(1).shuffle(keys)
    if limit: keys = keys[:limit]
    pairs_mod_to_old = [(toks(srcv[k], 'old'), toks(tgtv[k], 'en')) for k in keys]   # p(old | modern)
    pairs_old_to_mod = [(toks(tgtv[k], 'en'), toks(srcv[k], 'old')) for k in keys]   # p(modern | old)
    fm = collections.Counter(w for _, e in pairs_mod_to_old for w in e)
    fo = collections.Counter(w for f, _ in pairs_mod_to_old for w in f)
    a = table(ibm1(pairs_mod_to_old), fm)   # modern word -> old words
    b = table(ibm1(pairs_old_to_mod), fo)   # old word -> modern words
    print(src_name, 'trained on', len(keys), 'verses;', len(a), 'modern words,', len(b), 'old words')
    return {'m2o': a, 'o2m': b, 'freqM': {k: v for k, v in fm.items() if v >= 2}, 'freqO': {k: v for k, v in fo.items() if v >= 2}, 'verses': len(keys)}

import sys
if os.path.exists(os.path.join(OUT, 'align.json')) and '--align' not in sys.argv:
    print('align.json kept (pass --align to retrain)'); AL = None
else:
  AL = {}
  AL['oe'] = train('Old English', OE, B['BSB'])
  AL['me'] = train('Middle English', B['Wycliffe'], B['BSB'], limit=12000)
  AL['eme'] = train('Early Modern', B['KJV'], B['BSB'], limit=12000)
  dump('align.json', AL)

# held-out verses for measuring the translations honestly
test = [k for k in B['KJV'] if is_test(k)]
ev = {'oe': [[k, OE[k], B['BSB'][k]] for k in test if OE.get(k)],
      'me': [[k, B['Wycliffe'][k], B['BSB'][k]] for k in test if B['Wycliffe'].get(k)],
      'eme': [[k, B['KJV'][k], B['BSB'][k]] for k in test]}
print({k: len(v) for k, v in ev.items()})
dump('heldout.json', ev)
