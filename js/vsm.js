/* ================= Value stream mapping ================= */
Object.assign(BLANK,{
 "vsmcur.steps":{step:"",ct:"",co:"",uptime:"",ops:"",wait:"",pca:""},
 "vsmfut.steps":{step:"",ct:"",co:"",uptime:"",ops:"",wait:"",pca:""},
 "vsmfut.bursts":{where:"",improvement:"",effect:""},
 "vsmplan.actions":{action:"",burst:"",owner:"",due:"",status:"Open"}
});
Object.assign(STAGEBLANK,{
 vsmcur:()=>({family:"",supplier:"",customer:"",owner:"",sponsor:"",demand:"",period:"",avail:"",unit:"minutes",steps:rows("vsmcur.steps"),info:"",observations:""}),
 vsmfut:()=>({steps:rows("vsmfut.steps"),bursts:rows("vsmfut.bursts"),vision:""}),
 vsmplan:()=>({actions:rows("vsmplan.actions"),review:""})
});
registerTool("Value stream mapping",{gate:"Review",stages:[
 {id:"vc",letter:"1",name:"Current state",key:"vsmcur",tabs:[["setup","Scope and demand"],["current","Current-state map"]],
  tg:[["family","One product or service family chosen, with a clear customer"],["demand","Customer demand and available time known, takt calculated"],["walked","Map drawn from walking the process, not from the procedure"],["data","Cycle time and waiting time recorded for every step"],["team","People from every team in the stream took part"],["sponsor","Sponsor has seen the current-state map"]],
  focus:"one product or service family with a clear customer; demand and takt credible; data observed at the gemba not taken from the procedure; waiting time captured between every step; lead time, process time and PCE interpreted correctly; bottleneck against takt identified."},
 {id:"vf",letter:"2",name:"Future state",key:"vsmfut",tabs:[["future","Future-state map"],["bursts","Kaizen bursts"]],
  tg:[["flow","Future state creates flow where possible and pull where not"],["takt","No step's cycle time exceeds takt"],["bursts","Every change needed is marked as a kaizen burst"],["realistic","Future state is achievable in 6 to 12 months"],["sponsor","Sponsor has agreed the future state"]],
  focus:"future state follows lean principles (continuous flow, pull, levelling, pacemaker); no step above takt; lead time reduction is credible, not wishful; every difference between current and future state is covered by a kaizen burst."},
 {id:"vp",letter:"3",name:"Plan",key:"vsmplan",tabs:[["plan","Implementation plan"]],
  tg:[["covered","Every kaizen burst has an action"],["owners","Actions have one owner and a date each"],["method","Each action has a method (Just do it, Kaizen, A3, DMAIC)"],["review","Review rhythm with the sponsor is agreed"]],
  focus:"every kaizen burst turned into an action with a single owner, a date and the right improvement method; sequencing sensible (quick wins and bottleneck first); regular review with the sponsor."}
]});
CONTEXT["Value stream mapping"]=p=>({family:p.vsmcur.family,customer:p.vsmcur.customer,demand:p.vsmcur.demand+" per "+(p.vsmcur.period||"period"),unit:p.vsmcur.unit});
function vsmCalc(steps,c){
  const r=filled(steps,["step"]),sum=k=>r.reduce((a,x)=>a+(num(x[k])||0),0);
  const ct=sum("ct"),wait=sum("wait"),lead=ct+wait,d=num(c.demand),av=num(c.avail),takt=d&&av?av/d:null;
  const pcas=r.map(x=>num(x.pca)).filter(v=>v!=null);const rolled=pcas.length?pcas.reduce((a,v)=>a*v/100,1)*100:null;
  let bn=null;r.forEach(x=>{const v=num(x.ct);if(v!=null&&(!bn||v>num(bn.ct)))bn=x});
  return{r,ct,wait,lead,pce:lead?ct/lead*100:null,takt,rolled,bn,over:takt?r.filter(x=>num(x.ct)>takt):[]};
}
function vsmMap(steps,c,title,bursts=[]){
  const k=vsmCalc(steps,c),r=k.r;if(!r.length)return "";
  const u=c.unit||"",n=r.length,bx=i=>100+i*190,W=Math.max(860,100+n*190+230),H=400,BW=130;
  let g=svgOpen(W,H)+`<defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${C.blue}"/></marker></defs>`;
  g+=`<text x="20" y="22" font-size="13" font-weight="700" fill="${C.text}">${esc(title)}</text>`;
  g+=`<rect x="20" y="36" width="120" height="40" fill="${C.pale}" stroke="${C.blue}"/><text x="80" y="60" font-size="10" text-anchor="middle" fill="${C.text}">${esc(trunc(c.supplier||"Supplier",18))}</text>`;
  const cx=bx(n-1)+BW-120;g+=`<rect x="${cx}" y="36" width="120" height="40" fill="${C.pale}" stroke="${C.blue}"/><text x="${cx+60}" y="54" font-size="10" text-anchor="middle" fill="${C.text}">${esc(trunc(c.customer||"Customer",18))}</text>`;
  if(c.demand)g+=`<text x="${cx+60}" y="68" font-size="9" text-anchor="middle" fill="${C.grey}">${esc(c.demand)} per ${esc(c.period||"period")}</text>`;
  g+=`<line x1="80" y1="76" x2="80" y2="132" stroke="${C.blue}" marker-end="url(#ar)"/><line x1="${bx(n-1)+BW/2}" y1="110" x2="${cx+60}" y2="80" stroke="${C.blue}" marker-end="url(#ar)"/>`;
  r.forEach((s,i)=>{const x=bx(i),over=k.takt&&num(s.ct)>k.takt;
    const tx=x-30;g+=`<polygon points="${tx},118 ${tx-16},146 ${tx+16},146" fill="#fff" stroke="${C.orange}" stroke-width="1.5"/><text x="${tx}" y="142" font-size="10" font-weight="700" text-anchor="middle" fill="${C.orange}">I</text>`;
    g+=`<text x="${tx}" y="162" font-size="9" text-anchor="middle" fill="${C.text}">${esc(s.wait?fmt(num(s.wait)):"?")}</text>`;
    g+=`<rect x="${x}" y="110" width="${BW}" height="40" fill="${C.blue}" ${over?`stroke="${C.orange}" stroke-width="4"`:""}/>`;
    wrapWords(s.step,20,2).forEach((l,j)=>g+=`<text x="${x+BW/2}" y="${127+j*13}" font-size="10" text-anchor="middle" fill="#fff">${esc(l)}</text>`);
    g+=`<rect x="${x}" y="150" width="${BW}" height="74" fill="#fff" stroke="${C.blue}"/>`;
    [["C/T",s.ct?fmt(num(s.ct))+" "+u:"-"],["C/O",s.co?fmt(num(s.co))+" "+u:"-"],["Uptime",s.uptime?s.uptime+"%":"-"],["People",s.ops||"-"],["%C&A",s.pca?s.pca+"%":"-"]].forEach(([l,v],j)=>g+=`<text x="${x+6}" y="${164+j*13}" font-size="9" fill="${C.text}">${esc(l)}</text><text x="${x+BW-6}" y="${164+j*13}" font-size="9" text-anchor="end" fill="${C.text}">${esc(v)}</text>`);
    if(i<n-1)g+=`<line x1="${x+BW}" y1="130" x2="${x+BW+44}" y2="130" stroke="${C.grey}" stroke-dasharray="4 3" marker-end="url(#ar)"/>`;
    const b=bursts.map((z,bi)=>({...z,bi})).filter(z=>z.where&&s.step&&(z.where.toLowerCase().includes(s.step.toLowerCase())||s.step.toLowerCase().includes(z.where.toLowerCase())));
    b.forEach((z,j)=>{const sx=x+BW-10-j*26,sy=98,pts=[];for(let q=0;q<16;q++){const ang=q*Math.PI/8,rad=q%2?7:13;pts.push((sx+rad*Math.cos(ang)).toFixed(1)+","+(sy+rad*Math.sin(ang)).toFixed(1))}
      g+=`<polygon points="${pts.join(" ")}" fill="${C.orange}"/><text x="${sx}" y="${sy+4}" font-size="9" font-weight="700" text-anchor="middle" fill="#fff">${z.bi+1}</text>`});
  });
  const ty=280,tl=ty+30;let path=`M${bx(0)-60},${ty}`;
  r.forEach((s,i)=>{const x=bx(i);path+=` L${x},${ty} L${x},${tl} L${x+BW},${tl} L${x+BW},${ty}`;
    g+=`<text x="${x-30}" y="${ty-6}" font-size="9" text-anchor="middle" fill="${C.text}">${esc(s.wait?fmt(num(s.wait)):"?")}</text><text x="${x+BW/2}" y="${tl+14}" font-size="9" text-anchor="middle" fill="${C.text}">${esc(s.ct?fmt(num(s.ct)):"?")}</text>`});
  g+=`<path d="${path}" fill="none" stroke="${C.blue}" stroke-width="1.5"/>`;
  g+=`<text x="${bx(0)-60}" y="${ty-20}" font-size="9" fill="${C.grey}">Waiting (${esc(u)})</text><text x="${bx(0)-60}" y="${tl+30}" font-size="9" fill="${C.grey}">Processing (${esc(u)})</text>`;
  const sx=W-200;g+=`<rect x="${sx}" y="250" width="185" height="96" fill="${C.pale}" stroke="${C.blue}"/>`;
  [["Lead time",fmt(k.lead)+" "+u],["Processing time",fmt(k.ct)+" "+u],["PCE",k.pce==null?"n/a":fmt(k.pce,1)+"%"],["Takt",k.takt==null?"n/a":fmt(k.takt)+" "+u],["Rolled %C&A",k.rolled==null?"n/a":fmt(k.rolled,1)+"%"]].forEach(([l,v],j)=>g+=`<text x="${sx+8}" y="${268+j*16}" font-size="10" fill="${C.text}">${esc(l)}</text><text x="${sx+177}" y="${268+j*16}" font-size="10" font-weight="700" text-anchor="end" fill="${C.text}">${esc(v)}</text>`);
  if(k.takt)g+=`<text x="20" y="${H-12}" font-size="9" fill="${C.orange}">Orange outline: cycle time above takt (${esc(fmt(k.takt))} ${esc(u)}).</text>`;
  return g+`</svg>`;
}
function vsmFlags(k,u){const f=[];
  if(k.r.length&&k.r.some(x=>!String(x.wait||"").trim()))f.push("Some steps have no waiting time. In most value streams the waiting is where the lead time goes.");
  if(k.pce!=null)f.push(`ℹ Lead time ${fmt(k.lead)} ${u}, of which ${fmt(k.ct)} ${u} processing: PCE ${fmt(k.pce,1)}%.`);
  if(k.pce!=null&&k.pce<5)f.push("PCE below 5% is common in office processes. The big gains are in the waiting, not in working faster.");
  if(k.over.length)f.push(`${k.over.map(x=>x.step).join(", ")} ${k.over.length>1?"are":"is"} slower than takt: ${k.over.length>1?"these steps":"this step"} cannot keep up with demand.`);
  else if(k.takt&&k.r.length)f.push("✓ Every step is within takt.");
  if(!k.takt)f.push("Enter demand and available time on the Scope tab to calculate takt.");
  if(k.rolled!=null&&k.rolled<70)f.push(`Only ${fmt(k.rolled,0)}% of work passes every step first time right. Rework is a hidden source of lead time.`);
  return f}
