# Base de datos de la lista de espera (gratis, 10 minutos)

Guarda **nombre, correo, teléfono y tipo** de cada persona que se registra en iogga.com,
directo en una **Hoja de Google** que puedes abrir cuando quieras.

Es gratis, sin límite de registros, y los datos son 100% tuyos.

---

## Paso 1 · Crea la hoja
1. Entra a [sheets.new](https://sheets.new) (crea una hoja nueva).
2. Ponle de nombre: **iogga — Lista de espera**.
3. **Guarda el enlace de esa hoja**: ese es tu link para consultar los registros. ✅

## Paso 2 · Pega el código
1. En la hoja, ve al menú **Extensiones → Apps Script**.
2. Borra todo lo que aparezca y **pega este código**:

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Encabezados la primera vez
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

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

3. Haz clic en **Guardar** (el ícono del disquete).

## Paso 3 · Publícalo
1. Arriba a la derecha, botón azul **Implementar → Nueva implementación**.
2. En el engrane ⚙️ elige **Aplicación web**.
3. Configura así:
   - **Ejecutar como:** Yo (tu correo)
   - **Quién tiene acceso:** **Cualquier persona**  ← importante
4. Clic en **Implementar**.
5. Google te pedirá permisos → **Autorizar acceso** → elige tu cuenta →
   *"Google no verificó esta app"* → **Configuración avanzada** → **Ir a (nombre) (no seguro)** → **Permitir**.
   *(Es tu propio script; es seguro.)*
6. Copia la **URL de la aplicación web**. Se ve así:
   `https://script.google.com/macros/s/AKfy...largo.../exec`

## Paso 4 · Conéctalo al sitio
En `index.html`, busca esta línea (está cerca del inicio del `<script>`):

```javascript
var WAITLIST_ENDPOINT = "";
```

Y pega tu URL entre las comillas:

```javascript
var WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
```

Guarda y haz commit. ¡Listo! 🎉

---

## Cómo consultar los registros
Solo abre tu **Hoja de Google**. Cada registro aparece automáticamente con fecha, nombre,
correo, teléfono y tipo. Puedes filtrar, ordenar y descargar en Excel o CSV.

### Recibir un correo cuando alguien se registre (opcional)
En la hoja: **Herramientas → Reglas de notificación → Notificarme cuando… se realicen cambios →
Enviar un correo electrónico de inmediato.**

---

## ¿Y mientras tanto?
Si `WAITLIST_ENDPOINT` está vacío, el formulario **abre el correo del visitante** con sus datos
prellenados hacia `omareduardo_@hotmail.com`. Funciona, pero es manual — por eso conviene
hacer los 4 pasos de arriba.
