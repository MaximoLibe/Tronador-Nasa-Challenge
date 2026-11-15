# Misión Hábitat Marte

Simulador 3D de gestión de un hábitat en Marte para chicos de 7 a 12 años, hecho por el equipo **Tronador** para el desafío [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) del NASA Space Apps Challenge 2026.

El jugador construye una base con cúpulas **semiesféricas** y **semicilíndricas** acopladas entre sí, y tiene que equilibrar energía, oxígeno, agua, alimentos, cordura y protección contra la radiación. Ninguna decisión es gratis: cada máquina consume energía y la energía no alcanza para todo.

## Cómo jugar

Abrí `index.html` en el navegador (no hace falta instalar nada: todo, incluido el modo Explorar, las imágenes y los modelos 3D, va dentro de ese único archivo). También funciona desde GitHub Pages. Necesita internet para el motor 3D y los mapas de NASA Mars Trek.

Al abrirlo aparece 3 segundos la insignia de la misión **TRONADOR** y después el menú, que sigue el diagrama `Estructura de juego.drawio`. Todo el programa usa Helvética Bold y sonidos robóticos y espaciales generados por el navegador.

- **Jugar**
  - **Supervivencia:** en «Elige tu misión» elegís **Cadete** o **Comandante** (cambian los recursos iniciales, la frecuencia de climas extremos y los castigos) y después **Iniciar** (con las misiones del perro) o **Modo libre** (sin misiones guiadas). Tras confirmar, escribís tu nombre (con el teclado o con el teclado virtual del control): el perro asistente te llama por tu nombre. Después hay un descenso orbital sobre Arcadia Planitia con la cartografía real de Mars Trek, inspirado en la carga de mapas de Star Wars Battlefront, y un timelapse de 10 segundos en el que se arma la base.
  - **Explorar:** un globo 3D de Marte con el mosaico real de NASA Mars Trek gira hasta cada uno de los 5 destinos (Monte Olimpo, Cráter Korolev, Cráter Jezero, Monte Sharp y Valles Marineris). Al tocar **Iniciar misión** se reproduce el mismo descenso orbital y después el aterrizaje del rover. En cada lugar hay una **pelota de fútbol medio enterrada** para encontrar.
- **Cargar partida:** 3 ranuras guardadas en el navegador.
- **Opciones:** Juego (idioma y guía al empezar), Video (calidad y sensibilidad de cámara), Audio (música y efectos) y Controles (reasignar teclas y botones). Es la misma pantalla desde el menú y desde la pausa; se vuelve con `Esc` o `B`.
- **Créditos** y **Salir del juego**.

Se juega con teclado y mouse o con un **control de Xbox 360 por USB**: el juego lo detecta solo al apretar cualquier botón. Con el control aparece una mira en el centro de la pantalla para apuntar. Teclas y botones por defecto:

| Acción | Teclado y mouse | Control Xbox 360 |
|---|---|---|
| Mover la cámara | `W` `A` `S` `D` o flechas, o arrastrar | Stick izquierdo |
| Girar / inclinar la cámara | `Q` `R`, o clic derecho + arrastrar | Stick derecho |
| Zoom | Rueda del mouse o `Z` `X` | `RT` acercar · `LT` alejar |
| Construir / seleccionar | Clic izquierdo | `A` |
| Cancelar / volver | `Esc` o clic derecho | `B` |
| Rotar el objeto | `E` | `X` |
| Modo construcción (casco) | `B` | `R3` |
| Bienestar del astronauta (corazón) | `H` | Cruceta ← |
| Categorías de construcción | `1` a `8` | `LB` `RB` |
| Recorrer el panel derecho | Clic | Cruceta ↑ ↓ |
| Radar de hielo · Desarmar | `9` · `0` | Cruceta → · `Y` |
| Mostrar la misión · Mapa de Arcadia | `O` · `M` | `Back` · `L3` |
| Menú de pausa | `P` o `Esc` | `Start` |

Un sol (día marciano) dura 10 minutos de juego a velocidad ×1. Al terminar la carga de cada misión aparece una guía con los controles (teclado o control) y en el HUD hay íconos con la tecla o el botón de cada acción.

