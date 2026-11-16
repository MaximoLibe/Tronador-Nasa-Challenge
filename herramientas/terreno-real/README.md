# Real terrain for Explore mode

Node.js scripts that prepared the elevation grids embedded in the Explore mode of `index.html` (the `<script id="terreno-real">` block).

| Place | Elevation model | Source | Centre |
|---|---|---|---|
| Jezero Crater | CTX DEM 20 m/pixel (`JEZ_ctx_B_soc_008_DTM_…_20m`) | NASA Mars Trek | 18.4447° N · 77.4508° E (Perseverance landing site) |
| Mount Sharp | HiRISE DTM 1 m/pixel (`DTEEC_001488_1750_001752_1750_U02`) | HiRISE PDS, Univ. of Arizona | 4.7803° S · 137.2833° E (edge of Gale's mound) |
| Olympus Mons | MOLA MEGDR 128 pixels/degree (463 m), `megt44n180hb.img` | NASA PDS Geosciences (`node mola.js`) | 18.65° N · 133.8° W (west rim of the caldera) |
| Korolev Crater | MOLA MEGDR 128 pixels/degree, `megt88n090hb.img` | NASA PDS Geosciences (`node mola.js`) | 73.0° N · 165.0° E (ice dome) |
| Coprates Chasma | CTX DEM 24 m/pixel (`CTX_DEM_13S293E_24mp_…`) | NASA Mars Trek | 13.7616° S · 66.5446° W (edge of the south wall, on the plateau) |

Steps (files are downloaded into this same folder):

1. `curl -o jezero_ctx.tif "https://trek.nasa.gov/mars/TrekWS/rest/cat/data/stream?label=JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0"`
2. `curl -o coprates.tif "https://trek.nasa.gov/mars/TrekWS/rest/cat/data/stream?label=CTX_DEM_13S293E_24mp_G07_020879_1669_G09_021657_1665"`
3. `node gale.js recorte 2017 2600` (downloads only the rows needed from the HiRISE DTM, about 80 MB)
4. `node armar.js` → `terreno_real.json`
5. `node integrar.js ../../expedicion.html` (only on the version before the integration)

`node mola.js armar` downloads by ranges only the MOLA rows needed (about 19 MB, stored in `mola_cache/`) and writes `mola.json`; `node mola.js vista olimpo` shows an ASCII map. `coprates.js vista` and `gale.js perfil` help inspect the models and pick another area. Each grid covers 12 km, 3 km and (in Gale) 640 m; the game uses the most detailed one covering each point and only adds a few centimetres of roughness.
