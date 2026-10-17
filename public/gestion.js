const money=cents=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents/100);
function row(parent,values){const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}parent.append(tr);}
async function refresh(){
 const state=document.getElementById('state'),dashboard=document.getElementById('dashboard');dashboard.hidden=true;state.textContent='Comprobando acceso…';
 try{const r=await fetch('/api/owner/summary',{cache:'no-store'});if(r.status===403){state.textContent='Acceso privado. Entra con tu correo autorizado a través de Cloudflare Access. Si aún no está configurado, los datos permanecen bloqueados.';return;}if(!r.ok)throw Error();const d=await r.json();
  document.getElementById('registrations').textContent=d.registrations.filter(x=>x.kind==='workshop').reduce((a,x)=>a+x.total,0);
  document.getElementById('inquiries').textContent=d.registrations.filter(x=>x.kind==='inquiry').reduce((a,x)=>a+x.total,0);
  document.getElementById('payments').textContent=d.payments.reduce((a,x)=>a+x.total,0);
  document.getElementById('income').textContent=money(d.payments.reduce((a,x)=>a+x.gross_cents,0)-d.refunds.cents);
  const groups=document.getElementById('groups');groups.replaceChildren();const topics=new Map();for(const x of d.registrations)topics.set(x.topic,{title:x.title,requests:x.total+(topics.get(x.topic)?.requests||0),paid:0,cents:0});for(const x of d.payments){const group=topics.get(x.product)||{title:x.title,requests:0};group.paid=x.total;group.cents=x.gross_cents;topics.set(x.product,group);}for(const x of topics.values())row(groups,[x.title,x.requests,x.paid||0,money(x.cents||0)]);
  const recent=document.getElementById('recent');recent.replaceChildren();for(const x of d.recent)row(recent,[new Date(x.created_at).toLocaleString('es-ES',{timeZone:'Europe/Madrid'}),x.customer_name,x.customer_email,x.title,x.paid?'Confirmado':'Sin pago confirmado']);document.getElementById('note').textContent=d.note;state.textContent=d.automaticPayments?'Actualizado. Confirmación automática de PayPal activa.':'Actualizado. Conexión automática de PayPal pendiente.';dashboard.hidden=false;
 }catch{state.textContent='El panel todavía no está disponible. No se muestran datos privados. Comprueba la conexión de la base de datos.';}
}
document.getElementById('refresh').addEventListener('click',refresh);refresh();
