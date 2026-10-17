// Keep existing PayPal.me purchases until the owner finishes and enables the integration.
(async()=>{try{
 const r=await fetch('/api/private-payments/config');if(!r.ok||!(await r.json()).enabled)return;
 const update=()=>document.querySelectorAll('a[href^="https://paypal.me/rosanaortega/"],a[data-integrated-product]').forEach(link=>{
  const amount=new URL(link.href,location.origin).pathname.split('/').pop();const product=link.dataset.integratedProduct||(amount==='15EUR'?'book-student':amount==='20EUR'?'book-teacher':null);
  if(product){link.dataset.integratedProduct=product;link.href='/pago?product='+product+'&lang='+(document.documentElement.lang.startsWith('pt')?'pt':'es');}
 });update();for(const id of ['es','pt'])document.getElementById(id)?.addEventListener('click',update);
}catch{}})();
