// Searches the Coprates model for a spot on the edge of the canyon:
// a drivable 600 m area (gentle slope) with a big drop a few hundred metres away.
// Usage: node buscar_borde.js   (needs coprates.tif in this folder)
const fs=require('fs'),path=require('path');
const b=fs.readFileSync(path.join(__dirname,'coprates.tif')),u16=o=>b.readUInt16LE(o),u32=o=>b.readUInt32LE(o);
const ifd=u32(4),n=u16(ifd),tag={};for(let i=0;i<n;i++){const e=ifd+2+i*12;tag[u16(e)]={c:u32(e+4),v:u32(e+8)}}
const W=tag[256].v,H=tag[257].v,TW=tag[322].v,TH=tag[323].v,TX=Math.ceil(W/TW),offs=[],cnts=[];
for(let i=0;i<tag[324].c;i++){offs.push(u32(tag[324].v+i*4));cnts.push(u32(tag[325].v+i*4))}
function lzw(src,largo){const out=new Uint8Array(largo);let op=0,bit=0;const dic=[];let ancho=9,prev=null;
  const reset=()=>{dic.length=258;for(let i=0;i<256;i++)dic[i]=[i];ancho=9;prev=null};reset();
  const leer=()=>{let v=0;for(let k=0;k<ancho;k++){v=(v<<1)|((src[bit>>3]>>(7-(bit&7)))&1);bit++}return v};
  while(op<largo&&(bit>>3)<src.length){const c=leer();if(c===257)break;if(c===256){reset();continue}
    let ent;if(c<dic.length&&dic[c])ent=dic[c];else if(prev)ent=prev.concat(prev[0]);else break;
    for(const x of ent){if(op<largo)out[op++]=x}
    if(prev){dic.push(prev.concat(ent[0]));const sz=dic.length;if(sz>=511&&ancho===9)ancho=10;else if(sz>=1023&&ancho===10)ancho=11;else if(sz>=2047&&ancho===11)ancho=12}
    prev=ent}return out}
const cache=new Map(),dv=Buffer.alloc(4);
function tile(t){if(cache.has(t))return cache.get(t);const raw=lzw(b.subarray(offs[t],offs[t]+cnts[t]),TW*TH*4),f=new Float32Array(TW*TH);
  for(let r=0;r<TH;r++){const row=raw.subarray(r*TW*4,(r+1)*TW*4);for(let i=1;i<row.length;i++)row[i]=(row[i]+row[i-1])&255;
    for(let j=0;j<TW;j++){dv[0]=row[j];dv[1]=row[TW+j];dv[2]=row[2*TW+j];dv[3]=row[3*TW+j];f[r*TW+j]=dv.readFloatBE(0)}}
  cache.set(t,f);return f}
const px=(c,r)=>{if(c<0||r<0||c>=W||r>=H)return NaN;const v=tile(Math.floor(r/TH)*TX+Math.floor(c/TW))[(r%TH)*TW+(c%TW)];return v>-30000&&v<30000?v:NaN};
const R=3396190,D=Math.PI/180,X0=-3962412,Y0=-720444,S=24;
const res=[],RZ=12; // area radius in pixels (≈ 300 m)
for(let r=40;r<H-40;r+=10)for(let c=40;c<W-40;c+=10){
  const h0=px(c,r);if(isNaN(h0))continue;
  // mean slope inside the 600 m area
  let ps=0,k=0,ok=true;for(let dy=-RZ;dy<=RZ;dy+=3)for(let dx=-RZ;dx<=RZ;dx+=3){const a=px(c+dx+1,r+dy),bb=px(c+dx-1,r+dy),e=px(c+dx,r+dy+1),f=px(c+dx,r+dy-1);if([a,bb,e,f].some(isNaN)){ok=false;break}ps+=Math.atan(Math.hypot((a-bb)/48,(e-f)/48))/D;k++}
  if(!ok)continue;const pend=ps/k;if(pend>6)continue;
  // drop: the lowest point within 1.2 km of the centre, in any direction
  let bajo=1e9,dir=0;for(let a=0;a<16;a++){const ang=a/16*Math.PI*2;for(let d=15;d<=50;d+=5){const v=px(Math.round(c+Math.cos(ang)*d),Math.round(r+Math.sin(ang)*d));if(v<bajo){bajo=v;dir=ang}}}
  let valido=true;for(let a=0;a<16&&valido;a++)for(let d=5;d<=60;d+=5)if(isNaN(px(Math.round(c+Math.cos(a/8*Math.PI)*d),Math.round(r+Math.sin(a/8*Math.PI)*d)))){valido=false;break}
  const caida=h0-bajo;if(valido&&caida>400&&caida<2500)res.push({lat:(Y0-r*S)/R/D,lon:(X0+c*S)/R/D,pend,caida,dir})}
res.sort((p,q)=>q.caida-p.caida);
console.log('candidates',res.length);
res.slice(0,12).forEach(x=>console.log(`lat ${x.lat.toFixed(4)} lon ${x.lon.toFixed(4)} · pendiente ${x.pend.toFixed(1)}° · caída ${x.caida.toFixed(0)} m a menos de 1,2 km hacia ${['E','SE','S','SO','O','NO','N','NE'][Math.round(x.dir/(Math.PI/4))%8]}`));
