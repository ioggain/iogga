# Política de calidad de iogga

Este documento explica **cómo se protege la app para que no llegue nada roto a
la gente**. Está escrito para que se entienda sin saber programar.

La regla de fondo es una sola:

> **Publicar algo roto es peor que no publicar.**
> Si algo falla en la revisión, la publicación se detiene y la gente se queda
> con la versión anterior, que sí funciona.

---

## 1. Las tres revisiones automáticas

Cada vez que se sube un cambio, GitHub corre estas tres revisiones **solo, sin
que nadie las pida**. Si cualquiera falla, sale en rojo y no se publica.

| Revisión | Qué busca | Por qué existe |
|---|---|---|
| **Tipos** | Errores de programación: llamar algo que no existe, mandar un texto donde iba un número | Atrapa el error antes de que exista |
| **Pruebas** | Que las reglas de negocio den el resultado correcto | Las reglas que ya se rompieron una vez no se vuelven a romper |
| **Construcción** | Que la app compile completa | Si no compila, no hay nada que publicar |

Más dos revisiones de seguridad:

- **Contraseñas olvidadas en el código**: busca claves privadas en cada subida.
  Las claves privadas nunca deben vivir en el código.
- **Actualizaciones de seguridad**: cada lunes GitHub revisa si alguna pieza que
  usa iogga tiene una falla conocida y propone la actualización él solo.

Para correr las tres revisiones en tu computadora antes de subir:

```
npm run verify
```

---

## 2. Qué se prueba, y por qué exactamente eso

No se prueba todo: se prueba **lo que ya falló alguna vez y costó caro**. Cada
prueba lleva escrito el error real que previene.

Viven en `src/lib/reglas.ts` (las reglas) y `src/lib/__tests__/reglas.test.ts`
(las pruebas).

### La comisión de iogga
**Lo que pasó:** el panel de administrador sumaba el **precio completo** de cada
venta como ingreso de iogga —dinero que es del negocio— y en un lugar del código
usaba 5% cuando el backend cobraba 10%. Los ingresos salían inflados.

**Lo que se prueba ahora:** que el neto del negocio más la comisión de iogga
**siempre** den exactamente el total. Nunca se pierde ni se inventa un peso.

### Cuándo termina un plan
**Lo que pasó:** planes que desaparecían del perfil de quien los creó.

**Lo que se prueba ahora:** que un plan sin hora dure hasta el final del día,
que "todo el día" llegue a las 23:59, que un plan de varios días termine el
último día y no el primero, y que un plan sin fecha nunca quede en el año 1970.

### La lectura de precios
**Lo que se prueba:** que entienda cómo escribe la gente (`$1,299.50`,
`199`, `$ 80 MXN`) y que lo que no es un precio valga cero en vez de romper.

> Esta prueba **encontró un error el día que se escribió**: un precio en
> negativo (`-5`) se leía como `5`, porque al quitarle los símbolos se perdía el
> signo. Ya está corregido.

### El tamaño de lo que se publica
**Lo que pasó:** una foto copiada de Google entraba sin comprimir, pesaba más de
lo que aguanta un registro, el servidor rechazaba el guardado **en silencio**, y
el plan "se publicaba" sin llegar nunca.

**Lo que se prueba ahora:** que una foto demasiado pesada se detecte **antes** de
intentar guardarla, para poder avisar en vez de fingir que se publicó.

---

## 3. Una sola fuente para cada dato

El error de la comisión pasó porque **el mismo número estaba escrito a mano en
cinco lugares**, y dos de ellos tenían un valor distinto.

Regla: **cada dato importante vive en un solo lugar y los demás lo leen de ahí.**

| Dato | Dónde vive |
|---|---|
| Comisión de iogga, neto del negocio, lectura de precios, caducidad de planes | `src/lib/reglas.ts` (con pruebas) |
| Contacto, redes y domicilio de iogga | `IOGGA_INFO` en `src/App.tsx` |
| Colores, tipografías y movimiento | `src/index.css` |
| Versión de la app | `src/lib/version.ts` |

---

## 4. Nada falla en silencio

El patrón que más daño ha hecho en este proyecto es el mismo siempre: **algo
falla, nadie se entera, y la app dice que todo salió bien.** Pasó con los pagos,
con la publicación de planes y con el guardado del perfil.

Reglas que lo evitan:

- **Publicar se confirma, no se supone.** Al publicar un plan o una oferta se
  espera la respuesta del servidor **y** se vuelve a leer para comprobar que
  quedó. Si falla, se dice por qué en palabras claras y lo escrito se queda en
  el formulario para reintentar.
- **Nunca `catch` vacío en algo que le importa a la persona.** Si un guardado
  falla, se avisa.
- **El despliegue avisa lo que no se actualizó.** Las reglas de seguridad y el
  backend de pagos no rompen el sitio si fallan, pero ahora dejan una
  advertencia visible. Antes fallaban en silencio y el despliegue salía verde.

---

## 5. Cómo se publica

1. Se trabaja en la rama de la app.
2. Al subir, corren las revisiones de la sección 1.
3. Si todo pasa, se publica sola en `iogga.com`.
4. Se sube la versión en `src/lib/version.ts` y el número de `public/sw.js`
   en **cada** cambio, para que a la gente se le ofrezca actualizar.

### Antes de tocar código: leer `CLAUDE.md`
Ahí están las restricciones de producto (no inventar, copiar de apps conocidas,
pokayoke, mínimo de elementos). La calidad técnica no sustituye a la de diseño.

---

## 6. Lo que falta (pendiente honesto)

Esto **todavía no está** y conviene tenerlo antes de crecer:

- [ ] **Proteger la rama principal** en GitHub, para que nada entre sin pasar
      las revisiones. Se activa en Settings → Branches → Add rule.
- [ ] **Separar los proyectos en repositorios distintos.** Hoy la app, el sitio
      de iogga y el sitio de EdwCorp viven en el mismo repositorio, en ramas
      distintas. Eso ya provocó una confusión.
- [ ] **Pruebas de pantalla** (que un botón haga lo que dice). Hoy solo se
      prueban las reglas de negocio.
- [ ] **Llaves de producción de Mercado Pago** y mover el secreto del
      Marketplace a Secret Manager (ver `CLAUDE.md`).
- [ ] **Una prueba de pago real** con un comprador que no sea el dueño de la
      app (regla de tres partes de Mercado Pago).
