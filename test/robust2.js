const ET=require('./load');
(async()=>{await ET.initRender();
const P=ET.D.par, ks=Object.keys(P.v); let n=0,ex=0;
for (let i=0;i<ks.length;i+=13){ const v=P.v[ks[i]]; for (const [p,c] of [['oe',0],['me',1]]) { if(!v[c])continue; for (const w of ET.tokens(v[c]).filter(t=>ET.isWord(t.t))) { try { const r=ET.wordIPA(w.t,p); n++; if(!r||!r.ipa) throw new Error('no ipa '+w.t); const m=ET.toEspeak(r.ipa,'sv'); if(m.dropped.length) { ex++; if(ex<8) console.log('dropped',p,w.t,r.ipa,m.dropped); } } catch(e){ ex++; if(ex<8) console.log('EXC',e.message); } } } }
console.log('word IPA',n,'problems',ex);
for (const t of ['', ' ', 'a', 'x'.repeat(300), 'Ꝥ ⁊ ſ ƿ ȝ', '中文 text', '\n\n\n', 'ᚠᚢᚦ']) for (const sc of Object.keys(ET.SCRIPTS)) { try { const st=ET.scriptText(t,sc); const svg=ET.render(st,{script:sc,size:48,width:600}); const r=ET.readSVG(svg); } catch(e) { console.log('EXC render',JSON.stringify(t.slice(0,10)),sc,e.message); } }
console.log('render odd done');
for (const t of ['Speak the speech, I pray you', "'Tis but thy name that is my enemy", 'Wherefore art thou Romeo?']) { const r=await ET.textIPA(t,'eme'); const m=ET.toEspeak(r.ipa,'en'); console.log(r.ipa,'| dropped',m.dropped.join('')); }
const au=await ET.speakIPA((await ET.textIPA('To be or not to be','eme')).ipa,'eme'); console.log('eme wav',au.wav.length);
})();
