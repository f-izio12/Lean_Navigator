/* Service worker: caches the app so it opens offline. Bump VERSION when you publish changes. */
const VERSION="lean-navigator-1.3.0";
const FILES=["./","./index.html","./css/app.css","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./js/a3.js","./js/ai.js","./js/app.js","./js/charts.js","./js/core.js","./js/dmadv.js","./js/dmaic.js","./js/export.js","./js/fives.js","./js/hoshin.js","./js/hyp.js","./js/info.js","./js/kaizen.js","./js/pdca.js","./js/pdf.js","./js/people.js","./js/plan.js","./js/portfolio.js","./js/ui.js","./js/vault.js","./js/vsm.js","./vendor/exceljs.min.js","./vendor/jspdf.plugin.autotable.min.js","./vendor/jspdf.umd.min.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin)return; // AI requests and other sites are never cached
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match("./index.html"))));
});
