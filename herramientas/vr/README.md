# ARCADIA VR mode with a phone over USB

> The in-game VR mode is currently disabled and shown as «Coming soon». These instructions are kept for when it returns.

VR mode splits the screen into two images (one per eye) so the phone can be used inside a Cardboard-style viewer. The phone's gyroscope moves the first-person view; keeping a finger on the screen makes your cadet walk where you are looking.

## What you need

- An **Android** phone with Chrome and a USB cable.
- On the computer: [Node.js](https://nodejs.org) and the Android tools (**adb**, included in «Android SDK Platform-Tools»).
- A Cardboard-style viewer (optional: without one the screen still looks split in two).

## Steps

1. On the phone, turn on **Developer options** (Settings › About phone › tap «Build number» 7 times) and, inside them, **USB debugging**.
2. Connect the phone to the computer with the cable and accept the «Allow USB debugging?» prompt.
3. On the computer, open a terminal in the project folder and start the server:
   ```
   node herramientas/vr/servidor.js
   ```
4. In another terminal, forward the phone's port to the computer over the cable:
   ```
   adb reverse tcp:8766 tcp:8766
   ```
5. In Chrome on the phone, open **http://localhost:8766**. Because the address is `localhost`, the browser allows the gyroscope.
6. Start a game, open **Pause** and choose **VR mode (phone)**. Turn the phone to landscape and put it in the viewer.
7. To leave, tap **Exit VR mode** at the top or go back to the pause menu.

## Common problems

- **It does not follow your head:** check that the address is `localhost` (with the network IP, Chrome blocks the gyroscope because the connection is not secure).
- **iPhone:** iOS does not support `adb reverse`. You can use Safari with the computer and the iPhone on the same network, but the gyroscope only works over HTTPS; you need an HTTPS tunnel (for example `npx localtunnel --port 8766`) and must accept the motion permission Safari asks for.
- **`adb` does not see the phone:** switch the phone's USB mode to «File transfer» and try `adb devices` again.
