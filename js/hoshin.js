/* ================= Hoshin Kanri: strategy deployment across levels ================= */
const LEVELS=["University","Faculty or service","Team"];
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const HKIND=[["breakthrough","B","Breakthrough objectives","3 to 5 years. Where the organisation must be."],["annual","A","Annual objectives","This year's steps towards the breakthrough objectives."],["priorities","P","Improvement priorities","The few initiatives that deliver the annual objectives. Projects link here."],["metrics","M","Metrics and targets","How progress on the priorities is measured each month."]];
const linkTarget={annual:"breakthrough",priorities:"annual",metrics:"priorities"};
function newPlan(){return{id:uidGen(),name:"",level:"Faculty or service",period:String(new Date().getFullYear()+1),owner:"",parent:"",breakthrough:[],annual:[],priorities:[],metrics:[],updated:new Date().toISOString()}}
const hcode=(plan,kind,id)=>{const k=HKIND.find(x=>x[0]===kind)[1],i=(plan[kind]||[]).findIndex(x=>x.id===id);return i<0?"":k+(i+1)};
const findPlan=id=>PF().plans.find(p=>p.id===id)||PF().parents.find(p=>p.id===id);
function parseCodes(plan,kind,text){const pre=HKIND.find(x=>x[0]===kind)[1],ids=[],bad=[];String(text||"").toUpperCase().split(/[,;\s]+/).filter(Boolean).forEach(c=>{const m=new RegExp("^"+pre+"(\\d+)$").exec(c);const it=m&&plan[kind][+m[1]-1];if(it)ids.includes(it.id)||ids.push(it.id);else bad.push(c)});return{ids,bad}}
function parseParentCodes(parent,text){const ids=[],bad=[];String(text||"").toUpperCase().split(/[,;\s]+/).filter(Boolean).forEach(c=>{const m=/^([AP])(\d+)$/.exec(c),kind=m&&(m[1]==="A"?"annual":"priorities"),it=kind&&parent[kind][+m[2]-1];if(it)ids.includes(it.id)||ids.push(it.id);else bad.push(c)});return{ids,bad}}
const monthPlan=(m,i)=>{const b=num(m.baseline),t=num(m.target);return b==null||t==null?null:b+(t-b)*(i+1)/12};
const monthOK=(m,i)=>{const a=num((m.months||{})[i]),pl=monthPlan(m,i);if(a==null||pl==null)return null;return m.direction==="Lower is better"?a<=pl:a>=pl};
function planGaps(plan){const f=[],c=(k,id)=>hcode(plan,k,id);
  plan.breakthrough.filter(b=>b.text.trim()&&!plan.annual.some(a=>(a.links||[]).includes(b.id))).forEach(b=>f.push(`${c("breakthrough",b.id)} has no annual objective this year.`));
  plan.annual.filter(a=>a.text.trim()&&!(a.links||[]).length).forEach(a=>f.push(`${c("annual",a.id)} is not linked to a breakthrough objective.`));
  plan.annual.filter(a=>a.text.trim()&&!plan.priorities.some(p=>(p.links||[]).includes(a.id))).forEach(a=>f.push(`${c("annual",a.id)} has no improvement priority delivering it.`));
  plan.priorities.filter(p=>p.text.trim()&&!p.owner.trim()).forEach(p=>f.push(`${c("priorities",p.id)} has no owner.`));
  plan.priorities.filter(p=>p.text.trim()&&!plan.metrics.some(m=>(m.links||[]).includes(p.id))).forEach(p=>f.push(`${c("priorities",p.id)} has no metric: progress cannot be tracked.`));
  const np=plan.priorities.filter(p=>p.text.trim()).length;if(np>7)f.push(`${np} improvement priorities. Hoshin works by focus: most organisations manage three to five.`);
  return f}
function workFor(priId){return{projects:S.projects.filter(p=>p.hoshinLink===priId),ideas:PF().ideas.filter(x=>x.link===priId&&!["Started","Rejected"].includes(x.status)),jdi:PF().jdi.filter(j=>j.link===priId)}}

