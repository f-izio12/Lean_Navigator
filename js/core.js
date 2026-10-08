/* ================= registry ================= */
const TOOLS=["DMAIC","DMADV","Kaizen event","A3 problem solving","Value stream mapping","5S","PDCA","Just do it"];
const DEF={},ST={},TABS={},AFTER={},AUTO={},PDFSEC={},EXTRA={},INFO={},FIELDI={};
const BLANK={},STAGEBLANK={};
function registerTool(tool,o){
  DEF[tool]={...o,order:o.stages.map(s=>s.id)};
  o.stages.forEach((s,i)=>{ST[s.id]={...s,tool,next:o.stages[i+1]?o.stages[i+1].id:null,tabs:[...s.tabs,["tollgate",o.gate]]};TABS[s.id]=TABS[s.id]||{}});
}
const BUILT=()=>Object.keys(DEF);
const tgBlank=()=>({checks:{},decision:"",notes:""});
function blankFor(tool){const d=DEF[tool];if(!d)return{};const m={};d.stages.forEach(s=>{m[s.key]={...STAGEBLANK[s.key](),tollgate:tgBlank()}});return m}
const rows=(path,n=1)=>Array.from({length:n},()=>({...BLANK[path]}));

/* ================= state & helpers ================= */
const STATUSES=new Proxy({ongoing:"Ongoing",onhold:"On hold",closed:"Closed"},{get:(o,k)=>typeof o[k]==="string"?_t(o[k]):o[k]});
let S={pview:"method",view:"home",filter:"all",q:"",projects:[],current:null,stage:null,tab:null,chat:[],reco:null,title:null,busy:false,coach:{},coachBusy:false,refresh:null,info:{}};
let store=null,sample=null,downloads=null;
const $=s=>document.querySelector(s);
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(t){const el=$("#toast");el.textContent=t;el.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display="none",3200)}
const uidGen=()=>"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fmtDate=iso=>{try{return iso?new Date(iso).toLocaleDateString(uiLocale(),{day:"numeric",month:"short",year:"numeric"}):""}catch{return ""}};
const getPath=(o,p)=>p.split(".").reduce((a,k)=>a==null?a:a[k],o);
function setPath(o,p,v){const ks=p.split(".");let a=o;for(let i=0;i<ks.length-1;i++)a=a[ks[i]];a[ks[ks.length-1]]=v}
function deepMerge(base,v){
  if(v===undefined||v===null)return base;
  if(Array.isArray(base))return Array.isArray(v)?v:base;
  if(typeof base==="object"){const r={...v};for(const k in base)r[k]=deepMerge(base[k],v[k]);return r}
  return v;
}
const lines=t=>String(t||"").split("\n").map(x=>x.trim()).filter(Boolean);
const num=v=>{if(v==null||String(v).trim()==="")return null;const n=parseFloat(String(v).replace(",","."));return Number.isFinite(n)?n:null};
const fmt=(n,d=2)=>n==null||!Number.isFinite(n)?_t("n/a"):Number(n.toFixed(d)).toLocaleString(uiLocale(),{maximumFractionDigits:d});
const fmtP=p=>p==null||!Number.isFinite(p)?_t("n/a"):p<0.001?"< 0.001":fmt(p,3);
const filled=(rs,keys)=>rs.filter(r=>keys.every(k=>String(r[k]??"").trim()));
const trunc=(t,n)=>{t=String(t||"");return t.length>n?t.slice(0,n-1)+"…":t};

