# Modo VR de ARCADIA con un celular por USB

El modo VR divide la pantalla en dos imágenes (una por ojo) para usar el celular dentro de un visor tipo Cardboard. El giroscopio del celular mueve la mirada en primera persona; manteniendo el dedo en la pantalla, tu cadete camina hacia donde mirás.

## Lo que hace falta

- Un celular **Android** con Chrome y un cable USB.
- En la computadora: [Node.js](https://nodejs.org) y las herramientas de Android (**adb**, vienen en «Android SDK Platform-Tools»).
- Un visor tipo Cardboard (opcional: sin visor se ve igual, dividido en dos).

## Pasos

1. En el celular, activá las **Opciones de desarrollador** (Ajustes › Acerca del teléfono › tocá 7 veces «Número de compilación») y dentro de ellas la **Depuración por USB**.
2. Conectá el celular a la computadora con el cable y aceptá el aviso «¿Permitir la depuración por USB?».
3. En la computadora, abrí una terminal en la carpeta del proyecto y arrancá el servidor:
   ```
   node herramientas/vr/servidor.js
   ```
4. En otra terminal, redirigí el puerto del celular a la computadora por el cable:
   ```
   adb reverse tcp:8766 tcp:8766
   ```
5. En el Chrome del celular abrí **http://localhost:8766**. Como la dirección es `localhost`, el navegador deja usar el giroscopio.
6. Empezá una partida, abrí la **Pausa** y elegí **Modo VR (celular)**. Girá el celular a horizontal y ponelo en el visor.
7. Para salir, tocá **Salir del modo VR** arriba o volvé a la pausa.

## Problemas comunes

- **No se mueve con la cabeza:** revisá que la dirección sea `localhost` (con la IP de la red, Chrome bloquea el giroscopio porque no es una conexión segura).
- **iPhone:** iOS no permite `adb reverse`. Se puede usar Safari con la computadora y el iPhone en la misma red, pero el giroscopio sólo funciona con HTTPS; hace falta un túnel HTTPS (por ejemplo `npx localtunnel --port 8766`) y aceptar el permiso de movimiento que pide Safari.
- **`adb` no reconoce el celular:** cambiá el modo USB del celular a «Transferencia de archivos» y volvé a probar `adb devices`.
