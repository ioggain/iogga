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

  function destinos() {
    if (typeof EDW_CORREOS !== "undefined" && EDW_CORREOS && EDW_CORREOS.length) return EDW_CORREOS;
    if (typeof EDW_CORREO !== "undefined" && EDW_CORREO) return [EDW_CORREO];
    return ["proyectos@edwcorp.org"];
  }

  /* --- Camino 1: correo por FormSubmit, a todas las direcciones de la lista --- */
  function aUno(correo, cuerpo) {
    return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(correo), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(cuerpo)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) { return !!(res && (res.success === true || res.success === "true")); })
      .catch(function () { return false; });
  }

  function porCorreo(datos, asunto) {
    var cuerpo = { _subject: asunto, _captcha: "false", _template: "table" };
    Object.keys(datos).forEach(function (k) {
      if (k.charAt(0) !== "_" && datos[k] !== "" && datos[k] != null) cuerpo[k] = datos[k];
    });

    return Promise.all(destinos().map(function (c) { return aUno(c, cuerpo); }))
      .then(function (r) { return r.some(Boolean); });
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
