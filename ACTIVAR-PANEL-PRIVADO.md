# Panel privado e integración de PayPal

El código no activa pagos ni publica datos privados hasta completar la configuración. Los formularios y enlaces PayPal.me existentes siguen funcionando mientras tanto.

## 1. Base de datos

En Cloudflare, crear una base **D1** llamada `rosana-inscripciones`. Ejecutar el SQL de `migrations/0001_private_panel.sql` en su consola. Añadir al Worker `plataforma-rosana` un binding D1 con nombre **ANALYTICS_DB** que apunte a esa base. Conservar el binding en los despliegues: añadir a `wrangler.jsonc` un bloque `d1_databases` con `binding: ANALYTICS_DB`, `database_name: rosana-inscripciones` y el `database_id` real proporcionado por Cloudflare. No inventar el identificador.

Desde ese momento se guardan las solicitudes aceptadas por el servicio de correo, separando consultas e inscripciones. Una entrega de correo no equivale a una plaza pagada. Los registros no reconstruyen inscripciones antiguas.

## 2. Acceso exclusivo de Rosana

En Cloudflare Zero Trust → Access → Applications, crear una aplicación self-hosted que cubra **rosanaortega.com/gestion**, **rosanaortega.com/api/owner/** y sus equivalentes en **www.rosanaortega.com**. Usar una política Allow que incluya solamente **rortegarcia@gmail.com** y verificación mediante código de un solo uso por correo (o un proveedor de identidad). No crear políticas Bypass/Everyone. Copiar el Application Audience (AUD).

Configurar en el Worker:

- `OWNER_EMAIL`: `rortegarcia@gmail.com`
- `ACCESS_TEAM_DOMAIN`: `https://NOMBRE-REAL-DEL-EQUIPO.cloudflareaccess.com`
- `ACCESS_AUD`: el identificador real de la aplicación.

El backend verifica criptográficamente la firma del JWT, su emisor, caducidad, audiencia y correo. Un enlace oculto o una cabecera de correo por sí solos no dan acceso. En workers.dev las consultas privadas también permanecen bloqueadas sin un JWT válido.

## 3. PayPal Sandbox primero

Crear una aplicación REST en PayPal Developer, usar las credenciales Sandbox y configurar en el Worker los secretos **PAYPAL_CLIENT_ID**, **PAYPAL_CLIENT_SECRET**. Aunque el client ID se puede mostrar al comprador, el client secret nunca se devuelve al navegador.

Crear un webhook de esa misma aplicación con URL **https://rosanaortega.com/api/paypal/webhook**. Seleccionar los eventos de captura COMPLETED, PENDING, DENIED, REFUNDED y REVERSED. Guardar su identificador como secreto **PAYPAL_WEBHOOK_ID**.

Variables: `PAYPAL_MODE=sandbox` y, solo cuando base, webhook y credenciales estén preparados, `PAYMENTS_ENABLED=true`.

Probar una compra con cuenta Sandbox de comprador: creación, cancelación, captura, repetición del webhook y reembolso. Comprobar que una captura repetida no incrementa el total y que el reembolso reduce el neto. No usar tarjetas ni dinero reales en estas pruebas. Los libros cuestan 15/20 EUR, los talleres abiertos 30 EUR, definidos en el servidor. Los talleres agotados o próximos no admiten órdenes.

## 4. Producción

Sustituir por credenciales **Live** y webhook Live de la misma aplicación. Establecer `PAYPAL_MODE=live`. No mezclar identificadores Sandbox y Live. Los enlaces de libros pasan al checkout integrado solo cuando la integración está habilitada. Los talleres envían primero la solicitud de inscripción, y la página de pago requiere su recibo firmado. El enlace genérico de PayPal.me para importes acordados queda fuera del contador automático.

## Qué muestra / límites

- `/gestion`: inscripciones de talleres, consultas, cobros confirmados por producto, importe neto tras reembolsos y últimas 100 solicitudes (totales sin ese límite).
- Totales desde la activación, no importación de cobros antiguos o PayPal.me.
- Neto antes de comisiones PayPal. No es contabilidad fiscal ni conciliación bancaria.
- Pago confirmado no significa que el libro ya se haya enviado: la entrega sigue siendo personal por correo.
- No almacenar correos, nombres, claves o respuestas de PayPal en logs. Definir con la propietaria un plazo de conservación y actualizar el aviso de privacidad antes de activar el almacenamiento.

Documentación oficial: https://developers.cloudflare.com/d1/ ; https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ ; https://developer.paypal.com/checkout/integrate ; https://developer.paypal.com/api/rest/webhooks/rest/