const STEPCOLS=u=>[{k:"step",label:"Step"},{k:"ct",label:`C/T (${u})`,type:"text",w:"90px"},{k:"co",label:`C/O (${u})`,type:"text",w:"90px"},{k:"uptime",label:"Uptime %",type:"text",w:"85px"},{k:"ops",label:"People",type:"text",w:"75px"},{k:"wait",label:`Waiting before (${u})`,type:"text",w:"110px"},{k:"pca",label:"%C&A",type:"text",w:"80px"}];
TABS.vc.setup=()=>`${inp("vsmcur.family","Product or service family","The one flow you map, e.g. dataset deposits requiring curation.",{rows:1})}
  <div class="grid2">${inp("vsmcur.supplier","Supplier","Where the work comes from.",{rows:1})}${inp("vsmcur.customer","Customer","Who receives the output.",{rows:1})}</div>
  <div class="grid2">${inp("vsmcur.owner","Value stream owner","",{rows:1})}${inp("vsmcur.sponsor","Sponsor","",{rows:1})}</div>
  <fieldset><legend>Demand and takt</legend><div class="grid3">${inp("vsmcur.demand","Customer demand","Units per period.",{rows:1})}${inp("vsmcur.period","Period","e.g. day, week",{rows:1})}${inp("vsmcur.unit","Time unit","Used for every time on the map.",{options:["seconds","minutes","hours","days"],rerender:1})}</div>
  ${inp("vsmcur.avail","Available working time per period","In the time unit above, e.g. 450 minutes per day.",{rows:1})}<div class="flags" id="taktFlags"></div></fieldset>
  ${inp("vsmcur.info","Information flow","How work is triggered and scheduled: emails, queues, systems, meetings.",{rows:3})}`;
