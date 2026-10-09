/* ================= Hoshin Kanri: strategy deployment across levels ================= */
var MONTHS=[_t("Jan"),_t("Feb"),_t("Mar"),_t("Apr"),_t("May"),_t("Jun"),_t("Jul"),_t("Aug"),_t("Sep"),_t("Oct"),_t("Nov"),_t("Dec")];
var HKIND=[["breakthrough","B",_t("Breakthrough objectives"),_t("3 to 5 years. Where the organisation must be.")],["annual","A",_t("Annual objectives"),_t("This year's steps towards the breakthrough objectives.")],["priorities","P",_t("Improvement priorities"),_t("The few initiatives that deliver the annual objectives. Projects link here.")],["metrics","M",_t("Metrics and targets"),_t("How progress on the priorities is measured each month.")]];
var linkTarget={annual:"breakthrough",priorities:"annual",metrics:"priorities"};
function newPlan(){return{id:uidGen(),name:"",level:"",period:String(new Date().getFullYear()+1),owner:"",parent:"",breakthrough:[],annual:[],priorities:[],metrics:[],updated:new Date().toISOString()}}
var hcode=(plan,kind,id)=>{const k=HKIND.find(x=>x[0]===kind)[1],i=(plan[kind]||[]).findIndex(x=>x.id===id);return i<0?"":k+(i+1)};
var findPlan=id=>PF().plans.find(p=>p.id===id)||PF().parents.find(p=>p.id===id);
function parseCodes(plan,kind,text){const pre=HKIND.find(x=>x[0]===kind)[1],ids=[],bad=[];String(text||"").toUpperCase().split(/[,;\s]+/).filter(Boolean).forEach(c=>{const m=new RegExp("^"+pre+"(\\d+)$").exec(c);const it=m&&plan[kind][+m[1]-1];if(it)ids.includes(it.id)||ids.push(it.id);else bad.push(c)});return{ids,bad}}
function parseParentCodes(parent,text){const ids=[],bad=[];String(text||"").toUpperCase().split(/[,;\s]+/).filter(Boolean).forEach(c=>{const m=/^([AP])(\d+)$/.exec(c),kind=m&&(m[1]==="A"?"annual":"priorities"),it=kind&&parent[kind][+m[2]-1];if(it)ids.includes(it.id)||ids.push(it.id);else bad.push(c)});return{ids,bad}}
var monthPlan=(m,i)=>{const b=num(m.baseline),t=num(m.target);return b==null||t==null?null:b+(t-b)*(i+1)/12};
var monthOK=(m,i)=>{const a=num((m.months||{})[i]),pl=monthPlan(m,i);if(a==null||pl==null)return null;return m.direction==="Lower is better"?a<=pl:a>=pl};
function planGaps(plan){const f=[],c=(k,id)=>hcode(plan,k,id);
  plan.breakthrough.filter(b=>b.text.trim()&&!plan.annual.some(a=>(a.links||[]).includes(b.id))).forEach(b=>f.push(`${_t("{id} has no annual objective this year.",{id:c("breakthrough",b.id)})}`));
  plan.annual.filter(a=>a.text.trim()&&!(a.links||[]).length).forEach(a=>f.push(`${_t("{id} is not linked to a breakthrough objective.",{id:c("annual",a.id)})}`));
  plan.annual.filter(a=>a.text.trim()&&!plan.priorities.some(p=>(p.links||[]).includes(a.id))).forEach(a=>f.push(`${_t("{id} has no improvement priority delivering it.",{id:c("annual",a.id)})}`));
  plan.priorities.filter(p=>p.text.trim()&&!p.owner.trim()).forEach(p=>f.push(`${_t("{id} has no owner.",{id:c("priorities",p.id)})}`));
  plan.priorities.filter(p=>p.text.trim()&&!plan.metrics.some(m=>(m.links||[]).includes(p.id))).forEach(p=>f.push(`${_t("{id} has no metric: progress cannot be tracked.",{id:c("priorities",p.id)})}`));
  const np=plan.priorities.filter(p=>p.text.trim()).length;if(np>7)f.push(`${_t("{np} improvement priorities. Hoshin works by focus: most organisations manage three to five.",{np:np})}`);
  return f}
