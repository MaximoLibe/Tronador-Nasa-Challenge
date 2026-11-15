# Terreno real del Modo Expedición

Scripts de Node.js que prepararon las grillas de elevación embebidas en `expedicion.html` (bloque `<script id="terreno-real">`).

| Lugar | Modelo de elevación | Fuente | Centro |
|---|---|---|---|
| Cráter Jezero | CTX DEM 20 m/píxel (`JEZ_ctx_B_soc_008_DTM_…_20m`) | NASA Mars Trek | 18,4447° N · 77,4508° E (aterrizaje de Perseverance) |
| Monte Sharp | HiRISE DTM 1 m/píxel (`DTEEC_001488_1750_001752_1750_U02`) | HiRISE PDS, Univ. of Arizona | 4,7803° S · 137,2833° E (borde del montículo de Gale) |
| Coprates Chasma | CTX DEM 24 m/píxel (`CTX_DEM_13S293E_24mp_…`) | NASA Mars Trek | 13,36° S · 66,55° O (pie de la pared sur) |

Pasos (los archivos se descargan en esta misma carpeta):

1. `curl -o jezero_ctx.tif "https://trek.nasa.gov/mars/TrekWS/rest/cat/data/stream?label=JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0"`
2. `curl -o coprates.tif "https://trek.nasa.gov/mars/TrekWS/rest/cat/data/stream?label=CTX_DEM_13S293E_24mp_G07_020879_1669_G09_021657_1665"`
3. `node gale.js recorte 2017 2600` (baja sólo las filas necesarias del DTM HiRISE, unos 80 MB)
4. `node armar.js` → `terreno_real.json`
5. `node integrar.js ../../expedicion.html` (sólo sobre la versión anterior a la integración)

`coprates.js vista` y `gale.js perfil` sirven para mirar los modelos y elegir otra zona. Cada grilla cubre 12 km, 3 km y (en Gale) 640 m; el juego usa la más detallada que cubra cada punto y suma sólo unos centímetros de rugosidad.
