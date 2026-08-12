/* ============================================================
   EdwCorp — Envío de lo que se captura en el sitio

   Cada solicitud sale por DOS caminos independientes:

   1) FormSubmit  → manda el correo a EDW_CORREO.
      No necesita cuenta ni configuración. Es el camino principal
      del correo, para que nunca se pierda una solicitud.

   2) Apps Script → guarda la fila en la hoja de cálculo.
      Solo se usa si EDW_ENDPOINT tiene una URL en config.js.

   Si uno de los dos falla, el otro sigue funcionando.
   ============================================================ */

(function () {
  "use strict";

  var CORREO = (typeof EDW_CORREO !== "undefined" && EDW_CORREO) ? EDW_CORREO : "admin@edwcorp.org";

  /* --- Camino 1: correo por FormSubmit --- */
  function porCorreo(datos, asunto) {
    var cuerpo = { _subject: asunto, _captcha: "false", _template: "table" };
    Object.keys(datos).forEach(function (k) {
      if (k.charAt(0) !== "_" && datos[k] !== "" && datos[k] != null) cuerpo[k] = datos[k];
    });

    return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(CORREO), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(cuerpo)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) { return !!(res && (res.success === true || res.success === "true")); })
      .catch(function () { return false; });
  }

  /* --- Camino 2: base de datos por Apps Script --- */
  function porHoja(datos) {
    var url = (typeof EDW_ENDPOINT !== "undefined") ? EDW_ENDPOINT : "";
    if (!url) return Promise.resolve(false);

    return fetch(url, { method: "POST", body: new URLSearchParams(datos) })
      .then(function (r) { return r.json(); })
      .then(function (res) { return !!(res && res.ok); })
      .catch(function () { return false; });
  }

  /**
   * Manda un registro por los dos caminos.
   * Devuelve { ok, correo, hoja } — ok es true si al menos uno funcionó.
   */
  window.edwEnviar = function (datos, asunto) {
    return Promise.all([
      porCorreo(datos, asunto || "EdwCorp — Nuevo registro del sitio"),
      porHoja(datos)
    ]).then(function (r) {
      return { ok: r[0] || r[1], correo: r[0], hoja: r[1] };
    });
  };
})();