function workFor(priId){return{projects:S.projects.filter(p=>p.hoshinLink===priId),ideas:PF().ideas.filter(x=>x.link===priId&&!["Started","Rejected","Just do it"].includes(x.status)),jdi:PF().jdi.filter(j=>j.link===priId)}}

/* ----- page ----- */
function renderStrategy(){
  const pf=PF();S.refresh=null;
  const plan=S.planId&&pf.plans.find(p=>p.id===S.planId);
  if(!plan){
    $("#app").innerHTML=`<div class="proj-head"><h2>${_t("Strategy (Hoshin Kanri)")}</h2><span class="muted small">${_t("Plans per level. A plan can take a plan from the level above as its parent: its annual objectives and priorities become the starting point below.")}</span>
     <div style="margin-left:auto" class="row"><button class="btn" id="newPlan">${_t("New plan")}</button><label class="btn alt" for="impPlan">${_t("Import a plan from a share file")}</label><input id="impPlan" type="file" accept=".json,application/json" hidden></div></div>
     ${infoBlock("hk.list")}
     <div class="plans">${pf.plans.map(p=>`<button class="card plan-card" data-plan="${esc(p.id)}"><span class="lvl">${esc(lvlTxt(p))}</span><b>${esc(p.name||_t("Untitled plan"))}</b><span class="small muted">${esc(p.period)}${p.owner?(_t(", owner {owner}",{owner:esc(p.owner)})):""}${p.parent?(_t(", under {x}",{x:esc(findPlan(p.parent)?.name||"?")})):""}</span><span class="small">${p.priorities.filter(x=>x.text.trim()).length} priorities, ${planGaps(p).length} gaps</span></button>`).join("")||`<p class="muted">${_t("No plans yet.")}</p>`}</div>
     ${pf.parents.length?`<h4>${_t("Imported plans from other levels (read-only)")}</h4><ul class="small">${pf.parents.map(p=>`<li>${_t("<b>{pName}</b> ({p}, {period}), received {importedAt}",{pName:esc(p.name),p:esc(lvlTxt(p)),period:esc(p.period),importedAt:fmtDate(p.importedAt)})} <button class="x" data-rmimp="${esc(p.id)}" aria-label="${_t("Remove")}">×</button></li>`).join("")}</ul>`:""}`;
    $("#newPlan").onclick=()=>{const p=newPlan();pf.plans.push(p);S.planId=p.id;S.planTab="plan";savePF();renderStrategy()};
    document.querySelectorAll("[data-plan]").forEach(b=>b.onclick=()=>{S.planId=b.dataset.plan;S.planTab="plan";renderStrategy()});
    document.querySelectorAll("[data-rmimp]").forEach(b=>b.onclick=()=>{if(!confirm(_t("Remove this imported plan? Links to it stop working.")))return;pf.parents=pf.parents.filter(p=>p.id!==b.dataset.rmimp);savePF();renderStrategy()});
    $("#impPlan").onchange=e=>importShare(e.target.files[0]);bind($("#app"));return}
  const tab=S.planTab||"plan";
  $("#app").innerHTML=`<div class="proj-head"><button class="btn alt" id="toList">${_t("All plans")}</button><input class="title-input" id="pname" value="${esc(plan.name)}" placeholder="${_t("Plan name, e.g. Operations plan 2027")}" aria-label="${_t("Plan name")}">
    <div class="menu"><button class="btn" id="hkExp">${_t("Export ▾")}</button><div class="menu-list" id="hkList" hidden>
      <button data-hx="pdf">${_t("<b>PDF</b>")}<span>${_t("The plan, the linked matrices and the monthly tracking.")}</span></button>
      <button data-hx="xlsx">${_t("<b>Excel workbook</b>")}<span>${_t("Objectives, matrices and a coloured monthly tracking chart. One-way.")}</span></button>
      <button data-hx="share">${_t("<b>Share file (catchball)</b>")}<span>${_t("For the level below or above to import. Not encrypted: share only what may be shared.")}</span></button></div></div>
    <button class="btn alt" id="delPlan">${_t("Delete")}</button></div>
   <div class="pviews">${[["plan",_t("Plan")],["obj",_t("Objectives")],["matrix",_t("Matrix")],["bowl",_t("Monthly tracking")],["work",_t("Projects and ideas")]].map(([k,l])=>`<button class="pv" data-ht="${k}" aria-selected="${tab===k}">${l}</button>`).join("")}</div>
   <div class="sheet solo" id="hkSheet"></div>`;
  $("#toList").onclick=()=>{S.planId=null;renderStrategy()};
  $("#pname").oninput=e=>{plan.name=e.target.value;plan.updated=new Date().toISOString();savePF()};
  $("#delPlan").onclick=()=>{if(!confirm(_t("Delete this plan? Projects and ideas linked to its priorities lose the link.")))return;pf.plans=pf.plans.filter(p=>p.id!==plan.id);pf.plans.forEach(p=>{if(p.parent===plan.id)p.parent=""});S.planId=null;savePF();renderStrategy()};
  const b=$("#hkExp"),l=$("#hkList");b.onclick=e=>{e.stopPropagation();l.hidden=!l.hidden};document.addEventListener("click",function h(e){if(!l.isConnected)return document.removeEventListener("click",h);if(!l.contains(e.target))l.hidden=true});
  l.querySelectorAll("[data-hx]").forEach(x=>x.onclick=async()=>{l.hidden=true;try{if(x.dataset.hx==="share")await exportShare(plan);else if(x.dataset.hx==="xlsx")await exportPlanXlsx(plan);else await exportPlanPdf(plan)}catch(e){console.error(e);toast((_t("Export failed: {message}",{message:e.message})))}});
  document.querySelectorAll("[data-ht]").forEach(x=>x.onclick=()=>{S.planTab=x.dataset.ht;renderStrategy()});
  const el=$("#hkSheet");({plan:hkPlanTab,obj:hkObjTab,matrix:hkMatrixTab,bowl:hkBowlTab,work:hkWorkTab})[tab](el,plan);
}
function descendantsOf(id){const out=new Set([id]);let grew=true;while(grew){grew=false;PF().plans.forEach(p=>{if(p.parent&&out.has(p.parent)&&!out.has(p.id)){out.add(p.id);grew=true}})}return out}
var lvlTxt=p=>p.level&&p.level.trim()?p.level:"no level";
function hkPlanTab(el,plan){
  const pf=PF(),below=descendantsOf(plan.id),parents=[...pf.plans.filter(p=>!below.has(p.id)),...pf.parents.filter(p=>!below.has(p.id))];
  el.innerHTML=infoBlock("hk.plan")+`<div class="grid3"><div class="field"><label for="hl">${_t("Level")}</label><div class="hint">${_t("Your own name for the level, for example organisation, division, department or team.")}</div><input id="hl" data-o="level" value="${esc(plan.level||"")}"></div>
   <div class="field"><label for="hp">${_t("Period")}</label><div class="hint">${_t("The year this plan covers.")}</div><input id="hp" data-o="period" value="${esc(plan.period)}"></div>
   <div class="field"><label for="ho">${_t("Owner")}</label><div class="hint">&nbsp;</div><input id="ho" data-o="owner" value="${esc(plan.owner)}"></div></div>
   <div class="field"><label for="hpar">${_t("Plan of the level above")}</label><div class="hint">${_t("Its annual objectives and priorities become the starting point for this plan. Import it from a share file if someone else owns it. Plans below this one are not offered, to avoid loops.")}</div>
   <select id="hpar" data-o="parent"><option value="">${_t("None (top level)")}</option>${parents.map(p=>`<option value="${esc(p.id)}" ${p.id===plan.parent?"selected":""}>${esc(p.name||_t("Untitled"))} (${esc(lvlTxt(p))}, ${esc(p.period)})${pf.parents.includes(p)?" [imported]":""}</option>`).join("")}</select></div>
   <div class="flags" id="hkGaps">${flagsHTML(planGaps(plan).length?planGaps(plan):plan.priorities.length?[_t("✓ The plan is connected from breakthrough objectives down to metrics.")]:[])}</div>`;
  bindRoot(el,plan,()=>{plan.updated=new Date().toISOString()});bind(el);
}
function hkObjTab(el,plan){
  const par=plan.parent&&findPlan(plan.parent),tree=(kind,lbl,hint)=>{
    const tgt=linkTarget[kind],pre=HKIND.find(x=>x[0]===kind)[1];
    return `<h4>${lbl}</h4><p class="small muted">${hint}</p><div class="wide"><table class="grid hk"><thead><tr><th style="width:50px">#</th><th>${_t("Text")}</th>${kind==="priorities"||kind==="metrics"?`<th style="width:150px">${_t("Owner")}</th>`:""}${kind==="metrics"?`<th style="width:90px">${_t("Baseline")}</th><th style="width:90px">${_t("Target")}</th><th style="width:140px">${_t("Direction")}</th>`:""}<th style="width:130px">${tgt?_t("Serves ({x} codes)",{x:HKIND.find(x=>x[0]===tgt)[1]}):par?_t("Supports above (A or P codes)"):""}</th><th style="width:40px"></th></tr></thead><tbody>
     ${plan[kind].map((x,i)=>`<tr data-k="${kind}" data-i="${i}"><td class="pcode">${pre}${i+1}</td><td><textarea data-o="text" rows="1">${esc(x.text)}</textarea></td>
       ${kind==="priorities"||kind==="metrics"?`<td><input data-o="owner" value="${esc(x.owner||"")}"></td>`:""}
       ${kind==="metrics"?`<td><input data-o="baseline" value="${esc(x.baseline||"")}"></td><td><input data-o="target" value="${esc(x.target||"")}"></td><td><select data-o="direction">${["Higher is better","Lower is better"].map(v=>`<option value="${esc(v)}" ${v===x.direction?"selected":""}>${esc(_tv(v))}</option>`).join("")}</select></td>`:""}
       <td>${tgt?`<input data-links="${kind}" value="${esc((x.links||[]).map(id=>hcode(plan,tgt,id)).filter(Boolean).join(", "))}" placeholder="e.g. ${HKIND.find(y=>y[0]===tgt)[1]}1">`:par?`<input data-sup value="${esc((x.supports||[]).map(id=>hcode(par,"annual",id)||hcode(par,"priorities",id)).filter(Boolean).join(", "))}" placeholder="${_t("e.g. P1")}">`:""}</td>
       <td><button class="x" data-hdel="${kind}|${i}" aria-label="${_t("Remove")}">×</button></td></tr>`).join("")}
     </tbody></table></div><button class="btn alt addrow" data-hadd="${kind}">${_t("Add")}</button>`};
  el.innerHTML=infoBlock("hk.obj")+(par?`<div class="parentbox">${_t("<b>From the level above: {x} ({par}, {period})</b>",{x:esc(par.name||_t("Untitled")),par:esc(lvlTxt(par)),period:esc(par.period)})}
     <div class="grid2"><div><p class="small muted">${_t("Annual objectives")}</p><ul>${par.annual.filter(a=>a.text).map(a=>`<li><b>${hcode(par,"annual",a.id)}</b> ${esc(a.text)}</li>`).join("")||_t("<li class='muted'>None</li>")}</ul></div>
     <div><p class="small muted">${_t("Improvement priorities")}</p><ul>${par.priorities.filter(a=>a.text).map(a=>`<li><b>${hcode(par,"priorities",a.id)}</b> ${esc(a.text)}</li>`).join("")||_t("<li class='muted'>None</li>")}</ul></div></div></div>`:"")+
   HKIND.map(([k,,l,h])=>tree(k,l,h)).join("")+`<div class="flags" id="hkF"></div>`;
  const gaps=()=>{const f=planGaps(plan);if(par)plan.breakthrough.filter(b=>b.text.trim()&&!(b.supports||[]).length).forEach(b=>f.push(`${_t("{id} does not say which objective of the level above it supports.",{id:hcode(plan,"breakthrough",b.id)})}`));$("#hkF").innerHTML=flagsHTML(f.length?f:[_t("✓ No gaps.")])};
  el.querySelectorAll("tr[data-k]").forEach(tr=>{const it=plan[tr.dataset.k][+tr.dataset.i];bindRoot(tr,it,()=>{plan.updated=new Date().toISOString();gaps()})});
  el.querySelectorAll("[data-links]").forEach(i=>i.addEventListener("change",()=>{const tr=i.closest("tr"),kind=tr.dataset.k,it=plan[kind][+tr.dataset.i],r=parseCodes(plan,linkTarget[kind],i.value);it.links=r.ids;savePF();if(r.bad.length)toast((_t("Unknown code: {x}",{x:r.bad.join(", ")})));hkObjTab(el,plan)}));
  el.querySelectorAll("[data-sup]").forEach(i=>i.addEventListener("change",()=>{const tr=i.closest("tr"),it=plan.breakthrough[+tr.dataset.i],r=parseParentCodes(par,i.value);it.supports=r.ids;savePF();if(r.bad.length)toast((_t("Unknown code: {x}",{x:r.bad.join(", ")})));hkObjTab(el,plan)}));
  el.querySelectorAll("[data-hadd]").forEach(b=>b.onclick=()=>{plan[b.dataset.hadd].push({id:uidGen(),text:"",owner:"",links:[],supports:[],baseline:"",target:"",direction:"Higher is better",months:{}});savePF();hkObjTab(el,plan)});
  el.querySelectorAll("[data-hdel]").forEach(b=>b.onclick=()=>{const [k,i]=b.dataset.hdel.split("|"),id=plan[k][+i].id;plan[k].splice(+i,1);HKIND.forEach(([kk])=>plan[kk].forEach(x=>x.links=(x.links||[]).filter(l=>l!==id)));savePF();hkObjTab(el,plan)});
  gaps();bind(el);
}
function linkGrid(plan,rowsK,colsK){const R=plan[rowsK].filter(x=>x.text.trim()),Cc=plan[colsK].filter(x=>x.text.trim());if(!R.length||!Cc.length)return `<p class="muted small">${_t("Nothing to show yet.")}</p>`;
  return `<div class="wide"><table class="grid xm"><thead><tr><th></th>${Cc.map(c=>`<th title="${esc(c.text)}">${hcode(plan,colsK,c.id)}</th>`).join("")}</tr></thead><tbody>${R.map(r=>`<tr><td><b>${hcode(plan,rowsK,r.id)}</b> ${esc(trunc(r.text,60))}</td>${Cc.map(c=>`<td class="dot">${(r.links||[]).includes(c.id)?"●":""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`}
function hkMatrixTab(el,plan){el.innerHTML=infoBlock("hk.matrix")+`<h4>${_t("Annual objectives against breakthrough objectives")}</h4>${linkGrid(plan,"annual","breakthrough")}<h4>${_t("Priorities against annual objectives")}</h4>${linkGrid(plan,"priorities","annual")}<h4>${_t("Metrics against priorities")}</h4>${linkGrid(plan,"metrics","priorities")}
  <h4>${_t("Owners of the priorities")}</h4>${plan.priorities.filter(p=>p.text.trim()).length?`<table class="grid xm"><tbody>${plan.priorities.filter(p=>p.text.trim()).map(p=>`<tr><td><b>${hcode(plan,"priorities",p.id)}</b> ${esc(trunc(p.text,60))}</td><td>${esc(p.owner||_t("(no owner)"))}</td></tr>`).join("")}</tbody></table>`:""}`;bind(el)}
function hkBowlTab(el,plan){
  const ms=plan.metrics.filter(m=>m.text.trim());
  el.innerHTML=infoBlock("hk.bowl")+(ms.length?`<div class="wide"><table class="grid bowl"><thead><tr><th style="min-width:200px">${_t("Metric")}</th><th>${_t("Base")}</th><th>${_t("Target")}</th>${MONTHS.map(m=>`<th>${m}</th>`).join("")}</tr></thead><tbody>
    ${ms.map(m=>`<tr><td><b>${hcode(plan,"metrics",m.id)}</b> ${esc(trunc(m.text,40))}<div class="small muted">${esc(m.direction||"")}</div></td><td class="calc">${esc(m.baseline||"")}</td><td class="calc">${esc(m.target||"")}</td>${MONTHS.map((_,i)=>{const ok=monthOK(m,i),pl=monthPlan(m,i);return `<td class="${ok===true?"ok":ok===false?"nok":""}"><input data-mid="${esc(m.id)}" data-mo="${i}" value="${esc((m.months||{})[i]||"")}" aria-label="${MONTHS[i]}" title="${pl!=null?(_t("Plan: {pl}",{pl:fmt(pl,1)})):""}"></td>`}).join("")}</tr>`).join("")}
    </tbody></table></div><p class="small muted">${_t("Green: on or ahead of the monthly plan (a straight line from baseline to target). Orange: behind plan. Hover a cell to see the plan value.")}</p><div class="flags" id="bF"></div>`
   :`<p class="muted">${_t("Add metrics with a baseline and target on the Objectives tab.")}</p>`);
  const fl=()=>{const f=[];ms.forEach(m=>{const res=MONTHS.map((_,i)=>monthOK(m,i)).filter(v=>v!==null);if(res.length>=2&&res.slice(-2).every(v=>v===false))f.push(`${_t("{id} has been behind plan two months running. Hoshin practice: write a short countermeasure for the owner to act on.",{id:hcode(plan,"metrics",m.id)})}`)});const e=$("#bF");if(e)e.innerHTML=flagsHTML(f)};
  el.querySelectorAll("[data-mid]").forEach(i=>i.oninput=()=>{const m=plan.metrics.find(x=>x.id===i.dataset.mid);m.months=m.months||{};m.months[i.dataset.mo]=i.value;savePF();const td=i.parentElement,ok=monthOK(m,+i.dataset.mo);td.className=ok===true?"ok":ok===false?"nok":"";fl()});fl();bind(el);
}
function hkWorkTab(el,plan){
  const pr=plan.priorities.filter(p=>p.text.trim());
  el.innerHTML=infoBlock("hk.work")+(pr.length?pr.map(p=>{const w=workFor(p.id),n=w.projects.length+w.ideas.length+w.jdi.length;
    return `<div class="card"><b>${hcode(plan,"priorities",p.id)} ${esc(p.text)}</b> <span class="small muted">${esc(p.owner||_t("no owner"))}</span>
     ${n?`<ul class="small">${w.projects.map(x=>`<li>${_t("Project:")} <button class="btn link" data-op="${esc(x.id)}">${esc(x.title)}</button> (${esc(x.tool)}, ${esc(STATUSES[x.status])}${DEF[x.tool]?", "+esc(ST[x.phase].name):""})</li>`).join("")}${w.ideas.map(x=>`<li>${_t("Idea in pipeline: {x} ({status})",{x:esc(x.title||"untitled"),status:esc(x.status)})}</li>`).join("")}${w.jdi.map(x=>`<li>${_t("Just do it: {what} ({x})",{what:esc(x.what),x:x.done==="Yes"?"done":"open"})}</li>`).join("")}</ul>`
      :`<div class="flag">${_t("No project, idea or quick win serves this priority yet.")}</div>`}</div>`}).join("")
   :`<p class="muted">${_t("Add improvement priorities on the Objectives tab.")}</p>`)+`<p class="small muted">${_t("Link a project to a priority in the project itself (under its title), or an idea in the pipeline.")}</p>`;
  el.querySelectorAll("[data-op]").forEach(b=>b.onclick=()=>openProject(b.dataset.op));bind(el);
}

/* ----- catchball: share files ----- */
async function exportShare(plan){
  const par=plan.parent&&findPlan(plan.parent);
  const strip=p=>({id:p.id,name:p.name,level:p.level,period:p.period,owner:p.owner,parent:p.parent||"",breakthrough:p.breakthrough,annual:p.annual,priorities:p.priorities,metrics:p.metrics,updated:p.updated});
  const data={format:"lean-navigator-hoshin",version:1,exportedAt:new Date().toISOString(),plan:strip(plan),parent:par?strip(par):null};
  await saveBlob(`hoshin-${slug(plan.name||"plan")}-${today10()}.json`,new Blob([JSON.stringify(data,null,1)],{type:"application/json"}));toast(_t("Share file saved. Send it to the owner of the level below or above."));
}
async function importShare(f){if(!f)return;try{if(f.size>2e6)throw new Error(_t("The file is too large to be a share file."));const d=JSON.parse(await f.text());if(d.format!=="lean-navigator-hoshin"||!d.plan)throw new Error(_t("This is not a Lean Navigator Hoshin share file."));
  const pf=PF(),plan=cleanPlanImport(d.plan),parent=d.parent?cleanPlanImport(d.parent):null,add=p=>{if(!p)return;if(pf.plans.some(x=>x.id===p.id)){return}const i=pf.parents.findIndex(x=>x.id===p.id);const rec={...p,importedAt:new Date().toISOString(),source:cleanStr(f.name,200)};if(i>=0)pf.parents[i]=rec;else pf.parents.push(rec)};
  if(pf.plans.some(x=>x.id===plan.id)){toast(_t("This plan is one of your own plans: nothing imported."));return}
  add(parent);add(plan);savePF();renderStrategy();toast(`${_t("Imported \"{planName}\". Choose it as the parent of your plan on the Plan tab.",{planName:plan.name})}`)}catch(e){toast(e.message||_t("Could not read the file."))}}
async function exportPlanXlsx(plan){
  const wb=new ExcelJS.Workbook();wb.creator=_t("Lean Navigator");const ws=wb.addWorksheet(_t("Plan"));ws.getColumn(1).width=8;ws.getColumn(2).width=70;ws.getColumn(3).width=20;ws.getColumn(4).width=20;
  const t=ws.addRow([plan.name||_t("Hoshin plan")]);t.font={bold:true,size:16,color:{argb:"FF0C2145"}};ws.addRow([_t("Level"),plan.level]);ws.addRow([_t("Period"),plan.period]);ws.addRow([_t("Owner"),plan.owner]);const par=plan.parent&&findPlan(plan.parent);if(par)ws.addRow([_t("Under"),`${par.name} (${lvlTxt(par)})`]);
  HKIND.forEach(([k,,l])=>{ws.addRow([]);const h=ws.addRow([l]);h.getCell(1).font={bold:true,size:12,color:{argb:"FF7A6A3E"}};styleHead(ws.addRow(["#",_t("Text"),_t("Owner"),_t("Serves")]));plan[k].forEach(x=>ws.addRow([hcode(plan,k,x.id),x.text,x.owner||"",linkTarget[k]?(x.links||[]).map(id=>hcode(plan,linkTarget[k],id)).join(", "):""]))});
  const mx=wb.addWorksheet(_t("Matrix"));[["annual","breakthrough"],["priorities","annual"],["metrics","priorities"]].forEach(([r,c])=>{const R=plan[r].filter(x=>x.text.trim()),Cc=plan[c].filter(x=>x.text.trim());styleHead(mx.addRow(["",...Cc.map(x=>hcode(plan,c,x.id))]));R.forEach(x=>{const row=mx.addRow([hcode(plan,r,x.id)+" "+x.text,...Cc.map(y=>(x.links||[]).includes(y.id)?"●":"")]);row.alignment={horizontal:"center"};row.getCell(1).alignment={horizontal:"left"}});mx.addRow([])});mx.getColumn(1).width=60;
  const bw=wb.addWorksheet(_t("Monthly tracking"));styleHead(bw.addRow([_t("Metric"),_t("Direction"),_t("Baseline"),_t("Target"),...MONTHS]));
  plan.metrics.filter(m=>m.text.trim()).forEach(m=>{const r=bw.addRow([hcode(plan,"metrics",m.id)+" "+m.text,m.direction,num(m.baseline),num(m.target),...MONTHS.map((_,i)=>num((m.months||{})[i]))]);MONTHS.forEach((_,i)=>{const ok=monthOK(m,i);if(ok!==null)r.getCell(5+i).fill={type:"pattern",pattern:"solid",fgColor:{argb:ok?"FFBFE6CF":"FFF8C9B5"}}});const p=bw.addRow(["   plan","","","",...MONTHS.map((_,i)=>{const v=monthPlan(m,i);return v==null?null:Math.round(v*10)/10})]);p.font={italic:true,color:{argb:"FF8A97A8"}}});
  bw.getColumn(1).width=50;bw.getColumn(2).width=16;
  await saveBlob(`hoshin-${slug(plan.name||"plan")}-${today10()}.xlsx`,new Blob([await wb.xlsx.writeBuffer()],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));toast(_t("Excel workbook saved."));
}
async function exportPlanPdf(plan){
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4",orientation:"landscape"}),H=helpers(doc),M=H.M,PW=297;
  doc.setFillColor(...BLUE);doc.rect(0,0,PW,30,"F");doc.setFillColor(...ORG);doc.rect(M,8,2.5,15,"F");doc.setFont("helvetica","bold");doc.setFontSize(16);doc.setTextColor(255,255,255);doc.text(pdfText(plan.name||_t("Hoshin plan")),M+7,16);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...LBL);const par=plan.parent&&findPlan(plan.parent);doc.text(pdfText(`${lvlTxt(plan)}, ${plan.period}${plan.owner?(_t(", owner {owner}",{owner:plan.owner})):""}${par?(_t(", under {parName}",{parName:par.name})):""}`),M+7,23);H.y=40;
  HKIND.forEach(([k,,l])=>{H.h2(l);H.tbl(["#",_t("Text"),_t("Owner"),_t("Serves"),...(k==="metrics"?[_t("Baseline"),_t("Target")]:[])],plan[k].map(x=>[hcode(plan,k,x.id),x.text,x.owner||"",linkTarget[k]?(x.links||[]).map(id=>hcode(plan,linkTarget[k],id)).join(", "):(x.supports||[]).length&&par?(x.supports||[]).map(id=>hcode(par,"annual",id)||hcode(par,"priorities",id)).join(", "):"",...(k==="metrics"?[x.baseline||"",x.target||""]:[])]),[12,null,34,26])});
  const ms=plan.metrics.filter(m=>m.text.trim());if(ms.length){H.h2(_t("Monthly tracking"));H.tbl([_t("Metric"),_t("Target"),...MONTHS],ms.map(m=>[hcode(plan,"metrics",m.id)+" "+m.text,m.target||"",...MONTHS.map((_,i)=>{const v=(m.months||{})[i];const ok=monthOK(m,i);return v?(v+(ok===true?" +":ok===false?" -":"")):""})]),[60,16]);H.para(_t("+ on or ahead of the monthly plan, - behind plan."),{color:GRY})}
  const g=planGaps(plan);if(g.length){H.h2(_t("Gaps"));H.para(g.join(" "),{color:WARN})}
  const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(7.5);doc.setTextColor(...GRY);doc.text(`${_t("Page {i} of {n}",{i:i,n:n})}`,PW-M,203,{align:"right"})}
  await saveBlob(`hoshin-${slug(plan.name||"plan")}-${today10()}.pdf`,doc.output("blob"));toast(_t("PDF saved."));
}
Object.assign(INFO,{
 "hk.list":I(_t("Deploy strategy from the top down and connect it to the improvement work."),_t("One plan per level and year. For a level below, choose the plan above as its parent (import it from a share file if someone else owns it)."),_t("The tool flags gaps: objectives without priorities, priorities without metrics, owners or projects.")),
 "hk.plan":I(_t("Place this plan in the hierarchy."),_t("Level, period, owner and, for a lower level, the plan of the level above."),_t("Not reviewed.")),
 "hk.obj":I(_t("Write the plan as a chain: breakthrough objectives, annual objectives, improvement priorities, metrics."),_t("Each item, and in the last column the codes of the items one level up that it serves (e.g. A1, A2)."),_t("Every annual objective serves a breakthrough objective; every priority has an owner and a metric; few priorities rather than many.")),
 "hk.matrix":I(_t("See the links of the X-matrix as grids, to spot what is missing or overloaded."),_t("Nothing: drawn from the Objectives tab."),_t("Empty rows or columns: objectives nothing delivers, or work that serves nothing.")),
 "hk.bowl":I(_t("Track the metrics month by month against a straight-line plan from baseline to target."),_t("The actual value of each metric per month."),_t("Two months behind plan in a row calls for a countermeasure from the owner.")),
 "hk.work":I(_t("Check that every priority has work behind it."),_t("Nothing here: link projects (under the project title) and ideas (in the pipeline) to priorities."),_t("Priorities with no project, idea or quick win."))
});
