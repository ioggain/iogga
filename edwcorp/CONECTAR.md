# EdwCorp — Cómo llega lo que capturas en el sitio

**Lo que la gente manda desde `www.edwcorp.org` sale por dos caminos independientes.**
Si uno falla, el otro sigue funcionando y no se pierde ninguna solicitud.

```
Formulario de contacto  ─┐
Diagnóstico ─────────────┤
                         ▼
              ┌──────────┴──────────┐
              ▼                     ▼
     1. CORREO (FormSubmit)   2. BASE DE DATOS (Apps Script)
     → admin@edwcorp.org      → Hoja de cálculo
     Sin configuración        Opcional, para el histórico
```

---

# ⚡ ACTIVACIÓN — se hace UNA sola vez

El camino del correo usa **FormSubmit**, un servicio gratuito que no necesita cuenta.
Lo único que pide es comprobar, una vez, que el correo es tuyo.

1. Entra a 👉 **[www.edwcorp.org/#contacto](https://www.edwcorp.org/#contacto)** y manda el
   formulario con datos de prueba.
2. Revisa la bandeja de **admin@edwcorp.org**. Va a llegar un correo de **FormSubmit**
   pidiendo confirmar la dirección. **Revisa también spam** — suele caer ahí la primera vez.
3. Haz clic en el botón de confirmación de ese correo.

**Listo.** A partir de ese clic, cada solicitud del sitio llega directo a tu bandeja,
para siempre y sin más configuración.

> La solicitud de prueba que mandaste queda guardada y también te llega, una vez confirmes.

---

# LA BASE DE DATOS (opcional)

La hoja de cálculo guarda el histórico de todo. El correo ya funciona sin esto,
así que es un paso que puedes hacer con calma.

### 1.1 · Abre Apps Script

👉 **[script.google.com/home/projects/create](https://script.google.com/home/projects/create)**

Inicia sesión con la cuenta de Google que quieras usar como dueña de la base de datos.
Se abre un proyecto nuevo con un archivo llamado `Código.gs` que trae unas líneas de ejemplo.

### 1.2 · Ponle nombre al proyecto

Arriba a la izquierda dice *«Proyecto sin título»*. Haz clic y escribe:

```
EdwCorp — Base de datos del sitio
```

### 1.3 · Pega el código

1. Abre el código en esta liga:
   👉 **[Ver el código completo](https://github.com/ioggain/edwcorp/blob/main/apps-script/Codigo.gs)**
   (o directo en texto plano para copiar más fácil:
   **[versión para copiar](https://raw.githubusercontent.com/ioggain/edwcorp/main/apps-script/Codigo.gs)**)
2. Cópialo **completo**.
3. Regresa a Apps Script, haz clic dentro del editor, selecciona todo con `Ctrl+A`
   (o `Cmd+A` en Mac), bórralo y **pega**.
4. Guarda con el ícono 💾 o `Ctrl+S`.

> **No tienes que cambiar nada adentro.** El correo ya dice `admin@edwcorp.org` y la hoja
> de cálculo se crea sola. Si algún día quieres otro destinatario, cambias la línea
> `var AVISO_A = 'admin@edwcorp.org';` y ya.

### 1.4 · Ejecuta la prueba

1. Arriba, en el menú desplegable de funciones, elige **`probar`**.
2. Dale ▶ **Ejecutar**.
3. **La primera vez pide permisos.** Es normal, es tu propio script:
   - **Revisar permisos** → elige tu cuenta
   - Aparece «Google no ha verificado esta aplicación» → **Configuración avanzada**
   - Abajo: **Ir a EdwCorp — Base de datos del sitio (no seguro)**
   - **Permitir**

4. Abajo se abre el **Registro de ejecución**. Debe decir algo así:

```
Solicitudes guardadas:  1
Diagnósticos guardados: 1
✅ TODO BIEN — ya puedes implementar.
Tu base de datos: https://docs.google.com/spreadsheets/d/....../edit
Revisa que te haya llegado el correo a admin@edwcorp.org
```

5. **Abre el enlace de tu base de datos** que aparece ahí y guárdalo en favoritos.
   Vas a ver dos pestañas abajo: **Solicitudes** y **Diagnósticos**, con una fila de prueba
   cada una. Bórralas cuando quieras.
6. **Revisa tu correo `admin@edwcorp.org`.** Te debieron llegar dos avisos.

> Si no llegó el correo, revisa la carpeta de spam. Google manda desde la cuenta con la que
> iniciaste sesión en Apps Script.

### 1.5 · Publícalo como aplicación web

1. Arriba a la derecha: **Implementar** → **Nueva implementación**.
2. Haz clic en el engranito ⚙️ junto a «Seleccionar tipo» → **Aplicación web**.
3. Llena así:

| Campo | Qué poner |
|---|---|
| Descripción | `Formulario EdwCorp` |
| Ejecutar como | **Yo (tu correo)** |
| Quién tiene acceso | **Cualquier persona** |

> ⚠️ Tiene que decir **«Cualquier persona»**, no «Cualquier usuario con cuenta de Google».
> Si eliges la segunda, el formulario va a fallar para quien no tenga sesión de Google
> abierta — o sea, para casi todos tus visitantes.

4. **Implementar**.
5. Copia la **URL de la aplicación web**. Se ve así:

```
https://script.google.com/macros/s/AKfycbx...largo.../exec
```

**Guárdala, la necesitas en la Parte 2.**

---

# PARTE 2 · Conectar el sitio

Solo hay que pegar esa URL en un archivo.

### 2.1 · Abre el archivo de configuración

👉 **[Editar config.js](https://github.com/ioggain/edwcorp/edit/main/config.js)**

Esa liga te lleva directo al archivo, ya en modo edición.

### 2.2 · Pega la URL

Busca esta línea:

```js
var EDW_ENDPOINT = "";
```

Y pega tu URL **adentro de las comillas**:

```js
var EDW_ENDPOINT = "https://script.google.com/macros/s/AKfycbx.../exec";
```

### 2.3 · Guarda

Botón verde **Commit changes…** arriba a la derecha → **Commit changes**.

En 1–2 minutos el sitio se actualiza solo.

> Con eso quedan conectados **el formulario y el diagnóstico** al mismo tiempo.
> Es el único lugar donde se configura.

---

# PARTE 3 · Comprobar que jala

1. Entra a 👉 **[www.edwcorp.org/#contacto](https://www.edwcorp.org/#contacto)**
2. Llena el formulario con datos de prueba y envíalo.
3. Debe salir: *«Recibido. Te contactamos en menos de 48 horas hábiles.»*
4. Revisa las tres cosas:
   - ✉️ Llegó el correo a `admin@edwcorp.org`
   - 📊 Apareció la fila en la pestaña **Solicitudes** de tu hoja
   - 🔁 El remitente sale en «Responder», para contestar de un clic

5. Ahora prueba el otro: entra a 👉 **[www.edwcorp.org/diagnostico.html](https://www.edwcorp.org/diagnostico.html)**,
   contesta las 10 preguntas y al final deja un correo en la caja
   *«¿Te mandamos el plan por correo?»*.
   Debe aparecer la fila en la pestaña **Diagnósticos**.

> El diagnóstico guarda el resultado **aunque no dejen correo** (puntaje, nivel y área más
> floja). Así sabes qué le duele a la gente que visita el sitio, aunque no se identifique.

---

# PARTE 4 · Analítica

Para saber cuánta gente entra y de dónde llega.

### 4.1 · Crea la propiedad

👉 **[analytics.google.com](https://analytics.google.com)**

1. **Administrar** (el engrane, abajo a la izquierda) → **Crear** → **Propiedad**.
2. Nombre: `EdwCorp` · Zona horaria: **México** · Moneda: **peso mexicano**.
3. Contesta las dos pantallas de negocio y dale **Crear**.
4. Plataforma: **Web**.
   - URL: `https://www.edwcorp.org`
   - Nombre del flujo: `Sitio EdwCorp`
5. Copia el **ID de medición**: se ve `G-XXXXXXXXXX`.

   *(Si cierras la ventana: **Administrar → Flujos de datos → Sitio EdwCorp**.)*

### 4.2 · Pégalo en el sitio

👉 **[Editar analytics.js](https://github.com/ioggain/edwcorp/edit/main/analytics.js)**

Busca la línea `var GA_ID = "";` y pega tu ID:

```js
var GA_ID = "G-XXXXXXXXXX";
```

**Commit changes.**

### 4.3 · Compruébalo

En Analytics → **Informes → Tiempo real**, abre tu sitio en otra pestaña.
Te debes ver a ti mismo como visitante activo.

### 4.4 · Marca las conversiones

En Analytics → **Administrar → Eventos**, activa «Marcar como evento clave» en:

- `solicitud_enviada`
- `diagnostico_completado`
- `whatsapp`

Así vas a poder ver **de qué canal vienen los clientes de verdad**, no solo las visitas.

---

# PARTE 5 · Que Google lo encuentre

👉 **[search.google.com/search-console](https://search.google.com/search-console)**

1. Agrega la propiedad `https://www.edwcorp.org` (tipo *Prefijo de URL*).
2. Para verificar: como ya tienes Analytics, aparece la opción **«Google Analytics»** —
   un clic y listo.
3. En **Sitemaps**, escribe `sitemap.xml` y **Enviar**.

Google tarda de días a un par de semanas en indexarlo.

---

# Si algo falla

| Qué ves | Por qué pasa | Cómo se arregla |
|---|---|---|
| No llega ningún correo | Falta confirmar la dirección en FormSubmit | Revisa spam en `admin@edwcorp.org` y haz clic en el correo de confirmación |
| El formulario abre el correo del visitante | Fallaron los dos caminos a la vez | Casi siempre es falta de internet; vuelve a intentar |
| «No pudimos enviar la solicitud» | La implementación no es pública | Apps Script → Implementar → Administrar implementaciones → ✏️ → *Quién tiene acceso:* **Cualquier persona** |
| Cambié el código y sigue igual | Guardar no basta en Apps Script | **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar** |
| No llega el correo | Está en spam, o el script no tiene permisos | Revisa spam; vuelve a ejecutar `probar` y acepta permisos |
| No encuentro mi hoja de cálculo | Se creó en el Drive de la cuenta del script | En Apps Script ejecuta la función **`verHoja`** y mira el registro |
| Analytics no registra nada | Falta el ID, o lo bloquea una extensión | Revisa `analytics.js`; prueba en ventana de incógnito sin bloqueadores |

---

## Lo importante de recordar

> Cada vez que **cambies el código en Apps Script**, tienes que hacer
> **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar**.
> Si solo guardas, la URL sigue sirviendo la versión anterior. Es el tropiezo más común.

Los cambios en **GitHub** (config.js, analytics.js, textos) sí se publican solos en 1–2 minutos.
