# EdwCorp — Sitio web oficial

Sitio corporativo de **EdwCorp**: programas de capacitación, planes y programas de estudio,
material didáctico y consultoría por entregables para empresas e instituciones educativas.

Es un sitio **estático** (HTML + CSS + un poco de JavaScript, sin frameworks ni dependencias),
pensado para publicarse gratis en GitHub Pages y apuntar a **www.edwcorp.org**.

> Este sitio es **independiente de iogga**. Vive en su propia carpeta y no comparte
> código, estilos ni dominio con el sitio de iogga.

---

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Página principal: propuesta de valor, servicios, modalidades, método, socios y contacto. |
| `catalogo.html` | Catálogo de 55 programas (10 y 16 horas) con buscador y filtros. |
| `diagnostico.html` | Herramienta gratuita: diagnóstico de madurez en capacitación, con resultado y recomendación. |
| `assets/logo.svg` | Logotipo oficial. También `logo-blanco.svg` (fondos oscuros) e `isotipo.svg` (favicon). |
| `assets/*.jpg` | Fotos de los socios y del edificio de las oficinas. |
| `privacidad.html` | Aviso de privacidad (LFPDPPP). |
| `terminos.html` | Términos de servicio. |
| `legal.css` | Estilos compartidos por las dos páginas legales. |
| `analytics.js` | Google Analytics y los eventos del sitio. Se activa pegando el ID en la primera línea. |
| `apps-script/Codigo.gs` | Script de Google que recibe el formulario y lo guarda en una hoja. |
| `MODELO-DE-NEGOCIO.md` | Documento interno: líneas de ingreso, precios, sostenibilidad. |
| `PUBLICAR.md` | **Guía paso a paso para poner el sitio en el dominio.** |
| `CNAME`, `robots.txt`, `sitemap.xml`, `.nojekyll` | Configuración de publicación y buscadores. |

Cada página es un solo archivo con su CSS adentro: para cambiar un texto, se abre el archivo,
se busca la frase y se edita. No hay que compilar nada.

---

## 🚀 Publicarlo en edwcorp.org

**La guía completa está en [`PUBLICAR.md`](PUBLICAR.md)** — ocho pasos, todo desde el navegador.
Lo que sigue es el resumen.

El sitio vive hoy en la carpeta `edwcorp/` de este repositorio. Para publicarlo con su propio
dominio necesita **su propio repositorio**, porque GitHub Pages permite un solo dominio
personalizado por repositorio.

### 1) Crear el repositorio de EdwCorp
1. En GitHub: **New repository** → nombre `edwcorp` → público → **Create**.
2. Sube el **contenido de esta carpeta** (no la carpeta, sino los archivos de adentro:
   `index.html`, `catalogo.html`, etc.) a la raíz del nuevo repositorio.
   Puedes arrastrarlos en **Add file → Upload files**.

### 2) Activar GitHub Pages
1. En el repositorio `edwcorp` → **Settings** → **Pages**.
2. **Source**: *Deploy from a branch*.
3. **Branch**: `main`, carpeta **/(root)** → **Save**.
4. En 1–2 minutos el sitio ya está en línea.

### 3) Conectar el dominio
El archivo `CNAME` ya apunta a **www.edwcorp.org**. En el panel de tu proveedor de dominio
(GoDaddy, Namecheap, Google Domains…), en la sección **DNS**:

**Dominio raíz `edwcorp.org`** — cuatro registros **A**:
```
Tipo A · Nombre @ · Valor 185.199.108.153
Tipo A · Nombre @ · Valor 185.199.109.153
Tipo A · Nombre @ · Valor 185.199.110.153
Tipo A · Nombre @ · Valor 185.199.111.153
```

**Subdominio `www`** — un registro **CNAME**:
```
Tipo CNAME · Nombre www · Valor <tu-usuario>.github.io
```

Después, en GitHub → **Settings → Pages → Custom domain**: escribe `www.edwcorp.org`,
guarda y activa **Enforce HTTPS**. El DNS puede tardar de minutos a 24 horas en propagar.

> Si prefieres que el dominio sea `edwcorp.org` sin `www`, cambia el contenido del archivo
> `CNAME` a `edwcorp.org` y escribe eso mismo en el campo *Custom domain*.

---

## 📬 Conectar el formulario de contacto

Mientras no se configure, el formulario abre el correo del visitante con los datos ya escritos
(funciona, pero es menos cómodo). Para que las solicitudes lleguen a una hoja de cálculo y por correo:

