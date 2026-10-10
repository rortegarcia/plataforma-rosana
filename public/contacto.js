let language = 'es';
const es = Object.fromEntries([...document.querySelectorAll('[data-t]')].map(el => [el.dataset.t, el.textContent]));
const pt = {
  home:'Início',about:'Sobre mim',contact:'Contato',eyebrow:'VAMOS CONVERSAR',title:'Conte sobre seu projeto.',
  intro:'Uma tradução, uma reunião ou um novo idioma. Escreva para mim e encontraremos a melhor forma de trabalhar juntos.',
  direct:'Prefere entrar em contato por e-mail?',directNote:'Você pode escrever diretamente para meu e-mail.',
  formTitle:'Envie uma mensagem',name:'Seu nome',email:'Seu e-mail',reason:'Como posso ajudar?',
  equipment:'Aluguel de equipamentos',information:'Informações gerais',translation:'Tradução',interpretation:'Interpretação',classes:'Aulas de idiomas',
  portugues:'Aulas de português',espanol:'Aulas de espanhol',taller:'Oficinas de leitura',materiales:'Produtos linguísticos',payment:'Consulta sobre pagamentos',
  message:'Sua mensagem',hint:'Conte o que você precisa e, se necessário, indique as línguas, datas ou prazos.',
  consent:'Aceito enviar meus dados à Rosana Ortega para responder a esta solicitação.',
  note:'Usarei o e-mail indicado para responder à sua solicitação. Enviar este formulário não confirma uma inscrição nem um pagamento.',
  submit:'Enviar mensagem ↗',back:'Voltar ao início ↑'
};
const links = [...document.querySelectorAll('[data-language-link]')].map(el => [el,el.getAttribute('href')]);
function setLanguage(value) {
  language = value === 'pt' ? 'pt' : 'es';
  document.documentElement.lang = language;
  const dict = language === 'pt' ? pt : es;
  document.querySelectorAll('[data-t]').forEach(el => { if (dict[el.dataset.t] !== undefined) el.textContent = dict[el.dataset.t]; });
  for (const [el,href] of links) { const url = new URL(href,location.origin);url.searchParams.set('lang',language);el.href=url.pathname+url.search+url.hash; }
  for (const id of ['es','pt']) document.getElementById(id).setAttribute('aria-pressed',String(language===id));
  document.title=(language==='pt'?'Contato':'Contacto')+' · Rosana Ortega García';
  document.querySelector('meta[name="description"]').content=language==='pt'?'Entre em contato com Rosana Ortega García para tradução, interpretação e aulas de idiomas.':'Contacta con Rosana Ortega García para traducción, interpretación y clases de idiomas.';
  const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);
  document.querySelectorAll('form').forEach(form=>form.refreshStatus?.());
}
const topic=new URLSearchParams(location.search).get('tema');
const select=document.getElementById('service-select');
if ([...select.options].some(option=>option.value===topic)) select.value=topic;
for (const id of ['es','pt']) document.getElementById(id).addEventListener('click',()=>setLanguage(id));
setLanguage(new URLSearchParams(location.search).get('lang'));
