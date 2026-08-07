# iogga — Reglas del proyecto

iogga (siempre en minúsculas) es una PWA marketplace que conecta planes personales
con promociones de negocios en Chihuahua, México. Filosofía: "la app para salir
del móvil y entrar en la vida". Sin chats: solo acción. El fundador no es técnico.

## RESTRICCIÓN MAESTRA DE DISEÑO (obligatoria en TODA la app)

**NO INVENTAR NADA. TODO POKAYOKE.**

1. Cada elemento de interfaz (botón, gesto, etiqueta, icono, flujo) debe copiar
   la estructura y UX de una app mundialmente famosa. Nunca inventar patrones
   propios. Referencias por área:
   - Feed, perfiles, seguidores/seguidos, "X y 2 más": **Instagram**
   - Grupos, compartir, estados: **WhatsApp**
   - Visibilidad de publicaciones (mundito 🌐 público / siluetas 👥 amigos,
     discreto junto al contenido): **Facebook**
   - Pedidos/ofertas de negocios: **Uber Eats**
   - Swipe de tarjetas: **Tinder/Instagram**
   - Guardar/descartar cambios: **Word/Google Docs/Mac** (Guardar / No guardar / Cancelar)
   - Fecha y hora: **Google Calendar / Calendario de iPhone**
2. Pokayoke: cero probabilidad de error del usuario. Confirmaciones antes de
   perder datos, estados imposibles bloqueados, textos mínimos y clarísimos.
3. Sutileza: nada saturado. Indicadores discretos (iconos pequeños, blancos,
   junto al contenido), no etiquetas llamativas que compitan con el contenido.
4. Menos elementos posibles. Reusar componentes existentes antes de crear nuevos.
5. Iconos y textos universales (los que ya conoce todo el mundo), en español.

## Reglas técnicas

- **Repositorio de la app: `ioggain/iogga-app`. Rama: `main`** (auto-deploya a iogga.com).
  Cada proyecto tiene el suyo y NO se mezclan: `ioggain/iogga` es el sitio web
  (www.iogga.com) y `ioggain/edwcorp` es EdwCorp. Trabajar en el que no es
  provoca que un proyecto pise al otro.
- Antes de dar por hecho el estado de git, correr `git fetch --all`: una copia
  local vieja hace concluir cosas falsas sobre lo que existe o se perdió.
- Antes de subir: `npm run verify` (tipos + pruebas + construcción). La misma
  puerta corre sola en GitHub y detiene la publicación si algo falla. Ver CALIDAD.md.
- Si se cambia una regla de negocio (comisión, caducidad, precios, tamaños),
  va en `src/lib/reglas.ts` y CON su prueba en `src/lib/__tests__/`.
- Al cambiar código de la app: subir `APP_VERSION` en `src/lib/version.ts` y el
  `CACHE` en `public/sw.js` (iogga-vN) juntos, para que el aviso "Actualización
  disponible" funcione.
- Datos de prueba siempre con `isSeed`/etiqueta "Prueba".
- Las claves web de Firebase son públicas por diseño; la seguridad vive en
  `firestore.rules`.
- Info sensible (WhatsApp, redes, fotos extra, ubicación exacta) solo se muestra
  con confianza (aceptación/seguimiento confirmado). Nunca exponerla en público.

## Limpieza fina PENDIENTE (hacer cuando el MVP esté completo, antes de auditoría)

1. Crear cuenta de servicio dedicada de despliegue (ej. iogga-deployer@) con
   permisos mínimos; hoy CI usa firebase-adminsdk-fbsvc con Editor + Secret
   Manager Admin + Service Account User + Cloud Functions Admin (funcional,
   pero amplio). Rotar la llave y actualizar el secreto FIREBASE_SERVICE_ACCOUNT.
2. Quitar el rol Editor a firebase@flutterflow.io (acceso externo heredado).
3. Pagos a producción: cambiar llaves TEST de Mercado Pago por productivas
   (secreto MP_ACCESS_TOKEN + Public Key en src/lib/payments.ts), validar
   webhook con firma, y hacer compra real de $10 + reembolso como examen final.
4. Endurecer flujo: exigir pago aprobado (verificado por webhook) antes de
   mostrar el QR (hoy el botón "Ya pagué" es de confianza, apto solo para MVP).
5. Definir % de comisión oficial (hoy 10% por defecto en functions IOGGA_FEE_PCT).
6. Perfil de pagos Google "Empresa" viejo (2452-0543-7969) quedó sin uso; no tocar.
7. Rotar el par de claves de push web (Cloud Messaging → Certificados push web):
   la clave privada se compartió por chat durante el MVP. Al rotar, actualizar
   PUSH_PUBLIC_KEY en src/lib/firebase.ts (los teléfonos se re-registran solos).
8. Marketplace de Mercado Pago (reparto automático): hoy el client_secret de la
   app se guarda en Firestore (config/mp, solo lectura del backend) por
   simplicidad del MVP. Para producción, moverlo a Secret Manager y rotar el
   client_secret que se haya pegado en el panel. Los tokens de los negocios
   (mp_sellers/{uid}) también son sensibles: server-only, y conviene refrescarlos
   (refresh_token) antes de los ~180 días de vigencia.
