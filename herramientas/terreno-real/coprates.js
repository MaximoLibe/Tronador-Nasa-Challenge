// Valles Marineris / Coprates Chasma: CTX DEM 13S293E from Mars Trek (GeoTIFF in 256 px tiles,
// LZW compression and floating-point predictor). Usage:
//   node coprates.js vista              → map of the whole model to pick the place
//   node coprates.js recorte <lat> <lon> → 3 km grid around that point
const fs=require('fs'),path=require('path');
const b=fs.readFileSync(path.join(__dirname,'coprates.tif'));
const u16=o=>b.readUInt16LE(o),u32=o=>b.readUInt32LE(o);
const ifd=u32(4),n=u16(ifd),tag={};for(let i=0;i<n;i++){const e=ifd+2+i*12;tag[u16(e)]={t:u16(e+2),c:u32(e+4),v:u32(e+8)}}
const W=tag[256].v,H=tag[257].v,TW=tag[322].v,TH=tag[323].v,offs=[],cnts=[];
for(let i=0;i<tag[324].c;i++){offs.push(u32(tag[324].v+i*4));cnts.push(u32(tag[325].v+i*4))}
const TX=Math.ceil(W/TW);
// TIFF LZW decoder (MSB-first codes, 9 to 12 bits)
function lzw(src,largo){
  const out=new Uint8Array(largo);let op=0,bit=0;const dic=[];let ancho=9,prev=null;
  const reset=()=>{dic.length=258;for(let i=0;i<256;i++)dic[i]=[i];ancho=9;prev=null};reset();
  const leer=()=>{let v=0;for(let k=0;k<ancho;k++){const by=src[bit>>3];v=(v<<1)|((by>>(7-(bit&7)))&1);bit++}return v};
  while(op<largo&&(bit>>3)<src.length){const c=leer();if(c===257)break;if(c===256){reset();continue}
    let ent;if(c<dic.length&&dic[c])ent=dic[c];else if(prev)ent=prev.concat(prev[0]);else break;
    for(const x of ent){if(op<largo)out[op++]=x}
    if(prev){dic.push(prev.concat(ent[0]));const sz=dic.length;if(sz>=511&&ancho===9)ancho=10;else if(sz>=1023&&ancho===10)ancho=11;else if(sz>=2047&&ancho===11)ancho=12}
    prev=ent}
  return out}
const cacheT=new Map();
function tile(t){
  if(cacheT.has(t))return cacheT.get(t);
  const raw=lzw(b.subarray(offs[t],offs[t]+cnts[t]),TW*TH*4),f=new Float32Array(TW*TH),dv=Buffer.alloc(4);
  for(let r=0;r<TH;r++){const row=raw.subarray(r*TW*4,(r+1)*TW*4);for(let i=1;i<row.length;i++)row[i]=(row[i]+row[i-1])&255;
    for(let j=0;j<TW;j++){dv[0]=row[j];dv[1]=row[TW+j];dv[2]=row[2*TW+j];dv[3]=row[3*TW+j];f[r*TW+j]=dv.readFloatBE(0)}}
  cacheT.set(t,f);return f}
function px(c,r){if(c<0||r<0||c>=W||r>=H)return NaN;const t=Math.floor(r/TH)*TX+Math.floor(c/TW),v=tile(t)[(r%TH)*TW+(c%TW)];return v>-30000&&v<30000?v:NaN}
const R=3396190,D=Math.PI/180,X0=-3962412,Y0=-720444,S=24;
const aPix=(lat,lon)=>[(R*lon*D-X0)/S,(Y0-R*lat*D)/S];
const deLonLat=(c,r)=>[(X0+c*S)/R/D,(Y0-r*S)/R/D];
const modo=process.argv[2],pasos=' .:-=+*#%@';
if(modo==='vista'){
  let mn=1e9,mx=-1e9;const g=[];for(let r=0;r<H;r+=110){const fila=[];for(let c=0;c<W;c+=45){const v=px(c,r);fila.push(v);if(!isNaN(v)){mn=Math.min(mn,v);mx=Math.max(mx,v)}}g.push(fila)}
  console.log(W,'x',H,'elev',mn.toFixed(0),mx.toFixed(0));
  g.forEach((f,k)=>{const[lon,lat]=deLonLat(0,k*110);console.log(lat.toFixed(2).padStart(7),f.map(v=>isNaN(v)?' ':pasos[Math.min(9,Math.floor((v-mn)/(mx-mn)*10))]).join(''))});
  const[l0]=deLonLat(0,0),[l1]=deLonLat(W,0);console.log('lon from',l0.toFixed(2),'a',l1.toFixed(2));
}else{
  const lat=+process.argv[3],lon=+process.argv[4],[cc,cr]=aPix(lat,lon),N=151,L=3000,o=new Float32Array(N*N);let mn=1e9,mx=-1e9,nan=0;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const c=cc+(i/(N-1)-.5)*L/S,r=cr+(j/(N-1)-.5)*L/S,c0=Math.floor(c),r0=Math.floor(r),fx=c-c0,fy=r-r0;
    const v=px(c0,r0)*(1-fx)*(1-fy)+px(c0+1,r0)*fx*(1-fy)+px(c0,r0+1)*(1-fx)*fy+px(c0+1,r0+1)*fx*fy;o[j*N+i]=v;if(isNaN(v))nan++;else{mn=Math.min(mn,v);mx=Math.max(mx,v)}}
  console.log('min',mn.toFixed(1),'max',mx.toFixed(1),'no data',nan);
  fs.writeFileSync(path.join(__dirname,'coprates.f32'),Buffer.from(o.buffer));
  let s='';for(let j=0;j<N;j+=8){for(let i=0;i<N;i+=4){const v=o[j*N+i];s+=isNaN(v)?'?':pasos[Math.min(9,Math.floor((v-mn)/(mx-mn+1e-6)*10))]}s+='\n'}console.log(s);
}
