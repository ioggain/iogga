/**
 * iogga — Lista de espera
 * Recibe los registros de www.iogga.com y los guarda en la Hoja de Google.
 * También los devuelve al panel privado (www.iogga.com/panel.html).
 *
 * Publicar: Implementar → Nueva implementación → Aplicación web
 *           Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona
 */

// ————— Configuración —————
//
// LA CLAVE DEL PANEL YA NO VIVE AQUÍ.
// Este archivo está en GitHub, en un repositorio PÚBLICO. Cualquier persona
// del mundo podía leerlo, y con esa clave entrar a www.iogga.com/panel.html y
// descargarse la lista de espera completa: nombres, correos y teléfonos de
// gente real. Eso son datos personales, y protegerlos no es opcional.
//
// Ahora la clave vive dentro de Apps Script, donde nadie la ve:
//   Configuración del proyecto → Propiedades del script → Agregar propiedad
//   Nombre: CLAVE      Valor: la clave nueva que elijas
//
// Importante: elige una clave NUEVA. La anterior estuvo publicada, así que ya
// no sirve aunque se cambie de lugar.
function clave_() {
  return PropertiesService.getScriptProperties().getProperty('CLAVE') || '';
}

// El ID de la hoja NO es un secreto: para abrirla hace falta permiso de Google,
// no basta con conocer el número.
var HOJA_ID = '18reM1EwWa5IYikIF6OkHpZiuRuh6yTCPorAP_Gv8240';

var ENCABEZADOS = ['Fecha', 'Nombre', 'Correo', 'Teléfono', 'Tipo', 'Origen'];


/** Abre la primera hoja del archivo y crea los encabezados si faltan. */
function abrirHoja_() {
  var hoja = SpreadsheetApp.openById(HOJA_ID).getSheets()[0];
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold');
    hoja.setFrozenRows(1);
    hoja.setColumnWidth(1, 150);
    hoja.setColumnWidth(2, 180);
    hoja.setColumnWidth(3, 230);
  }
  return hoja;
}


/** Guarda un registro nuevo. Lo llama el formulario del sitio. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var p = (e && e.parameter) || {};

    if (!p.nombre && !p.email) {
      return json_({ ok: false, error: 'faltan datos' });
    }

    abrirHoja_().appendRow([
      new Date(),
      p.nombre   || '',
      p.email    || '',
      p.telefono || '',
      p.tipo     || '',
      p.origen   || ''
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}


/** Devuelve todos los registros. Requiere la clave. Lo usa el panel. */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    // Si la clave no está configurada, NO se abre a nadie. Es a propósito:
    // más vale que el panel no entre a que entre todo el mundo.
    var esperada = clave_();
    if (!esperada || p.key !== esperada) {
      return json_({ ok: false, error: 'clave incorrecta' });
    }

    var hoja = abrirHoja_();
    if (hoja.getLastRow() < 2) {
      return json_({ ok: true, registros: [] });
    }

    var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, ENCABEZADOS.length).getValues();
    var registros = filas
      .filter(function (f) { return f[1] || f[2]; })
      .map(function (f) {
        return {
          fecha:    f[0] instanceof Date ? f[0].toISOString() : String(f[0] || ''),
          nombre:   String(f[1] || ''),
          email:    String(f[2] || ''),
          telefono: String(f[3] || ''),
          tipo:     String(f[4] || ''),
          origen:   String(f[5] || '')
        };
      });

    return json_({ ok: true, registros: registros });
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
 * Escribe un registro de prueba y lo vuelve a leer.
 * Si ves "TODO BIEN" en el registro de ejecución, ya quedó.
 */
function probar() {
  var guardado = doPost({ parameter: {
    nombre: 'Registro de prueba',
    email: 'prueba@iogga.com',
    telefono: '614 000 0000',
    tipo: 'Usuario',
    origen: 'prueba'
  }});
  Logger.log('Guardar: ' + guardado.getContent());

  var leido = JSON.parse(doGet({ parameter: { key: clave_() } }).getContent());
  Logger.log('Leer: ' + leido.registros.length + ' registro(s)');

  if (leido.ok && leido.registros.length > 0) {
    Logger.log('✅ TODO BIEN — ya puedes implementar.');
    Logger.log('Borra la fila de prueba de la hoja cuando quieras.');
  } else {
    Logger.log('⚠️ Algo falló. Revisa que HOJA_ID sea correcto y que');
    Logger.log('   la propiedad CLAVE esté puesta en Configuración del proyecto.');
  }
}
