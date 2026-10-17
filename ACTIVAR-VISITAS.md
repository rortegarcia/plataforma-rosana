# Conectar las visitas de Cloudflare al panel
El código está preparado, pero no muestra cifras hasta configurar ambos valores.
1. En el perfil de Cloudflare → API Tokens → Create custom token, crear un token llamado Panel de Rosana: permiso **Zone → Analytics → Read**, Zone Resources → Include → Specific zone → rosanaortega.com. No necesita permisos de edición.
2. En Workers & Pages → plataforma-rosana → Settings → Variables and Secrets, añadir **CF_ANALYTICS_TOKEN** como **Secret**, con el token generado. No enviarlo por chat ni guardarlo en GitHub.
3. En la vista general de rosanaortega.com, copiar el **Zone ID** (no el Account ID). Añadirlo en el Worker como **CF_ZONE_ID**, tipo texto. Guardar y desplegar.
4. Abrir /gestion con el acceso de Rosana y pulsar Actualizar. Comprobar que aparecen cifras y fecha. Si indica que no se pudo consultar, revisar permisos, identificador y disponibilidad de los datasets del plan.
Solo se consultan las últimas 24 horas. Los errores de estadísticas no bloquean los datos de inscripciones/pagos y se muestran como no disponibles, nunca como cero.
Se usan GraphQL httpRequestsAdaptiveGroups sum.visits y httpRequests1hGroups sum.pageViews. Las páginas vistas tienen resolución horaria; las cifras no tienen por qué coincidir con precisión con otro intervalo del dashboard y pueden ser estimadas. No son personas únicas. Incluyen la zona completa y pueden incluir bots y visitas propias.
Referencia: https://developers.cloudflare.com/analytics/graphql-api/tutorials/end-customer-analytics/