/* ================= storage (implemented by the vault, see vault.js and app.js) ================= */
const pending=new Map(),inflight=new Set();
function scheduleSave(p){p.updated=new Date().toISOString();setSaveState(_t("Unsaved changes"));clearTimeout(pending.get(p.id));pending.set(p.id,setTimeout(()=>flush(p),900))}
async function flush(p){
  if(inflight.has(p.id)){pending.set(p.id,setTimeout(()=>flush(p),500));return}
  inflight.add(p.id);
  try{await store.save(p);setSaveState(_t("Saved"))}catch(e){setSaveState((_t("Not saved: {x}",{x:e&&e.message?e.message:_t("storage error")})))}
  finally{inflight.delete(p.id)}
}
function setSaveState(t){const el=$("#saveState");if(el)el.textContent=t}
function newProject(title,tool,notes){
  return{kind:"project",id:uidGen(),title:title||"Untitled project",tool,status:"ongoing",phase:DEF[tool]?DEF[tool].order[0]:"",
    created:new Date().toISOString(),updated:new Date().toISOString(),advisorNotes:notes||"",...blankFor(tool),...projBlank()};
}
const projBlank=()=>({plan:{items:[]},people:{stakeholders:[],raci:{custom:[],cells:{}}}});
function ensureModel(p){const pb=projBlank();p.plan=deepMerge(pb.plan,p.plan);p.people=deepMerge(pb.people,p.people);if(!DEF[p.tool])return p;const b=blankFor(p.tool);for(const k in b)p[k]=deepMerge(b[k],p[k]);if(!DEF[p.tool].order.includes(p.phase))p.phase=DEF[p.tool].order[0];return p}
const tgOf=(p,id)=>p[ST[id].key].tollgate;
const autoTG=(p,id)=>AUTO[id]?AUTO[id](p):{};
function progress(p,id){const t=tgOf(p,id).checks,l=ST[id].tg;return Math.round(l.filter(([k])=>t[k]).length/l.length*100)}
const hasContent=(p,key)=>{const b={...STAGEBLANK[key](),tollgate:tgBlank()};return JSON.stringify(p[key])!==JSON.stringify(b)};
function stageStatus(p,id){const o=DEF[p.tool].order,i=o.indexOf(id),ci=o.indexOf(p.phase),d=tgOf(p,id).decision,last=i===o.length-1;
  if(d==="go")return last?"Completed":"Passed";if(d==="stop")return"Stopped";if(i===ci)return"In progress";if(i<ci)return"Passed";return hasContent(p,ST[id].key)?"Started early":"Not started"}

