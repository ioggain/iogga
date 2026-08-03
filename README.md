# IOGGA — Sitio web oficial

Sitio web de **IOGGA**: la plataforma que convierte tu intención en un plan que sí sucede,
conectando personas, planes y negocios locales. Chihuahua, México.

Es un sitio de **una sola página** (`index.html`), rápido, moderno y 100% gratis de hospedar
con **GitHub Pages**.

---

## 🚀 Cómo publicarlo GRATIS (paso a paso)

### 1) Activar GitHub Pages
1. Entra al repositorio en GitHub → pestaña **Settings** (Configuración).
2. En el menú de la izquierda, clic en **Pages**.
3. En **Source** elige **Deploy from a branch**.
4. En **Branch** selecciona la rama donde está este código y la carpeta **/ (root)**.
5. Clic en **Save**. En 1–2 minutos tu sitio estará en línea.

### 2) Conectar tu dominio de GoDaddy (www.iogga.com)
El archivo `CNAME` ya está configurado con `www.iogga.com`.

En **GoDaddy** → *Mis dominios* → `iogga.com` → **DNS**:

**a) Para `www` (recomendado):** crea/edita un registro **CNAME**
```
Tipo: CNAME   |   Nombre: www   |   Valor: <tu-usuario>.github.io
```

**b) Para el dominio raíz `iogga.com`:** crea **4 registros A** apuntando a GitHub Pages:
```
Tipo: A   |   Nombre: @   |   Valor: 185.199.108.153
Tipo: A   |   Nombre: @   |   Valor: 185.199.109.153
Tipo: A   |   Nombre: @   |   Valor: 185.199.110.153
Tipo: A   |   Nombre: @   |   Valor: 185.199.111.153
```

Luego en GitHub → **Settings → Pages → Custom domain** escribe `www.iogga.com` y guarda.
Activa también **Enforce HTTPS** (puede tardar unos minutos en habilitarse).

> Los cambios de DNS pueden tardar de unos minutos hasta 24 horas en propagarse.

---

## ✏️ Cómo editar el sitio (fácil)

Todo el contenido está en **`index.html`**. Para cambiar textos:

1. En GitHub, abre `index.html` y haz clic en el lápiz ✏️ (**Edit**).
2. Cambia el texto que quieras (busca la palabra que ves en la página).
3. Baja y haz clic en **Commit changes**. ¡Listo, se actualiza solo!

O simplemente pídele a tu asistente los cambios y él los hace por ti.

### Cosas rápidas que puedes personalizar
- **Correo / teléfono / redes:** están en el `<footer>` y en el botón de WhatsApp.
- **Lista de espera:** hoy abre un correo prellenado hacia `omareduardo_@hotmail.com`.
  Para guardar correos automáticamente, crea un formulario gratis en
  [Formspree](https://formspree.io) o [Google Forms](https://forms.google.com) y
  reemplaza la lógica del `<form id="waitlistForm">` por el endpoint que te den.

---

## 📁 Archivos
| Archivo        | Para qué sirve                                  |
|----------------|-------------------------------------------------|
| `index.html`   | Todo el sitio (diseño + textos + interacción)   |
| `CNAME`        | Tu dominio personalizado (`www.iogga.com`)      |
| `robots.txt`   | SEO — permite que Google indexe el sitio        |
| `sitemap.xml`  | SEO — mapa del sitio para buscadores            |

---

*Convertimos la intención en oportunidad.*
