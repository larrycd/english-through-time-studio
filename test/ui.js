const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8772/');
  await p.waitForFunction(() => /dictionary entries/.test(document.getElementById('ver').textContent) || /Could not/.test(document.getElementById('ver').textContent), null, { timeout: 120000 });
  console.log(await p.textContent('#ver'));
  console.log('translate:', await p.textContent('#tout'));
  await p.screenshot({ path: process.argv[2] + '/t1.png' });
  await p.click('#nav button[data-v=test]'); await p.click('#runTest');
  await p.waitForFunction(() => /passed, \d+ failed$/.test(document.getElementById('tlog').textContent.trim()), null, { timeout: 600000 });
  const log = await p.textContent('#tlog'); console.log(log.split('\n').filter(l => !l.startsWith('✓')).join('\n')); console.log(log.split('\n').slice(-1)[0]);
  console.log('errors', errs.slice(0, 5));
  await b.close();
})();