/* ================= statistics ================= */
function parseNums(t){return String(t||"").split(/[\n;\t ]+/).map(s=>s.trim().replace(",",".")).filter(Boolean).map(Number).filter(Number.isFinite)}
function parseGroups(t){return lines(t).map((l,i)=>{const m=l.match(/^([^:]*[A-Za-zÀ-ÿ][^:]*):(.*)$/);return m?{label:m[1].trim(),vals:parseNums(m[2])}:{label:(_t("Row {i}{x}",{i:i,x:1})),vals:parseNums(l)}}).filter(g=>g.vals.length)}
function stats(x){
  const n=x.length;if(!n)return{n:0};
  const mean=x.reduce((a,b)=>a+b,0)/n,s=[...x].sort((a,b)=>a-b);
  const median=n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;
  const sd=n>1?Math.sqrt(x.reduce((a,b)=>a+(b-mean)**2,0)/(n-1)):0;
  return{n,mean,median,sd,min:s[0],max:s[n-1]};
}
function normInv(p){const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416];const pl=.02425;let q,r;if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}if(p<=1-pl){q=p-.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
function lgamma(x){const g=7,c=[.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];if(x<.5)return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x);x-=1;let a=c[0];const t=x+g+.5;for(let i=1;i<9;i++)a+=c[i]/(x+i);return .5*Math.log(2*Math.PI)+(x+.5)*Math.log(t)-t+Math.log(a)}
function betacf(a,b,x){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-300)d=1e-300;d=1/d;let h=d;for(let m=1;m<=300;m++){const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-14)break}return h}
function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b}
function gammp(a,x){if(x<=0)return 0;if(x<a+1){let ap=a,sum=1/a,del=sum;for(let n=0;n<500;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*3e-15)break}return sum*Math.exp(-x+a*Math.log(x)-lgamma(a))}let b=x+1-a,c=1e300,d=1/b,h=d;for(let i=1;i<500;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-15)break}return 1-Math.exp(-x+a*Math.log(x)-lgamma(a))*h}
const pT2=(t,df)=>ibeta(df/(df+t*t),df/2,.5);
const pF=(f,d1,d2)=>f<=0?1:ibeta(d2/(d2+d1*f),d2/2,d1/2);
const pChi=(x,k)=>1-gammp(k/2,x/2);
const pZ2=z=>1-gammp(.5,z*z/2);
function tInv(p,df){let lo=0,hi=1000;for(let i=0;i<200;i++){const m=(lo+hi)/2;if(pT2(m,df)>p)lo=m;else hi=m}return(lo+hi)/2}
function longestSide(x,c){let best=0,cur=0,side=0,idx=[],bestIdx=[];x.forEach((v,i)=>{const s=v>c?1:v<c?-1:0;if(s===0)return;if(s===side){cur++;idx.push(i)}else{side=s;cur=1;idx=[i]}if(cur>best){best=cur;bestIdx=[...idx]}});return{len:best,idx:bestIdx}}
function longestTrend(x){let best=1,up=1,dn=1;for(let i=1;i<x.length;i++){up=x[i]>x[i-1]?up+1:1;dn=x[i]<x[i-1]?dn+1:1;best=Math.max(best,up,dn)}return x.length?best:0}
function capability(x,lsl,usl){
  const st=stats(x);if(st.n<2)return null;
  const L=num(lsl),U=num(usl);if(L==null&&U==null)return{st};
  const out=x.filter(v=>(L!=null&&v<L)||(U!=null&&v>U)).length;
  const cpu=U!=null&&st.sd?(U-st.mean)/(3*st.sd):null,cpl=L!=null&&st.sd?(st.mean-L)/(3*st.sd):null;
  const cp=U!=null&&L!=null&&st.sd?(U-L)/(6*st.sd):null;
  const cpk=[cpu,cpl].filter(v=>v!=null).reduce((a,b)=>a==null?b:Math.min(a,b),null);
  return{st,out,cp,cpk,dpmo:out/st.n*1e6,sigma:out===0?null:normInv(1-out/st.n)+1.5};
}
function imr(x){
  const st=stats(x);if(st.n<2)return null;
  const mr=x.slice(1).map((v,i)=>Math.abs(v-x[i])),mrbar=mr.reduce((a,b)=>a+b,0)/mr.length;
  const ucl=st.mean+2.66*mrbar,lcl=st.mean-2.66*mrbar;
  const outside=x.map((v,i)=>v>ucl||v<lcl?i:-1).filter(i=>i>=0),run=longestSide(x,st.mean);
  return{st,mrbar,ucl,lcl,outside,run,runIdx:run.len>=8?run.idx:[],mrUcl:3.267*mrbar};
}

/* ================= instant text checks ================= */
/* Keywords for the quick text checks in each interface language (glossary sheet "Check keywords").
   English always applies; the keywords of the selected language are checked as well. */
