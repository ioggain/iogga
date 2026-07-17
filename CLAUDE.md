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

- Rama de trabajo y push: SOLO `claude/ai-studio-app-features-rlth7p` (auto-deploya a iogga.com).
- Al cambiar código de la app: subir `APP_VERSION` en `src/lib/version.ts` y el
  `CACHE` en `public/sw.js` (iogga-vN) juntos, para que el aviso "Actualización
  disponible" funcione.
- Datos de prueba siempre con `isSeed`/etiqueta "Prueba".
- Las claves web de Firebase son públicas por diseño; la seguridad vive en
  `firestore.rules`.
- Info sensible (WhatsApp, redes, fotos extra, ubicación exacta) solo se muestra
  con confianza (aceptación/seguimiento confirmado). Nunca exponerla en público.
