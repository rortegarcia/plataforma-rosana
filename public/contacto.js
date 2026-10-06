let language = 'es';
const es = Object.fromEntries([...document.querySelectorAll('[data-t]')].map(el => [el.dataset.t, el.textContent]));
const pt = {
  home:'Início',about:'Sobre mim',contact:'Contacto',eyebrow:'VAMOS CONVERSAR',title:'Conte-me o seu projeto.',
  intro:'Uma tradução, uma reunião ou um novo idioma. Escreva-me e encontraremos a melhor forma de trabalhar juntos.',
  direct:'Prefere escrever diretamente?',directNote:'Pode enviar um e-mail para o meu endereço habitual.',
  formTitle:'Envie-me uma mensagem',name:'O seu nome',email:'O seu e-mail',reason:'O que precisa?',
  equipment:'Aluguer de equipamentos',information:'Informações gerais',translation:'Tradução',interpretation:'Interpretação',classes:'Aulas de línguas',
  portugues:'Aulas de português',espanol:'Aulas de espanhol',taller:'Oficinas de leitura',materiales:'Produtos linguísticos',payment:'Consulta sobre pagamentos',
  message:'A sua mensagem',hint:'Conte-me o que precisa e, se necessário, indique as línguas, datas ou prazos.',
  consent:'Aceito enviar os meus dados à Rosana Ortega para responder a este pedido.',
  note:'Usarei o e-mail indicado para responder ao seu pedido. O envio deste formulário não implica uma inscrição ou pagamento.',
  submit:'Enviar pedido ↗',back:'Voltar ao início ↑'
};
const links = [...document.querySelectorAll('[data-language-link]')].map(el => [el,el.getAttribute('href')]);
function setLanguage(value) {
  language = value === 'pt' ? 'pt' : 'es';
  document.documentElement.lang = language;
  const dict = language === 'pt' ? pt : es;
  document.querySelectorAll('[data-t]').forEach(el => { if (dict[el.dataset.t] !== undefined) el.textContent = dict[el.dataset.t]; });
  for (const [el,href] of links) { const url = new URL(href,location.origin);url.searchParams.set('lang',language);el.href=url.pathname+url.search+url.hash; }
  for (const id of ['es','pt']) document.getElementById(id).setAttribute('aria-pressed',String(language===id));
  document.title=(language==='pt'?'Contacto':'Contacto')+' · Rosana Ortega García';
  document.querySelector('meta[name="description"]').content=language==='pt'?'Contacte Rosana Ortega García para tradução, interpretação e aulas de línguas.':'Contacta con Rosana Ortega García para traducción, interpretación y clases de idiomas.';
  const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);
  document.querySelectorAll('form').forEach(form=>form.refreshStatus?.());
}
const topic=new URLSearchParams(location.search).get('tema');
const select=document.getElementById('service-select');
if ([...select.options].some(option=>option.value===topic)) select.value=topic;
for (const id of ['es','pt']) document.getElementById(id).addEventListener('click',()=>setLanguage(id));
setLanguage(new URLSearchParams(location.search).get('lang'));
