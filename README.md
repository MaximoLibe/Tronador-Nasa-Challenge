# Misión Hábitat Marte

Simulador 3D de gestión de un hábitat en Marte para chicos de 7 a 12 años, hecho por el equipo **Tronador** para el desafío [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) del NASA Space Apps Challenge 2026.

El jugador construye una base con cúpulas **semiesféricas** y **semicilíndricas** acopladas entre sí, y tiene que equilibrar energía, oxígeno, agua, alimentos, cordura y protección contra la radiación. Ninguna decisión es gratis: cada máquina consume energía y la energía no alcanza para todo.

## Cómo jugar

Abrí `index.html` en el navegador (no hace falta instalar nada). También funciona desde GitHub Pages.

| Acción | Control |
|---|---|
| Mover la cámara | `W` `A` `S` `D` o flechas, o arrastrar con el mouse |
| Girar la cámara | `Q` `E`, o clic derecho + arrastrar |
| Zoom | Rueda del mouse o `Z` `X` |
| Rotar la pieza | `R` |
| Categorías de construcción | `1` a `8` |
| Cancelar | `Esc` o clic derecho |
| Pausa | `Espacio` |

Un sol (día marciano) dura 10 minutos de juego a velocidad ×1.

## Mecánicas

- **Construcción en grilla:** cada cúpula nueva tiene que quedar acoplada a otra. Las estructuras exteriores necesitan una esclusa.
- **Energía:** paneles solares (sólo de día), reactor KRUSTY y baterías. Si falta energía, se apagan máquinas por prioridad.
- **Oxígeno:** MOXIE + electrólisis, que además fabrica metano.
- **Agua:** hielo bajo la superficie (radar), taladros y planta de agua.
- **Alimentos:** granja hidropónica con tilapias y microalgas, cocina y suplementos que llegan de la Tierra.
- **Protección:** blindaje de regolito y refugio durante tormentas solares.
- **Comunicaciones:** retraso de 4 a 24 minutos con la Tierra. Sin antena no llegan cohetes ni avisos de tormenta.
- **Cordura y salud** de la tripulación.

## Datos usados

- **Datos del proyecto (PDF del equipo):** consumos y producción de cada módulo, fórmulas de calefacción e iluminación, estequiometría de la electrólisis y de la hidrogenación de CO, dieta y áreas de cultivo.
- **NASA DONKI:** fechas reales de eventos de partículas solares (SEP) de 2024–2025 usadas en los avisos de tormenta solar. Son datos archivados, no en vivo.
- **Curiosity RAD:** dosis en superficie de ~0,67 mSv por sol.
- Fuentes completas dentro del juego, en la sección **Aprende**.

Valores agregados para el juego (no salen del PDF): 0,84 kg de O₂ y 4 L netos de agua por astronauta por sol, costos de construcción, producción del taladro y la intensidad de las tormentas solares (exagerada para que se note su efecto).
