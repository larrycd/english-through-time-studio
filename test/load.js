global.window = undefined;
const fs=require('fs'),path=require('path');
const A=path.join(__dirname,'..','src','app');
require(A+'/js/data.js'); require(A+'/js/translate.js'); require(A+'/js/pron.js');
const ET=globalThis.ET;
const PT=JSON.parse(fs.readFileSync(A+'/data/parts.json','utf8'));for (const n of ['ang','enm']){let r=[];for(let i=1;i<=PT[n];i++)r=r.concat(JSON.parse(fs.readFileSync(A+'/data/'+n+i+'.json','utf8')));ET.load(n,r);}
for (const n of ['align','parallel','heldout']) ET.load(n, JSON.parse(fs.readFileSync(A+'/data/'+n+'.json','utf8')));
ET.load('cmu', fs.readFileSync(A+'/data/cmu.tsv','utf8'));
module.exports=ET;
require(A+'/js/render.js');
module.exports.initRender = async function(){
  const hb = require(A+'/vendor/hbjs.js')(await require(A+'/vendor/hb.js')({locateFile:f=>A+'/vendor/'+f}));
  ET.setShaper(hb); ET.loadGlyphs(JSON.parse(fs.readFileSync(A+'/data/glyphs.json','utf8')));
  for (const k of ['ca','un','bl','fe','ru']) ET.loadFont(k, new Uint8Array(fs.readFileSync(A+'/fonts/ET'+k.toUpperCase()+'.ttf')));
};
