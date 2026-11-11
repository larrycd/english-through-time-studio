// every script x sizes x themes x PNG/JPEG x scale, on real verses: write, export, read back, compare
const { chromium } = require('playwright');
(async () => {
  const N = +process.argv[2] || 6;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8772/');
  await p.waitForFunction(() => READY.dict, null, { timeout: 120000 });
  const res = await p.evaluate(async (N) => {
    const P = ET.D.par, keys = Object.keys(P.v), out = { total: 0, exact: 0, svg: 0, svgOk: 0, chars: 0, errs: 0, fails: [] };
    let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const COL = { modern: [0, 4, 5], fell: [2, 3, 4], black: [1], insular: [0], runes: [0] };
    const norm = s => String(s).replace(/\s+/g, ' ').trim().replace(/ ?([᛫᛬]) ?/g, '$1');
    for (const sc of Object.keys(ET.SCRIPTS)) for (let i = 0; i < N; i++) {
      let t = ''; while (!t) { const k = keys[Math.floor(rnd() * keys.length)], c = COL[sc][Math.floor(rnd() * COL[sc].length)]; t = P.v[k][c]; }
      t = t.slice(0, 160);
      const size = [32, 48, 64, 90][i % 4], theme = ['vellum', 'paper', 'oak', 'night'][(i >> 1) % 4], width = [700, 900, 1200][i % 3];
      const st = ET.scriptText(t, sc), keep = st.split('').filter(c => /\s/.test(c) || !ET.missing(c, sc).length).join(''), want = norm(keep);
      const svg = ET.render(st, { script: sc, size, width, theme }), r = ET.readSVG(svg);
      out.svg++; if (r.ok && norm(r.text) === want) out.svgOk++; else out.fails.push(['svg', sc, size, want, r.text]);
      for (const fmt of ['png', 'jpeg']) for (const scale of [1, 2]) {
        const id = await rasterOf(svg, fmt, scale), rr = ET.readImage(id, 'auto'), got = rr.ok ? norm(rr.text) : '';
        out.total++; out.chars += want.length; const d = diffCount(got, want); out.errs += d;
        if (d === 0) out.exact++; else out.fails.push([fmt + 'x' + scale, sc, size, theme, want, rr.ok ? got : rr.reason, d]);
      }
    }
    return out;
  }, N);
  console.log('SVG exact', res.svgOk + '/' + res.svg, '| images exact', res.exact + '/' + res.total, '| letter errors', res.errs + '/' + res.chars, (100 * res.errs / res.chars).toFixed(2) + '%');
  res.fails.slice(0, +process.argv[3] || 12).forEach(f => console.log(JSON.stringify(f)));
  console.log('page errors', errs.slice(0, 3));
  await b.close();
})();