**Construcción:** el panel de construcción sale desde la izquierda y la pestaña blanca **MODO CONSTRUCCIÓN** baja del recuadro de arriba a la derecha. Cada orden de construcción la cumplen tres robots humanoides que la arman en 5 segundos. Nuevos: **Hábitat de investigación** (escritorios, sillas ergonómicas, luminarias y computadoras), **tanques enormes de metano** (reemplazan a las baterías: guardan la energía que sobra como metano) y **5 tanques de gases** de 0,6 × 1,90 m (O₂, N₂, CH₄, CO₂ y CO). El Módulo de Control ya no tiene camas (la base arranca con un dormitorio). Cada módulo tiene una cámara de vigilancia afuera y, a la misma altura adentro, una pantalla que muestra el exterior en tiempo real. El reactor KRUSTY, el taladro de hielo (barrena con trípode), los muebles y las cámaras son los modelos 3D del equipo.

## Interfaz y mecánicas

- **Arriba a la izquierda:** 9 indicadores circulares en vivo: Agua, Oxígeno, Alimentos, Energía, Protección, Cordura, Salud, Gastos y **Bienestar del astronauta**.
- **Arriba a la derecha:** sol y hora, temperatura, clima, velocidad del tiempo y Objetivos.
- **Abajo a la izquierda:** el **corazón** abre el bienestar y el **casco** activa el **modo construcción** (barra de categorías, letrero naranja y cuadrícula negra). Cada categoría se despliega en un panel vertical en la pared derecha, en una sola columna, con Semiesfera 2×2 y Semicilindro 3×2 como opciones propias.
- **Bienestar:** 5 pilares (ejercicio con ARED, T2 y CEVIS; nutrición e hidratación; monitoreo médico y del SANS; sueño y ritmo circadiano; apoyo psicológico). Cada uno necesita instalaciones y gasta recursos; si se descuidan bajan la salud y la cordura.
- **Clima:** Templado, Ventisca (paneles al 20 %, más calefacción, nadie sale) y Tornado (puede dañar estructuras exteriores si no se activan los anclajes; después deja los paneles limpios).
- **Misiones:** el perro astronauta aparece con cada misión con el formato «(Categoría) Objetivo / Descripción / Recompensa».
- **Construcciones:** al seleccionarlas se dibuja un contorno del color de su sector. Al acercar la cámara las cúpulas se vuelven transparentes y muestran su interior; la granja hidropónica es un sistema acuapónico con pecera, peces, bombas y bandejas escalonadas de cultivo.
- **Pausa (`P`):** desenfoca el fondo; Continuar, Guardar partida (3 ranuras), Opciones y Salir con confirmación.

## Ubicación de la base: Arcadia Planitia

La base está en el sector centro-oriental de **Arcadia Planitia**, en **40,0° N · 190,0° E** (170,0° O): una llanura baja del hemisferio norte con hielo de agua a poca profundidad. El sitio de impacto con hielo confirmado más cercano (Dundas et al., 2014) está a unos 54 km, en 39,1° N · 190,2° E.

