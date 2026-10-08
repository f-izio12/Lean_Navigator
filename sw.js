/* Service worker: caches the app so it opens offline. Bump VERSION when you publish changes. */
const VERSION="lean-navigator-1.2.3";
const FILES=["./","./index.html","./css/app.css","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./fonts/jost-latin-400-normal.woff2","./fonts/jost-latin-500-normal.woff2","./fonts/jost-latin-700-normal.woff2","./fonts/jost-latin-ext-400-normal.woff2","./fonts/jost-latin-ext-500-normal.woff2","./fonts/jost-latin-ext-700-normal.woff2","./js/a3.js","./js/ai.js","./js/app.js","./js/charts.js","./js/core.js","./js/dmadv.js","./js/dmaic.js","./js/export.js","./js/fives.js","./js/hoshin.js","./js/hyp.js","./js/info.js","./js/kaizen.js","./js/pdca.js","./js/pdf.js","./js/people.js","./js/plan.js","./js/portfolio.js","./js/security.js","./js/ui.js","./js/vault.js","./js/vsm.js","./vendor/exceljs.min.js","./vendor/jspdf.plugin.autotable.min.js","./vendor/jspdf.umd.min.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("lean-navigator-")&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
/* Fetch: only same-origin GET requests for the files listed above are handled.
   Network first, so updates arrive straight away; the cache is the offline fallback.
   Only successful (200, basic) responses are stored, so an error page can never replace a good copy.
   index.html is served as a fallback only for page navigations, never for scripts or styles. */
const SCOPE=new URL("./",self.location).href;
const KNOWN=new Set(FILES.map(f=>new URL(f,SCOPE).href));
self.addEventListener("fetch",e=>{
  const req=e.request,u=new URL(req.url);
  if(req.method!=="GET"||u.origin!==location.origin)return; // AI requests and other sites are never touched
  const key=u.origin+u.pathname,nav=req.mode==="navigate";
  if(!KNOWN.has(key)&&!nav)return; // unknown files go straight to the network, never into the cache
  e.respondWith((async()=>{
    try{
      const r=await fetch(req);
      if(r.ok&&r.status===200&&r.type==="basic"&&KNOWN.has(key)){const c=r.clone();caches.open(VERSION).then(x=>x.put(key,c)).catch(()=>{})}
      return r;
    }catch(err){
      const m=await caches.match(key,{ignoreSearch:true});if(m)return m;
      if(nav){const i=await caches.match(new URL("./index.html",SCOPE).href);if(i)return i}
      throw err;
    }
  })());
});
