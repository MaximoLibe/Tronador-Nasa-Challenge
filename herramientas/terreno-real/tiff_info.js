// Lee sólo la cabecera y el primer IFD de un GeoTIFF remoto (con pedidos por rango) y muestra su estructura
const https=require('https');
function rango(url,a,b){return new Promise((ok,mal)=>{https.get(url,{headers:{Range:`bytes=${a}-${b}`}},r=>{if(r.statusCode>=300&&r.statusCode<400&&r.headers.location)return rango(r.headers.location,a,b).then(ok,mal);const c=[];r.on('data',d=>c.push(d));r.on('end',()=>ok({buf:Buffer.concat(c),status:r.statusCode,len:r.headers['content-range']}))}).on('error',mal)})}
const TAGS={256:'ancho',257:'alto',258:'bits',259:'compresion',262:'fotometrica',273:'stripOffsets',277:'muestras',278:'filasPorStrip',279:'stripBytes',284:'planar',317:'predictor',322:'tileAncho',323:'tileAlto',324:'tileOffsets',325:'tileBytes',339:'formatoMuestra',33550:'escalaPixel',33922:'puntoAtado',34735:'geoClaves',42113:'nodata'};
(async()=>{
  const url=process.argv[2];
  let {buf,status,len}=await rango(url,0,65535);
  console.log('status',status,len);
  const le=buf.toString('ascii',0,2)==='II';const big=(le?buf.readUInt16LE(2):buf.readUInt16BE(2))===43;
  const u16=o=>le?buf.readUInt16LE(o):buf.readUInt16BE(o),u32=o=>le?buf.readUInt32LE(o):buf.readUInt32BE(o),u64=o=>Number(le?buf.readBigUInt64LE(o):buf.readBigUInt64BE(o)),f64=o=>le?buf.readDoubleLE(o):buf.readDoubleBE(o);
  console.log(le?'little':'big','bigtiff',big);
  let ifd=big?u64(8):u32(4);
  if(ifd+4000>buf.length){({buf}=await rango(url,ifd,ifd+65535));ifd=0}
  const n=big?u64(ifd):u16(ifd),es=big?20:12,base=ifd+(big?8:2);
  const out={};
  for(let i=0;i<n;i++){const e=base+i*es,tag=u16(e),typ=u16(e+2),cnt=big?u64(e+4):u32(e+4),vo=e+(big?12:8);
    const nombre=TAGS[tag]||tag;let v;
    if(cnt===1&&(typ===3))v=u16(vo);else if(cnt===1&&(typ===4))v=u32(vo);else if(cnt===1&&typ===16)v=u64(vo);
    else{const off=big?u64(vo):u32(vo);v=`[${cnt} de tipo ${typ} en ${off}]`;
      if(typ===12&&off+cnt*8<=buf.length){v=[];for(let k=0;k<cnt;k++)v.push(f64(off+k*8))}}
    out[nombre]=v}
  console.log(out);
})();
