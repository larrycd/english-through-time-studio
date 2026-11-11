const ET=require('./load');
(async()=>{await ET.initRender();
const T=['Hwæt! We Gardena in geardagum þeodcyninga þrym gefrunon.','Whan that Aprill with his shoures soote the droghte of March hath perced to the roote','To be, or not to be, that is the question: whether tis nobler in the mind to suffer','Fæder ūre þū þe eart on heofonum, sī þīn nama ġehālgod.','Jesus said unto them, Have ye understood all these things? They say unto him, Yea, Lord.'];
let ok=0,n=0;
for (const s of Object.keys(ET.SCRIPTS)) for (const t of T){ const st=ET.scriptText(t,s); const miss=ET.missing(st,s); const svg=ET.render(st,{script:s,size:40,width:800}); const r=ET.readSVG(svg); n++; const N=x=>x.replace(/\s+/g,' ').trim().replace(/([᛫᛬]) /g,'$1'); const good=r.ok&&N(r.text)===N(st)&&r.script===s; if(good)ok++; else console.log('FAIL',s,JSON.stringify(st),'\n  got',JSON.stringify(r.text),r.script,miss); }
console.log('svg round trips',ok,'/',n);
console.log(ET.scriptText(T[2],'fell'));console.log(ET.scriptText(T[1],'black'));console.log(ET.scriptText(T[0],'insular'));console.log(ET.scriptText(T[0],'runes'), '=>', ET.plainText(ET.scriptText(T[0],'runes'),'runes'));
for (const s of Object.keys(ET.SCRIPTS)){const T2=ET._templates(s);console.log(s,T2.items.length,'zone',T2.zone.toFixed(3),'base',T2.zoneBase.toFixed(3),'space',T2.space.toFixed(3));}
})();