/* ----- page ----- */
function renderStrategy(){
  const pf=PF();S.refresh=null;
  const plan=S.planId&&pf.plans.find(p=>p.id===S.planId);
  if(!plan){
    $("#app").innerHTML=`<div class="proj-head"><h2>Strategy (Hoshin Kanri)</h2><span class="muted small">Plans per level. A plan can take a plan from the level above as its parent: its annual objectives and priorities become the starting point below.</span>
     <div style="margin-left:auto" class="row"><button class="btn" id="newPlan">New plan</button><label class="btn alt" for="impPlan">Import a plan from a share file</label><input id="impPlan" type="file" accept=".json,application/json" hidden></div></div>
     ${infoBlock("hk.list")}
     <div class="plans">${pf.plans.map(p=>`<button class="card plan-card" data-plan="${p.id}"><span class="lvl">${esc(p.level)}</span><b>${esc(p.name||"Untitled plan")}</b><span class="small muted">${esc(p.period)}${p.owner?", owner "+esc(p.owner):""}${p.parent?", under "+esc(findPlan(p.parent)?.name||"?"):""}</span><span class="small">${p.priorities.filter(x=>x.text.trim()).length} priorities, ${planGaps(p).length} gaps</span></button>`).join("")||`<p class="muted">No plans yet.</p>`}</div>
     ${pf.parents.length?`<h4>Imported plans from other levels (read-only)</h4><ul class="small">${pf.parents.map(p=>`<li><b>${esc(p.name)}</b> (${esc(p.level)}, ${esc(p.period)}), received ${fmtDate(p.importedAt)} <button class="x" data-rmimp="${p.id}" aria-label="Remove">×</button></li>`).join("")}</ul>`:""}`;
    $("#newPlan").onclick=()=>{const p=newPlan();pf.plans.push(p);S.planId=p.id;S.planTab="plan";savePF();renderStrategy()};
    document.querySelectorAll("[data-plan]").forEach(b=>b.onclick=()=>{S.planId=b.dataset.plan;S.planTab="plan";renderStrategy()});
    document.querySelectorAll("[data-rmimp]").forEach(b=>b.onclick=()=>{if(!confirm("Remove this imported plan? Links to it stop working."))return;pf.parents=pf.parents.filter(p=>p.id!==b.dataset.rmimp);savePF();renderStrategy()});
    $("#impPlan").onchange=e=>importShare(e.target.files[0]);bind($("#app"));return}
  const tab=S.planTab||"plan";
  $("#app").innerHTML=`<div class="proj-head"><button class="btn alt" id="toList">All plans</button><input class="title-input" id="pname" value="${esc(plan.name)}" placeholder="Plan name, e.g. Library plan 2027" aria-label="Plan name">
    <div class="menu"><button class="btn" id="hkExp">Export ▾</button><div class="menu-list" id="hkList" hidden>
      <button data-hx="pdf"><b>PDF</b><span>The plan, the linked matrices and the monthly tracking.</span></button>
      <button data-hx="xlsx"><b>Excel workbook</b><span>Objectives, matrices and a coloured monthly tracking chart. One-way.</span></button>
      <button data-hx="share"><b>Share file (catchball)</b><span>For the level below or above to import. Not encrypted: share only what may be shared.</span></button></div></div>
    <button class="btn alt" id="delPlan">Delete</button></div>
   <div class="pviews">${[["plan","Plan"],["obj","Objectives"],["matrix","Matrix"],["bowl","Monthly tracking"],["work","Projects and ideas"]].map(([k,l])=>`<button class="pv" data-ht="${k}" aria-selected="${tab===k}">${l}</button>`).join("")}</div>
   <div class="sheet solo" id="hkSheet"></div>`;
  $("#toList").onclick=()=>{S.planId=null;renderStrategy()};
  $("#pname").oninput=e=>{plan.name=e.target.value;plan.updated=new Date().toISOString();savePF()};
  $("#delPlan").onclick=()=>{if(!confirm("Delete this plan? Projects and ideas linked to its priorities lose the link."))return;pf.plans=pf.plans.filter(p=>p.id!==plan.id);pf.plans.forEach(p=>{if(p.parent===plan.id)p.parent=""});S.planId=null;savePF();renderStrategy()};
  const b=$("#hkExp"),l=$("#hkList");b.onclick=e=>{e.stopPropagation();l.hidden=!l.hidden};document.addEventListener("click",function h(e){if(!l.isConnected)return document.removeEventListener("click",h);if(!l.contains(e.target))l.hidden=true});
  l.querySelectorAll("[data-hx]").forEach(x=>x.onclick=async()=>{l.hidden=true;try{if(x.dataset.hx==="share")await exportShare(plan);else if(x.dataset.hx==="xlsx")await exportPlanXlsx(plan);else await exportPlanPdf(plan)}catch(e){console.error(e);toast("Export failed: "+e.message)}});
  document.querySelectorAll("[data-ht]").forEach(x=>x.onclick=()=>{S.planTab=x.dataset.ht;renderStrategy()});
  const el=$("#hkSheet");({plan:hkPlanTab,obj:hkObjTab,matrix:hkMatrixTab,bowl:hkBowlTab,work:hkWorkTab})[tab](el,plan);
}
function hkPlanTab(el,plan){
  const pf=PF(),parents=[...pf.plans.filter(p=>p.id!==plan.id&&LEVELS.indexOf(p.level)<LEVELS.indexOf(plan.level)),...pf.parents.filter(p=>LEVELS.indexOf(p.level)<LEVELS.indexOf(plan.level))];
  el.innerHTML=infoBlock("hk.plan")+`<div class="grid3"><div class="field"><label for="hl">Level</label><select id="hl" data-o="level">${LEVELS.map(v=>`<option ${v===plan.level?"selected":""}>${v}</option>`).join("")}</select></div>
   <div class="field"><label for="hp">Period</label><div class="hint">The year this plan covers.</div><input id="hp" data-o="period" value="${esc(plan.period)}"></div>
   <div class="field"><label for="ho">Owner</label><input id="ho" data-o="owner" value="${esc(plan.owner)}"></div></div>
   <div class="field"><label for="hpar">Plan of the level above</label><div class="hint">Its annual objectives and priorities become the starting point for this plan. Import it from a share file if someone else owns it.</div>
   <select id="hpar" data-o="parent"><option value="">None (top level)</option>${parents.map(p=>`<option value="${p.id}" ${p.id===plan.parent?"selected":""}>${esc(p.name||"Untitled")} (${esc(p.level)}, ${esc(p.period)})${pf.parents.includes(p)?" [imported]":""}</option>`).join("")}</select></div>
   <div class="flags" id="hkGaps">${flagsHTML(planGaps(plan).length?planGaps(plan):plan.priorities.length?["✓ The plan is connected from breakthrough objectives down to metrics."]:[])}</div>`;
  bindRoot(el,plan,i=>{plan.updated=new Date().toISOString();if(i.id==="hl")hkPlanTab(el,plan)});bind(el);
}
function hkObjTab(el,plan){
  const par=plan.parent&&findPlan(plan.parent),tree=(kind,lbl,hint)=>{
    const tgt=linkTarget[kind],pre=HKIND.find(x=>x[0]===kind)[1];
    return `<h4>${lbl}</h4><p class="small muted">${hint}</p><div class="wide"><table class="grid hk"><thead><tr><th style="width:50px">#</th><th>Text</th>${kind==="priorities"||kind==="metrics"?`<th style="width:150px">Owner</th>`:""}${kind==="metrics"?`<th style="width:90px">Baseline</th><th style="width:90px">Target</th><th style="width:140px">Direction</th>`:""}<th style="width:130px">${tgt?`Serves (${HKIND.find(x=>x[0]===tgt)[1]} codes)`:par?"Supports above (A or P codes)":""}</th><th style="width:40px"></th></tr></thead><tbody>
     ${plan[kind].map((x,i)=>`<tr data-k="${kind}" data-i="${i}"><td class="pcode">${pre}${i+1}</td><td><textarea data-o="text" rows="1">${esc(x.text)}</textarea></td>
       ${kind==="priorities"||kind==="metrics"?`<td><input data-o="owner" value="${esc(x.owner||"")}"></td>`:""}
       ${kind==="metrics"?`<td><input data-o="baseline" value="${esc(x.baseline||"")}"></td><td><input data-o="target" value="${esc(x.target||"")}"></td><td><select data-o="direction">${["Higher is better","Lower is better"].map(v=>`<option ${v===x.direction?"selected":""}>${v}</option>`).join("")}</select></td>`:""}
       <td>${tgt?`<input data-links="${kind}" value="${esc((x.links||[]).map(id=>hcode(plan,tgt,id)).filter(Boolean).join(", "))}" placeholder="e.g. ${HKIND.find(y=>y[0]===tgt)[1]}1">`:par?`<input data-sup value="${esc((x.supports||[]).map(id=>hcode(par,"annual",id)||hcode(par,"priorities",id)).filter(Boolean).join(", "))}" placeholder="e.g. P1">`:""}</td>
       <td><button class="x" data-hdel="${kind}|${i}" aria-label="Remove">×</button></td></tr>`).join("")}
     </tbody></table></div><button class="btn alt addrow" data-hadd="${kind}">Add</button>`};
  el.innerHTML=infoBlock("hk.obj")+(par?`<div class="parentbox"><b>From the level above: ${esc(par.name||"Untitled")} (${esc(par.level)}, ${esc(par.period)})</b>
     <div class="grid2"><div><p class="small muted">Annual objectives</p><ul>${par.annual.filter(a=>a.text).map(a=>`<li><b>${hcode(par,"annual",a.id)}</b> ${esc(a.text)}</li>`).join("")||"<li class='muted'>None</li>"}</ul></div>
     <div><p class="small muted">Improvement priorities</p><ul>${par.priorities.filter(a=>a.text).map(a=>`<li><b>${hcode(par,"priorities",a.id)}</b> ${esc(a.text)}</li>`).join("")||"<li class='muted'>None</li>"}</ul></div></div></div>`:"")+
   HKIND.map(([k,,l,h])=>tree(k,l,h)).join("")+`<div class="flags" id="hkF"></div>`;
  const gaps=()=>{const f=planGaps(plan);if(par)plan.breakthrough.filter(b=>b.text.trim()&&!(b.supports||[]).length).forEach(b=>f.push(`${hcode(plan,"breakthrough",b.id)} does not say which objective of the level above it supports.`));$("#hkF").innerHTML=flagsHTML(f.length?f:["✓ No gaps."])};
  el.querySelectorAll("tr[data-k]").forEach(tr=>{const it=plan[tr.dataset.k][+tr.dataset.i];bindRoot(tr,it,()=>{plan.updated=new Date().toISOString();gaps()})});
  el.querySelectorAll("[data-links]").forEach(i=>i.addEventListener("change",()=>{const tr=i.closest("tr"),kind=tr.dataset.k,it=plan[kind][+tr.dataset.i],r=parseCodes(plan,linkTarget[kind],i.value);it.links=r.ids;savePF();if(r.bad.length)toast("Unknown code: "+r.bad.join(", "));hkObjTab(el,plan)}));
  el.querySelectorAll("[data-sup]").forEach(i=>i.addEventListener("change",()=>{const tr=i.closest("tr"),it=plan.breakthrough[+tr.dataset.i],r=parseParentCodes(par,i.value);it.supports=r.ids;savePF();if(r.bad.length)toast("Unknown code: "+r.bad.join(", "));hkObjTab(el,plan)}));
  el.querySelectorAll("[data-hadd]").forEach(b=>b.onclick=()=>{plan[b.dataset.hadd].push({id:uidGen(),text:"",owner:"",links:[],supports:[],baseline:"",target:"",direction:"Higher is better",months:{}});savePF();hkObjTab(el,plan)});
  el.querySelectorAll("[data-hdel]").forEach(b=>b.onclick=()=>{const [k,i]=b.dataset.hdel.split("|"),id=plan[k][+i].id;plan[k].splice(+i,1);HKIND.forEach(([kk])=>plan[kk].forEach(x=>x.links=(x.links||[]).filter(l=>l!==id)));savePF();hkObjTab(el,plan)});
  gaps();bind(el);
}
function linkGrid(plan,rowsK,colsK){const R=plan[rowsK].filter(x=>x.text.trim()),Cc=plan[colsK].filter(x=>x.text.trim());if(!R.length||!Cc.length)return `<p class="muted small">Nothing to show yet.</p>`;
  return `<div class="wide"><table class="grid xm"><thead><tr><th></th>${Cc.map(c=>`<th title="${esc(c.text)}">${hcode(plan,colsK,c.id)}</th>`).join("")}</tr></thead><tbody>${R.map(r=>`<tr><td><b>${hcode(plan,rowsK,r.id)}</b> ${esc(trunc(r.text,60))}</td>${Cc.map(c=>`<td class="dot">${(r.links||[]).includes(c.id)?"●":""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`}
function hkMatrixTab(el,plan){el.innerHTML=infoBlock("hk.matrix")+`<h4>Annual objectives against breakthrough objectives</h4>${linkGrid(plan,"annual","breakthrough")}<h4>Priorities against annual objectives</h4>${linkGrid(plan,"priorities","annual")}<h4>Metrics against priorities</h4>${linkGrid(plan,"metrics","priorities")}
  <h4>Owners of the priorities</h4>${plan.priorities.filter(p=>p.text.trim()).length?`<table class="grid xm"><tbody>${plan.priorities.filter(p=>p.text.trim()).map(p=>`<tr><td><b>${hcode(plan,"priorities",p.id)}</b> ${esc(trunc(p.text,60))}</td><td>${esc(p.owner||"(no owner)")}</td></tr>`).join("")}</tbody></table>`:""}`;bind(el)}
function hkBowlTab(el,plan){
  const ms=plan.metrics.filter(m=>m.text.trim());
  el.innerHTML=infoBlock("hk.bowl")+(ms.length?`<div class="wide"><table class="grid bowl"><thead><tr><th style="min-width:200px">Metric</th><th>Base</th><th>Target</th>${MONTHS.map(m=>`<th>${m}</th>`).join("")}</tr></thead><tbody>
    ${ms.map(m=>`<tr><td><b>${hcode(plan,"metrics",m.id)}</b> ${esc(trunc(m.text,40))}<div class="small muted">${esc(m.direction||"")}</div></td><td class="calc">${esc(m.baseline||"")}</td><td class="calc">${esc(m.target||"")}</td>${MONTHS.map((_,i)=>{const ok=monthOK(m,i),pl=monthPlan(m,i);return `<td class="${ok===true?"ok":ok===false?"nok":""}"><input data-mid="${m.id}" data-mo="${i}" value="${esc((m.months||{})[i]||"")}" aria-label="${MONTHS[i]}" title="${pl!=null?"Plan: "+fmt(pl,1):""}"></td>`}).join("")}</tr>`).join("")}
    </tbody></table></div><p class="small muted">Green: on or ahead of the monthly plan (a straight line from baseline to target). Orange: behind plan. Hover a cell to see the plan value.</p><div class="flags" id="bF"></div>`
   :`<p class="muted">Add metrics with a baseline and target on the Objectives tab.</p>`);
  const fl=()=>{const f=[];ms.forEach(m=>{const res=MONTHS.map((_,i)=>monthOK(m,i)).filter(v=>v!==null);if(res.length>=2&&res.slice(-2).every(v=>v===false))f.push(`${hcode(plan,"metrics",m.id)} has been behind plan two months running. Hoshin practice: write a short countermeasure for the owner to act on.`)});const e=$("#bF");if(e)e.innerHTML=flagsHTML(f)};
  el.querySelectorAll("[data-mid]").forEach(i=>i.oninput=()=>{const m=plan.metrics.find(x=>x.id===i.dataset.mid);m.months=m.months||{};m.months[i.dataset.mo]=i.value;savePF();const td=i.parentElement,ok=monthOK(m,+i.dataset.mo);td.className=ok===true?"ok":ok===false?"nok":"";fl()});fl();bind(el);
}
function hkWorkTab(el,plan){
  const pr=plan.priorities.filter(p=>p.text.trim());
  el.innerHTML=infoBlock("hk.work")+(pr.length?pr.map(p=>{const w=workFor(p.id),n=w.projects.length+w.ideas.length+w.jdi.length;
    return `<div class="card"><b>${hcode(plan,"priorities",p.id)} ${esc(p.text)}</b> <span class="small muted">${esc(p.owner||"no owner")}</span>
     ${n?`<ul class="small">${w.projects.map(x=>`<li>Project: <button class="btn link" data-op="${x.id}">${esc(x.title)}</button> (${esc(x.tool)}, ${esc(STATUSES[x.status])}${DEF[x.tool]?", "+esc(ST[x.phase].name):""})</li>`).join("")}${w.ideas.map(x=>`<li>Idea in pipeline: ${esc(x.title||"untitled")} (${esc(x.status)})</li>`).join("")}${w.jdi.map(x=>`<li>Just do it: ${esc(x.what)} (${x.done==="Yes"?"done":"open"})</li>`).join("")}</ul>`
      :`<div class="flag">No project, idea or quick win serves this priority yet.</div>`}</div>`}).join("")
   :`<p class="muted">Add improvement priorities on the Objectives tab.</p>`)+`<p class="small muted">Link a project to a priority in the project itself (under its title), or an idea in the pipeline.</p>`;
  el.querySelectorAll("[data-op]").forEach(b=>b.onclick=()=>openProject(b.dataset.op));bind(el);
}

/* ----- catchball: share files ----- */
async function exportShare(plan){
  const par=plan.parent&&findPlan(plan.parent);
  const strip=p=>({id:p.id,name:p.name,level:p.level,period:p.period,owner:p.owner,parent:p.parent||"",breakthrough:p.breakthrough,annual:p.annual,priorities:p.priorities,metrics:p.metrics,updated:p.updated});
  const data={format:"lean-navigator-hoshin",version:1,exportedAt:new Date().toISOString(),plan:strip(plan),parent:par?strip(par):null};
  await saveBlob(`hoshin-${slug(plan.name||"plan")}-${today10()}.json`,new Blob([JSON.stringify(data,null,1)],{type:"application/json"}));toast("Share file saved. Send it to the owner of the level below or above.");
}
async function importShare(f){if(!f)return;try{const d=JSON.parse(await f.text());if(d.format!=="lean-navigator-hoshin"||!d.plan)throw new Error("This is not a Lean Navigator Hoshin share file.");
  const pf=PF(),add=p=>{if(!p)return;if(pf.plans.some(x=>x.id===p.id)){return}const i=pf.parents.findIndex(x=>x.id===p.id);const rec={...p,importedAt:new Date().toISOString(),source:f.name};if(i>=0)pf.parents[i]=rec;else pf.parents.push(rec)};
  if(pf.plans.some(x=>x.id===d.plan.id)){toast("This plan is one of your own plans: nothing imported.");return}
  add(d.parent);add(d.plan);savePF();renderStrategy();toast(`Imported "${d.plan.name}". Choose it as the parent of your plan on the Plan tab.`)}catch(e){toast(e.message||"Could not read the file.")}}
async function exportPlanXlsx(plan){
  const wb=new ExcelJS.Workbook();wb.creator="Lean Navigator";const ws=wb.addWorksheet("Plan");ws.getColumn(1).width=8;ws.getColumn(2).width=70;ws.getColumn(3).width=20;ws.getColumn(4).width=20;
  const t=ws.addRow([plan.name||"Hoshin plan"]);t.font={bold:true,size:16,color:{argb:"FF001C3D"}};ws.addRow(["Level",plan.level]);ws.addRow(["Period",plan.period]);ws.addRow(["Owner",plan.owner]);const par=plan.parent&&findPlan(plan.parent);if(par)ws.addRow(["Under",`${par.name} (${par.level})`]);
  HKIND.forEach(([k,,l])=>{ws.addRow([]);const h=ws.addRow([l]);h.getCell(1).font={bold:true,size:12,color:{argb:"FFE84E10"}};styleHead(ws.addRow(["#","Text","Owner","Serves"]));plan[k].forEach(x=>ws.addRow([hcode(plan,k,x.id),x.text,x.owner||"",linkTarget[k]?(x.links||[]).map(id=>hcode(plan,linkTarget[k],id)).join(", "):""]))});
  const mx=wb.addWorksheet("Matrix");[["annual","breakthrough"],["priorities","annual"],["metrics","priorities"]].forEach(([r,c])=>{const R=plan[r].filter(x=>x.text.trim()),Cc=plan[c].filter(x=>x.text.trim());styleHead(mx.addRow(["",...Cc.map(x=>hcode(plan,c,x.id))]));R.forEach(x=>{const row=mx.addRow([hcode(plan,r,x.id)+" "+x.text,...Cc.map(y=>(x.links||[]).includes(y.id)?"●":"")]);row.alignment={horizontal:"center"};row.getCell(1).alignment={horizontal:"left"}});mx.addRow([])});mx.getColumn(1).width=60;
  const bw=wb.addWorksheet("Monthly tracking");styleHead(bw.addRow(["Metric","Direction","Baseline","Target",...MONTHS]));
  plan.metrics.filter(m=>m.text.trim()).forEach(m=>{const r=bw.addRow([hcode(plan,"metrics",m.id)+" "+m.text,m.direction,num(m.baseline),num(m.target),...MONTHS.map((_,i)=>num((m.months||{})[i]))]);MONTHS.forEach((_,i)=>{const ok=monthOK(m,i);if(ok!==null)r.getCell(5+i).fill={type:"pattern",pattern:"solid",fgColor:{argb:ok?"FFBFE6CF":"FFF8C9B5"}}});const p=bw.addRow(["   plan","","","",...MONTHS.map((_,i)=>{const v=monthPlan(m,i);return v==null?null:Math.round(v*10)/10})]);p.font={italic:true,color:{argb:"FF8A97A8"}}});
  bw.getColumn(1).width=50;bw.getColumn(2).width=16;
  await saveBlob(`hoshin-${slug(plan.name||"plan")}-${today10()}.xlsx`,new Blob([await wb.xlsx.writeBuffer()],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));toast("Excel workbook saved.");
}
async function exportPlanPdf(plan){
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4",orientation:"landscape"}),H=helpers(doc),M=H.M,PW=297;
  doc.setFillColor(...BLUE);doc.rect(0,0,PW,30,"F");doc.setFillColor(...ORG);doc.rect(M,8,2.5,15,"F");doc.setFont("helvetica","bold");doc.setFontSize(16);doc.setTextColor(255,255,255);doc.text(pdfText(plan.name||"Hoshin plan"),M+7,16);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...LBL);const par=plan.parent&&findPlan(plan.parent);doc.text(pdfText(`${plan.level}, ${plan.period}${plan.owner?", owner "+plan.owner:""}${par?", under "+par.name:""}`),M+7,23);H.y=40;
  HKIND.forEach(([k,,l])=>{H.h2(l);H.tbl(["#","Text","Owner","Serves",...(k==="metrics"?["Baseline","Target"]:[])],plan[k].map(x=>[hcode(plan,k,x.id),x.text,x.owner||"",linkTarget[k]?(x.links||[]).map(id=>hcode(plan,linkTarget[k],id)).join(", "):(x.supports||[]).length&&par?(x.supports||[]).map(id=>hcode(par,"annual",id)||hcode(par,"priorities",id)).join(", "):"",...(k==="metrics"?[x.baseline||"",x.target||""]:[])]),[12,null,34,26])});
  const ms=plan.metrics.filter(m=>m.text.trim());if(ms.length){H.h2("Monthly tracking");H.tbl(["Metric","Target",...MONTHS],ms.map(m=>[hcode(plan,"metrics",m.id)+" "+m.text,m.target||"",...MONTHS.map((_,i)=>{const v=(m.months||{})[i];const ok=monthOK(m,i);return v?(v+(ok===true?" +":ok===false?" -":"")):""})]),[60,16]);H.para("+ on or ahead of the monthly plan, - behind plan.",{color:GRY})}
  const g=planGaps(plan);if(g.length){H.h2("Gaps");H.para(g.join(" "),{color:ORG})}
  const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(7.5);doc.setTextColor(...GRY);doc.text(`Page ${i} of ${n}`,PW-M,203,{align:"right"})}
  await saveBlob(`hoshin-${slug(plan.name||"plan")}-${today10()}.pdf`,doc.output("blob"));toast("PDF saved.");
}
Object.assign(INFO,{
 "hk.list":I("Deploy strategy from the top down and connect it to the improvement work.","One plan per level and year. For a level below, choose the plan above as its parent (import it from a share file if someone else owns it).","The tool flags gaps: objectives without priorities, priorities without metrics, owners or projects."),
 "hk.plan":I("Place this plan in the hierarchy.","Level, period, owner and, for a lower level, the plan of the level above.","Not reviewed."),
 "hk.obj":I("Write the plan as a chain: breakthrough objectives, annual objectives, improvement priorities, metrics.","Each item, and in the last column the codes of the items one level up that it serves (e.g. A1, A2).","Every annual objective serves a breakthrough objective; every priority has an owner and a metric; few priorities rather than many."),
 "hk.matrix":I("See the links of the X-matrix as grids, to spot what is missing or overloaded.","Nothing: drawn from the Objectives tab.","Empty rows or columns: objectives nothing delivers, or work that serves nothing."),
 "hk.bowl":I("Track the metrics month by month against a straight-line plan from baseline to target.","The actual value of each metric per month.","Two months behind plan in a row calls for a countermeasure from the owner."),
 "hk.work":I("Check that every priority has work behind it.","Nothing here: link projects (under the project title) and ideas (in the pipeline) to priorities.","Priorities with no project, idea or quick win.")
});
