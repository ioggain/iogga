/**
 * EdwCorp — Base de datos del sitio
 * =================================
 * Recibe lo que la gente manda desde www.edwcorp.org y lo guarda en una
 * Hoja de Google, en dos pestañas:
 *   · Solicitudes  → el formulario de contacto
 *   · Diagnósticos → quien completa el diagnóstico de madurez
 *
 * El AVISO POR CORREO ya lo manda el sitio por su cuenta, así que este
 * script solo se encarga del histórico. Así no llegan correos duplicados.
 *
 * NO HAY QUE CONFIGURAR NADA. La hoja de cálculo se crea sola la primera
 * vez que ejecutas la función "probar". El enlace aparece en el registro.
 */

// ————— Lo único que puedes querer cambiar —————
// Déjalo vacío: el correo ya lo manda el sitio.
// Si quieres además una copia desde aquí, escribe la dirección entre comillas.
var AVISO_A = '';
var CLAVE   = 'edw-8JtWe-rMZLS-RkFUa';  // para consultar los datos desde fuera


// ============================================================
//  De aquí para abajo no hace falta tocar nada.
// ============================================================

var COL_SOLICITUDES  = ['Fecha', 'Nombre', 'Organización', 'Correo', 'Teléfono', 'Necesidad', 'Mensaje', 'Origen'];
var COL_DIAGNOSTICOS = ['Fecha', 'Puntaje', 'Nivel', 'Área más floja', 'Correo', 'Nombre', 'Organización', 'Origen'];


/** Devuelve el ID de la hoja. La crea la primera vez. */
function idHoja_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('HOJA_ID');
  if (id) return id;

  var ss = SpreadsheetApp.create('EdwCorp — Base de datos del sitio');
  ss.getSheets()[0].setName('Solicitudes');
  ss.insertSheet('Diagnósticos');
  props.setProperty('HOJA_ID', ss.getId());
  return ss.getId();
}


/** Abre una pestaña por nombre y le pone encabezados si está vacía. */
function hoja_(nombre, columnas) {
  var ss = SpreadsheetApp.openById(idHoja_());
  var h = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  if (h.getLastRow() === 0) {
    h.appendRow(columnas);
    h.getRange(1, 1, 1, columnas.length).setFontWeight('bold').setBackground('#eaf3fa');
    h.setFrozenRows(1);
    h.setColumnWidth(1, 150);
    h.setColumnWidth(2, 180);
    h.setColumnWidth(3, 180);
    h.setColumnWidth(4, 220);
  }
  return h;
}


/** Recibe lo que manda el sitio. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var p = (e && e.parameter) || {};
    var tipo = p.tipo || 'solicitud';

    if (tipo === 'diagnostico') {
      hoja_('Diagnósticos', COL_DIAGNOSTICOS).appendRow([
        new Date(),
        p.puntaje      || '',
        p.nivel        || '',
        p.area_debil   || '',
        p.correo       || '',
        p.nombre       || '',
        p.organizacion || '',
        p.origen       || ''
      ]);
      if (p.correo) avisarDiagnostico_(p);
      return json_({ ok: true });
    }

    if (!p.nombre || !p.correo) {
      return json_({ ok: false, error: 'faltan datos' });
    }

    hoja_('Solicitudes', COL_SOLICITUDES).appendRow([
      new Date(),
      p.nombre       || '',
      p.organizacion || '',
      p.correo       || '',
      p.telefono     || '',
      p.necesidad    || '',
      p.mensaje      || '',
      p.origen       || ''
    ]);
    avisarSolicitud_(p);
    return json_({ ok: true });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}


/** Aviso de una solicitud del formulario. */
function avisarSolicitud_(p) {
  try {
    if (!AVISO_A) return;
    MailApp.sendEmail({
      to: AVISO_A,
      subject: 'EdwCorp — Solicitud de ' + (p.organizacion || p.nombre || 'contacto'),
      replyTo: p.correo || AVISO_A,
      body:
        'Nueva solicitud desde el sitio.\n\n' +
        'Nombre: '       + (p.nombre || '') + '\n' +
        'Organización: ' + (p.organizacion || '') + '\n' +
        'Correo: '       + (p.correo || '') + '\n' +
        'Teléfono: '     + (p.telefono || '') + '\n' +
        'Necesidad: '    + (p.necesidad || '') + '\n\n' +
        'Mensaje:\n'     + (p.mensaje || '') + '\n\n' +
        '— Puedes responder directamente a este correo.'
    });
  } catch (err) {
    Logger.log('No se pudo enviar el aviso: ' + err);
  }
}