AFTER["vc.setup"]=p=>{S.refresh=()=>{const c=p.vsmcur,t=vsmCalc([],c).takt;$("#taktFlags").innerHTML=flagsHTML(t?[`ℹ Takt time: ${fmt(t)} ${c.unit}. The process must complete one unit every ${fmt(t)} ${c.unit} to meet demand.`]:[])}};
TABS.vc.current=p=>`<p class="lead">One row per process step, in flow order. C/T is the working time per unit, C/O the changeover or set-up time, %C&A the share that is complete and accurate (no rework needed). Waiting is the time a unit waits before the step starts.</p>
  ${table("vsmcur.steps",STEPCOLS(p.vsmcur.unit))}<div class="chartbox" id="vsmCur"></div><div class="flags" id="vsmCurF"></div>
  ${inp("vsmcur.observations","Observations","What surprised you while walking the process.",{rows:3})}`;
AFTER["vc.current"]=p=>{S.refresh=()=>{$("#vsmCur").innerHTML=vsmMap(p.vsmcur.steps,p.vsmcur,"Current state")||'<p class="muted small" style="margin:8px">Add steps to draw the map.</p>';$("#vsmCurF").innerHTML=flagsHTML(vsmFlags(vsmCalc(p.vsmcur.steps,p.vsmcur),p.vsmcur.unit))}};
TABS.vf.future=p=>`<p class="lead">Design the flow you want in 6 to 12 months. Combine steps, remove queues, and keep every step within takt.</p>
  <button class="btn alt" id="copyCur" style="margin-bottom:12px">Start from the current state</button>
  ${table("vsmfut.steps",STEPCOLS(p.vsmcur.unit))}<div class="chartbox" id="vsmFut"></div><div id="vsmCmp"></div><div class="flags" id="vsmFutF"></div>
  ${inp("vsmfut.vision","Future-state description","The main changes in one paragraph.",{rows:3})}`;
