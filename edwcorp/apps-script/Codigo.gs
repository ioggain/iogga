/**
 * EdwCorp — Solicitudes de propuesta
 * Recibe el formulario de www.edwcorp.org, lo guarda en una Hoja de Google
 * y envía un aviso por correo para no perder ninguna solicitud.
 *
 * Cómo publicarlo:
 *   1. Crea una Hoja de Google nueva y copia su ID (lo que va entre /d/ y /edit en la URL).
 *   2. script.google.com → Nuevo proyecto → pega este archivo.
 *   3. Cambia HOJA_ID y AVISO_A abajo.
 *   4. Ejecuta la función "probar" una vez y acepta los permisos.
 *   5. Implementar → Nueva implementación → Aplicación web
 *        Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona
 *   6. Copia la URL que termina en /exec y pégala en index.html:
 *        var FORM_ENDPOINT = "https://script.google.com/macros/s/.../exec";
 */

// ————— Configuración —————
var HOJA_ID = 'PEGA_AQUI_EL_ID_DE_TU_HOJA';
var AVISO_A = 'admin@edwcorp.org';   // a dónde llega el aviso de cada solicitud
var CLAVE   = 'CAMBIA-ESTA-CLAVE'; // para consultar las solicitudes por GET

var ENCABEZADOS = ['Fecha', 'Nombre', 'Organización', 'Correo', 'Teléfono', 'Necesidad', 'Mensaje', 'Origen'];


/** Abre la primera hoja del archivo y crea los encabezados si faltan. */
function abrirHoja_() {
  var hoja = SpreadsheetApp.openById(HOJA_ID).getSheets()[0];
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold');
    hoja.setFrozenRows(1);
    hoja.setColumnWidth(1, 150);
    hoja.setColumnWidth(2, 180);
    hoja.setColumnWidth(3, 180);
    hoja.setColumnWidth(4, 220);
    hoja.setColumnWidth(7, 380);
  }
  return hoja;
}


/** Guarda una solicitud nueva. La llama el formulario del sitio. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var p = (e && e.parameter) || {};

    if (!p.nombre || !p.correo) {
      return json_({ ok: false, error: 'faltan datos' });
    }

    abrirHoja_().appendRow([
      new Date(),
      p.nombre       || '',
      p.organizacion || '',
      p.correo       || '',
      p.telefono     || '',
      p.necesidad    || '',
      p.mensaje      || '',
      p.origen       || ''
    ]);

    avisar_(p);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}


/** Manda un correo con la solicitud. Si algo falla, no rompe el guardado. */
function avisar_(p) {
  try {
    if (!AVISO_A) return;
    var cuerpo =
      'Nueva solicitud de propuesta desde el sitio.\n\n' +
      'Nombre: '       + (p.nombre || '') + '\n' +
      'Organización: ' + (p.organizacion || '') + '\n' +
      'Correo: '       + (p.correo || '') + '\n' +
      'Teléfono: '     + (p.telefono || '') + '\n' +
      'Necesidad: '    + (p.necesidad || '') + '\n\n' +
      'Mensaje:\n'     + (p.mensaje || '');

    MailApp.sendEmail({
      to: AVISO_A,
      subject: 'EdwCorp — Solicitud de ' + (p.organizacion || p.nombre || 'contacto'),
      body: cuerpo,
      replyTo: p.correo || AVISO_A
    });
  } catch (err) {
    Logger.log('No se pudo enviar el aviso: ' + err);
  }
}


/** Devuelve todas las solicitudes. Requiere la clave. */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.key !== CLAVE) {
      return json_({ ok: false, error: 'clave incorrecta' });
    }

    var hoja = abrirHoja_();
    if (hoja.getLastRow() < 2) {
      return json_({ ok: true, solicitudes: [] });
    }

    var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, ENCABEZADOS.length).getValues();
    var solicitudes = filas
      .filter(function (f) { return f[1] || f[3]; })
      .map(function (f) {
        return {
          fecha:        f[0] instanceof Date ? f[0].toISOString() : String(f[0] || ''),
          nombre:       String(f[1] || ''),
          organizacion: String(f[2] || ''),
          correo:       String(f[3] || ''),
          telefono:     String(f[4] || ''),
          necesidad:    String(f[5] || ''),
          mensaje:      String(f[6] || ''),
          origen:       String(f[7] || '')
        };
      });

    return json_({ ok: true, solicitudes: solicitudes });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}


/** Respuesta JSON. */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * PRUEBA — selecciona "probar" arriba y dale ▶ Ejecutar.
 * Escribe una solicitud de prueba y la vuelve a leer.
 */
function probar() {
  var guardado = doPost({ parameter: {
    nombre: 'Solicitud de prueba',
    organizacion: 'Empresa Demo',
    correo: 'prueba@edwcorp.org',
    telefono: '614 000 0000',
    necesidad: 'Programa de capacitación corporativa',
    mensaje: 'Esto es una prueba del formulario.',
    origen: 'prueba'
  }});
  Logger.log('Guardar: ' + guardado.getContent());

  var leido = JSON.parse(doGet({ parameter: { key: CLAVE } }).getContent());
  Logger.log('Leer: ' + (leido.solicitudes || []).length + ' solicitud(es)');

  if (leido.ok && leido.solicitudes.length > 0) {
    Logger.log('✅ TODO BIEN — ya puedes implementar.');
    Logger.log('Borra la fila de prueba de la hoja cuando quieras.');
  } else {
    Logger.log('⚠️ Algo falló. Revisa que HOJA_ID sea correcto.');
  }
}
