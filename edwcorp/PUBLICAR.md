# Poner EdwCorp en producción — paso a paso

Guía completa para publicar el sitio en **www.edwcorp.org**, gratis, con GitHub Pages.
Todo se hace desde el navegador. No necesitas instalar nada.

Tiempo aproximado: **30 minutos de trabajo** + hasta 24 horas de espera del DNS.

> ⚠️ **Antes de empezar:** hoy `edwcorp.org` apunta a tu Google Sites. Cuando cambies el DNS
> (paso 5), el dominio dejará de mostrar el sitio de Google y mostrará este. El sitio de Google
> Sites no se borra: sigue existiendo en su dirección de Google, solo deja de usar tu dominio.
> Conviene tenerlo listo y revisado antes de tocar el DNS.

---

## Paso 1 · Descargar los archivos del sitio

1. Abre este enlace, que descarga todo el proyecto en un ZIP:
   ```
   https://github.com/ioggain/iogga/archive/refs/heads/claude/edwcorp-website-qvz0kc.zip
   ```
2. Descomprime el ZIP.
3. Adentro busca la carpeta **`edwcorp`**. Esa carpeta es el sitio completo.
   Lo que vas a subir es **el contenido de adentro** de esa carpeta, no la carpeta misma.

Dentro debes ver: `index.html`, `catalogo.html`, `diagnostico.html`, `privacidad.html`,
`terminos.html`, `legal.css`, `CNAME`, `robots.txt`, `sitemap.xml`, `.nojekyll`
y las carpetas `assets` y `apps-script`.

---

## Paso 2 · Agregar las dos fotos que faltan

En la carpeta `edwcorp/assets/`, guarda estos dos archivos con **exactamente** estos nombres:

| Archivo | Qué es | Formato ideal |
|---|---|---|
| `carlos.jpg` | Foto de Carlos Villalpando | Cuadrada, ~600×600 px |
| `oficinas.jpg` | Foto del edificio de las oficinas | Horizontal, ~1600×1100 px |

El sitio ya está programado para tomarlas solas. Si por alguna razón no las pones,
la página **no se rompe**: en lugar de la foto de Carlos aparecen sus iniciales, y el mapa
ocupa todo el ancho de la sección de oficinas.

> Los nombres van en minúsculas y sin acentos. `Carlos.JPG` no funciona; `carlos.jpg` sí.

---

## Paso 3 · Crear el repositorio en GitHub

