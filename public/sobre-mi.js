const original = new Map([...document.querySelectorAll('[data-pt]')].map(el => [el, el.textContent]));
const links = [...document.querySelectorAll('[data-language-link]')].map(el => [el, el.getAttribute('href')]);
function setBiographyLanguage(lang) {
  lang = lang === 'pt' ? 'pt' : 'es';
  document.documentElement.lang = lang;
  for (const [el, text] of original) el.textContent = lang === 'pt' ? el.dataset.pt : text;
  for (const [el, href] of links) {
    const url = new URL(href, location.origin);
    url.searchParams.set('lang', lang);
    el.href = url.pathname + url.search + url.hash;
  }
  for (const id of ['es', 'pt']) document.getElementById(id).setAttribute('aria-pressed', String(id === lang));
  document.title = (lang === 'pt' ? 'Sobre mim e a minha trajetória' : 'Sobre mí y mi trayectoria') + ' · Rosana Ortega García';
  document.querySelector('meta[name="description"]').content = lang === 'pt'
    ? 'Conheça a trajetória de Rosana Ortega García: formação em línguas, tradução, interpretação, clientes e o seu livro de português para hispanofalantes.'
    : 'Conoce la trayectoria de Rosana Ortega García: formación de idiomas, traducción, interpretación, clientes y su libro de portugués para hispanohablantes.';
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
}
for (const id of ['es', 'pt']) document.getElementById(id).addEventListener('click', () => setBiographyLanguage(id));
setBiographyLanguage(new URLSearchParams(location.search).get('lang'));
