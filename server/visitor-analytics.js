// Credentials stay on the Worker. Only aggregate counts reach the authenticated owner.
export async function visitorAnalytics(env, now = Date.now()) {
  if (!env.CF_ANALYTICS_TOKEN || !/^[a-f0-9]{32}$/i.test(env.CF_ZONE_ID || '')) return {status:'not_configured'};
  const to = new Date(now).toISOString(), from = new Date(now - 86400000).toISOString();
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method:'POST',
      headers:{Authorization:'Bearer '+env.CF_ANALYTICS_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify({
        query:`query OwnerTraffic($zone: string, $from: Time, $to: Time) {
          viewer { zones(filter:{zoneTag:$zone}) {
            traffic: httpRequestsAdaptiveGroups(limit:1, filter:{datetime_geq:$from,datetime_lt:$to,requestSource:"eyeball"}) { sum { visits } }
            pages: httpRequests1hGroups(limit:48, filter:{datetime_geq:$from,datetime_lt:$to}) { sum { pageViews } }
          } }
        }`,
        variables:{zone:env.CF_ZONE_ID,from,to}
      }),
      signal:AbortSignal.timeout(12000)
    });
    if(!res.ok) return {status:'unavailable'};
    const data = await res.json();
    const zone = data.data?.viewer?.zones?.[0];
    if(data.errors?.length || !Array.isArray(zone?.traffic) || !Array.isArray(zone?.pages)) return {status:'unavailable'};
    const total = (rows,key) => rows.reduce((sum,row) => {
      const value = row.sum?.[key];
      if(!Number.isFinite(value) || value < 0) throw Error('invalid analytics');
      return sum + value;
    },0);
    return {status:'ready',visits:total(zone.traffic,'visits'),pageViews:total(zone.pages,'pageViews'),breakdown:await pageBreakdown(env,from,to),from,to};
  } catch { return {status:'unavailable'}; }
}

export async function pageBreakdown(env,from,to) {
  try {
    const res=await fetch('https://api.cloudflare.com/client/v4/graphql',{
      method:'POST',headers:{Authorization:'Bearer '+env.CF_ANALYTICS_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify({query:`query OwnerPages($zone: string, $from: Time, $to: Time) {
        viewer { zones(filter:{zoneTag:$zone}) {
          byPage: httpRequestsAdaptiveGroups(limit:1000,orderBy:[count_DESC],filter:{
            datetime_geq:$from,datetime_lt:$to,requestSource:"eyeball",
            edgeResponseContentTypeName:"html",edgeResponseStatus:200,
            clientRequestHTTPHost_in:["rosanaortega.com","www.rosanaortega.com"]
          }) { count dimensions { clientRequestPath } }
        } }
      }`,variables:{zone:env.CF_ZONE_ID,from,to}}),signal:AbortSignal.timeout(12000)
    });
    if(!res.ok)return {status:'unavailable'};
    const data=await res.json(), rows=data.data?.viewer?.zones?.[0]?.byPage;
    if(data.errors?.length||!Array.isArray(rows))return {status:'unavailable'};
    const counts=new Map();
    for(const item of rows){
      let path=item.dimensions?.clientRequestPath;
      if(typeof path!=='string'||!path.startsWith('/')||!Number.isFinite(item.count)||item.count<0)throw Error('invalid');
      path=path.replace(/\.html$/,'').replace(/\/$/,'')||'/';
      if(path==='/index')path='/';
      if(path==='/gestion'||path==='/pago'||path.startsWith('/api/')||path.startsWith('/cdn-cgi/'))continue;
      counts.set(path,(counts.get(path)||0)+item.count);
    }
    return {status:'ready',truncated:rows.length===1000,pages:[...counts].map(([path,views])=>({path,views})).sort((a,b)=>b.views-a.views)};
  }catch{return {status:'unavailable'};}
}
