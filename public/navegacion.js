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
 for(const [el,attr,original] of translatedAttributes) el.setAttribute(attr,lang==='pt'?(translations[original]||original):original);
 const caption=document.querySelector('.type-art>p');
 if(caption) caption.textContent=lang==='pt'?'espanhol / portugu\u00eas':'espa\u00f1ol / portugu\u00eas';
}

refreshNavigation();
