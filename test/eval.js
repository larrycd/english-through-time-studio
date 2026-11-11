const ET=require('./load'),fs=require('fs');
const H=ET.D.heldout, out={};
for (const p of ['oe','me','eme']){
  let fb=0,fs1=0,tb=0,ts=0,n=0,unk=0,tot=0;
  for (const [ref,old,mod] of H[p]){
    const f=ET.translate(old,p,'mod'); fs1+=ET.overlap(f.text,mod,'eme'); fb+=ET.overlap(old,mod,'eme');
    const t=ET.translate(mod,'mod',p,{you:'ye'}); ts+=ET.overlap(t.text,old,p); tb+=ET.overlap(mod,old,p);
    f.words.forEach(w=>{if(!w.punct&&!w.skip){tot++; if(!w.ok)unk++;}}); n++;
  }
  out[p]={verses:n,from:{score:+(fs1/n*100).toFixed(1),baseline:+(fb/n*100).toFixed(1)},to:{score:+(ts/n*100).toFixed(1),baseline:+(tb/n*100).toFixed(1)},unknownFrom:+(unk/tot*100).toFixed(1)};
}
console.log(JSON.stringify(out,null,1));
if (process.argv[2]==='--save') fs.writeFileSync(__dirname+'/../src/app/data/eval.json',JSON.stringify(out));
