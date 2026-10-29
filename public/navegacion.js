const navigationLinks=[...document.querySelectorAll('[data-nav-es]')].map(el=>[el,el.getAttribute('href')]);
function refreshNavigation(){const lang=document.documentElement.lang.startsWith('pt')?'pt':'es';document.documentElement.lang=lang==='pt'?'pt-BR':'es';refreshLanguageDetails(lang);for(const [el,href] of navigationLinks){const url=new URL(href,location.origin);url.searchParams.set('lang',lang);el.href=url.pathname+url.search+url.hash;el.textContent=lang==='pt'?el.dataset.navPt:el.dataset.navEs;if(url.pathname!=='/'&&url.pathname===location.pathname)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');}}
for(const id of ['es','pt'])document.getElementById(id)?.addEventListener('click',refreshNavigation);

const translatedAttributes = [...document.querySelectorAll('[alt], [aria-label], [placeholder]')].flatMap(el => ['alt', 'aria-label', 'placeholder'].filter(attr => el.hasAttribute(attr)).map(attr => [el, attr, el.getAttribute(attr)]));
function refreshLanguageDetails(lang) {
 const translations = {
  'Principal':'Navega\u00e7\u00e3o principal',
  'Plataforma Portugu\u00eas \u2014 inicio':'Plataforma Portugu\u00eas \u2014 in\u00edcio',
  'nombre@ejemplo.com':'nome@exemplo.com',
  'Transmisor con micr\u00f3fono y receptores con fones de ouvido':'Transmissor com microfone e receptores com fones de ouvido',
  'Equipo de transmisi\u00f3n y recepci\u00f3n con micr\u00f3fono y fones de ouvido':'Equipamento de transmiss\u00e3o e rece\u00e7\u00e3o com microfone e fones de ouvido',
  'Rosana Ortega trabajando como int\u00e9rprete en una cabina de interpretaci\u00f3n':'Rosana Ortega trabalhando em uma cabine de interpreta\u00e7\u00e3o'
 };
 Object.assign(translations,{
 'Transmisor con micrófono y receptores con auriculares':'Transmissor com microfone e receptores com fones de ouvido',
 'Rosana Ortega García trabajando como intérprete en una cabina durante un encuentro':'Rosana Ortega García trabalhando como intérprete em uma cabine durante um encontro',
 'Rosana Ortega García en la Universidad de Navarra':'Rosana Ortega García na Universidade de Navarra',
 'Clientes destacados':'Clientes em destaque',
 'Trayectoria / Trajetória':'Trajetória',
 'Carrusel de propuestas / Carrossel de propostas':'Carrossel de propostas',
 'Propuestas':'Propostas','Anterior':'Anterior','Siguiente':'Próxima','Filtrar / Filtrar':'Filtrar'
 });
 for(const [el,attr,original] of translatedAttributes){
  const spanish=Object.keys(translations).find(key=>key===original||translations[key]===original);
  if(spanish)el.setAttribute(attr,lang==='pt'?translations[spanish]:spanish);
 }
 const skip=document.querySelector('.skip');if(skip)skip.textContent=lang==='pt'?'Ir para o conteúdo':'Saltar al contenido';
 const caption=document.querySelector('.type-art>p');
 if(caption) caption.textContent=lang==='pt'?'espanhol / portugu\u00eas':'espa\u00f1ol / portugu\u00eas';
}

refreshNavigation();

function refreshBrand(){
 const portuguese=document.documentElement.lang.startsWith('pt');
 const src=portuguese?'/images/logo-portugues.jpg':'/images/logo-espanol.jpg';
 const label=portuguese?'Plataforma Português':'Plataforma Español';
 document.querySelectorAll('header>a:first-child img,footer img').forEach(img=>{img.src=src;img.alt=label;});
 const home=document.querySelector('header>a:first-child');
 if(home)home.setAttribute('aria-label',label+(portuguese?' — início':' — inicio'));
}
for(const id of ['es','pt'])document.getElementById(id)?.addEventListener('click',refreshBrand);
refreshBrand();

const paymentLinksScript=document.createElement('script');paymentLinksScript.src='/payments-links.js';paymentLinksScript.defer=true;document.head.append(paymentLinksScript);

const offerScript=document.createElement('script');offerScript.src='/oferta-testes.js';offerScript.defer=true;document.head.append(offerScript);