1. Crea una **Hoja de Google** nueva y copia su ID (lo que va entre `/d/` y `/edit` en la URL).
2. Entra a [script.google.com](https://script.google.com) → **Nuevo proyecto**.
3. Borra lo que traiga y pega el contenido de `apps-script/Codigo.gs`.
4. Arriba del archivo, cambia:
   - `HOJA_ID` → el ID de tu hoja.
   - `AVISO_A` → el correo donde quieres recibir el aviso.
   - `CLAVE` → una contraseña cualquiera, para consultar las solicitudes.
5. Selecciona la función **`probar`** y dale ▶ **Ejecutar**. Acepta los permisos.
   Si en el registro aparece «✅ TODO BIEN», ya quedó (borra la fila de prueba de la hoja).
6. **Implementar → Nueva implementación → Aplicación web**
   - *Ejecutar como*: **Yo**
   - *Quién tiene acceso*: **Cualquier persona**
7. Copia la URL que termina en `/exec`.
8. En `index.html`, busca esta línea (cerca del final) y pega la URL:
   ```js
   var FORM_ENDPOINT = "";
   ```

Las solicitudes llegan a **admin@edwcorp.org** (configurado en `AVISO_A` del script).

---

## ✏️ Cosas que conviene revisar antes de publicar

- **Logotipo.** `assets/logo.svg` es una reconstrucción vectorial del logo oficial (tipografía
  Poppins incrustada, azul `#0b72b8`). Si tienes el archivo original en SVG, sustitúyelo con el
  mismo nombre y todo el sitio lo toma. Para fondos oscuros se usa `logo-blanco.svg`.
- **Video del header.** Hoy el fondo es una animación hecha con canvas (no requiere archivo ni
  descarga). Para usar video: guarda `assets/hero.mp4` y `assets/hero-poster.jpg`, y en
  `index.html` descomenta el bloque `<video>` que está justo debajo del `<canvas>`.
- **Logos de clientes.** El cintillo muestra los nombres en gris claro. Para poner logotipos:
  guarda cada archivo en `assets/logos/` (PNG o SVG, fondo transparente, alto ~60 px) y cambia
  cada `<li>Nombre</li>` por `<li><img src="assets/logos/archivo.svg" alt="Nombre"></li>`.
  Añade a la hoja de estilos: `.marquee li img{height:34px;filter:grayscale(1);opacity:.55}`.
  Confirma que tienes autorización para mostrar cada marca.
- **Fotos.** Las de los socios y la del edificio ya están en `assets/`. Para cambiar cualquiera,
  sube la nueva **con el mismo nombre** y listo. Si algún día falta la foto de un socio, el sitio
  muestra sus iniciales en lugar de romperse; si falta la del edificio, el mapa ocupa todo el ancho.
  La foto de Carlos está a 256×256 px: si consigues una de ~600×600 se verá más nítida en pantallas retina.
- **Catálogo.** Los programas salen del *Portafolio de cursos, capacitaciones y entrenamiento*
  (Nov-2025), con las duraciones normalizadas a 10 y 16 horas. Están en el arreglo `CURSOS`
  dentro de `catalogo.html`: agregar uno es copiar una línea y cambiar los textos.

---

## ✅ Antes de publicar

1. Conectar el formulario (sección de arriba) para que las solicitudes lleguen a
   `admin@edwcorp.org` sin depender del correo del visitante.
2. Revisar en el celular: menú, botón de WhatsApp, diagnóstico y catálogo.
3. Publicar en GitHub Pages y apuntar el dominio (sección de arriba).
4. Pegar el ID de Google Analytics en `analytics.js` (paso 8 de `PUBLICAR.md`).
5. Después de publicar, dar de alta el sitio en
   [Google Search Console](https://search.google.com/search-console) y subir `sitemap.xml`.

---

## Cómo verlo en tu computadora

Abre `index.html` con doble clic — funciona directo en el navegador.
Si prefieres un servidor local (para que las rutas se comporten igual que en producción):

```bash
cd edwcorp
python3 -m http.server 8000
# abre http://localhost:8000
```

---

## Marca

| Elemento | Valor |
|---|---|
| Azul de marca (el del logo) | `#0b72b8` |
| Azul marino de fondo | `#08243c` |
| Verde azulado (acento) | `#0f8f83` |
| Ámbar (acento) | `#c07615` |
| Morado (acento) | `#5b46b8` |
| Tipografía de títulos | Poppins |
| Tipografía de texto | Inter |

Los colores están definidos como variables CSS al inicio de cada archivo (`:root{…}`);
cambiarlos ahí cambia todo el sitio.
