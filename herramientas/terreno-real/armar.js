// Arma las grillas de elevación reales de los tres lugares del Modo Expedición y las guarda en terreno_real.json.
// Cada grilla: n×n muestras sobre un cuadrado de «lado» metros centrado en el lugar, x hacia el este y z hacia el sur,
// alturas en metros relativas al centro, guardadas como Int16 con una escala propia (base64).
const fs=require('fs'),path=require('path'),https=require('https');
const R=3396190,D=Math.PI/180;
// ---------- Jezero: CTX 20 m (GeoTIFF por tiras, sin compresión) ----------
function jezero(){
  const b=fs.readFileSync(path.join(__dirname,'jezero_ctx.tif')),u16=o=>b.readUInt16LE(o),u32=o=>b.readUInt32LE(o);
  const ifd=u32(4),n=u16(ifd),tag={};for(let i=0;i<n;i++){const e=ifd+2+i*12;tag[u16(e)]={c:u32(e+4),v:u32(e+8)}}
  const W=tag[256].v,H=tag[257].v,offs=[];for(let i=0;i<tag[273].c;i++)offs.push(u32(tag[273].v+i*4));
  const X0=4573663.250853,Y0=1109693.140188,S=20;
  return{S,muestra(c,r){if(c<0||r<0||c>=W||r>=H)return NaN;const v=b.readFloatLE(offs[r]+c*4);return v>-1e5&&v<1e5?v:NaN},
    pix:(lat,lon)=>[(R*lon*D-X0)/S,(Y0-R*lat*D)/S]};
}
// ---------- Coprates: CTX 24 m (mosaicos LZW + predictor flotante) ----------
function coprates(){
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
  const X0=-3962412,Y0=-720444,S=24;
  return{S,muestra(c,r){if(c<0||r<0||c>=W||r>=H)return NaN;const v=tile(Math.floor(r/TH)*TX+Math.floor(c/TW))[(r%TH)*TW+(c%TW)];return v>-30000&&v<30000?v:NaN},
    pix:(lat,lon)=>[(R*lon*D-X0)/S,(Y0-R*lat*D)/S]};
}
// Muestreo bilineal con promedio de celda para grillas más gruesas que el modelo
function grilla(src,lat,lon,lado,N){
  const[cc,cr]=src.pix(lat,lon),o=new Float32Array(N*N),paso=lado/(N-1)/src.S,h=Math.max(0,Math.floor(paso/2));
  const bil=(c,r)=>{const c0=Math.floor(c),r0=Math.floor(r),fx=c-c0,fy=r-r0;return src.muestra(c0,r0)*(1-fx)*(1-fy)+src.muestra(c0+1,r0)*fx*(1-fy)+src.muestra(c0,r0+1)*(1-fx)*fy+src.muestra(c0+1,r0+1)*fx*fy};
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const c=cc+(i/(N-1)-.5)*lado/src.S,r=cr+(j/(N-1)-.5)*lado/src.S;
    if(!h){o[j*N+i]=bil(c,r);continue}
    let s=0,k=0;const st=Math.max(1,h>>1);for(let dy=-h;dy<=h;dy+=st)for(let dx=-h;dx<=h;dx+=st){const v=src.muestra(Math.round(c+dx),Math.round(r+dy));if(!isNaN(v)){s+=v;k++}}o[j*N+i]=k?s/k:NaN}
  return o}
