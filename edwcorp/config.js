/* ============================================================
   EdwCorp — Configuración del sitio

   Este es el ÚNICO archivo que hay que tocar para conectar el
   formulario y el diagnóstico con la base de datos.

   La URL va SIEMPRE adentro de las comillas de EDW_ENDPOINT.
   Si se pega en cualquier otro lugar, el archivo se rompe y el
   formulario deja de enviar.
   ============================================================ */

var EDW_ENDPOINT = "https://script.google.com/macros/s/AKfycbxrQvVPWaxlt_ikZDIGFJjs_qCkS-Z72l63cwP5Et_ZDGNzjND32dobwg0CDNj9cqA0Ag/exec";

/* A DÓNDE LLEGAN LOS AVISOS.
   Puedes poner varias direcciones: la solicitud se manda a todas.
   Basta con que una funcione para no perder el prospecto. */
var EDW_CORREOS = [
  "proyectos@edwcorp.org"
];

/* Se usa como respaldo si no hay forma de enviar. */
var EDW_CORREO = EDW_CORREOS[0];
