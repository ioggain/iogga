# Pagos de iogga (Mercado Pago) — cómo se despliega

El dinero fluye así (modelo Costco/Starbucks: pagas antes, canjeas después):

1. La persona **selecciona la promo** (cuenta en "Seleccionados").
2. Al **descargar su QR**, paga en la pantalla segura de Mercado Pago
   (tarjeta, dinero en cuenta MP, SPEI u OXXO). iogga **nunca** ve la tarjeta.
3. El dinero entra a la cuenta de Mercado Pago de iogga, con concepto,
   **folio del QR**, nombre de la persona y fecha.
4. Al **escanear el QR en el negocio**, el canje queda concretado; en el panel
   de administrador se ve cuánto **dispersarle al negocio** (monto − comisión)
   a la **CLABE** que el negocio registró en su perfil (SPEI).

## Requisitos (una sola vez)

1. Firebase en plan **Blaze** (Functions lo requiere).
2. En una terminal con firebase-tools (`npm i -g firebase-tools`, `firebase login`):

```bash
cd functions && npm install && cd ..
firebase functions:secrets:set MP_ACCESS_TOKEN   # pegar el Access Token cuando lo pida
firebase deploy --only functions --project iogga-b932b
```

- Para PRUEBAS usar el Access Token de prueba; para dinero real, el productivo.
- La comisión se cambia con la variable `IOGGA_FEE_PCT` (por defecto 10):
  se define en `functions/.env` (`IOGGA_FEE_PCT=10`) antes de desplegar.

## Endpoints que expone

- `createPreference` — la app lo llama al descargar el QR; devuelve el link
  de pago (`init_point`).
- `mpWebhook` — Mercado Pago avisa aquí cada pago; se guarda en la colección
  `payments` y la comisión aprobada se suma al libro `ledger` (visible en el
  panel de administrador).

## Nota de seguridad

El Access Token **jamás** va en el código ni en el repositorio: vive como
secreto de Firebase. El Public Key sí es público por diseño (va en la app).