/** Aviso de un diagnóstico en el que sí dejaron correo. */
function avisarDiagnostico_(p) {
  try {
    if (!AVISO_A) return;
    MailApp.sendEmail({
      to: AVISO_A,
      subject: 'EdwCorp — Diagnóstico completado (' + (p.puntaje || '?') + '/30)',
      replyTo: p.correo || AVISO_A,
      body:
        'Alguien terminó el diagnóstico y dejó su correo.\n\n' +
        'Correo: '         + (p.correo || '') + '\n' +
        'Nombre: '         + (p.nombre || '') + '\n' +
        'Organización: '   + (p.organizacion || '') + '\n' +
        'Puntaje: '        + (p.puntaje || '') + '/30\n' +
        'Nivel: '          + (p.nivel || '') + '\n' +
        'Área más floja: ' + (p.area_debil || '') + '\n\n' +
        '— Puedes responder directamente a este correo.'
    });
  } catch (err) {
    Logger.log('No se pudo enviar el aviso: ' + err);
  }
}


/** Devuelve los datos en JSON. Requiere la clave. */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.key !== CLAVE) return json_({ ok: false, error: 'clave incorrecta' });

    return json_({
      ok: true,
      solicitudes:  leer_('Solicitudes',  COL_SOLICITUDES),
      diagnosticos: leer_('Diagnósticos', COL_DIAGNOSTICOS)
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}


/** Lee una pestaña y la devuelve como lista de objetos. */
function leer_(nombre, columnas) {
  var h = hoja_(nombre, columnas);
  if (h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, columnas.length).getValues().map(function (f) {
    var o = {};
    columnas.forEach(function (c, i) {
      o[c] = f[i] instanceof Date ? f[i].toISOString() : String(f[i] || '');
    });
    return o;
  });
}


/** Respuesta JSON. */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * ▶ PRUEBA — selecciona "probar" arriba y dale Ejecutar.
 * Crea la hoja si no existe, guarda dos registros de ejemplo y te manda
 * el correo de aviso. Al final imprime el enlace de tu hoja.
 */
function probar() {
  doPost({ parameter: {
    tipo: 'solicitud',
    nombre: 'Solicitud de prueba',
    organizacion: 'Empresa Demo',
    correo: 'prueba@edwcorp.org',
    telefono: '614 000 0000',
    necesidad: 'Programa de capacitación a la medida',
    mensaje: 'Esto es una prueba del formulario.',
    origen: 'prueba'
  }});

  doPost({ parameter: {
    tipo: 'diagnostico',
    puntaje: '15',
    nivel: 'En desarrollo',
    area_debil: 'Medición de impacto',
    correo: 'prueba@edwcorp.org',
    origen: 'prueba'
  }});

  var datos = JSON.parse(doGet({ parameter: { key: CLAVE } }).getContent());
  Logger.log('Solicitudes guardadas:  ' + datos.solicitudes.length);
  Logger.log('Diagnósticos guardados: ' + datos.diagnosticos.length);

  if (datos.ok && datos.solicitudes.length > 0) {
    Logger.log('✅ TODO BIEN — ya puedes implementar.');
    Logger.log('Tu base de datos: ' + verHoja());
    Logger.log('Ábrela, revisa las dos pestañas y borra las filas de prueba.');
  } else {
    Logger.log('⚠️ Algo falló. Vuelve a ejecutar y revisa el error de arriba.');
  }
}


/** Imprime el enlace de tu hoja de cálculo. */
function verHoja() {
  var url = SpreadsheetApp.openById(idHoja_()).getUrl();
  Logger.log(url);
  return url;
}