1. Entra a [github.com](https://github.com) con tu cuenta.
2. Arriba a la derecha: **+** → **New repository**.
3. Llena así:
   - **Repository name:** `edwcorp`
   - **Public** (tiene que ser público para que GitHub Pages sea gratis)
   - **No** marques «Add a README file»
4. **Create repository**.
5. En la pantalla que sigue, haz clic en **uploading an existing file**
   (o entra a **Add file → Upload files**).
6. Arrastra **todos los archivos y carpetas que están adentro** de `edwcorp`.
   Repito porque es el error más común: arrastra el *contenido*, no la carpeta `edwcorp`.
7. Abajo, en **Commit changes**, escribe `Sitio EdwCorp` y dale al botón verde.

Al terminar, la lista de archivos del repositorio debe empezar con `index.html`.
Si ves una carpeta `edwcorp` adentro, bórrala y vuelve a subir el contenido.

---

## Paso 4 · Encender GitHub Pages

1. En el repositorio `edwcorp` → pestaña **Settings** (arriba a la derecha).
2. Menú izquierdo → **Pages**.
3. **Source:** *Deploy from a branch*.
4. **Branch:** `main` · carpeta **/(root)** → **Save**.
5. Espera 1–2 minutos y recarga la página. Arriba aparecerá una liga tipo
   `https://TU-USUARIO.github.io/edwcorp/`.
6. Ábrela. **El sitio ya está en línea.** Revísalo completo antes de seguir:
   menú, catálogo, diagnóstico, botón de WhatsApp, y que se vean las fotos y el mapa.

---

## Paso 5 · Apuntar el dominio edwcorp.org

Entra al panel donde compraste el dominio (GoDaddy, Namecheap, Hostinger, Google Domains…)
y busca la sección **DNS** o **Administrar DNS** de `edwcorp.org`.

### 5.1 · Borrar lo que apunta a Google Sites
Elimina los registros **A** y **CNAME** existentes del dominio raíz (`@`) y de `www`.
No toques los registros **MX** — esos son los del correo y si los borras dejas de recibir mensajes.

### 5.2 · Agregar cuatro registros A
Para el dominio raíz. En «Nombre» o «Host» va `@`:

```
Tipo A · Nombre @ · Valor 185.199.108.153
Tipo A · Nombre @ · Valor 185.199.109.153
Tipo A · Nombre @ · Valor 185.199.110.153
Tipo A · Nombre @ · Valor 185.199.111.153
```

### 5.3 · Agregar un registro CNAME
Para el subdominio `www`. Sustituye `TU-USUARIO` por tu usuario de GitHub:

```
Tipo CNAME · Nombre www · Valor TU-USUARIO.github.io
```

Guarda los cambios.

---

## Paso 6 · Conectar el dominio en GitHub

1. Repositorio `edwcorp` → **Settings** → **Pages**.
2. En **Custom domain** escribe: `www.edwcorp.org` → **Save**.
3. GitHub verifica el DNS. Puede tardar desde unos minutos hasta 24 horas
   (normalmente menos de una hora).
4. Cuando aparezca la palomita verde, marca la casilla **Enforce HTTPS**.
   Si todavía está gris, espera y vuelve más tarde: se activa sola cuando el DNS propaga.

Al terminar, `www.edwcorp.org` y `edwcorp.org` muestran el sitio con candado de seguridad.

---

## Paso 7 · Conectar el formulario de contacto

Mientras no hagas esto, el formulario abre el correo del visitante con los datos escritos.
Funciona, pero se pierden solicitudes. Para que lleguen solas a `proyectos@edwcorp.org`
y queden en una hoja de cálculo:

1. Crea una **Hoja de Google** nueva. Copia su ID: es lo que va entre `/d/` y `/edit` en la URL.
2. Entra a [script.google.com](https://script.google.com) → **Nuevo proyecto**.
3. Borra el código que trae y pega el contenido de `apps-script/Codigo.gs`.
4. Arriba del archivo cambia:
   - `HOJA_ID` → el ID de tu hoja
   - `CLAVE` → cualquier contraseña que inventes
   - (`AVISO_A` ya dice `proyectos@edwcorp.org`)
5. Selecciona la función **`probar`** y dale ▶ **Ejecutar**. Acepta los permisos que pida.
   Si en el registro sale «✅ TODO BIEN», quedó. Borra la fila de prueba de la hoja.
6. **Implementar → Nueva implementación → Aplicación web**
   - *Ejecutar como:* **Yo**
   - *Quién tiene acceso:* **Cualquier persona**
7. Copia la URL que termina en `/exec`.
8. En GitHub, abre `index.html` → ícono del lápiz ✏️ → busca esta línea (está casi al final):
   ```js
   var FORM_ENDPOINT = "";
   ```
   y pega la URL adentro de las comillas. **Commit changes**.

En 1–2 minutos el sitio se actualiza solo con el cambio.

---

## Paso 8 · Darlo de alta en Google

1. Entra a [Google Search Console](https://search.google.com/search-console).
2. Agrega la propiedad `https://www.edwcorp.org`.
3. Verifica la propiedad (la opción más simple es el registro TXT en el DNS).
4. En **Sitemaps**, escribe `sitemap.xml` y envíalo.

Con esto Google empieza a indexar el sitio. Tarda de días a un par de semanas.

---

## Cómo editar el sitio de aquí en adelante

Todo se puede hacer desde el navegador, sin instalar nada:

1. Entra al repositorio `edwcorp` en GitHub.
2. Abre el archivo que quieras cambiar (`index.html` para la página principal).
3. Dale al ícono del lápiz ✏️ arriba a la derecha.
4. Busca el texto con `Ctrl+F` (o `Cmd+F`), cámbialo.
5. Abajo, **Commit changes**.
6. En 1–2 minutos el sitio publicado ya muestra el cambio.

**Cambios frecuentes y dónde están:**

| Qué quieres cambiar | Archivo | Qué buscar |
|---|---|---|
| Textos de la página principal | `index.html` | La frase misma |
| Agregar o quitar un curso | `catalogo.html` | `var CURSOS` |
| Preguntas del diagnóstico | `diagnostico.html` | `var PREGUNTAS` |
| Empresas del cintillo | `index.html` | `marqueeList` |
| Teléfono de WhatsApp | Todos | `526146887271` |
| Colores de la marca | `index.html` | `:root{` |

**Para reemplazar una foto:** entra a la carpeta `assets` en GitHub, borra la vieja y sube la
nueva **con el mismo nombre**. No hay que tocar nada más.

**Poner un video en el header:** sube `assets/hero.mp4` y `assets/hero-poster.jpg`, luego
en `index.html` busca `<!--` justo debajo de `heroCanvas` y descomenta el bloque `<video>`.

---

## Si algo sale mal

| Problema | Causa más común | Solución |
|---|---|---|
| Sale el 404 de GitHub | Subiste la carpeta en vez del contenido | `index.html` tiene que estar en la raíz del repositorio |
| Se ve sin diseño | Falta `.nojekyll` | Súbelo (es un archivo vacío, pero necesario) |
| El dominio no carga | El DNS aún no propaga | Espera. Hasta 24 h es normal |
| «Enforce HTTPS» en gris | El certificado aún no se emite | Espera unas horas y vuelve a entrar |
| No se ve una foto | El nombre no coincide exacto | Revisa mayúsculas, acentos y la extensión |
| Se dejó de recibir correo | Se borraron los registros MX | Vuelve a capturarlos con tu proveedor de correo |
