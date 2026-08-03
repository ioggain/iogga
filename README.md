# iogga — Sitio web oficial

**The Apportunity.** Sitio web de iogga: la app donde tus planes cobran vida
y conectar es más fácil que nunca.

Sitio de **una sola página** (`index.html`), diseño limpio y contemporáneo, alineado con
el sistema visual de la app (indigo `#6366f1` para personas, teal `#14b8a6` para negocios).
Se puede **instalar como app** en el celular (PWA). Hosting **gratis** con GitHub Pages.

---

## 🚀 Publicarlo GRATIS en iogga.com (paso a paso)

### 1) Activar GitHub Pages
1. En GitHub abre el repositorio → pestaña **Settings**.
2. Menú izquierdo → **Pages**.
3. **Source**: *Deploy from a branch*.
4. **Branch**: la rama con este código, carpeta **/(root)** → **Save**.
5. En 1–2 minutos el sitio está en línea.

### 2) Conectar el dominio de GoDaddy
El archivo `CNAME` ya apunta a **iogga.com**. En **GoDaddy → Mis dominios → iogga.com → DNS**:

**Dominio raíz `iogga.com`** — 4 registros **A**:
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

Luego GitHub → **Settings → Pages → Custom domain**: escribe `iogga.com`, guarda y activa
**Enforce HTTPS**. El DNS puede tardar de minutos a 24 h en propagar.

---

## 📥 Lista de espera y panel privado
Ver **[LISTA-DE-ESPERA.md](LISTA-DE-ESPERA.md)** — 4 pasos (10 min, una sola vez) para guardar
nombre, correo, teléfono y tipo en una Hoja de Google tuya. Gratis y sin límite.

Después puedes consultarlos de dos formas:
- **`iogga.com/panel.html`** — panel privado con clave: totales, buscador, descarga en CSV y
  copiar como texto. No está enlazado desde el sitio y lleva `noindex`.
- **Tu Hoja de Google** — directamente.

Mientras no esté configurada, el formulario abre el correo del visitante como respaldo.

---

## 📱 Instalar como app (PWA)
La sección **Descargar** del sitio explica al visitante cómo poner iogga en la pantalla de inicio:
- **iPhone (Safari):** Compartir → *Agregar a inicio*.
- **Android (Chrome):** menú ⋮ → *Instalar app*.

Cuando la app nativa salga en **App Store / Google Play**, solo hay que reemplazar los badges
"Pronto" de la sección `#descargar` por los enlaces reales.

---

## ✏️ Cómo editar
Todo el contenido está en **`index.html`**. En GitHub: abre el archivo → lápiz ✏️ → edita →
**Commit changes**.

### Poner las fotos de los fundadores
**No hay que tocar el código.** Solo sube las dos fotos con estos nombres exactos:

```
assets/omar.jpg
assets/isela.jpg
```

Desde GitHub: entra a la carpeta **`assets`** → botón **Add file → Upload files** → arrastra
las fotos (renómbralas antes) → **Commit changes**.

Si el archivo existe, la foto aparece sola; si no, se muestra el monograma.
Recomendado: cuadradas, mínimo 400×400 px.

---

## 📁 Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | Todo el sitio (diseño, textos, interacción) |
| `privacidad.html` | Aviso de Privacidad (LFPDPPP) |
| `terminos.html` | Términos y Condiciones |
| `legal.css` | Estilos de las páginas legales |
| `panel.html` | Panel privado para consultar y exportar los registros |
| `LISTA-DE-ESPERA.md` | Cómo conectar la base de datos de registros |
| `manifest.webmanifest` · `sw.js` | Hacen la web instalable como app (PWA) |
| `assets/` | Logo, íconos y fotos de fundadores |
| `CNAME` | Dominio personalizado (`iogga.com`) |
| `robots.txt` · `sitemap.xml` | SEO (el panel va excluido) |

---

## 🎨 Notas de marca
- **iogga** se escribe siempre en **minúscula** (marca registrada: iogga®).
- Colores tomados de la app: `#6366f1` (personas), `#14b8a6` (negocios).
- El logo funciona como **botón de inicio**: al tocarlo, la página vuelve arriba.

---

*The Apportunity — que los mejores momentos no dependan de la suerte.*
