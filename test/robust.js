const ET=require('./load');
const P=ET.D.par, ks=Object.keys(P.v); let n=0, ex=0, empty=0, t0=Date.now();
const COL={oe:0,me:1,eme:4,mod:5};
for (let i=0;i<ks.length;i+=7){ const v=P.v[ks[i]];
  for (const f of ['oe','me','eme','mod']) for (const t of ['oe','me','eme','mod']) { if (f===t) continue; const src=v[COL[f]]; if(!src) continue;
    try { const r=ET.translate(src,f,t,{you: i%2?'ye':'thou'}); n++; if(!r.text.trim()) empty++; if(!r.rating) throw new Error('no rating'); } catch(e){ ex++; if(ex<5) console.log('EXC',f,t,ks[i],e.message, e.stack.split('\n')[1]); } } }
console.log('translations',n,'exceptions',ex,'empty',empty,'ms each',((Date.now()-t0)/n).toFixed(2));
// odd input
for (const s of ['', '   ', '!!!', '123 456', 'ÆÐÞ', '<script>alert(1)</script>', 'a'.repeat(5000), "don't won't can't", 'Hello\n\nWorld']) for (const f of ['oe','me','eme','mod']) for (const t of ['oe','me','eme','mod']) { if (f===t) continue; try { ET.translate(s,f,t); } catch(e) { console.log('EXC odd',JSON.stringify(s.slice(0,20)),f,t,e.message); } }
console.log('odd inputs done');