const KW={
 de:{sol:/(implementier|einführ|installier|kaufen|beschaff|neue[sn]? (system|tool|software|prozess)|mangel an|fehlt|müssen|muss |sollte|brauchen|automatisier)/iu,
     cause:/(weil|aufgrund|wegen|verursacht durch|infolge|der grund)/iu,
     blame:/(mitarbeiter\w*|personal|kollegen) (sind|ist) (nachlässig|faul|nicht)/iu,
     time:/(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|woche|monat|quartal|jahr|seit|pro (tag|woche|monat))/iu,
     abs:/(null|100\s?%|beseitig|eliminier)/iu,
     agree:/(team war sich einig|jeder weiß|abstimmung|konsens|wir (denken|glauben))/iu,
     tool:/(neues system|neues tool|software)/iu,
     weak:/(schwach|minus|risiko|abmilder|übernehm|kombinier)/iu},
 fr:{sol:/(mettre en place|implément|introdui|install|achet|nouve(au|l|lle) (système|outil|logiciel|processus)|manque de|il faut|devrai|doit|automatis)/iu,
     cause:/(parce que|à cause de|en raison de|dû à|due à|causé par|la raison)/iu,
     blame:/(personnel|employés|collègues) (sont|est) (négligent|paresseu|ne )/iu,
     time:/(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|semaine|mois|trimestre|année|\ban\b|depuis|par (jour|semaine|mois)|\bT[1-4]\b)/iu,
     abs:/(zéro|100\s?%|élimin|supprim)/iu,
     agree:/(l'équipe est d'accord|tout le monde sait|vote|consensus|nous pensons)/iu,
     tool:/(nouveau système|nouvel outil|logiciel)/iu,
     weak:/(faible|moins|risque|atténu|emprunt|combin)/iu},
 it:{sol:/(implementa|introdur|install|comprar|acquist|nuov[oa] (sistema|strumento|software|processo)|mancanza di|manca |bisogna|occorre|serve |dovrebbe|deve |automatizz)/iu,
     cause:/(perché|a causa di|dovut[oa] a|causat[oa] da|per via di|il motivo)/iu,
     blame:/(personale|dipendenti|colleghi) (sono|è) (negligent|pigr|non )/iu,
     time:/(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|settimana|mese|trimestre|anno|\bdal\b|da quando|al giorno|alla settimana|al mese|\b[TQ][1-4]\b)/iu,
     abs:/(zero|100\s?%|eliminar|azzerar)/iu,
     agree:/(il team concorda|lo sanno tutti|votazione|consenso|pensiamo|crediamo)/iu,
     tool:/(nuovo sistema|nuovo strumento|software)/iu,
     weak:/(debol|meno|rischio|mitigar|prendere da|combinar)/iu},
 nl:{sol:/(implementer|invoeren|installer|kopen|aanschaf|nieuwe? (systeem|tool|software|proces)|gebrek aan|ontbreekt|moet|zou moeten|nodig|automatiser)/iu,
     cause:/(omdat|doordat|vanwege|als gevolg van|veroorzaakt door|de reden)/iu,
     blame:/(medewerkers|personeel|collega'?s) (zijn|is) (slordig|lui|niet)/iu,
     time:/(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|week|maand|kwartaal|jaar|sinds|per (dag|week|maand)|\b[QK][1-4]\b)/iu,
     abs:/(\bnul\b|100\s?%|elimin|uitbann)/iu,
     agree:/(het team was het eens|iedereen weet|stemming|consensus|we denken)/iu,
     tool:/(nieuw systeem|nieuwe tool|software)/iu,
     weak:/(zwak|\bmin\b|risico|beperk|overnem|combiner)/iu}};
const kwLang=(name,t)=>{const k=KW[I18N.lang];return !!(k&&k[name]&&k[name].test(String(t||"")))};

const hasNum=t=>/\d/.test(t);
const hasTime=t=>kwLang("time",t)||/\b(20\d\d|19\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|week|month|quarter|q[1-4]|year|since|per (day|week|month))/i.test(t);
function checkProblem(t,noLen){
  const f=[];if(!String(t).trim())return f;
  if(kwLang("sol",t)||/\b(implement|introduc|install|buy|purchase|new (system|tool|software|process)|lack of|need(s)? (to|a|an)|should|must|automate)/i.test(t))f.push(_t("Reads like a solution or a pre-decided fix. Describe the gap, not the remedy."));
  if(kwLang("cause",t)||/\b(because|due to|caused by|as a result of|the reason)\b/i.test(t))f.push(_t("States a cause. Describe the symptom here; the analysis proves the cause."));
  if(kwLang("blame",t)||/\b(staff|people|employees|colleagues) (are|is) (careless|lazy|not)\b/i.test(t))f.push(_t("Blames people. Point at the process, not the person."));
  if(!hasNum(t))f.push(_t("No magnitude. How big is the gap, in numbers?"));
  if(!hasTime(t))f.push(_t("No timeframe. Since when, or over what period?"));
  if(!noLen&&t.trim().length<60)f.push(_t("Very short. Cover what, where, when, how much and the impact."));
  if(!f.length)f.push(_t("✓ Passes the quick checks. Still test it with the sponsor."));
  return f;
}
function checkGoal(t){
  const f=[];if(!String(t).trim())return f;
  if(!hasNum(t))f.push(_t("Not measurable. State the target value."));
  if(!hasTime(t))f.push(_t("Not time-bound. Add a date."));
  if(kwLang("abs",t)||/\b(zero|100\s?%|eliminate)/i.test(t))f.push(_t("Absolute targets rarely survive contact with data. Is this realistic?"));
  if(!f.length)f.push(_t("✓ Measurable and time-bound. Check it uses the same metric as the baseline."));
  return f;
}
