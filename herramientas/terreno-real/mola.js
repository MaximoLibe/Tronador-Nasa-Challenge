// Monte Olimpo y Cráter Korolev: altimetría láser MOLA de Mars Global Surveyor
// (MEGDR de 128 píxeles por grado, unos 463 m, el mismo modelo global que muestra NASA Mars Trek).
// Los archivos de PDS Geosciences aceptan pedidos por rangos: se bajan sólo las filas necesarias.
// Uso: node mola.js vista olimpo|korolev     → mapa ASCII de la zona para elegir el lugar
//      node mola.js armar                    → escribe mola.json con las grillas de los dos lugares
const https=require('https'),fs=require('fs'),path=require('path');
const BASE='https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/';
const PPD=128,REC=11520*2,R=3396000,D=Math.PI/180;
// Cada archivo cubre 44° de latitud × 90° de longitud (este).
const LUGARES={
  olimpo:{archivo:'megt44n180hb.img',latSup:44,lonIzq:180,lat:18.65,lon:226.2,
    fuente:'MGS MOLA MEGDR 128 píxeles/grado (463 m) · NASA PDS Geosciences · el mismo modelo global de NASA Mars Trek'},
  korolev:{archivo:'megt88n090hb.img',latSup:88,lonIzq:90,lat:73.0,lon:165.0,
    fuente:'MGS MOLA MEGDR 128 píxeles/grado (463 m en latitud) · NASA PDS Geosciences · el mismo modelo global de NASA Mars Trek'},
};
function rango(url,a,b){return new Promise((ok,mal)=>{https.get(url,{headers:{Range:`bytes=${a}-${b}`}},r=>{if(r.statusCode!==206){mal(new Error('HTTP '+r.statusCode));return}const c=[];r.on('data',d=>c.push(d));r.on('end',()=>ok(Buffer.concat(c)))}).on('error',mal)})}
const cache=path.join(__dirname,'mola_cache');
async function bloque(L,lat0,lat1){ // filas entre las latitudes lat1 (sur) y lat0 (norte)
  const f0=Math.max(0,Math.floor((L.latSup-lat0)*PPD)-2),f1=Math.min(5631,Math.ceil((L.latSup-lat1)*PPD)+2);
  if(!fs.existsSync(cache))fs.mkdirSync(cache);
  const arch=path.join(cache,`${L.archivo}_${f0}_${f1}.bin`);let b;
  if(fs.existsSync(arch))b=fs.readFileSync(arch);else{b=await rango(BASE+L.archivo,f0*REC,(f1+1)*REC-1);fs.writeFileSync(arch,b)}
  return{f0,f1,v:(fila,col)=>{fila=Math.max(f0,Math.min(f1,fila));col=Math.max(0,Math.min(11519,col));return b.readInt16BE(((fila-f0)*11520+col)*2)}};
}
// Interpolación cúbica en la grilla de MOLA (filas = latitud, columnas = longitud)
const cub=(p0,p1,p2,p3,t)=>p1+.5*t*(p2-p0+t*(2*p0-5*p1+4*p2-p3+t*(3*(p1-p2)+p3-p0)));
function muestra(L,B,lat,lon){
  const fr=(L.latSup-lat)*PPD-.5,cr=(lon-L.lonIzq)*PPD-.5,f=Math.floor(fr),c=Math.floor(cr),tf=fr-f,tc=cr-c;
  const fila=k=>cub(B.v(f+k,c-1),B.v(f+k,c),B.v(f+k,c+1),B.v(f+k,c+2),tc);
  return cub(fila(-1),fila(0),fila(1),fila(2),tf);
}
// Grilla de N×N alrededor del centro: x hacia el este y z hacia el sur, en metros
function grilla(L,B,lado,N){const o=new Float32Array(N*N),cl=Math.cos(L.lat*D);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i/(N-1)-.5)*lado,z=(j/(N-1)-.5)*lado;
    o[j*N+i]=muestra(L,B,L.lat-z/R/D,L.lon+x/(R*cl)/D)}return o}
function empaquetar(a,N,lado,cero){
  let mn=1e9,mx=-1e9;for(const v of a){mn=Math.min(mn,v-cero);mx=Math.max(mx,v-cero)}
  const esc=Math.max(.01,(mx-mn)/65000),q=new Int16Array(N*N);for(let k=0;k<a.length;k++)q[k]=Math.round((a[k]-cero-mn)/esc)-32500;
  return{n:N,lado,min:+mn.toFixed(3),esc:+esc.toFixed(6),d:Buffer.from(q.buffer).toString('base64')}}
async function datos(id){const L=LUGARES[id],m=95000/R/D;return{L,B:await bloque(L,L.lat+m,L.lat-m)}}
(async()=>{
  const modo=process.argv[2];
  if(modo==='vista'){const{L,B}=await datos(process.argv[3]);const N=61,lado=+(process.argv[4]||170000),g=grilla(L,B,lado,N),pasos=' .:-=+*#%@';
    let mn=1e9,mx=-1e9;for(const v of g){mn=Math.min(mn,v);mx=Math.max(mx,v)}console.log('elevación',mn,'a',mx,'m · centro',muestra(L,B,L.lat,L.lon).toFixed(0));
    for(let j=0;j<N;j+=2){let s='';for(let i=0;i<N;i++)s+=pasos[Math.min(9,Math.floor((g[j*N+i]-mn)/(mx-mn+1e-6)*10))];console.log(((j/(N-1)-.5)*lado/1000).toFixed(0).padStart(5),s)}
    return}
  const out={};
  for(const id of Object.keys(LUGARES)){const{L,B}=await datos(id),cero=muestra(L,B,L.lat,L.lon);
    out[id]={lat:L.lat,lon:L.lon>180?L.lon-360:L.lon,fuente:L.fuente,grillas:[empaquetar(grilla(L,B,180000,201),201,180000,cero),empaquetar(grilla(L,B,12000,151),151,12000,cero),empaquetar(grilla(L,B,3000,121),121,3000,cero)]};
    console.log(id,'centro',cero.toFixed(0),'m',out[id].grillas.map(g=>`${g.lado/1000} km: ${g.min.toFixed(0)} a ${(g.min+65000*g.esc).toFixed(0)} m`).join(' | '))}
  const txt=JSON.stringify(out);fs.writeFileSync(path.join(__dirname,'mola.json'),txt);console.log('tamaño',(txt.length/1024).toFixed(0),'KB');
})().catch(e=>{console.error(e);process.exit(1)});
