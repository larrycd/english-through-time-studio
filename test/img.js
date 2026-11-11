const ET=require('./load');
(async()=>{await ET.initRender();
const S=['Hwæt! We Gardena in geardagum þeodcyninga þrym gefrunon.','Whan that Aprill with his shoures soote the droghte of March hath perced to the roote','To be, or not to be, that is the question: whether tis nobler in the mind to suffer'];
const only=process.argv[2];
for (const sc of Object.keys(ET.SCRIPTS)) { if(only&&sc!==only)continue; for (const s of S){
 const st=ET.scriptText(s,sc); const M=ET.renderMask(st,{script:sc,size:40,width:900});
 const d=new Uint8ClampedArray(M.W*M.H*4); for(let i=0;i<M.W*M.H;i++){const v=M.data[i]?30:245; d[i*4]=v;d[i*4+1]=v;d[i*4+2]=v;d[i*4+3]=255;}
 const r=ET.readImage({width:M.W,height:M.H,data:d},'auto'); const N=x=>x.replace(/\s+/g,' ').trim().replace(/([᛫᛬]) /g,'$1'); const a=N(r.text||''), b=N(st);
 console.log(a===b?'OK ':'XX ',sc,r.script, a===b?'':'\n   got '+JSON.stringify(a)+'\n  want '+JSON.stringify(b));
}}
const T=ET._templates('insular'); console.log('gaps', Object.keys(ET.SCRIPTS).map(k=>k+' '+ET._templates(k).gap.toFixed(3)).join(', '));
})();
