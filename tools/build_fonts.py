#!/usr/bin/env python3
"""English Through Time Studio - fonts (by Larry Dalton).
Each period face is subset to the letters the studio writes; letters a face lacks (wynn, yogh, Tironian et,
thorn-with-stroke, macron vowels) are copied in from Cardo so every face covers the same set."""
import os, json, subprocess
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools import subset

FD = os.path.join(os.path.dirname(__file__), '..', 'sources', 'fonts')
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'app', 'fonts')
DATA = os.path.join(os.path.dirname(__file__), '..', 'src', 'app', 'data')
os.makedirs(OUT, exist_ok=True)

LATIN = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180)) | {0x1BF, 0x1F7, 0x1E2, 0x1E3, 0x1FC, 0x1FD, 0x21C, 0x21D, 0x232, 0x233,
         0x2018, 0x2019, 0x201C, 0x201D, 0x2013, 0x2014, 0x2026, 0x204A, 0xA765, 0xA764, 0xA76B, 0x2E2C, 0x00B7, 0x00B6, 0x2E2B}
RUNES = set(range(0x16A0, 0x16F9))
FACES = {
    'ca': ('Cardo-Regular.ttf', 'Cardo', LATIN, None),
    'un': ('UncialAntiqua-Regular.ttf', 'Uncial Antiqua', LATIN, 'Cardo-Regular.ttf'),
    'bl': ('UnifrakturMaguntia-Book.ttf', 'UnifrakturMaguntia', LATIN, 'Cardo-Regular.ttf'),
    'fe': ('IMFeENrm28P.ttf', 'IM FELL English', LATIN, 'Cardo-Regular.ttf'),
    'ru': ('NotoSansRunic-Regular.ttf', 'Noto Sans Runic', RUNES | set(range(0x20, 0x7F)) | {0xB7}, 'Cardo-Regular.ttf'),
}

def do_subset(src, codes, dst):
    opts = subset.Options(); opts.layout_features = ['kern']; opts.name_IDs = ['*']; opts.notdef_outline = True; opts.glyph_names = True
    f = TTFont(src); s = subset.Subsetter(opts); s.populate(unicodes=sorted(codes)); s.subset(f); f.save(dst)

def fill(dst, donor, codes):
    t = TTFont(dst); d = TTFont(donor)
    tc, dc = t.getBestCmap(), d.getBestCmap()
    gs = d.getGlyphSet(); scale = t['head'].unitsPerEm / d['head'].unitsPerEm
    # match the donor's x-height to the target's so the borrowed letters sit in the line
    def xh(font):
        os2 = font['OS/2']; return getattr(os2, 'sxHeight', 0) or font['head'].unitsPerEm * 0.45
    k = scale * (xh(t) / scale) / xh(d) if xh(d) else scale
    k = max(scale * 0.8, min(scale * 1.35, k))
    added = []
    order = list(t.getGlyphOrder())
    for cp in sorted(codes):
        if cp in tc or cp not in dc: continue
        gname = 'u%04X' % cp
        rp = DecomposingRecordingPen(gs); gs[dc[cp]].draw(rp)
        pen = TTGlyphPen(None); rp.replay(TransformPen(pen, (k, 0, 0, k, 0, 0)))
        t['glyf'][gname] = pen.glyph()
        adv = round(d['hmtx'][dc[cp]][0] * k)
        t['hmtx'][gname] = (adv, 0)
        if gname not in order: order.append(gname)
        for tb in t['cmap'].tables:
            if tb.isUnicode(): tb.cmap[cp] = gname
        added.append(chr(cp))
    t.setGlyphOrder(order); t['glyf'].glyphOrder = order
    t['maxp'].numGlyphs = len(order)
    if 'post' in t: t['post'].formatType = 2.0; t['post'].extraNames = []; t['post'].mapping = {}
    t.save(dst)
    return added

glyphs = {}
for key, (fn, name, codes, donor) in FACES.items():
    dst = os.path.join(OUT, 'ET%s.ttf' % key.upper())
    do_subset(os.path.join(FD, fn), codes, dst)
    added = fill(dst, os.path.join(FD, donor), codes) if donor else []
    # re-save through subset once more to recompute tables cleanly
    t = TTFont(dst)
    cmap = t.getBestCmap(); order = t.getGlyphOrder(); gid = {g: i for i, g in enumerate(order)}
    rev = {}
    for cp in sorted(cmap):
        g = cmap[cp]
        if gid[g] not in rev and cp not in (0xA0,): rev[gid[g]] = [chr(cp), t['hmtx'][g][0]]
    glyphs[key] = {'upm': t['head'].unitsPerEm, 'name': name, 'asc': t['hhea'].ascent, 'desc': t['hhea'].descent, 'glyphs': rev}
    print(key, os.path.getsize(dst), 'glyphs', len(rev), 'borrowed from Cardo:', ''.join(added))
with open(os.path.join(DATA, 'glyphs.json'), 'w', encoding='utf8') as f: json.dump(glyphs, f, ensure_ascii=False, separators=(',', ':'))
