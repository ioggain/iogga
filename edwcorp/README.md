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
| `index.html` | Página principal. Todo el sitio: hero, servicios, método, modalidades, socios, contacto. |
| `catalogo.html` | Catálogo de 55 programas con buscador y filtros por área. |
| `privacidad.html` | Aviso de privacidad (LFPDPPP). |
| `terminos.html` | Términos de servicio. |
| `legal.css` | Estilos compartidos por las dos páginas legales. |
| `apps-script/Codigo.gs` | Script de Google que recibe el formulario y lo guarda en una hoja. |
| `MODELO-DE-NEGOCIO.md` | Documento interno: líneas de ingreso, precios, sostenibilidad. |
| `CNAME`, `robots.txt`, `sitemap.xml`, `.nojekyll` | Configuración de publicación y buscadores. |

Cada página es un solo archivo con su CSS adentro: para cambiar un texto, se abre el archivo,
se busca la frase y se edita. No hay que compilar nada.

---

## 🚀 Publicarlo en edwcorp.org

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

---

## ✏️ Cosas que conviene revisar antes de publicar

- **Bios de los socios.** La de Omar Eduardo Hernández viene del portafolio. Las de
  **Carlos Villalpando** e **Isela Domínguez** están escritas de forma general a partir de su rol:
  conviene que cada uno mande su versión (formación, certificaciones, trayectoria) y
  reemplazarlas en la sección `<!-- SOCIOS -->` de `index.html`.
- **Fotos.** Ahora se muestran monogramas (las iniciales en un círculo). Si quieres fotos,
  guárdalas en `assets/` (cuadradas, ~600×600 px) y cambia el `<div class="mono">…</div>`
  por `<img class="mono" src="assets/nombre.jpg" alt="Nombre" />`.
- **Correos.** El sitio usa `CEO@edwcorp.org` y `proyectos@edwcorp.org`. Verifica que el
  segundo exista (el sitio anterior mencionaba `proyectos@edwcorp.com`, con `.com`).
- **Instituciones de la barra de confianza.** Están tomadas de la trayectoria docente del
  portafolio. Si alguna requiere autorización para mencionarse, quítala de `index.html`.
- **Catálogo.** Los programas salen del *Portafolio de cursos, capacitaciones y entrenamiento*
  (Nov-2025). Están en el arreglo `CURSOS` dentro de `catalogo.html`: agregar uno nuevo es
  copiar una línea y cambiar los textos.

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
| Azul marino corporativo | `#0a1c2e` |
| Azul de acento | `#1257a6` |
| Dorado | `#b08528` |
| Tipografía de títulos | Source Serif 4 |
| Tipografía de texto | Inter |

Los colores están definidos como variables CSS al inicio de cada archivo (`:root{…}`);
cambiarlos ahí cambia todo el sitio.
