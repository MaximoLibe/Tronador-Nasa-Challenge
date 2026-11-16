// Integrates the real terrain into expedicion.html
const fs=require('fs'),path=require('path');
const F=process.argv[2];let h=fs.readFileSync(F,'utf8');
const datos=fs.readFileSync(path.join(__dirname,'terreno_real.json'),'utf8');
const rep=(a,b)=>{if(!h.includes(a))throw new Error('no encontrado: '+a.slice(0,80));h=h.split(a).join(b)};
const entre=(ini,fin,nuevo)=>{const a=h.indexOf(ini),b=h.indexOf(fin,a);if(a<0||b<0)throw new Error('bloque no encontrado: '+ini.slice(0,50));h=h.slice(0,a)+nuevo+h.slice(b)};

// 1) Embedded elevation data (JSON) before the main module
rep('<script type="importmap">',`<!-- Elevación real de los tres lugares (NASA Mars Trek y HiRISE PDS), preparada en grillas comprimidas -->
<script type="application/json" id="terreno-real">${datos}</script>
<script type="importmap">`);

// 2) Real heights instead of made-up formulas
entre('function hJezero(x, z) {','function cJezero(',`/* ================= Terreno real =================
   Elevación medida por orbitadores de la NASA, no inventada:
   · Jezero: modelo CTX de 20 m/píxel (NASA Mars Trek), centrado en el aterrizaje de Perseverance.
   · Monte Sharp: modelo HiRISE de 1 m/píxel (HiRISE PDS) del borde del montículo de Gale.
   · Coprates Chasma: modelo CTX de 24 m/píxel (NASA Mars Trek) al pie de la pared sur.
   Cada lugar tiene grillas de 12 km, 3 km y (en Gale) 640 m; se usa la más detallada que cubra el punto.
   Encima se suma sólo rugosidad de centímetros (piedritas y ondulaciones) que el satélite no llega a ver. */
const TERRENO = JSON.parse(document.getElementById('terreno-real').textContent);
function grillaReal(g) {
  const bin = atob(g.d), n = g.n, a = new Float32Array(n * n);
  for (let k = 0; k < n * n; k++) { let q = bin.charCodeAt(2 * k) | (bin.charCodeAt(2 * k + 1) << 8); if (q > 32767) q -= 65536; a[k] = (q + 32500) * g.esc + g.min; }
  return { n, lado: g.lado, a };
}
// Cubic (Catmull-Rom) interpolation so the terrain looks smooth, not faceted
function cubica(p0, p1, p2, p3, t) { return p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0))); }
function leerGrilla(g, x, z) {
  const u = (x / g.lado + 0.5) * (g.n - 1), v = (z / g.lado + 0.5) * (g.n - 1);
  const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, n = g.n, A = g.a;
  const m = (ii, jj) => A[clamp(jj, 0, n - 1) * n + clamp(ii, 0, n - 1)];
  const fila = (jj) => cubica(m(i - 1, jj), m(i, jj), m(i + 1, jj), m(i + 2, jj), fu);
  return cubica(fila(j - 1), fila(j), fila(j + 1), fila(j + 2), fv);
}
function alturaReal(id, rugosidad) {
  const gs = TERRENO[id].grillas.map(grillaReal).sort((p, q) => p.lado - q.lado);
  return (x, z) => {
    let h = null;
    for (let k = gs.length - 1; k >= 0; k--) {             // from the coarsest to the finest
      const g = gs[k], d = Math.max(Math.abs(x), Math.abs(z)) / (g.lado / 2);
      if (d >= 1) continue;
      const v = leerGrilla(g, x, z), w = h === null ? 1 : smooth(1, 0.85, d); // soft edge between grids
      h = h === null ? v : mix(h, v, w);
    }
    if (h === null) h = leerGrilla(gs[gs.length - 1], clamp(x, -gs[gs.length - 1].lado / 2, gs[gs.length - 1].lado / 2), clamp(z, -gs[gs.length - 1].lado / 2, gs[gs.length - 1].lado / 2));
    return h + (fbm(x * 0.09, z * 0.09, 3, 7) - 0.5) * rugosidad + (fbm(x * 0.6, z * 0.6, 2, 8) - 0.5) * rugosidad * 0.25;
  };
}
const hJezero = alturaReal('jezero', 0.6), hGale = alturaReal('gale', 0.25), hVM = alturaReal('valles', 0.7);
`);
// Gale's colouring no longer draws made-up dunes
entre('function galeDune(x, z) {','function cGale(','');
rep(`  const dm = galeDune(x, z)[0]; r = mix(r, 0.27, dm); g = mix(g, 0.23, dm); b = mix(b, 0.21, dm);\n`,'');
entre('const vmEdge = (x) =>','function cVM(','');

