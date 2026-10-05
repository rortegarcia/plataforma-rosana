# Plataforma Português · Rosana Ortega

Web basada en la versión 16 recuperada de Sites, adaptada para Netlify. Las páginas e imágenes se publican como archivos estáticos; consultas, inscripciones y confirmación de correo se ejecutan en Netlify Functions. El diseño de la web se conserva.

## Desplegar desde GitHub

1. En Netlify, importa `rortegarcia/plataforma-rosana` y selecciona la rama `main`.
2. Deja el directorio base vacío. `netlify.toml` configura automáticamente:
   - Build command: `npm run build`.
   - Publish directory: `dist-netlify`.
   - Functions directory: `netlify/functions`.
   - Node.js: 22.
3. En la configuración del proyecto, añade las variables indicadas abajo. Las variables deben incluir el alcance **Functions** (o todos los alcances). No las escribas en `netlify.toml` ni en `public/`.
4. Despliega. Si modificas las variables después, crea un nuevo deploy para aplicarlas.
5. Comprueba una consulta y una inscripción reales antes de dar la web por operativa.

La web puede compilar sin las claves, pero los formularios responderán con servicio no disponible hasta que estén configuradas. Importar el repositorio en Netlify, configurar las claves y confirmar un despliegue correcto siguen siendo pasos necesarios; preparar este repositorio no los ejecuta.

## Variables privadas y configuración

| Variable | Uso |
| --- | --- |
| `RESEND_API_KEY` | Obligatoria. Clave de Resend con permisos de envío y de consulta de correos enviados, porque la web comprueba su entrega. |
| `REGISTRATION_SECRET` | Obligatoria. Secreto aleatorio de al menos 32 bytes para firmar los comprobantes de inscripción. |
| `RESEND_FROM` | Remitente autorizado en Resend. Para producción utiliza una dirección de un dominio verificado. |
| `CONTACT_EMAIL` | Correo donde recibes solicitudes. Predeterminado: `rortegarcia@gmail.com`. |
| `PAYPAL_URL` | Enlace de pago. Predeterminado: `https://paypal.me/rosanaortega/30EUR`. Mantén coherencia con los 30 EUR anunciados en la web. |

`.env.example` contiene nombres y valores de ejemplo, sin claves. Copia ese archivo a `.env` para uso local y rellena los valores. `.gitignore` excluye `.env` y sus variantes privadas. El archivo `.env` local preparado en Codex incluye un nuevo secreto de firma; la clave de Resend queda vacía. Los secretos de Sites no se pueden recuperar desde el repositorio ni se han exportado.

Para generar un secreto independiente:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Netlify no importa automáticamente el `.env` local durante un deploy desde GitHub. Añade/importa sus valores en la configuración de variables del proyecto de Netlify. No subas el archivo a GitHub. Marca las claves como secretas cuando la interfaz lo permita.

`CONTACT_EMAIL` configura el destino del servidor; los correos de contacto visibles en las páginas mantienen su contenido original. Cambiar `PAYPAL_URL` cambia el destino del pago, no los precios mostrados en las páginas.

El remitente de ejemplo `onboarding@resend.dev` sirve para pruebas permitidas por Resend. Para producción verifica tu dominio en Resend y configura `RESEND_FROM`. Los registros de correo que indique Resend se añaden en DinaHosting.

## Desarrollo y pruebas

```sh
npm ci
npm test
npm run build
```

No hay dependencias de aplicación. Para probar estáticos y funciones juntos, utiliza Netlify CLI (`netlify dev`) con el `.env` local. Netlify CLI se instala por separado y no es una dependencia de producción.

Las pruebas simulan Resend: comprueban las rutas, consentimiento, origen, firma del comprobante, correo entregado/rechazado, destino de correo y enlace de PayPal. No envían correos ni realizan pagos. La confirmación de entrega habilita PayPal; no acredita que se haya pagado.

El build publica exclusivamente `public/` en `dist-netlify/`. Rechaza archivos `.env` y enlaces simbólicos dentro de `public/`. Las claves solo se consultan desde el servidor. `build.mjs` es el constructor histórico de Sites; Netlify usa `scripts/build-netlify.mjs` y no necesita configuración interna de Sites ni el Worker compilado antiguo.

## Dominio rosanaortega.com

Después del primer deploy correcto, añade `rosanaortega.com` y, si lo deseas, `www.rosanaortega.com` en la gestión de dominios de Netlify. Utiliza los registros DNS exactos que muestre Netlify para tu proyecto y añádelos en DinaHosting. Espera la validación y el certificado HTTPS antes de cambiar el dominio principal. Conserva los registros MX, SPF, DKIM y DMARC existentes. No se han cambiado los DNS desde este repositorio.

## Procedencia

Versión original: 16. Commit original: `bfb9d3a5405af9261b5133c6b5e43b56592d845c`. La copia ZIP original permanece sin cambios. Los metadatos internos de Sites y sus credenciales se excluyen del repositorio público.

Documentación oficial: [Netlify Functions](https://docs.netlify.com/build/functions/api/), [variables para funciones](https://docs.netlify.com/build/functions/environment-variables/).
