# Base de datos de la lista de espera

Guarda **nombre, correo, teléfono y tipo** de cada persona que se registra en www.iogga.com.
Los datos quedan en **tu Hoja de Google**, y además puedes consultarlos y exportarlos desde el
**panel privado**: `www.iogga.com/panel.html`

Gratis, sin límite de registros, y los datos son 100% tuyos.

**Tu hoja:**
https://docs.google.com/spreadsheets/d/18reM1EwWa5IYikIF6OkHpZiuRuh6yTCPorAP_Gv8240/edit

**Tu clave de acceso al panel** (generada al azar, ya está en el código de abajo):
```
PwCV2-vwfds-CfPdW-0Q4zP
```
Guárdala. Puedes cambiarla si quieres — solo edita la línea `var CLAVE` del script.

> **Por qué esto lo tienes que hacer tú:** desplegar un script de Google requiere que tú
> autorices con tu cuenta desde el navegador. Nadie más puede hacerlo por ti. Son 5 minutos,
> una sola vez.

---

## Paso 1 · Abre el editor de scripts
1. Abre [tu hoja](https://docs.google.com/spreadsheets/d/18reM1EwWa5IYikIF6OkHpZiuRuh6yTCPorAP_Gv8240/edit)
2. Menú **Extensiones → Apps Script**
3. Se abre una pestaña nueva con un editor de código

## Paso 2 · Pega el código
Borra todo lo que haya (normalmente `function myFunction() {}`) y pega esto **tal cual**:

```javascript
var CLAVE   = 'PwCV2-vwfds-CfPdW-0Q4zP';
var HOJA_ID = '18reM1EwWa5IYikIF6OkHpZiuRuh6yTCPorAP_Gv8240';

// Abre la hoja por su ID: funciona igual si el script está dentro de la
// hoja o si lo creaste aparte.
function abrirHoja_() {
  return SpreadsheetApp.openById(HOJA_ID).getSheets()[0];
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var hoja = abrirHoja_();
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(['Fecha', 'Nombre', 'Correo', 'Teléfono', 'Tipo', 'Origen']);
      hoja.getRange(1, 1, 1, 6).setFontWeight('bold');
      hoja.setFrozenRows(1);
    }
    var p = e.parameter || {};
    hoja.appendRow([
      new Date(),
      p.nombre   || '',
      p.email    || '',
      p.telefono || '',
      p.tipo     || '',
      p.origen   || ''
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var p = e.parameter || {};
  if (p.key !== CLAVE) return json({ ok: false, error: 'clave incorrecta' });

  var hoja = abrirHoja_();
  if (hoja.getLastRow() < 2) return json({ ok: true, registros: [] });

  var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 6).getValues();
  var registros = filas.map(function (f) {
    return {
      fecha:    f[0] ? new Date(f[0]).toISOString() : '',
      nombre:   f[1],
      email:    f[2],
      telefono: f[3],
      tipo:     f[4],
      origen:   f[5]
    };
  });
  return json({ ok: true, registros: registros });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Clic en **Guardar** 💾 (o `Ctrl+S`).

## Paso 3 · Publícalo
1. Botón azul **Implementar → Nueva implementación**
2. Clic en el engrane ⚙️ (junto a "Selecciona el tipo") → **Aplicación web**
3. Configura:
   - **Descripción:** `iogga lista de espera`
   - **Ejecutar como:** *Yo* (tu correo)
   - **Quién tiene acceso:** **Cualquier persona** ← 🔴 importantísimo
4. **Implementar**
5. Google pedirá permisos:
   - **Autorizar acceso** → elige tu cuenta
   - Saldrá *"Google no verificó esta aplicación"* → **Configuración avanzada** →
     **Ir a (nombre del proyecto) (no seguro)** → **Permitir**
   *(Es tu propio script en tu propia hoja. Es seguro.)*
6. Copia la **URL de la aplicación web**. Termina en `/exec`:
   ```
   https://script.google.com/macros/s/AKfy........./exec
   ```

## Paso 4 · Pásame la URL
Mándame esa URL por aquí y yo la conecto en los dos archivos.

**O si lo quieres hacer tú**, son dos líneas:

- En **`index.html`** busca `var WAITLIST_ENDPOINT = "";` → pega la URL entre las comillas.
- En **`panel.html`** busca `var ENDPOINT = "";` → pega **la misma URL**.

---

## Cómo consultar los registros

### Opción A — El panel del sitio
Entra a **`www.iogga.com/panel.html`**, escribe tu clave y verás:
- Total de registros, cuántos son negocios, cuántos dejaron teléfono, cuántos hoy
- Tabla con buscador por nombre, correo o teléfono
- **Descargar CSV** (abre en Excel) y **Copiar como texto**

La página no está enlazada en el sitio, lleva `noindex` y está bloqueada en `robots.txt`.
Sin la clave, el script no devuelve nada.

### Opción B — Tu Hoja de Google
Ábrela directo. Cada registro llega solo, con su fecha.

**Para que te llegue un correo con cada registro:**
en la hoja → **Herramientas → Reglas de notificación →** *Notificarme cuando se realicen
cambios* → *Enviar un correo electrónico de inmediato*.

---

## Mientras tanto
Si no está configurado, el formulario abre el correo del visitante con sus datos prellenados
hacia `admin@iogga.com`. Funciona, pero es manual.
