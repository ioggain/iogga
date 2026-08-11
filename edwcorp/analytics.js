/* ============================================================
   EdwCorp — Analítica del sitio (Google Analytics 4)

   PARA ACTIVARLA: pega tu ID de medición aquí abajo y guarda.
   El ID se ve así: G-XXXXXXXXXX
   Lo encuentras en analytics.google.com →
   Administrar → Flujos de datos → tu sitio → "ID de medición".

   Mientras esté vacío, el sitio funciona igual y no carga
   ningún rastreador ni cookie.
   ============================================================ */

var GA_ID = "";

/* ------------------------------------------------------------
   De aquí para abajo no hay nada que cambiar.
   ------------------------------------------------------------ */
(function () {
  "use strict";

  var activo = /^G-[A-Z0-9]+$/i.test(GA_ID);

  /* --- Carga de Google Analytics --- */
  if (activo) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  /* --- Registrar un evento. Se puede llamar desde cualquier página. --- */
  window.edwEvento = function (nombre, datos) {
    if (activo && typeof window.gtag === "function") {
      window.gtag("event", nombre, datos || {});
    }
  };

  /* --- Eventos que se detectan solos --- */
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";

    if (href.indexOf("wa.me") > -1) {
      window.edwEvento("whatsapp", { desde: location.pathname });
    } else if (href.indexOf("mailto:") === 0) {
      window.edwEvento("clic_correo", { desde: location.pathname });
    } else if (/catalogo\.html/.test(href)) {
      window.edwEvento("ver_catalogo", { desde: location.pathname });
    } else if (/diagnostico\.html/.test(href)) {
      window.edwEvento("abrir_diagnostico", { desde: location.pathname });
    } else if (/google\.com\/maps/.test(href)) {
      window.edwEvento("como_llegar", {});
    } else if (/instagram\.com|facebook\.com|linkedin\.com/.test(href)) {
      window.edwEvento("red_social", { red: href.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] });
    }
  }, true);

  /* --- Cuánto del sitio alcanzan a leer (una sola vez por umbral) --- */
  var vistos = {};
  addEventListener("scroll", function () {
    var alto = document.documentElement.scrollHeight - innerHeight;
    if (alto <= 0) return;
    var pct = Math.round((scrollY / alto) * 100);
    [25, 50, 75, 100].forEach(function (u) {
      if (pct >= u && !vistos[u]) {
        vistos[u] = true;
        window.edwEvento("scroll_" + u, { pagina: location.pathname });
      }
    });
  }, { passive: true });
})();
