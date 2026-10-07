let language = 'es';
const es = Object.fromEntries([...document.querySelectorAll('[data-t]')].map(el => [el.dataset.t, el.textContent]));
const pt = {
  home:'Início',about:'Sobre mim',contact:'Contato',eyebrow:'VAMOS CONVERSAR',title:'Conte-me o seu projeto.',
  intro:'Uma tradução, uma reunião ou um novo idioma. Escreva para mim e encontraremos a melhor forma de trabalhar juntos.',
  direct:'Prefere entrar em contato por e-mail?',directNote:'Pode enviar um e-mail para o meu endereço habitual.',
  formTitle:'Envie uma mensagem',name:'O seu nome',email:'O seu e-mail',reason:'O que precisa?',
  information:'Informações gerais',translation:'Tradução',interpretation:'Interpretação',classes:'Aulas de idiomas',
  portugues:'Aulas de português',espanol:'Aulas de espanhol',taller:'Oficinas de leitura',materiales:'Produtos linguísticos',payment:'Consulta sobre pagamentos',
  message:'A sua mensagem',hint:'Conte-me o que precisa e, se necessário, indique as línguas, datas ou prazos.',
  consent:'Aceito enviar os meus dados à Rosana Ortega para responder a este pedido.',
  note:'Usarei o e-mail indicado para responder ao seu pedido. O envio deste formulário não implica uma inscrição ou pagamento.',
  submit:'Enviar pedido ↗',back:'Voltar ao início ↑'
};
Object.assign(pt,{back:'Voltar ao in\u00edcio \u2191',eyebrow:'ALUGUEL DE EQUIPAMENTOS',title:'Uma voz. Todo o grupo em sintonia.',intro:'Para que todos ouçam com clareza e conforto em eventos, reuniões, congressos, visitas, percursos e oficinas.',availability:'Consulte a disponibilidade ↗',caption:'Equipamento de transmissão e recepção com microfone e fones de ouvido.',kit:'O EQUIPAMENTO',kitTitle:'Leve, prático e fácil de usar.',transmitters:'transmissores',receivers:'receptores',case:'Maleta',transport:'para um transporte confortável, organizado e seguro',range:'Equipamento de excelente alcance para acompanhar a comunicação do grupo.',usesTitle:'Em que atividades pode utilizar este equipamento?',uses:'Atividades de formação, reuniões, excursões, visitas guiadas a museus e eventos.',requestTitle:'Conte sobre a atividade que você está organizando.',request:'Indique a data, o local e o número de participantes para consultar a disponibilidade e as condições de aluguel.'});
const links = [...document.querySelectorAll('[data-language-link]')].map(el => [el,el.getAttribute('href')]);
function setLanguage(value) {
  language = value === 'pt' ? 'pt' : 'es';
  document.documentElement.lang = language;
  const dict = language === 'pt' ? pt : es;
  document.querySelectorAll('[data-t]').forEach(el => { if (dict[el.dataset.t] !== undefined) el.textContent = dict[el.dataset.t]; });
  for (const [el,href] of links) { const url = new URL(href,location.origin);url.searchParams.set('lang',language);el.href=url.pathname+url.search+url.hash; }
  for (const id of ['es','pt']) document.getElementById(id).setAttribute('aria-pressed',String(language===id));
  document.title=(language==='pt'?'Aluguel de equipamentos':'Alquiler de equipos')+' · Rosana Ortega García';
  document.querySelector('meta[name="description"]').content=language==='pt'?'Aluguel de equipamentos: 2 transmissores, 30 receptores e maleta de transporte.':'Alquiler de equipos: 2 transmisores, 30 receptores y maletín de transporte.';
  const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);
  document.querySelectorAll('form').forEach(form=>form.refreshStatus?.());
}
for (const id of ['es','pt']) document.getElementById(id).addEventListener('click',()=>setLanguage(id));
setLanguage(new URLSearchParams(location.search).get('lang'));