AFTER["vf.future"]=p=>{
  S.refresh=()=>{const c=vsmCalc(p.vsmcur.steps,p.vsmcur),f=vsmCalc(p.vsmfut.steps,p.vsmcur),u=p.vsmcur.unit;
    $("#vsmFut").innerHTML=vsmMap(p.vsmfut.steps,p.vsmcur,"Future state",p.vsmfut.bursts)||'<p class="muted small" style="margin:8px">Add steps, or start from the current state.</p>';
    $("#vsmCmp").innerHTML=f.r.length&&c.r.length?statsHTML([["Lead time",`${fmt(c.lead)} → ${fmt(f.lead)} ${u}`],["Change",c.lead?fmt((f.lead-c.lead)/c.lead*100,0)+"%":"n/a"],["Processing",`${fmt(c.ct)} → ${fmt(f.ct)}`],["PCE",`${fmt(c.pce,1)}% → ${fmt(f.pce,1)}%`],["Steps",`${c.r.length} → ${f.r.length}`]]):"";
    const fl=vsmFlags(f,u).filter(x=>!x.startsWith("Enter demand"));if(c.lead&&f.lead&&f.lead<c.lead*.1)fl.push("Lead time cut by more than 90%. Possible, but check every queue removal has a real kaizen burst behind it.");$("#vsmFutF").innerHTML=flagsHTML(fl)};
  setTimeout(()=>{const b=$("#copyCur");if(b)b.onclick=()=>{const has=filled(p.vsmfut.steps,["step"]).length;if(has&&!confirm("Replace the future-state steps with a copy of the current state?"))return;p.vsmfut.steps=p.vsmcur.steps.map(x=>({...x}));scheduleSave(p);renderSheet()}})};