// 3) Places: real coordinates, targets placed on the real terrain and corrected texts
rep(`id: 'jezero', name: 'Cráter Jezero', lat: 18.4, lon: 77.5,`,`id: 'jezero', name: 'Cráter Jezero', lat: 18.4447, lon: 77.4508,`);
rep(`start: { x: 40, z: 0, yaw: -Math.PI / 2 }, fog: 0.0011,`,`start: { x: 20, z: 30, yaw: -Math.PI / 2 }, fog: 0.00022,`);
entre(`      { name: 'Kodiak', x: -150, z: -165, instr: 'Mastcam-Z',`,`    ],\n  },\n  {\n    id: 'gale'`,`      { name: 'Mirador del delta', x: -190, z: -170, instr: 'Mastcam-Z',
        text: 'Mirá hacia el noroeste: el terreno que sube a lo lejos es el frente del delta, medido por la cámara CTX de Mars Reconnaissance Orbiter. Hace unos 3.500 millones de años un río depositaba ahí sus sedimentos al entrar en un lago. En 2021 Mastcam-Z fotografió con zoom, desde unos 2 km, la colina Kodiak: sus capas inclinadas son las de un delta que avanzaba sobre el agua. Fue la confirmación desde el suelo de que Jezero tuvo un lago.' },
      { name: 'Rocas de Máaz', x: -110, z: 150, instr: 'SHERLOC + PIXL',
        text: 'Perseverance aterrizó sobre la formación Máaz, rocas volcánicas del piso del cráter. SHERLOC y PIXL, los instrumentos del brazo, mostraron que el agua las alteró después de enfriarse. Más tarde, sobre el delta, el rover encontró la roca Cheyava Falls, con manchas que podrían haber dejado microbios antiguos: la NASA la presentó en 2025 como posible biofirma, todavía sin confirmar.' },
`);
rep(`id: 'gale', name: 'Monte Sharp', sub: 'Cráter Gale', lat: -5.4, lon: 137.8,`,`id: 'gale', name: 'Monte Sharp', sub: 'Cráter Gale', lat: -4.7803, lon: 137.2833,`);
rep(`start: { x: 0, z: -180, yaw: 0 }, fog: 0.0010,`,`start: { x: -120, z: -60, yaw: -Math.PI / 2 }, fog: 0.00022,`);
entre(`      { name: 'Dunas Bagnold', x: 140, z: 30, instr: 'SuperCam',`,`      { name: 'Capas de Monte Sharp', x: 40, z: 215, instr: 'Mastcam-Z',`,`      { name: 'Planicie Aeolis', x: -230, z: 40, instr: 'SuperCam',
        text: 'Estás en el fondo plano del cráter Gale, una llanura llamada Aeolis Palus. Curiosity aterrizó en esta misma llanura en 2012 y encontró piedras redondeadas por un antiguo arroyo. SuperCam dispara un láser que vaporiza un punto de la roca y lee su química por la luz que emite, desde varios metros.' },
      { name: 'Pie del montículo', x: 60, z: 40, instr: 'PIXL',
        text: 'Acá empieza a subir el terreno: es la base del montículo central de Gale. Las capas de abajo son arcillas que se formaron en un lago; Curiosity las estudió en la formación Murray. Más arriba, en el canal Gediz Vallis, encontró en 2024 cristales de azufre puro. PIXL usa rayos X para mapear los elementos de la roca.' },
`);
rep(`      { name: 'Capas de Monte Sharp', x: 40, z: 215, instr: 'Mastcam-Z',
        text: 'Monte Sharp se eleva unos 5,5 km sobre el fondo del cráter.`,`      { name: 'Capas de Monte Sharp', x: 220, z: 200, instr: 'Mastcam-Z',
        text: 'Estas laderas son reales: las midió la cámara HiRISE con 1 m de detalle. Monte Sharp se eleva unos 5,5 km sobre el fondo del cráter.`);
