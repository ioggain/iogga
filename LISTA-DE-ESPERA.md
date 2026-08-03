# Base de datos de la lista de espera

Guarda **nombre, correo, teléfono y tipo** de cada persona que se registra en iogga.com.
Los datos quedan en una **Hoja de Google tuya**, y además puedes consultarlos y exportarlos
desde el **panel privado** del propio sitio: `iogga.com/panel.html`

Es gratis, sin límite de registros, y los datos son 100% tuyos.

> **Por qué necesitas hacer esto tú:** GitHub Pages solo sirve archivos, no puede guardar datos.
> La información tiene que vivir en una cuenta que tú controles — y yo no puedo crear cuentas
> a tu nombre. Son 10 minutos, una sola vez.

---

## Paso 1 · Crea la hoja
1. Entra a [sheets.new](https://sheets.new).
2. Ponle de nombre: **iogga — Lista de espera**.

## Paso 2 · Pega el código
1. En la hoja: menú **Extensiones → Apps Script**.
2. Borra todo y pega esto:

```javascript
// ⚠️ CAMBIA ESTA CLAVE por una tuya (la usarás para entrar al panel)
var CLAVE = 'iogga2026';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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
  if (p.key !== CLAVE) {
    return json({ ok: false, error: 'clave incorrecta' });
  }
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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

3. **Cambia `iogga2026`** por la clave que tú quieras. Anótala: es la que usarás para entrar al panel.
4. Clic en **Guardar** 💾.

## Paso 3 · Publícalo
1. Botón azul **Implementar → Nueva implementación**.
2. Engrane ⚙️ → **Aplicación web**.
3. Configura:
   - **Ejecutar como:** Yo (tu cuenta)
   - **Quién tiene acceso:** **Cualquier persona** ← importante
4. **Implementar** → Google pide permisos → **Autorizar acceso** → tu cuenta →
   *"Google no verificó esta app"* → **Configuración avanzada** → **Ir a … (no seguro)** → **Permitir**.
   *(Es tu propio script, es seguro.)*
5. Copia la **URL de la aplicación web**:
   `https://script.google.com/macros/s/AKfy…/exec`

## Paso 4 · Conéctala (2 archivos)

**a) En `index.html`** — busca esta línea dentro del `<script>`:
```javascript
var WAITLIST_ENDPOINT = "";
```
y pega tu URL:
```javascript
var WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
```

**b) En `panel.html`** — busca:
```javascript
var ENDPOINT = "";
```
y pega **la misma URL**:
```javascript
var ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
```

Guarda los dos y haz commit. ¡Listo! 🎉

---

## Cómo consultar los registros

### Opción A — El panel del sitio (recomendado)
Entra a **`iogga.com/panel.html`**, escribe tu clave y verás:
- Total de registros, cuántos son negocios, cuántos dejaron teléfono y cuántos se registraron hoy.
- Tabla completa con buscador (por nombre, correo o teléfono).
- **Descargar CSV** (se abre en Excel) y **Copiar como texto**.

Esta página **no está enlazada** desde ningún lado del sitio y lleva `noindex`, así que no
aparece en Google. Solo entra quien conoce la dirección **y** la clave.

### Opción B — La Hoja de Google
Abre tu hoja directamente. Cada registro llega solo, con fecha.
Para recibir un correo cuando alguien se registre:
**Herramientas → Reglas de notificación → Notificarme cuando se realicen cambios → De inmediato.**

---

## Seguridad
- La clave viaja en la petición y se guarda solo en tu navegador (durante la sesión).
- Sin la clave, el script **no devuelve ningún dato**.
- Cambia la clave cuando quieras: edítala en el Apps Script y vuelve a implementar.
- Si quieres una dirección aún más difícil de adivinar, renombra `panel.html` a algo como
  `panel-9f3a2.html`. Nadie más la conoce.

## Si aún no lo configuras
El formulario del sitio abre el correo del visitante con sus datos prellenados hacia
`admin@iogga.com`. Funciona, pero es manual — por eso conviene hacer los 4 pasos.
