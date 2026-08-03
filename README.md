# IOGGA — Sitio web oficial

**The Apportunity.** Sitio web de IOGGA, la plataforma que convierte tu intención en un plan real
y conecta personas, planes y negocios locales.

Sitio de **una sola página** (`index.html`), estilo limpio y contemporáneo (inspirado en Apple),
que además se puede **instalar como app** en el celular (PWA). Hosting **100% gratis** con GitHub Pages.

---

## 🚀 Publicarlo GRATIS en tu dominio iogga.com (paso a paso)

### 1) Activar GitHub Pages
1. En GitHub, abre el repositorio → pestaña **Settings**.
2. Menú izquierdo → **Pages**.
3. **Source**: *Deploy from a branch*.
4. **Branch**: elige la rama con este código y carpeta **/(root)** → **Save**.
5. En 1–2 minutos el sitio estará en línea.

### 2) Conectar tu dominio de GoDaddy
El archivo `CNAME` ya apunta a **iogga.com**. En **GoDaddy → Mis dominios → iogga.com → DNS**:

**a) Dominio raíz `iogga.com`** — crea estos 4 registros **A**:
```
Tipo A · Nombre @ · Valor 185.199.108.153
Tipo A · Nombre @ · Valor 185.199.109.153
Tipo A · Nombre @ · Valor 185.199.110.153
Tipo A · Nombre @ · Valor 185.199.111.153
```

**b) Subdominio `www`** — crea un registro **CNAME**:
```
Tipo CNAME · Nombre www · Valor <tu-usuario>.github.io
```

Luego en GitHub → **Settings → Pages → Custom domain** escribe `iogga.com`, guarda y activa
**Enforce HTTPS**.

> El DNS puede tardar de unos minutos hasta 24 h en propagar.

---

## 📱 "Descargar" la app (PWA)
El sitio ya es una **app instalable**. En la sección **Descargar** se explica al visitante cómo
ponerla en la pantalla de inicio:
- **iPhone (Safari):** Compartir → *Agregar a inicio*.
- **Android (Chrome):** menú ⋮ → *Instalar app*.

Cuando la app nativa esté lista en **App Store / Google Play**, solo hay que reemplazar los
enlaces de los badges "Pronto" en la sección `#descargar`.

Archivos que hacen posible la instalación: `manifest.webmanifest`, `sw.js`, y los íconos en `assets/`.

---

## ✏️ Cómo editar
Todo el contenido está en **`index.html`**. En GitHub, abre el archivo → lápiz ✏️ → cambia el texto
→ **Commit changes**. O pídele los cambios a tu asistente.

- **Contacto / redes:** en el `<footer>` y el botón de WhatsApp.
- **Fundadores:** sección `#fundadores` (hoy con monogramas; sube fotos profesionales para reemplazarlos).
- **Lista de espera:** hoy abre un correo prellenado a `omareduardo_@hotmail.com`. Para guardar
  correos automáticamente, usa [Formspree](https://formspree.io) o Google Forms y conecta el `<form>`.

---

## 📁 Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | Todo el sitio (diseño, textos, interacción) |
| `manifest.webmanifest` · `sw.js` | Hacen la web instalable como app (PWA) |
| `assets/` | Logo e íconos de la app |
| `CNAME` | Dominio personalizado (`iogga.com`) |
| `robots.txt` · `sitemap.xml` | SEO |

---

*The Apportunity — que los mejores momentos no dependan de la suerte.*
