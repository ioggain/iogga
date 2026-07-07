# IOGGA

Marketplace que conecta **planes personales** con **promociones comerciales** en tiempo real.
App web instalable (PWA) hecha con React + Vite + Tailwind, con Firebase como motor
(login con correo, base de datos y canjes con código QR).

## Qué ya funciona

- ✅ **Login con correo y contraseña** (Firebase Authentication). La sesión se recuerda.
- ✅ **Registro de usuarios** guardado en la base de datos (Firestore, colección `users`).
- ✅ **QRs de canje únicos**: el cliente genera su QR en una promoción; el negocio lo
  valida con la cámara o escribiendo el código de 6 letras. Cada código sirve **una sola vez**.
- ✅ **Instalable en celulares** como app (PWA): ícono, pantalla completa y funciona sin conexión básica.
- ✅ **Modo demo**: si no configuras Firebase, todo sigue funcionando de forma local para probar.

## Cómo correr la app

```bash
npm install
npm run dev      # abre http://localhost:3000
npm run build    # genera la versión final en /dist
```

## Conectar Firebase (paso a paso, ~10 minutos)

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google
   y crea un proyecto (ej. `iogga`). No necesitas activar Analytics.
2. En el menú **Compilación → Authentication → Comenzar → Correo electrónico/contraseña → Habilitar**.
3. En **Compilación → Firestore Database → Crear base de datos** (modo producción, ubicación cercana).
4. En **Firestore → Reglas**, pega el contenido del archivo [`firestore.rules`](firestore.rules) y publica.
5. En **Configuración del proyecto (engrane) → Tus apps → ícono web `</>`** registra una app web
   y copia los valores de configuración (`apiKey`, `authDomain`, etc.).
6. En este proyecto, copia `.env.example` como `.env` y pega esos valores en las variables
   `VITE_FIREBASE_*`.
7. Listo: la app deja el modo demo y usa usuarios y canjes reales.

## Publicar en internet (Firebase Hosting)

```bash
npm run build
npx firebase-tools login
npx firebase-tools init hosting   # carpeta pública: dist, single-page app: sí
npx firebase-tools deploy
```

Comparte el link resultante: la gente puede **instalar la app** desde el navegador
(menú → "Agregar a pantalla de inicio").

## Próximos pasos planeados

- 💬 Chat real entre usuarios registrados (Firestore).
- 🔔 Notificaciones push (Firebase Cloud Messaging).
- 📊 Estadísticas reales de canjes para negocios.

---

Proyecto original creado en [Google AI Studio](https://ai.studio/apps/893bc7fe-f04d-4c8a-aaf1-26c8a067b087).
