(()=>{
const path=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';
if(['/teste-portugues','/gestion','/pago','/preferencias-email'].includes(path))return;
const key='rosana-test-online-offer-v2';try{if(sessionStorage.getItem(key))return;}catch{}
setTimeout(()=>{
if(document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
const dialog=document.createElement('dialog');dialog.className='test-offer-dialog';dialog.dataset.testPopup='';dialog.setAttribute('aria-labelledby','popup-test-title');
dialog.innerHTML="<button class=\"test-popup-close\" type=\"button\" aria-label=\"Cerrar / Fechar\">×</button><p class=\"eyebrow\" data-pt=\"OFERTA TEMPORÁRIA · SEM COMPROMISSO\">OFERTA TEMPORAL · SIN COMPROMISO</p><h2 id=\"popup-test-title\" data-pt=\"Você sabe qual é o seu verdadeiro nível de português?\">¿Sabes cuál es tu verdadero nivel de portugués?</h2><p data-pt=\"Descubra com um teste pensado especialmente para quem fala espanhol e quer identificar seus pontos fortes e suas dificuldades na língua portuguesa.\">Descúbrelo con un test pensado especialmente para quienes hablan español y quieren identificar sus puntos fuertes y sus dificultades en portugués.</p><p data-pt=\"Responda aqui na página. No final, envie suas respostas com seu e-mail para receber a avaliação humana de Rosana, com nota, diagnóstico individual e orientações personalizadas.\">Responde en la página. Al terminar, envía tus respuestas con tu correo para recibir la evaluación personal de Rosana, con nota, diagnóstico individual y orientaciones personalizadas.</p><a class=\"button\" id=\"popup-online-tests\" href=\"/teste-portugues\">Começar meu teste ↗</a><button class=\"test-popup-dismiss\" type=\"button\" data-pt=\"Agora não\">Ahora no</button>";
for(const href of ['/oferta-testes.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
document.body.append(dialog);
const originals=new Map([...dialog.querySelectorAll('[data-pt]')].map(el=>[el,el.textContent]));
function translate(){const pt=document.documentElement.lang.startsWith('pt');const link=dialog.querySelector('#popup-online-tests');link.textContent=pt?'Começar meu teste ↗':'Empezar mi test ↗';link.href='/teste-portugues?lang='+(pt?'pt':'es');for(const [el,es] of originals)el.textContent=pt?el.dataset.pt:es;}
translate();for(const id of ['es','pt'])document.getElementById(id)?.addEventListener('click',translate);
dialog.querySelectorAll('.test-popup-close,.test-popup-dismiss').forEach(el=>el.addEventListener('click',()=>dialog.close()));
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.showModal();try{sessionStorage.setItem(key,'shown');}catch{}
},3500);
})();