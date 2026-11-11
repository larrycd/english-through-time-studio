const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const D = path.join(__dirname, '..', 'shots'); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8772/'); await p.waitForFunction(() => READY.dict, null, { timeout: 120000 });
  await p.fill('#tsrc', 'Do you know where the king went? I do not know, but he will come home tomorrow.');
  for (const [to, n] of [['eme', 'tr-eme'], ['me', 'tr-me'], ['oe', 'tr-oe']]) { await p.click('#tto button[data-p=' + to + ']'); await p.waitForTimeout(300); await p.locator('#tout').screenshot({ path: D + '/' + n + '.png' }); }
  await p.click('#tto button[data-p=oe]'); await p.waitForTimeout(300);
  await p.locator('#v-translate .grid2 > div:nth-child(2) section:first-child').screenshot({ path: D + '/words.png' });
  await p.locator('#tacc').screenshot({ path: D + '/acc.png' });
  await p.click('#nav button[data-v=write]');
  const texts = { modern: 'Hwæt! We Gardena in geardagum þeodcyninga þrym gefrunon.', fell: 'To be, or not to be, that is the question: whether tis nobler in the mind to suffer', black: 'Whan that Aprill with his shoures soote the droghte of March hath perced to the roote', insular: 'Fæder ure þu þe eart on heofonum, si þin nama gehalgod.', runes: 'Hwæt we Gardena in geardagum' };
  for (const sc of Object.keys(texts)) { await p.fill('#wsrc', texts[sc]); await p.click('#wscript button[data-s=' + sc + ']'); await p.waitForFunction(() => !/…/.test(document.getElementById('chk2').textContent), null, { timeout: 30000 }); await p.locator('#stage').screenshot({ path: D + '/w-' + sc + '.png' }); console.log(sc, await p.textContent('#chk1'), await p.textContent('#chk2')); }
  await p.click('#nav button[data-v=dict]'); await p.fill('#dq', 'cyning'); await p.waitForTimeout(500); await p.locator('#dres .ent').first().screenshot({ path: D + '/dict.png' });
  await p.click('#nav button[data-v=examples]'); await p.fill('#xq', 'shepherd'); await p.click('#xgo'); await p.waitForTimeout(400); await p.locator('#xres .verse').first().screenshot({ path: D + '/ex.png' });
  await p.click('#nav button[data-v=pron]'); await p.click('#pgo'); await p.waitForTimeout(800); await p.locator('#v-pron section:nth-child(2)').screenshot({ path: D + '/pron.png' });
  await b.close();
})();