// ---------- Gale: HiRISE 1 m (PDS IMG por rangos) ----------
const GALE='https://hirise-pds.lpl.arizona.edu/PDS/DTM/PSP/ORB_001400_001499/PSP_001488_1750_PSP_001752_1750/DTEEC_001488_1750_001752_1750_U02.IMG';
const G={REC:26944,RES:58586.494013,LPO:-276559.50000001,SPO:3577.5000000001,LON0:137.3,SAMPLES:6736,LINES:13375,ESC:1.0117467945795};
function rango(a,b){return new Promise((ok,mal)=>{https.get(GALE,{headers:{Range:`bytes=${a}-${b}`}},r=>{const c=[];r.on('data',d=>c.push(d));r.on('end',()=>ok(Buffer.concat(c)))}).on('error',mal)})}
async function galeLejos(lat,lon,lado,N){
  const cl=G.LPO-lat*G.RES,cs=G.SPO+(lon-G.LON0)*G.RES,o=new Float32Array(N*N);
  for(let j=0;j<N;j++){const l=Math.round(cl+(j/(N-1)-.5)*lado/G.ESC);
    if(l<0||l>=G.LINES){for(let i=0;i<N;i++)o[j*N+i]=NaN;continue}
    const b=await rango(G.REC+l*G.REC,G.REC+(l+1)*G.REC-1);
    for(let i=0;i<N;i++){const s=Math.round(cs+(i/(N-1)-.5)*lado/G.ESC);let v=NaN;if(s>=0&&s<G.SAMPLES){const x=b.readFloatLE(s*4);if(x>-1e30)v=x}o[j*N+i]=v}}
  return o}
// Rellena huecos (fuera del modelo) con el promedio de los vecinos válidos, de afuera hacia adentro
function rellenar(a,N){let falta=true,vueltas=0;while(falta&&vueltas<1200){falta=false;vueltas++;const c=a.slice();
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){if(!isNaN(a[j*N+i]))continue;let s=0,k=0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=i+dx,y=j+dy;if(x<0||y<0||x>=N||y>=N)continue;const v=a[y*N+x];if(!isNaN(v)){s+=v;k++}}if(k)c[j*N+i]=s/k;else falta=true}
  a.set(c)}return a}
function empaquetar(a,N,lado,cero){
  let mn=1e9,mx=-1e9;for(const v of a){mn=Math.min(mn,v-cero);mx=Math.max(mx,v-cero)}
  const esc=Math.max(.01,(mx-mn)/65000),q=new Int16Array(N*N);for(let k=0;k<a.length;k++)q[k]=Math.round((a[k]-cero-mn)/esc)-32500;
  return{n:N,lado,min:+mn.toFixed(3),esc:+esc.toFixed(6),d:Buffer.from(q.buffer).toString('base64')}}
