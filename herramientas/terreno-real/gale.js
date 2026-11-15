// Gale / borde de Monte Sharp: DTM HiRISE DTEEC_001488_1750_001752_1750_U02 (PDS, float32 little endian, 1,01 m/píxel)
// Uso: node gale.js perfil            → elevación a lo largo de la columna central, de norte a sur
//      node gale.js recorte <linea0>  → baja un bloque de 3 km y arma las grillas
const https=require('https'),fs=require('fs'),path=require('path');
const URL='https://hirise-pds.lpl.arizona.edu/PDS/DTM/PSP/ORB_001400_001499/PSP_001488_1750_PSP_001752_1750/DTEEC_001488_1750_001752_1750_U02.IMG';
const REC=26944,LABEL_RECS=1,LINES=13375,SAMPLES=6736,RES=58586.494013,LPO=-276559.50000001,SPO=3577.5000000001,LON0=137.3,ESC=1.0117467945795;
const NODATA=-3.4028226550889045e38;
function rango(a,b){return new Promise((ok,mal)=>{https.get(URL,{headers:{Range:`bytes=${a}-${b}`}},r=>{const c=[];r.on('data',d=>c.push(d));r.on('end',()=>ok(Buffer.concat(c)))}).on('error',mal)})}
const lineaABytes=l=>LABEL_RECS*REC+l*REC;
const latDeLinea=l=>-(l-LPO)/RES*-1; // línea = LPO - lat·RES  →  lat = (LPO - línea)/RES
(async()=>{
  const modo=process.argv[2];
  if(modo==='perfil'){
    for(let l=0;l<LINES;l+=500){const b=await rango(lineaABytes(l),lineaABytes(l)+REC-1);
      const vals=[];for(let s=0;s<SAMPLES;s+=200){const v=b.readFloatLE(s*4);vals.push(v>-1e30?Math.round(v):'·')}
      console.log(String(l).padStart(5),'lat',((LPO-l)/RES).toFixed(4),vals.join(' '))}
    return;
  }
  const l0=+process.argv[3],s0=+process.argv[4],LADO=3000,px=Math.round(LADO/ESC);
  console.log('bajando',px,'líneas desde',l0,'(',(px*REC/1e6).toFixed(0),'MB)');
  const b=await rango(lineaABytes(l0),lineaABytes(l0+px)-1);
  const v=(l,s)=>{if(l<0||l>=px||s<0||s>=SAMPLES)return NaN;const x=b.readFloatLE(l*REC+s*4);return x>-1e30?x:NaN};
  function grilla(N,lado,cx,cy){ // cx,cy en píxeles dentro del bloque
    const o=new Float32Array(N*N);
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){
      const fx=cx+(i/(N-1)-.5)*lado/ESC,fy=cy+(j/(N-1)-.5)*lado/ESC;
      // promedio de una celda para no perder información al bajar resolución
      const paso=lado/(N-1)/ESC,h=Math.max(1,Math.floor(paso/2));let sum=0,k=0;
      for(let dy=-h;dy<=h;dy+=Math.max(1,h>>1))for(let dx=-h;dx<=h;dx+=Math.max(1,h>>1)){const q=v(Math.round(fy+dy),Math.round(fx+dx));if(!isNaN(q)){sum+=q;k++}}
      o[j*N+i]=k?sum/k:NaN}
    return o}
  const cx=s0,cy=px/2;
  const ext=grilla(151,3000,cx,cy),int=grilla(257,640,cx,cy);
  for(const[n,a]of[['ext',ext],['int',int]]){let mn=1e9,mx=-1e9,nan=0;for(const x of a){if(isNaN(x))nan++;else{mn=Math.min(mn,x);mx=Math.max(mx,x)}}console.log(n,'mín',mn.toFixed(1),'máx',mx.toFixed(1),'sin dato',nan)}
  fs.writeFileSync(path.join(__dirname,'gale_ext.f32'),Buffer.from(ext.buffer));fs.writeFileSync(path.join(__dirname,'gale_int.f32'),Buffer.from(int.buffer));
  const lat=(LPO-(l0+cy))/RES,lon=LON0+(cx-SPO)/RES;console.log('centro',lat.toFixed(5),lon.toFixed(5));
  const N=151,pasos=' .:-=+*#%@';let mn=1e9,mx=-1e9;for(const x of ext)if(!isNaN(x)){mn=Math.min(mn,x);mx=Math.max(mx,x)}
  let s='';for(let j=0;j<N;j+=8){for(let i=0;i<N;i+=4){const x=ext[j*N+i];s+=isNaN(x)?'?':pasos[Math.min(9,Math.floor((x-mn)/(mx-mn+1e-6)*10))]}s+='\n'}console.log(s);
})();
