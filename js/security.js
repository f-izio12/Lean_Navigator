/* ================= Input hardening =================
   Data that arrives from outside (Hoshin share files, restored vaults) is cleaned before use:
   only known fields are kept, identifiers must be plain [A-Za-z0-9_-], text is length-capped,
   enumerations are checked. Rendering escapes text as well, and index.html sets a
   Content-Security-Policy that blocks inline scripts and event handlers as a last line of defence. */
const SAFE_ID=/^[A-Za-z0-9_-]{1,64}$/;
const okId=v=>typeof v==="string"&&SAFE_ID.test(v);
const cleanStr=(v,max=4000)=>typeof v==="string"?v.slice(0,max):typeof v==="number"&&Number.isFinite(v)?String(v):"";
const cleanIds=(a,max=200)=>Array.isArray(a)?a.filter(okId).slice(0,max):[];
function cleanPlanImport(p){
  if(!p||typeof p!=="object"||Array.isArray(p))throw new Error("The share file has no valid plan.");
  if(!okId(p.id))throw new Error("The share file contains an invalid plan identifier and was not imported.");
  const items=(arr,extra)=>(Array.isArray(arr)?arr:[]).slice(0,200).filter(x=>x&&typeof x==="object"&&okId(x.id)).map(x=>({id:x.id,text:cleanStr(x.text,1000),owner:cleanStr(x.owner,200),links:cleanIds(x.links),supports:cleanIds(x.supports),...(extra?extra(x):{})}));
  return{id:p.id,name:cleanStr(p.name,200),level:cleanStr(p.level,100),period:cleanStr(p.period,40),owner:cleanStr(p.owner,200),parent:okId(p.parent)?p.parent:"",updated:cleanStr(p.updated,40),
    breakthrough:items(p.breakthrough),annual:items(p.annual),priorities:items(p.priorities),
    metrics:items(p.metrics,x=>{const m={};if(x.months&&typeof x.months==="object")for(let i=0;i<12;i++){const v=cleanStr(x.months[i],40);if(v)m[i]=v}
      return{baseline:cleanStr(x.baseline,40),target:cleanStr(x.target,40),direction:x.direction==="Lower is better"?"Lower is better":"Higher is better",months:m}})};
}
/* Restored or synced vaults are decrypted with the user's password, but may still have been
   produced by someone else. Replace unsafe identifiers and invalid enumeration values. */
function sanitizeState(st){
  const walk=o=>{if(Array.isArray(o)){o.forEach(walk);return}if(!o||typeof o!=="object")return;
    for(const k of Object.keys(o)){const v=o[k];
      if(k==="id"&&typeof v==="string"&&!okId(v))o[k]=uidGen();
      else if(["deps","links","supports"].includes(k)&&Array.isArray(v))o[k]=cleanIds(v);
      else if(["parent","hoshinLink","projectId","ideaId","link","datum","selected","_jdi"].includes(k)&&typeof v==="string"&&v&&!okId(v))o[k]="";
      else if(k==="cells"||k==="pugh"||k==="hoq"||k==="predicted"||k==="actual"){if(v&&typeof v==="object")for(const kk of Object.keys(v))if(!/^[A-Za-z0-9_:|-]{1,140}$/.test(kk))delete v[kk];walk(v)}
      else walk(v)}};
  walk(st);
  (st.projects||[]).forEach(p=>{if(!STATUSES[p.status])p.status="ongoing";if(typeof p.tool!=="string"||!TOOLS.includes(p.tool))p.tool="DMAIC";
    if(p.plan&&Array.isArray(p.plan.items))p.plan.items=p.plan.items.filter(x=>x&&PTYPES[x.type])});
  const pf=st.portfolio;if(pf){pf.parents=(pf.parents||[]).map(p=>{try{return{...cleanPlanImport(p),importedAt:cleanStr(p.importedAt,40),source:cleanStr(p.source,200)}}catch{return null}}).filter(Boolean);
    (pf.ideas||[]).forEach(x=>{if(!IDEA_ST.includes(x.status))x.status="New"});}
  return st;
}