(async()=>{
  const out={};
  // Jezero: centro en Octavia E. Butler Landing (aterrizaje de Perseverance)
  {const s=jezero(),lat=18.4447,lon=77.4508,medio=grilla(s,lat,lon,3000,151),lejos=rellenar(grilla(s,lat,lon,12000,151),151),cero=medio[75*151+75];
    out.jezero={lat,lon,fuente:'MRO CTX, Jezero DEM, Controlled (20 m/píxel) · NASA Mars Trek',grillas:[empaquetar(lejos,151,12000,cero),empaquetar(medio,151,3000,cero)]}}
  // Coprates Chasma, sobre el borde de la pared sur (meseta)
  {const s=coprates(),lat=-13.7616,lon=-66.5446,medio=grilla(s,lat,lon,3000,151),cero=medio[75*151+75];
    // el borde sur del modelo tiene errores de la reconstrucción estéreo (pozos de 8 km imposibles): se descartan y se rellenan
    const crudo=grilla(s,lat,lon,12000,151),malo=new Uint8Array(151*151);
    for(let j=0;j<151;j++)for(let i=0;i<151;i++)if(!(crudo[j*151+i]-cero>-4500))for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=i+dx,y=j+dy;if(x>=0&&y>=0&&x<151&&y<151)malo[y*151+x]=1}
    for(let k=0;k<malo.length;k++)if(malo[k])crudo[k]=NaN;
    const lejos=rellenar(crudo,151);
    // horizonte de 180 km para ver el cañón completo: el modelo cubre ~37 km de este a oeste y termina al sur de la base,
    // así que cada fila se continúa hacia el este y el oeste (el cañón corre en esa dirección) y al sur se continúa la meseta
    const N2=201,hz=grilla(s,lat,lon,180000,N2);
    for(let k=0;k<hz.length;k++)if(!(hz[k]-cero>-12000&&hz[k]-cero<12000))hz[k]=NaN;
    // al sur de la base sólo hay meseta: los pozos profundos ahí son errores del borde del modelo
    for(let j=Math.round(N2/2)+3;j<N2;j++)for(let i=0;i<N2;i++)if(hz[j*N2+i]-cero<-1500)hz[j*N2+i]=NaN;
    for(let j=0;j<N2;j++){const fila=[];for(let i=0;i<N2;i++)if(!isNaN(hz[j*N2+i]))fila.push(i);if(!fila.length)continue;
      const i0=fila[0],i1=fila[fila.length-1];
      // promedio de los extremos válidos para que la continuación no copie un solo píxel ruidoso
      const borde=(lado)=>{let s2=0,k2=0;for(let d=0;d<4;d++){const v=hz[j*N2+(lado<0?i0+d:i1-d)];if(!isNaN(v)){s2+=v;k2++}}return s2/k2};
      const vo=borde(-1),ve=borde(1);
      for(let i=0;i<N2;i++){const v=hz[j*N2+i];if(!isNaN(v))continue;if(i<i0)hz[j*N2+i]=vo;else if(i>i1)hz[j*N2+i]=ve;else{let a2=i-1,b2=i+1;while(a2>0&&isNaN(hz[j*N2+a2]))a2--;while(b2<N2-1&&isNaN(hz[j*N2+b2]))b2++;hz[j*N2+i]=(hz[j*N2+a2]+hz[j*N2+b2])/2}}}
    // filas sin datos: al sur, la meseta; al norte, la última fila conocida
    let ult=-1;for(let j=0;j<N2;j++){if(!isNaN(hz[j*N2+(N2>>1)]))ult=j;else if(ult>=0)for(let i=0;i<N2;i++)hz[j*N2+i]=hz[ult*N2+i]}
    let pri=-1;for(let j=N2-1;j>=0;j--){if(!isNaN(hz[j*N2+(N2>>1)]))pri=j;else if(pri>=0)for(let i=0;i<N2;i++)hz[j*N2+i]=hz[pri*N2+i]}
    // suavizado leve para que las continuaciones no tengan saltos
    const horizonte=hz.slice();for(let j=1;j<N2-1;j++)for(let i=1;i<N2-1;i++){let s2=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)s2+=hz[(j+dy)*N2+i+dx];horizonte[j*N2+i]=s2/9}
    out.valles={lat,lon,fuente:'MRO CTX, DEM Coprates 13S293E (24 m/píxel) · NASA Mars Trek',grillas:[empaquetar(horizonte,201,180000,cero),empaquetar(lejos,151,12000,cero),empaquetar(medio,151,3000,cero)]}}
  // Gale: borde del montículo central (Monte Sharp)
  {const lat=-4.78027,lon=137.28332;
    const medio=new Float32Array(fs.readFileSync(path.join(__dirname,'gale_ext.f32')).buffer.slice(0)),cerca=new Float32Array(fs.readFileSync(path.join(__dirname,'gale_int.f32')).buffer.slice(0));
    const lejos=rellenar(await galeLejos(lat,lon,12000,151),151),cero=medio[75*151+75];
    out.gale={lat,lon,fuente:'MRO HiRISE DTM DTEEC_001488_1750_001752_1750 (1 m/píxel) · HiRISE PDS, Univ. of Arizona',grillas:[empaquetar(lejos,151,12000,cero),empaquetar(medio,151,3000,cero),empaquetar(cerca,257,640,cero)]}}
  for(const k in out){const g=out[k].grillas;console.log(k,g.map(x=>`${x.lado} m: ${x.n}×${x.n}, ${x.min.toFixed(0)} a ${(x.min+65000*x.esc).toFixed(0)} m`).join(' | '))}
  const txt=JSON.stringify(out);fs.writeFileSync(path.join(__dirname,'terreno_real.json'),txt);console.log('tamaño',(txt.length/1024).toFixed(0),'KB');
})();
