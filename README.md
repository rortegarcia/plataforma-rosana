# Plataforma Português · Rosana Ortega

Código recuperado de la versión 16 de Sites.

- Commit original: `bfb9d3a5405af9261b5133c6b5e43b56592d845c`.
- Se conserva el contenido original de 24 archivos, incluidos imágenes y Worker compilado.
- Se omiten `.openai/hosting.json` y `dist/.openai/hosting.json`: contienen metadatos internos de Sites. La copia local original conserva ambos.

## Estructura

`public/` contiene páginas, estilos, scripts e imágenes. `server/worker.js` contiene los formularios y el envío de correo. `build.mjs` reúne los recursos en `dist/server/index.js`, un Worker compatible con Cloudflare.

## Compilar fuera de Sites

Requiere Node.js. El script original espera un archivo local de configuración. Para compilar sin los metadatos internos:

```sh
mkdir -p .openai
printf '%s\n' '{"d1":null,"r2":null}' > .openai/hosting.json
node build.mjs
```

No publique identificadores internos ni credenciales en este repositorio. Para volver a desplegar en Sites, utilice la configuración original de la copia local.

## Alojamiento y dominio

El dominio previsto es `rosanaortega.com`, registrado en DinaHosting. Solo se ha contratado el dominio. El repositorio no implica que la web esté desplegada ni que los DNS estén configurados.

La web necesita un servidor compatible con su Worker para conservar `/api/inquiries`, `/api/registrations` y `/api/registration-status`. GitHub Pages u otro alojamiento puramente estático no ejecutan esas funciones.

Opciones pendientes de elección:

1. Mantener el alojamiento actual en Sites y conectar el dominio mediante los registros DNS que Sites proporcione.
2. Desplegar el Worker en un alojamiento independiente compatible y configurar el dominio con los registros de ese proveedor. Un alojamiento PHP convencional necesitaría adaptar el servidor.

En un alojamiento independiente deben configurarse como secretos `RESEND_API_KEY` y `REGISTRATION_SECRET`; opcionalmente `RESEND_FROM`. Los secretos actuales de Sites no se exportan y no están en este repositorio. Antes de publicar, verifique el envío real de consultas e inscripciones, la confirmación de entrega y el paso posterior a PayPal.

No cambie registros de correo MX, SPF, DKIM o DMARC al conectar la web. Los valores DNS del alojamiento deben obtenerse del proveedor elegido; no se han establecido todavía.
