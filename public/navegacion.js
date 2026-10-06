const navigationLinks=[...document.querySelectorAll('[data-nav-es]')].map(el=>[el,el.getAttribute('href')]);
function refreshNavigation(){const lang=document.documentElement.lang==='pt'?'pt':'es';for(const [el,href] of navigationLinks){const url=new URL(href,location.origin);url.searchParams.set('lang',lang);el.href=url.pathname+url.search+url.hash;el.textContent=lang==='pt'?el.dataset.navPt:el.dataset.navEs;if(url.pathname!=='/'&&url.pathname===location.pathname)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');}}
for(const id of ['es','pt'])document.getElementById(id)?.addEventListener('click',refreshNavigation);
refreshNavigation();
