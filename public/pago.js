(async()=>{
 const params=new URLSearchParams(location.search),pt=params.get('lang')==='pt';document.documentElement.lang=pt?'pt-BR':'es';const status=document.getElementById('status');
 const say=(es,br)=>status.textContent=pt?br:es;
 if(pt){document.getElementById('title').textContent='Conclua seu pagamento';document.getElementById('delivery').textContent='Os livros são enviados pessoalmente por e-mail após o pagamento. Não há download automático.';const links=document.querySelectorAll('main a');links[0].textContent='Entre em contato com Rosana';links[0].href='/contacto?lang=pt';links[1].textContent='Voltar ao início';links[1].href='/?lang=pt';}
 let product=params.get('product'),receipt=params.get('receipt');
 const referenceKey='paypal-attempt-'+(product||receipt||'unknown');let reference=sessionStorage.getItem(referenceKey)||crypto.randomUUID();sessionStorage.setItem(referenceKey,reference);
 const names={'book-student':[pt?'Livro para alunos · 15 €':'Libro para alumnos · 15 €',15],'book-teacher':[pt?'Livro e tutoria para professores · 20 €':'Libro y tutoría para profesores · 20 €',20],'garcia-lorca':['García Lorca · 30 €',30],'cuentos-clarice-lispector':['Clarice Lispector · 30 €',30],'cien-anos-de-soledad':[pt?'Cem anos de solidão · 30 €':'Cien años de soledad · 30 €',30]};
 try{
  const config=await (await fetch('/api/private-payments/config')).json();
  if(!config.enabled){say('La conexión automática de pagos aún no está activa. Utiliza las opciones de compra de la página de productos o contacta con Rosana.','A conexão automática de pagamentos ainda não está ativa. Use as opções de compra na página de produtos ou entre em contato com Rosana.');return;}
  if(receipt){const r=await fetch('/api/private-payments/context?receipt='+encodeURIComponent(receipt));if(!r.ok)throw Error();product=(await r.json()).product;}
  if(!names[product])throw Error();document.getElementById('description').textContent=names[product][0];
  const sdk=document.createElement('script');sdk.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(config.clientId)+'&currency=EUR&intent=capture&components=buttons&locale='+(pt?'pt_BR':'es_ES');await new Promise((resolve,reject)=>{sdk.onload=resolve;sdk.onerror=reject;document.head.append(sdk);});
  const post=async(path,data)=>{const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error();return r.json();};
  await paypal.Buttons({
   createOrder:async()=>{const d=await post('/api/private-payments/order',{product,receipt,reference});return d.id;},
   onApprove:async data=>{say('Comprobando el cobro con PayPal…','Verificando o pagamento com o PayPal…');try{const d=await post('/api/private-payments/capture',{orderId:data.orderID,reference});if(d.status==='completed'){say('Pago confirmado por PayPal. Gracias. Rosana gestionará tu compra o inscripción.','Pagamento confirmado pelo PayPal. Obrigada. Rosana cuidará de sua compra ou inscrição.');sessionStorage.removeItem(referenceKey);document.getElementById('paypal-buttons').replaceChildren();}else say('PayPal está revisando el pago. No pagues otra vez; la confirmación se actualizará automáticamente cuando PayPal la envíe.','O PayPal está analisando o pagamento. Não pague novamente; a confirmação será atualizada automaticamente quando o PayPal enviar.');}catch{say('No hemos podido comprobar el resultado. Revisa PayPal o contacta con Rosana antes de volver a pagar.','Não foi possível verificar o resultado. Confira no PayPal ou fale com Rosana antes de pagar novamente.');}},
   onCancel:()=>say('Pago cancelado. No se ha confirmado ningún cobro.','Pagamento cancelado. Nenhum pagamento foi confirmado.'),
   onError:()=>say('No se ha podido completar el pago. Comprueba tu cuenta PayPal antes de intentarlo de nuevo.','Não foi possível concluir o pagamento. Confira sua conta PayPal antes de tentar novamente.'),
  }).render('#paypal-buttons');say('Elige cómo pagar con PayPal.','Escolha como pagar com o PayPal.');
 }catch{say('No se ha podido preparar el pago. Vuelve a la inscripción o contacta con Rosana.','Não foi possível preparar o pagamento. Volte à inscrição ou entre em contato com Rosana.');}
})();