TABS.vf.bursts=()=>`<p class="lead">A kaizen burst marks each change needed to reach the future state. Name the step in "Where" exactly as on the map to place the burst on it.</p>
  ${table("vsmfut.bursts",[{k:"where",label:"Where (step)",w:"200px"},{k:"improvement",label:"Improvement needed"},{k:"effect",label:"Expected effect"}])}`;
TABS.vp.plan=p=>`<p class="lead">Turn each kaizen burst into an action and choose the method: Just do it, Kaizen event, A3 or DMAIC.</p>
  ${table("vsmplan.actions",[{k:"action",label:"Action"},{k:"burst",label:"Burst / method"},{k:"owner",label:"Owner",w:"150px"},{k:"due",label:"Due",type:"date",w:"150px"},{k:"status",label:"Status",opts:["Open","In progress","Done","Blocked"],w:"120px"}])}
  <div class="flags" id="vpF"></div>${inp("vsmplan.review","Review rhythm","How often, with whom, and what is reviewed.",{rows:2})}`;
AFTER["vp.plan"]=p=>{S.refresh=()=>{const b=filled(p.vsmfut.bursts,["improvement"]).length,a=filled(p.vsmplan.actions,["action"]).length,f=[];if(b)f.push(a>=b?`✓ ${a} actions for ${b} kaizen bursts.`:`${b} kaizen bursts but only ${a} actions.`);$("#vpF").innerHTML=flagsHTML(f)}};
AUTO.vc=p=>{const c=p.vsmcur,k=vsmCalc(c.steps,c);return{family:!!(c.family.trim()&&c.customer.trim()),demand:k.takt!=null,data:k.r.length>=2&&k.r.every(x=>num(x.ct)!=null&&num(x.wait)!=null)}};
AUTO.vf=p=>{const f=vsmCalc(p.vsmfut.steps,p.vsmcur);return{takt:f.takt!=null&&f.r.length>0&&!f.over.length,bursts:filled(p.vsmfut.bursts,["improvement"]).length>0}};
AUTO.vp=p=>{const a=filled(p.vsmplan.actions,["action"]);return{covered:a.length>0&&a.length>=filled(p.vsmfut.bursts,["improvement"]).length,owners:a.length>0&&a.every(x=>x.owner.trim()&&x.due),method:a.length>0&&a.every(x=>/just do|kaizen|a3|dmaic/i.test(x.burst)),review:!!p.vsmplan.review.trim()}};
EXTRA.vc=p=>{const k=vsmCalc(p.vsmcur.steps,p.vsmcur);return{lead:k.lead,processing:k.ct,pce:k.pce,takt:k.takt,rolledCA:k.rolled,stepsOverTakt:k.over.map(x=>x.step)}};
EXTRA.vf=p=>{const c=vsmCalc(p.vsmcur.steps,p.vsmcur),f=vsmCalc(p.vsmfut.steps,p.vsmcur);return{current:{lead:c.lead,pce:c.pce},future:{lead:f.lead,pce:f.pce,stepsOverTakt:f.over.map(x=>x.step)},takt:f.takt}};