rep(`id: 'valles', name: 'Valles Marineris', sub: 'Coprates Chasma', lat: -13.5, lon: -61.0,`,`id: 'valles', name: 'Valles Marineris', sub: 'Coprates Chasma', lat: -13.36, lon: -66.55,`);
rep(`start: { x: 0, z: -140, yaw: 0 }, fog: 0.00055,`,`start: { x: 0, z: -120, yaw: Math.PI }, fog: 0.00016,`);
entre(`      { name: 'Borde del cañón', x: 10, z: null, edge: -12, instr: 'Mastcam-Z',`,`    ],\n  },\n];`,`      { name: 'Pie de la pared sur', x: 20, z: 230, instr: 'Mastcam-Z',
        text: 'La pared que se levanta al sur es la real: el modelo CTX de Mars Reconnaissance Orbiter mide más de 3 km de desnivel entre el fondo y la parte alta en apenas unos kilómetros. Valles Marineris mide más de 4.000 km de largo y hasta 7 km de profundidad. Las paredes muestran cientos de capas de roca volcánica y sedimentos.' },
      { name: 'Fractura del fondo', x: -170, z: -150, instr: 'RIMFAX',
        text: 'El cañón no lo cavó un río: se formó cuando la corteza se estiró y se partió, probablemente por el peso y el levantamiento de la región volcánica de Tharsis. RIMFAX, el radar de Perseverance, puede ver capas y fracturas a unos 10 m bajo el suelo.' },
      { name: 'Mirador de las vetas oscuras', x: 190, z: 90, instr: 'SuperCam',
        text: 'En las paredes de Coprates Chasma aparecen vetas oscuras que crecen en la estación cálida y se desvanecen después (se llaman RSL). Al principio se pensó que podían ser agua salada; estudios más recientes apuntan a flujos de arena y polvo seco. La cámara telescópica de SuperCam permite ver detalles desde lejos.' },
`);
// aerial photos of the new targets
rep(`  'Kodiak': `,`  'Mirador del delta': 'Con altura se ve el frente del delta subiendo hacia el noroeste. Ingenuity hacía justamente esto para Perseverance: fotos aéreas que ayudaron a elegir la ruta para subir al delta de Jezero y a decidir qué rocas valía la pena visitar.',
  'Rocas de Máaz': 'Desde arriba se ven las rocas del piso del cráter, oscuras y quebradas, y las huellas del rover entre ellas. Así las veía Ingenuity cuando volaba por delante de Perseverance.',
  'Kodiak': `);
rep(`  'Dunas Bagnold': `,`  'Planicie Aeolis': 'Desde el aire se ve lo plano que es el fondo del cráter frente a la ladera de Monte Sharp: por eso Curiosity pudo aterrizar acá.',
  'Pie del montículo': 'Con altura se ve dónde la llanura se convierte en ladera: el borde real del montículo central, tal como lo midió HiRISE.',
  'Dunas Bagnold': `);
rep(`  'Borde del cañón': `,`  'Pie de la pared sur': 'Desde el aire se ve la pared entera subiendo más de 3 km. Ningún rover puede trepar por acá, pero un helicóptero sí podría fotografiarla. Por eso la NASA estudia helicópteros marcianos más grandes, capaces de llevar instrumentos.',
  'Fractura del fondo': 'Desde arriba las fracturas se ven como líneas rectas, mucho más fáciles de reconocer que desde el suelo. Así se identifican las fallas en las imágenes tomadas desde órbita.',
  'Borde del cañón': `);
rep(`SITES.forEach(s => s.pois.forEach(p => { if (p.z === null) p.z = vmEdge(p.x) + p.edge; p.done = false;`,`SITES.forEach(s => s.pois.forEach(p => { p.done = false;`);
// 4) Starting point: the flattest spot near the given start
rep(`SITES.forEach(s => s.pois.forEach(p => { p.done = false;`,`function inicioPlano(s) {
  let mejor = null, pm = 1e9;
  for (let k = 0; k < 160; k++) { const a = k * 2.399, d = 6 * Math.sqrt(k), x = s.start.x + Math.cos(a) * d, z = s.start.z + Math.sin(a) * d;
    const p = Math.hypot(s.height(x + 4, z) - s.height(x - 4, z), s.height(x, z + 4) - s.height(x, z - 4)) / 8;
    if (p < pm) { pm = p; mejor = { x, z }; } }
  Object.assign(s.start, mejor);
}
SITES.forEach(inicioPlano);
SITES.forEach(s => s.pois.forEach(p => { p.done = false;`);
// 5) Real 12 km horizon and a camera that can see it
rep(`heightGeo(site, 3000, 150, true)`,`heightGeo(site, 12000, 220, true)`);
rep(`const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 6000);`,`const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 16000);`);
// 6) Menu texts
rep(`El terreno se genera por código inspirado en cada lugar: no es el relieve real.`,`El relieve es el real: viene de modelos de elevación de NASA Mars Trek (cámara CTX) y del archivo HiRISE, con sólo un poco de rugosidad agregada para las piedritas que el satélite no ve.`);
fs.writeFileSync(F,h);console.log('ok',(h.length/1024).toFixed(0),'KB');
