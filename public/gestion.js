const money=cents=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents/100);
function row(parent,values){const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}parent.append(tr);}
async function refresh(){
 const state=document.getElementById('state'),dashboard=document.getElementById('dashboard');dashboard.hidden=true;state.textContent='Comprobando acceso…';
 try{const r=await fetch('/api/owner/summary',{cache:'no-store'});if(r.status===403){state.textContent='Acceso privado. Entra con tu correo autorizado a través de Cloudflare Access. Si aún no está configurado, los datos permanecen bloqueados.';return;}if(!r.ok)throw Error();const d=await r.json();
  const traffic=d.traffic;const trafficReady=traffic?.status==='ready';const number=new Intl.NumberFormat('es-ES',{maximumFractionDigits:0});
  document.getElementById('visits').textContent=trafficReady?number.format(traffic.visits):'—';
  document.getElementById('pageviews').textContent=trafficReady?number.format(traffic.pageViews):'—';
  document.getElementById('traffic-state').textContent=trafficReady?'Datos de Cloudflare hasta '+new Date(traffic.to).toLocaleString('es-ES',{timeZone:'Europe/Madrid'})+'.':traffic?.status==='not_configured'?'Conexión de visitas pendiente: falta configurar la clave de estadísticas y el identificador de la zona en Cloudflare.':'No se han podido consultar las visitas. Las inscripciones y los pagos siguen disponibles. Pulsa Actualizar para volver a intentarlo.';
  const byPage=document.getElementById('page-breakdown');byPage.replaceChildren();
  const breakdown=traffic?.breakdown;
  const pageNames={'/':'Inicio','/sobre-mi':'Sobre mí','/libro':'Mi libro: el método','/productos-linguisticos':'Productos lingüísticos','/contacto':'Contacto','/taller':'Talleres','/alquiler-equipos':'Alquiler de equipos'};
  if(breakdown?.status==='ready'){for(const page of breakdown.pages)row(byPage,[pageNames[page.path]||page.path,number.format(page.views)]);}
  document.getElementById('pages-state').textContent=breakdown?.status==='ready'?(breakdown.pages.length?(breakdown.truncated?'Se muestran las páginas con más consultas.':'No incluye el panel privado, el pago ni archivos como imágenes. Solo cuenta páginas HTML cargadas correctamente; el total puede diferir del contador general.'):'No se han registrado consultas de páginas públicas en este período.'):trafficReady?'El desglose por página no está disponible ahora. Pulsa Actualizar para volver a consultarlo.':'El desglose aparecerá cuando estén disponibles las estadísticas de Cloudflare.';
  document.getElementById('registrations').textContent=d.registrations.filter(x=>x.kind==='workshop').reduce((a,x)=>a+x.total,0);
  document.getElementById('inquiries').textContent=d.registrations.filter(x=>x.kind==='inquiry').reduce((a,x)=>a+x.total,0);
  document.getElementById('payments').textContent=d.payments.reduce((a,x)=>a+x.total,0);
  document.getElementById('income').textContent=money(d.payments.reduce((a,x)=>a+x.gross_cents,0)-d.refunds.cents);
  const groups=document.getElementById('groups');groups.replaceChildren();const topics=new Map();for(const x of d.registrations)topics.set(x.topic,{title:x.title,requests:x.total+(topics.get(x.topic)?.requests||0),paid:0,cents:0});for(const x of d.payments){const group=topics.get(x.product)||{title:x.title,requests:0};group.paid=x.total;group.cents=x.gross_cents;topics.set(x.product,group);}for(const x of topics.values())row(groups,[x.title,x.requests,x.paid||0,money(x.cents||0)]);
  const recent=document.getElementById('recent');recent.replaceChildren();for(const x of d.recent)row(recent,[new Date(x.created_at).toLocaleString('es-ES',{timeZone:'Europe/Madrid'}),x.customer_name,x.customer_email,x.title,x.paid?'Confirmado':'Sin pago confirmado']);document.getElementById('note').textContent=d.note;state.textContent=d.automaticPayments?'Actualizado. Confirmación automática de PayPal activa.':'Actualizado. Conexión automática de PayPal pendiente.';dashboard.hidden=false;
 }catch{state.textContent='El panel todavía no está disponible. No se muestran datos privados. Comprueba la conexión de la base de datos.';}
}
document.getElementById('refresh').addEventListener('click',refresh);refresh();
