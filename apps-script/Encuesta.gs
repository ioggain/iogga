/**
 * iogga — Estadísticas en vivo de la encuesta de validación
 *
 * Lee la hoja de respuestas y devuelve SOLO conteos agregados.
 * Nunca sale un nombre, un correo ni un teléfono: la hoja tiene datos
 * personales y esos jamás se publican.
 *
 * Publicar: Implementar → Nueva implementación → Aplicación web
 *           Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona
 */

var HOJA_ENCUESTA = '117InxvRGPxi6k1uP4Z-t_dpJ1XeoJG3HjcU30PIQ3JQ';

// Columnas que NUNCA se leen, aunque cambien de lugar.
var PROHIBIDAS = ['teléfono', 'telefono', 'correo', 'email', 'nombre', 'whatsapp', 'escribe tu'];


function doGet() {
  try {
    var hoja  = SpreadsheetApp.openById(HOJA_ENCUESTA).getSheets()[0];
    var filas = hoja.getDataRange().getValues();
    if (filas.length < 2) return json_({ ok: true, total: 0 });

    var cab = filas[0].map(function (c) { return String(c).toLowerCase(); });
    var datos = filas.slice(1).filter(function (f) {
      return f.join('').trim() !== '';
    });

    // Busca una columna por fragmentos, saltando las prohibidas.
    function col(frags) {
      for (var i = 0; i < cab.length; i++) {
        var prohibida = PROHIBIDAS.some(function (p) { return cab[i].indexOf(p) > -1; });
        if (prohibida) continue;
        var coincide = frags.every(function (f) { return cab[i].indexOf(f.toLowerCase()) > -1; });
        if (coincide) return i;
      }
      return -1;
    }

    // Cuenta valores de una columna. multi = respuestas separadas por ';'
    function contar(idx, multi) {
      var c = {};
      if (idx < 0) return c;
      datos.forEach(function (f) {
        var v = String(f[idx] || '').trim();
        if (!v) return;
        var partes = multi ? v.split(';') : [v];
        partes.forEach(function (p) {
          p = p.trim();
          if (p) c[p] = (c[p] || 0) + 1;
        });
      });
      return c;
    }

    // Ordena de mayor a menor y recorta.
    function top(obj, n) {
      return Object.keys(obj)
        .map(function (k) { return { k: k, v: obj[k] }; })
        .sort(function (a, b) { return b.v - a.v; })
        .slice(0, n || 8);
    }

    // Agrupa las variantes de una respuesta ("Sí", "si", "Sí, claro"…)
    function agrupar(obj) {
      var r = { si: 0, tal_vez: 0, no: 0 };
      Object.keys(obj).forEach(function (k) {
        var s = k.toLowerCase();
        if (s.indexOf('no lo sé') === 0 || s.indexOf('no lo se') === 0 ||
            s.indexOf('tal vez') > -1 || s.indexOf('depende') > -1) r.tal_vez += obj[k];
        else if (s.indexOf('no') === 0) r.no += obj[k];
        else if (s.indexOf('s') === 0) r.si += obj[k];
      });
      return r;
    }

    var iDesc  = col(['descargarías', 'organizar']);
    var iNeg   = col(['descargarías', 'publicar']);
    var iCanal = col(['cómo sueles planear']);
    var iEdad  = col(['edad']);
    var iAct   = col(['tipos de planes']);

    var total = datos.length;
    var desc  = agrupar(contar(iDesc, false));
    var neg   = agrupar(contar(iNeg, false));

    // Fecha del último registro (primera columna = marca temporal)
    var ultimo = '';
    for (var j = datos.length - 1; j >= 0; j--) {
      if (datos[j][0]) { ultimo = new Date(datos[j][0]).toISOString(); break; }
    }

    return json_({
      ok: true,
      total: total,
      actualizado: new Date().toISOString(),
      ultimaRespuesta: ultimo,
      descargaria: desc,
      pctSi: total ? Math.round(100 * desc.si / (desc.si + desc.tal_vez + desc.no)) : 0,
      negocios: neg,
      canales: top(contar(iCanal, true), 6),
      edades: top(contar(iEdad, false), 6),
      actividades: top(contar(iAct, true), 6)
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}


function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * PRUEBA — selecciona "probar" y dale ▶ Ejecutar.
 * Revisa en el registro que los conteos tengan sentido.
 */
function probar() {
  var r = JSON.parse(doGet().getContent());
  if (!r.ok) { Logger.log('⚠️ ' + r.error); return; }
  Logger.log('Total de respuestas: ' + r.total);
  Logger.log('Descargaría: sí=' + r.descargaria.si + ' · tal vez=' + r.descargaria.tal_vez + ' · no=' + r.descargaria.no);
  Logger.log('% que sí: ' + r.pctSi + '%');
  Logger.log('Canales: ' + JSON.stringify(r.canales));
  Logger.log('Edades: ' + JSON.stringify(r.edades));
  Logger.log(r.total > 0 ? '✅ TODO BIEN — ya puedes implementar.' : '⚠️ No se leyeron respuestas.');
}
