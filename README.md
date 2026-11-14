# Misión Hábitat Marte

Simulador 3D de gestión de un hábitat en Marte para chicos de 7 a 12 años, hecho por el equipo **Tronador** para el desafío [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) del NASA Space Apps Challenge 2026.

El jugador construye una base con cúpulas **semiesféricas** y **semicilíndricas** acopladas entre sí, y tiene que equilibrar energía, oxígeno, agua, alimentos, cordura y protección contra la radiación. Ninguna decisión es gratis: cada máquina consume energía y la energía no alcanza para todo.

## Cómo jugar

Abrí `index.html` en el navegador (no hace falta instalar nada). También funciona desde GitHub Pages. Arranca en el **menú de inicio** (Jugar, Modo Expedición, Aprende, Opciones, Salir); el juego se construye recién al elegir **Jugar**.

Se juega con teclado y mouse o con un **control de Xbox 360 por USB**: el juego lo detecta solo al apretar cualquier botón, sin configurar nada. Con el control aparece una mira en el centro de la pantalla para apuntar.

| Acción | Teclado y mouse | Control Xbox 360 |
|---|---|---|
| Mover la cámara | `W` `A` `S` `D` o flechas, o arrastrar | Stick izquierdo |
| Girar / inclinar la cámara | `Q` `E`, o clic derecho + arrastrar | Stick derecho |
| Zoom | Rueda del mouse o `Z` `X` | `RT` acercar · `LT` alejar |
| Construir / seleccionar | Clic izquierdo | `A` |
| Cancelar / volver | `Esc` o clic derecho | `B` |
| Rotar la pieza | `R` | `X` |
| Modo desarmar | `0` | `Y` |
| Categorías del dock | `1` a `8` · `9` radar | `LB` `RB` |
| Elegir construcción | Clic en la tarjeta | Cruceta ← → |
| Semiesfera / semicilindro | Botones de la bandeja | Cruceta ↑ ↓ |
| Radar de hielo | `9` | `R3` (apretar el stick derecho) |
| Mostrar la misión | `O` | `Back` |
| Pausa | `Espacio` | `Start` |

Un sol (día marciano) dura 10 minutos de juego a velocidad ×1.

## Interfaz

- **Barra superior:** 8 indicadores circulares en vivo (Agua, Oxígeno, Alimentos, Energía, Protección, Cordura, Salud, Gastos) y, a la derecha, reloj, clima, velocidad del tiempo y Objetivos.
- **Dock inferior:** Hábitat, Energía, Oxígeno, Agua, Alimentos, Salud, Protección y Comunicaciones; separados, Radar y Desarmar.
- **Misiones:** un perro astronauta aparece arriba a la derecha con cada misión nueva y se va al cumplirla o al cerrarlo.

## Mecánicas

- **Construcción en grilla:** cada cúpula nueva tiene que quedar acoplada a otra. Las estructuras exteriores necesitan una esclusa.
- **Energía:** paneles solares (sólo de día), reactor KRUSTY y baterías. Si falta energía, se apagan máquinas por prioridad.
- **Oxígeno:** MOXIE + electrólisis, que además fabrica metano.
- **Agua:** hielo bajo la superficie (radar), taladros y planta de agua.
- **Alimentos:** granja hidropónica con tilapias y microalgas, cocina y suplementos que llegan de la Tierra.
- **Protección:** blindaje de regolito y refugio durante tormentas solares.
- **Comunicaciones:** retraso de 4 a 24 minutos con la Tierra. Sin antena no llegan cohetes ni avisos de tormenta.
- **Cordura y salud** de la tripulación.

## Modo Expedición (`expedicion.html`)

Un rover tipo Perseverance explora el cráter Jezero, Monte Sharp y Valles Marineris. Lleva al helicóptero **Ingenuity** guardado bajo la panza: se puede desplegar para ver cada lugar desde el aire y sacar fotos aéreas de los objetivos.

| Acción | Rover | Ingenuity |
|---|---|---|
| Moverse | `W` `S` avanzar / retroceder · `A` `D` girar | `W` `S` adelante / atrás · `A` `D` girar |
| Subir / bajar | — | `R` o `Espacio` subir · `F` o `Shift` bajar y aterrizar |
| Acción | `E` analizar con un instrumento | `E` foto aérea con la cámara RTE (a más de 4 m) |
| Cámara | `C` seguimiento / Navcam | `C` seguimiento / NAV (abajo, B/N) / RTE (color) |
| Ingenuity | `I` desplegar · `V` pasar al helicóptero | `V` volver al rover (sólo en el suelo) |

Límites tomados del Ingenuity real: altitud máxima de 24 m (su récord), 10 m/s, unos 170 s por vuelo, rotores a 2.537 rpm y radio de 1 km con el rover. Necesita terreno plano para aterrizar. La carga solar está acelerada. Ingenuity sólo voló en Jezero (72 vuelos, 2021–2024); en los otros lugares el vuelo es una simulación. Fuentes: Wikipedia, artículos *Ingenuity (helicopter)* y *Perseverance (rover)*.

## Datos usados

- **Datos del proyecto (PDF del equipo):** consumos y producción de cada módulo, fórmulas de calefacción e iluminación, estequiometría de la electrólisis y de la hidrogenación de CO, dieta y áreas de cultivo.
- **NASA DONKI:** fechas reales de eventos de partículas solares (SEP) de 2024–2025 usadas en los avisos de tormenta solar. Son datos archivados, no en vivo.
- **Curiosity RAD:** dosis en superficie de ~0,67 mSv por sol.
- Fuentes completas dentro del juego, en la sección **Aprende**.

Valores agregados para el juego (no salen del PDF): 0,84 kg de O₂ y 4 L netos de agua por astronauta por sol, costos de construcción, producción del taladro y la intensidad de las tormentas solares (exagerada para que se note su efecto).
