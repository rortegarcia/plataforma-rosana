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
    return {status:'ready',visits:total(zone.traffic,'visits'),pageViews:total(zone.pages,'pageViews'),from,to};
  } catch { return {status:'unavailable'}; }
}
