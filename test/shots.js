const { chromium } = require('playwright');
(async () => {
  const S = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8772/'); await p.waitForFunction(() => READY.dict, null, { timeout: 120000 });
  await p.waitForTimeout(500); await p.screenshot({ path: S + '/v-translate.png' });
  await p.click('#nav button[data-v=write]'); await p.waitForFunction(() => !/…/.test(document.getElementById('chk2').textContent), null, { timeout: 30000 }); await p.screenshot({ path: S + '/v-write.png' });
  for (const sc of ['modern','fell','black','runes']) { await p.click('#wscript button[data-s=' + sc + ']'); await p.waitForFunction(() => !/…/.test(document.getElementById('chk2').textContent), null, { timeout: 30000 }); console.log(sc, await p.textContent('#chk1'), '|', await p.textContent('#chk2')); }
  await p.screenshot({ path: S + '/v-write-runes.png' });
  await p.click('#nav button[data-v=dict]'); await p.waitForTimeout(300); await p.screenshot({ path: S + '/v-dict.png' });
  await p.click('#nav button[data-v=examples]'); await p.waitForTimeout(300); await p.screenshot({ path: S + '/v-examples.png' });
  await p.click('#nav button[data-v=pron]'); await p.click('#pgo'); await p.waitForTimeout(800); await p.click('#pplay'); await p.waitForFunction(() => document.getElementById('paudio').src, null, { timeout: 60000 }); console.log('audio', await p.evaluate(() => document.getElementById('paudio').src.slice(0, 20)), await p.textContent('#pstat')); await p.screenshot({ path: S + '/v-pron.png' });
  await p.click('#nav button[data-v=read]'); await p.screenshot({ path: S + '/v-read.png' });
  await p.click('#nav button[data-v=about]'); await p.screenshot({ path: S + '/v-about.png', fullPage: true });
  console.log('errors', errs);
  await b.close();
})();