El **Mapa de Arcadia** (tecla `M` o `L3` en el control) muestra mapas reales de [NASA Mars Trek](https://trek.nasa.gov/mars/) sin bibliotecas externas:

| Capa | Fuente | Para qué sirve |
|---|---|---|
| Color | Viking MDIM 2.1 (232 m/px) | Ver el terreno como desde órbita |
| Relieve | MOLA + HRSC (200 m/px) | Entender alturas: Arcadia es baja |
| Infrarrojo | THEMIS día (100 m/px) | Distinguir roca de polvo |
| Geología | USGS SIM 3292 | Tipos y edades de terreno |
| Inercia térmica | MGS TES | Roca, suelo compacto o hielo vs. polvo suelto |

Encima se dibujan la base, los **sitios de impacto con hielo expuesto** y los **cráteres nuevos** de la zona (consultados en vivo al servicio ArcGIS de Mars Trek, con una lista guardada de respaldo) y los destinos del Modo Expedición. Necesita internet: los mapas no cargan dentro del artifact de Claude, sí en GitHub Pages o abriendo el archivo.

## Mecánicas

- **Construcción en grilla:** cada cúpula nueva tiene que quedar acoplada a otra. Las estructuras exteriores necesitan una esclusa.
- **Energía:** paneles solares (sólo de día), reactor KRUSTY y baterías. Si falta energía, se apagan máquinas por prioridad.
- **Oxígeno:** MOXIE + electrólisis, que además fabrica metano.
- **Agua:** hielo bajo la superficie (radar), taladros y planta de agua.
- **Alimentos:** granja hidropónica con tilapias y microalgas, cocina y suplementos que llegan de la Tierra.
- **Protección:** blindaje de regolito y refugio durante tormentas solares.
- **Comunicaciones:** retraso de 4 a 24 minutos con la Tierra. Sin antena no llegan cohetes ni avisos de tormenta.
- **Cordura y salud** de la tripulación.

## Modo Explorar (rover + dron)

Está dentro de `index.html` (`expedicion.html` sólo redirige ahí). Un rover tipo Perseverance explora Monte Olimpo, el Cráter Korolev, el cráter Jezero, Monte Sharp y Valles Marineris. Se juega con teclado o con el control de Xbox 360 (stick izquierdo o `RT`/`LT` para manejar, `A` analizar, `X` cámara, `Y` Ingenuity, `Start` pausa). Lleva al helicóptero **Ingenuity** guardado bajo la panza: se puede desplegar para ver cada lugar desde el aire y sacar fotos aéreas de los objetivos.

| Acción | Rover | Ingenuity |
|---|---|---|
| Moverse | `W` `S` avanzar / retroceder · `A` `D` girar | `W` `S` adelante / atrás · `A` `D` girar |
| Subir / bajar | — | `R` o `Espacio` subir · `F` o `Shift` bajar y aterrizar |
| Acción | `E` analizar con un instrumento | `E` foto aérea con la cámara RTE (a más de 4 m) |
| Cámara | `C` seguimiento / Navcam | `C` seguimiento / NAV (abajo, B/N) / RTE (color) |
| Ingenuity | `I` desplegar · `V` pasar al helicóptero | `V` volver al rover (sólo en el suelo) |

**Relieve real:** el terreno de cada lugar sale de modelos de elevación medidos desde órbita, no de fórmulas inventadas: Jezero con el modelo CTX de 20 m de NASA Mars Trek (centrado en el aterrizaje de Perseverance), Monte Sharp con el modelo HiRISE de 1 m del borde del montículo de Gale Monte Olimpo y el Cráter Korolev con el altímetro láser MOLA de Mars Global Surveyor (463 m, el modelo global que muestra Mars Trek) y Valles Marineris con el modelo CTX de 24 m de Coprates Chasma, sobre el borde de la pared sur (13,76° S · 66,54° O), con más de 3 km de caída real hacia el cañón. Se ve hasta 12 km alrededor (180 km en Valles Marineris, Monte Olimpo y Korolev). Encima sólo se agrega rugosidad de centímetros. Los scripts que prepararon los datos están en `herramientas/terreno-real/`.

Límites tomados del Ingenuity real: altitud máxima de 24 m (su récord), 10 m/s, unos 170 s por vuelo, rotores a 2.537 rpm y radio de 1 km con el rover. Necesita terreno plano para aterrizar. La carga solar está acelerada. Ingenuity sólo voló en Jezero (72 vuelos, 2021–2024); en los otros lugares el vuelo es una simulación. Fuentes: Wikipedia, artículos *Ingenuity (helicopter)* y *Perseverance (rover)*.

## Datos usados

- **Datos del proyecto (PDF del equipo):** consumos y producción de cada módulo, fórmulas de calefacción e iluminación, estequiometría de la electrólisis y de la hidrogenación de CO, dieta y áreas de cultivo.
- **NASA DONKI:** fechas reales de eventos de partículas solares (SEP) de 2024–2025 usadas en los avisos de tormenta solar. Son datos archivados, no en vivo.
- **Curiosity RAD:** dosis en superficie de ~0,67 mSv por sol.
- Fuentes completas dentro del juego, en la sección **Aprende**.

Valores agregados para el juego (no salen del PDF): 0,84 kg de O₂ y 4 L netos de agua por astronauta por sol, costos de construcción, producción del taladro y la intensidad de las tormentas solares (exagerada para que se note su efecto).
