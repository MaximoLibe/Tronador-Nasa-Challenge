/* =====================================================================
   PUENTE VR POR USB — Misión Hábitat Marte (equipo Tronador)
   ---------------------------------------------------------------------
   Se incluye en el juego DESPUÉS de three.min.js:
       <script src="vr-puente.js"></script>

   Qué hace:
   · Se conecta por WebSocket a la app «Visor VR Tronador» del celular
     (ws://localhost:8080/ws mediante "adb forward", o la IP del anclaje USB).
   · MODO INMERSIVO: intercepta el render principal de Three.js, aplica la
     orientación de la cabeza recibida del celular, dibuja dos cámaras (ojo
     izquierdo/derecho) con distorsión de lente Cardboard y envía cada cuadro
     como JPEG al celular.
   · MODO CINE: captura la pestaña completa (menús, paneles, HUD) y la muestra
     como una pantalla plana en ambos ojos.
   · Teclas: F9 = panel de control · F10 = cambiar de modo · F8 = recentrar.
   No modifica el código del juego: la cámara se restaura después de cada cuadro.
   ===================================================================== */
(function () {
  'use strict';
  if (window.PuenteVR) return;
  if (typeof THREE === 'undefined') { console.warn('[PuenteVR] THREE no está cargado: incluya vr-puente.js después de three.min.js'); return; }

  // ------------------------------------------------------------------ configuración persistente
  const CLAVE = 'puenteVR.cfg.v1';
  const DEF = {
    url: '',          // vacío = automático
    sep: 0.03,        // separación ocular como fracción de la distancia al suelo enfocado
    fov: 85,          // campo de visión vertical por ojo (grados)
    distorsion: true,
    k1: 0.22, k2: 0.24,
    lentesMm: 63.5,   // distancia entre centros de lentes del visor
    calidad: 0.7,     // calidad JPEG
    fpsMax: 30,
    anchoMax: 1920,   // ancho máximo del cuadro enviado (px)
    cineEscala: 0.85, // tamaño de la «pantalla» en modo cine
    inclinacion: 1,   // 1 = se conserva la inclinación de la cámara del juego; 0 = horizonte al frente
    autoInmersivo: true
  };
  let cfg = Object.assign({}, DEF);
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) { /* almacenamiento no disponible */ }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(cfg)); } catch (e) { /* sin acción */ } };

  function urlAuto() {
    if (cfg.url) return cfg.url;
    if (location.protocol === 'http:' && location.port === '8080') return 'ws://' + location.host + '/ws';
    return 'ws://localhost:8080/ws';
  }

  // ------------------------------------------------------------------ estado
  const est = {
    ws: null, conectado: false, modo: 'apagado',        // 'apagado' | 'inmersivo' | 'cine'
    tel: { w: 1920, h: 1080, dpi: 0, modelo: '', giroscopio: true },
    qCab: null, qRef: null,
    enviando: false, ultimoEnvio: 0, ultimo3D: 0,
    cuadros: 0, bytes: 0, fps: 0, kbps: 0, t0: performance.now(),
    error: ''
  };

  // ------------------------------------------------------------------ conexión WebSocket
  let temporizadorReconexion = null;
  function conectar() {
    clearTimeout(temporizadorReconexion);
    if (est.ws) { try { est.ws.onclose = null; est.ws.close(); } catch (e) { /* sin acción */ } }
    let ws;
    try { ws = new WebSocket(urlAuto()); } catch (e) { est.error = String(e.message || e); programarReconexion(); return; }
    ws.binaryType = 'arraybuffer';
    est.ws = ws;
    ws.onopen = () => { est.conectado = true; est.error = ''; est.qRef = null; enviarEstado(); refrescarPanel(); };
    ws.onmessage = (ev) => {
      if (typeof ev.data !== 'string') return;
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'o' && Array.isArray(m.q)) {
        if (!est.qCab) est.qCab = new THREE.Quaternion();
        est.qCab.set(m.q[0], m.q[1], m.q[2], m.q[3]);
      } else if (m.t === 'recentrar') {
        est.qRef = null;
      } else if (m.t === 'hola') {
        est.tel = { w: m.w || 1920, h: m.h || 1080, dpi: m.dpi || 0, modelo: m.modelo || '', giroscopio: m.giroscopio !== false };
        if (cfg.autoInmersivo && est.modo === 'apagado') cambiarModo('inmersivo');
        refrescarPanel();
      }
    };
    ws.onclose = () => { est.conectado = false; est.qCab = null; refrescarPanel(); programarReconexion(); };
    ws.onerror = () => { est.error = 'Sin conexión con el celular (' + urlAuto() + ')'; };
  }
  function programarReconexion() { clearTimeout(temporizadorReconexion); temporizadorReconexion = setTimeout(conectar, 2000); }
  function enviarEstado() {
    if (est.conectado) try { est.ws.send(JSON.stringify({ t: 'estado', modo: est.modo })); } catch (e) { /* sin acción */ }
  }

  // ------------------------------------------------------------------ dimensiones del cuadro enviado
  function dimensiones() {
    const s = Math.min(1, cfg.anchoMax / est.tel.w);
    let w = Math.round(est.tel.w * s), h = Math.round(est.tel.h * s);
    w -= w % 2; h -= h % 2;
    return { w: Math.max(2, w), h: Math.max(2, h) };
  }
  // Desplazamiento del centro óptico de cada ojo (fracción del ancho de medio ojo)
  function desplazamientoLente() {
    if (!est.tel.dpi) return 0;
    const anchoMm = est.tel.w / est.tel.dpi * 25.4;
    return Math.max(-0.2, Math.min(0.2, 0.5 - cfg.lentesMm / anchoMm));
  }

  // ------------------------------------------------------------------ lienzo de envío
  const lienzo = document.createElement('canvas');
  const ctx2d = lienzo.getContext('2d');
  function enviarLienzo(forzar) {
    if (!est.conectado || est.enviando) return false;
    const ahora = performance.now();
    if (!forzar && ahora - est.ultimoEnvio < 1000 / cfg.fpsMax - 2) return false;
    if (est.ws.bufferedAmount > 1.5e6) return false;           // control de congestión
    est.ultimoEnvio = ahora;
    est.enviando = true;
    lienzo.toBlob((b) => {
      if (!b) { est.enviando = false; return; }
      b.arrayBuffer().then((buf) => {
        if (est.conectado) {
          try { est.ws.send(buf); est.cuadros++; est.bytes += buf.byteLength; } catch (e) { /* sin acción */ }
        }
        est.enviando = false;
      }, () => { est.enviando = false; });
    }, 'image/jpeg', cfg.calidad);
    return true;
  }
  setInterval(() => {
    const t = performance.now(), dt = (t - est.t0) / 1000;
    est.fps = est.cuadros / dt; est.kbps = est.bytes / 1024 / dt;
    est.cuadros = 0; est.bytes = 0; est.t0 = t;
    refrescarIndicador();
  }, 1000);

  // ------------------------------------------------------------------ MODO INMERSIVO (estéreo Three.js)
  const P = THREE.WebGLRenderer.prototype;
  const renderOriginal = P.render;
  let dentro = false;
  const estereo = new THREE.StereoCamera();
  const _q0 = new THREE.Quaternion(), _qRel = new THREE.Quaternion(), _dir = new THREE.Vector3();
  const _vp = new THREE.Vector4(), _color = new THREE.Color();
  const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  let rtI = null, rtD = null, escenaPost = null, camPost = null, matPost = null;

  function crearRT(w, h, r) {
    const op = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, encoding: THREE.sRGBEncoding };
    const rt = (r.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget)
      ? new THREE.WebGLMultisampleRenderTarget(w, h, op)
      : new THREE.WebGLRenderTarget(w, h, op);
    rt.texture.encoding = THREE.sRGBEncoding;
    return rt;
  }

  function prepararPost(r, wOjo, hOjo) {
    if (!rtI || rtI.width !== wOjo || rtI.height !== hOjo) {
      if (rtI) { rtI.dispose(); rtD.dispose(); }
      rtI = crearRT(wOjo, hOjo, r); rtD = crearRT(wOjo, hOjo, r);
    }
    if (!escenaPost) {
      matPost = new THREE.ShaderMaterial({
        uniforms: {
          tI: { value: null }, tD: { value: null },
          k1: { value: 0 }, k2: { value: 0 }, esc: { value: 1 }, asp: { value: 1 }, desp: { value: 0 }
        },
        vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
        fragmentShader: [
          'varying vec2 vUv;',
          'uniform sampler2D tI,tD;uniform float k1,k2,esc,asp,desp;',
          'void main(){',
          '  bool izq=vUv.x<0.5;',
          '  vec2 e=vec2(izq?vUv.x*2.:(vUv.x-.5)*2.,vUv.y);',           // coordenadas dentro del ojo (0..1)
          '  vec2 c=vec2(.5+(izq?desp:-desp),.5);',                     // centro de la lente
          '  vec2 p=(e-c)*2.;p.x*=asp;',                                 // radio 1 = medio alto del ojo
          '  float r2=dot(p,p);',
          '  vec2 d=p*(1.+k1*r2+k2*r2*r2)*esc;',                         // distorsión de barril (compensa la lente)
          '  d.x/=asp;vec2 uv=d*.5+.5;',
          '  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(0.,0.,0.,1.);return;}',
          '  vec4 col=izq?texture2D(tI,uv):texture2D(tD,uv);',
          '  float borde=smoothstep(0.,.03,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));',
          '  gl_FragColor=vec4(col.rgb*borde,1.);',
          '}'
        ].join('\n'),
        depthTest: false, depthWrite: false, toneMapped: false
      });
      const malla = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matPost);
      malla.frustumCulled = false;
      escenaPost = new THREE.Scene();
      escenaPost.add(malla);
      camPost = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
  }

  function esPrincipal(r) {
    const c = r.domElement;
    return c && c.isConnected && c.clientWidth * c.clientHeight > 0.2 * innerWidth * innerHeight;
  }

  P.render = function (scene, camera) {
    const principal = !dentro && camera && camera.isPerspectiveCamera && this.getRenderTarget() === null && esPrincipal(this);
    if (principal) est.ultimo3D = performance.now();
    if (!principal || est.modo !== 'inmersivo' || !est.conectado) return renderOriginal.apply(this, arguments);
    dentro = true;
    try { renderEstereo(this, scene, camera); }
    catch (e) { console.error('[PuenteVR] error en el render estéreo; se desactiva el modo inmersivo', e); est.error = String(e.message || e); cambiarModo('apagado'); renderOriginal.call(this, scene, camera); }
    finally { dentro = false; }
  };

  function renderEstereo(r, scene, cam) {
    const dim = dimensiones(), wOjo = dim.w / 2, hOjo = dim.h;
    prepararPost(r, wOjo, hOjo);

    // 1) Guardar el estado de la cámara del juego
    _q0.copy(cam.quaternion);
    const fov0 = cam.fov, asp0 = cam.aspect, foco0 = cam.focus;

    // 2) Distancia de enfoque: intersección del eje de visión con el suelo (y = 0)
    cam.updateMatrixWorld(true);
    cam.getWorldDirection(_dir);
    const pos = cam.getWorldPosition(new THREE.Vector3());
    let foco = (_dir.y < -0.05 && pos.y > 0) ? pos.y / -_dir.y : 80;
    foco = Math.max(3, Math.min(1500, foco));

    // 3) Orientación de la cabeza relativa al punto de recentrado (solo giro horizontal de referencia)
    if (est.qCab) {
      if (!est.qRef) {
        _euler.setFromQuaternion(est.qCab, 'YXZ');
        est.qRef = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), _euler.y);
      }
      _qRel.copy(est.qRef).invert().multiply(est.qCab);
      // Se combinan por ángulos para mantener el horizonte nivelado:
      // giro horizontal = juego + cabeza; inclinación = juego·factor + cabeza; alabeo = cabeza.
      _euler.setFromQuaternion(cam.quaternion, 'YXZ');
      const gy = _euler.y, gx = _euler.x;
      _euler.setFromQuaternion(_qRel, 'YXZ');
      const lim = Math.PI / 2 - 0.01;
      const px = Math.max(-lim, Math.min(lim, gx * cfg.inclinacion + _euler.x));
      _euler.set(px, gy + _euler.y, _euler.z, 'YXZ');
      cam.quaternion.setFromEuler(_euler);
    }

    // 4) Cámaras estéreo
    cam.fov = cfg.fov; cam.aspect = wOjo / hOjo; cam.focus = foco;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    estereo.eyeSep = foco * cfg.sep;
    estereo.update(cam);

    r.setRenderTarget(rtI); renderOriginal.call(r, scene, estereo.cameraL);
    const sombras = r.shadowMap.autoUpdate;
    r.shadowMap.autoUpdate = false;                 // el mapa de sombras del ojo izquierdo sirve para el derecho
    r.setRenderTarget(rtD); renderOriginal.call(r, scene, estereo.cameraR);
    r.shadowMap.autoUpdate = sombras;
    r.setRenderTarget(null);

    // 5) Restaurar la cámara del juego (selección con el mouse, marcadores, etc. siguen funcionando)
    cam.quaternion.copy(_q0); cam.fov = fov0; cam.aspect = asp0; cam.focus = foco0;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);

    // 6) Composición con distorsión en el lienzo de la PC (rectángulo con el aspecto del celular)
    const k1 = cfg.distorsion ? cfg.k1 : 0, k2 = cfg.distorsion ? cfg.k2 : 0;
    const u = matPost.uniforms;
    u.tI.value = rtI.texture; u.tD.value = rtD.texture;
    u.k1.value = k1; u.k2.value = k2; u.esc.value = 1 / (1 + k1 + k2);
    u.asp.value = wOjo / hOjo; u.desp.value = desplazamientoLente();

    const lc = r.domElement, pr = r.getPixelRatio();
    const Wc = lc.width, Hc = lc.height, aspT = dim.w / dim.h;
    let w = Wc, h = Math.round(Wc / aspT);
    if (h > Hc) { h = Hc; w = Math.round(Hc * aspT); }
    const x = Math.floor((Wc - w) / 2), y = Math.floor((Hc - h) / 2);

    r.getViewport(_vp);
    r.getClearColor(_color); const alfa = r.getClearAlpha(), autoClear = r.autoClear;
    r.setClearColor(0x000000, 1); r.clear(true, true, true);
    r.autoClear = false;
    r.setViewport(x / pr, y / pr, w / pr, h / pr);
    renderOriginal.call(r, escenaPost, camPost);
    r.autoClear = autoClear; r.setClearColor(_color, alfa);
    r.setViewport(_vp.x, _vp.y, _vp.z, _vp.w);

    // 7) Captura inmediata (el búfer WebGL sigue válido dentro de esta misma tarea) y envío
    if (!est.enviando && performance.now() - est.ultimoEnvio >= 1000 / cfg.fpsMax - 2) {
      if (lienzo.width !== dim.w || lienzo.height !== dim.h) { lienzo.width = dim.w; lienzo.height = dim.h; }
      ctx2d.drawImage(lc, x, Hc - y - h, w, h, 0, 0, dim.w, dim.h);
      enviarLienzo(false);
    }
  }

  // Cuando el juego no está dibujando 3D (menús, cinemáticas), se envía un aviso al visor.
  setInterval(() => {
    if (est.modo !== 'inmersivo' || !est.conectado) return;
    if (performance.now() - est.ultimo3D < 800) return;
    pintarAviso(['Partida no visible en 3D', 'Menús: pulse F10 en la PC (modo cine)', 'o continúe la partida']);
    enviarLienzo(true);
  }, 500);

  function pintarAviso(lineas) {
    const dim = dimensiones();
    lienzo.width = dim.w; lienzo.height = dim.h;
    ctx2d.fillStyle = '#000'; ctx2d.fillRect(0, 0, dim.w, dim.h);
    const desp = desplazamientoLente();
    for (let o = 0; o < 2; o++) {
      const cx = (o === 0 ? (0.5 + desp) : (1.5 - desp)) * dim.w / 2;
      ctx2d.fillStyle = '#e8b04a'; ctx2d.textAlign = 'center';
      lineas.forEach((t, i) => {
        ctx2d.font = (i === 0 ? 'bold ' : '') + Math.round(dim.h * (i === 0 ? 0.05 : 0.035)) + 'px sans-serif';
        ctx2d.fillStyle = i === 0 ? '#e8b04a' : '#ddd';
        ctx2d.fillText(t, cx, dim.h * (0.45 + i * 0.08));
      });
    }
  }

  // ------------------------------------------------------------------ MODO CINE (captura de la pestaña)
  let cine = null; // { stream, video, timer }
  async function iniciarCine() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) throw new Error('El navegador no permite capturar la pantalla');
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: cfg.fpsMax }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include'
    });
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.srcObject = stream;
    await video.play();
    const pista = stream.getVideoTracks()[0];
    pista.addEventListener('ended', () => { if (est.modo === 'cine') cambiarModo('inmersivo'); });
    const timer = setInterval(() => {
      if (!est.conectado || !video.videoWidth || est.enviando) return;
      const dim = dimensiones();
      if (lienzo.width !== dim.w || lienzo.height !== dim.h) { lienzo.width = dim.w; lienzo.height = dim.h; }
      ctx2d.fillStyle = '#000'; ctx2d.fillRect(0, 0, dim.w, dim.h);
      const wOjo = dim.w / 2, desp = desplazamientoLente();
      const esc = Math.min(wOjo / video.videoWidth, dim.h / video.videoHeight) * cfg.cineEscala;
      const vw = video.videoWidth * esc, vh = video.videoHeight * esc;
      for (let o = 0; o < 2; o++) {
        const cx = (o === 0 ? (0.5 + desp) : (1.5 - desp)) * wOjo;
        ctx2d.drawImage(video, cx - vw / 2, (dim.h - vh) / 2, vw, vh);
      }
      enviarLienzo(true);
    }, 1000 / cfg.fpsMax);
    cine = { stream, video, timer };
  }
  function detenerCine() {
    if (!cine) return;
    clearInterval(cine.timer);
    cine.stream.getTracks().forEach((t) => t.stop());
    cine = null;
  }

  async function cambiarModo(m) {
    if (m === est.modo) return;
    if (est.modo === 'cine') detenerCine();
    est.modo = m;
    if (m === 'cine') {
      try { await iniciarCine(); }
      catch (e) { est.error = 'Modo cine cancelado: ' + (e.message || e); est.modo = 'inmersivo'; }
    }
    enviarEstado();
    refrescarPanel();
  }

  // ------------------------------------------------------------------ panel de control (F9)
  const raiz = document.createElement('div');
  raiz.id = 'puenteVR';
  raiz.innerHTML = `
<style>
#puenteVR{position:fixed;left:10px;bottom:10px;z-index:2147483647;font:12px/1.35 system-ui,sans-serif;color:#eee}
#puenteVR .ind{cursor:pointer;background:rgba(15,20,30,.85);border:1px solid #555;border-radius:14px;padding:4px 10px;display:inline-flex;gap:6px;align-items:center;user-select:none}
#puenteVR .pt{width:9px;height:9px;border-radius:50%;background:#c33}
#puenteVR .pt.ok{background:#3c6}
#puenteVR .pan{display:none;margin-bottom:6px;width:310px;background:rgba(15,20,30,.95);border:1px solid #666;border-radius:8px;padding:10px}
#puenteVR.abierto .pan{display:block}
#puenteVR h4{margin:0 0 6px;font-size:13px;color:#e8b04a}
#puenteVR .fila{display:flex;align-items:center;gap:6px;margin:4px 0}
#puenteVR .fila label{flex:0 0 118px}
#puenteVR .fila input[type=range]{flex:1}
#puenteVR .fila span{flex:0 0 42px;text-align:right}
#puenteVR button{background:#2a3446;color:#eee;border:1px solid #567;border-radius:4px;padding:3px 8px;cursor:pointer}
#puenteVR button.act{background:#b4472a;border-color:#e8b04a}
#puenteVR input[type=text]{flex:1;min-width:0;background:#111;color:#eee;border:1px solid #555;border-radius:3px;padding:2px 4px}
#puenteVR .err{color:#f88;margin-top:4px;word-break:break-word}
#puenteVR small{color:#aaa}
</style>
<div class="pan">
  <h4>Visor VR por USB</h4>
  <div class="est"></div>
  <div class="fila"><button data-m="inmersivo">Inmersivo 3D</button><button data-m="cine">Cine (menús)</button><button data-m="apagado">Apagado</button></div>
  <div class="fila"><label>Dirección</label><input type="text" data-k="url" placeholder="automática (ws://localhost:8080/ws)"><button data-acc="con">↻</button></div>
  <div class="deslizadores"></div>
  <div class="fila"><label>Distorsión de lente</label><input type="checkbox" data-k="distorsion"></div>
  <div class="fila"><button data-acc="rec">Recentrar (F8)</button><button data-acc="def">Valores por defecto</button></div>
  <small>F9 panel · F10 cambiar modo · en el celular: toque = recentrar</small>
  <div class="err"></div>
</div>
<div class="ind"><span class="pt"></span><b>VR</b><span class="txt">desconectado</span></div>`;
  const DESL = [
    ['sep', 'Profundidad 3D', 0, 0.08, 0.002],
    ['fov', 'Campo visual (°)', 50, 110, 1],
    ['inclinacion', 'Inclinación juego', 0, 1, 0.05],
    ['k1', 'Lente k1', 0, 0.6, 0.01],
    ['k2', 'Lente k2', 0, 0.6, 0.01],
    ['lentesMm', 'Sep. lentes (mm)', 50, 75, 0.5],
    ['calidad', 'Calidad JPEG', 0.3, 0.95, 0.05],
    ['fpsMax', 'Cuadros/s', 10, 60, 1],
    ['anchoMax', 'Resolución (px)', 960, 2560, 64],
    ['cineEscala', 'Tamaño cine', 0.5, 1, 0.01]
  ];
  const cont = raiz.querySelector('.deslizadores');
  DESL.forEach(([k, et, min, max, paso]) => {
    const f = document.createElement('div'); f.className = 'fila';
    f.innerHTML = `<label>${et}</label><input type="range" min="${min}" max="${max}" step="${paso}" data-k="${k}"><span></span>`;
    cont.appendChild(f);
  });
  function sincronizarControles() {
    raiz.querySelectorAll('input[type=range]').forEach((i) => { i.value = cfg[i.dataset.k]; i.nextElementSibling.textContent = (+cfg[i.dataset.k]).toFixed(i.step < 1 ? (i.step < 0.01 ? 3 : 2) : 0); });
    raiz.querySelector('input[data-k=url]').value = cfg.url;
    raiz.querySelector('input[data-k=distorsion]').checked = !!cfg.distorsion;
  }
  raiz.addEventListener('input', (e) => {
    const k = e.target.dataset.k; if (!k) return;
    if (e.target.type === 'range') { cfg[k] = parseFloat(e.target.value); e.target.nextElementSibling.textContent = e.target.value; }
    else if (e.target.type === 'checkbox') cfg[k] = e.target.checked;
    else if (e.target.type === 'text') cfg[k] = e.target.value.trim();
    guardar();
  });
  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('button,.ind'); if (!b) return;
    if (b.classList.contains('ind')) { raiz.classList.toggle('abierto'); return; }
    if (b.dataset.m) cambiarModo(b.dataset.m);
    if (b.dataset.acc === 'con') conectar();
    if (b.dataset.acc === 'rec') est.qRef = null;
    if (b.dataset.acc === 'def') { cfg = Object.assign({}, DEF); guardar(); sincronizarControles(); conectar(); }
  });
  // Las teclas escritas en el panel no deben llegar al juego.
  ['keydown', 'keyup', 'keypress'].forEach((t) => raiz.addEventListener(t, (e) => { if (e.key !== 'F9' && e.key !== 'F10') e.stopPropagation(); }));

  function refrescarIndicador() {
    const pt = raiz.querySelector('.pt'), tx = raiz.querySelector('.txt');
    pt.classList.toggle('ok', est.conectado);
    tx.textContent = est.conectado
      ? `${est.modo} · ${est.fps.toFixed(0)} c/s · ${(est.kbps / 1024).toFixed(1)} MB/s`
      : 'desconectado';
  }
  function refrescarPanel() {
    raiz.querySelectorAll('button[data-m]').forEach((b) => b.classList.toggle('act', b.dataset.m === est.modo));
    const d = dimensiones();
    raiz.querySelector('.est').innerHTML = est.conectado
      ? `Celular: <b>${est.tel.modelo || 'conectado'}</b><br>Pantalla ${est.tel.w}×${est.tel.h} → cuadro ${d.w}×${d.h}` + (est.tel.giroscopio ? '' : '<br>⚠ sin sensor de rotación')
      : `Buscando el celular en <b>${urlAuto()}</b>…`;
    raiz.querySelector('.err').textContent = est.conectado ? '' : est.error;
    refrescarIndicador();
  }

  addEventListener('keydown', (e) => {
    if (e.key === 'F9') { e.preventDefault(); e.stopPropagation(); raiz.classList.toggle('abierto'); }
    else if (e.key === 'F10') {
      e.preventDefault(); e.stopPropagation();
      const orden = ['inmersivo', 'cine', 'apagado'];
      cambiarModo(orden[(orden.indexOf(est.modo) + 1) % orden.length]);
    } else if (e.key === 'F8') { e.preventDefault(); e.stopPropagation(); est.qRef = null; }
  }, true);

  function montar() { document.body.appendChild(raiz); sincronizarControles(); refrescarPanel(); conectar(); }
  if (document.body) montar(); else addEventListener('DOMContentLoaded', montar);

  window.PuenteVR = { estado: est, config: cfg, cambiarModo, conectar, recentrar: () => { est.qRef = null; } };
})();
