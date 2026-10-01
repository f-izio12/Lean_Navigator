/* ================= Export menu: PDF, Excel workbook, Jira Cloud CSV, agile backlog, email ================= */
const EXPORTS=[
  {id:"pdf",label:"PDF report",note:"The method stage by stage, plus plan, Gantt, stakeholders and RACI."},
  {id:"xlsx",label:"Excel workbook",note:"Every stage, the plan with a Responsible and Status column and a week-by-week Gantt, stakeholders and RACI. One-way: changes made in Excel do not come back into the app."},
  {id:"jira",label:"Jira Cloud import file (CSV)",note:"Work packages as epics, stories, sub-tasks and dependencies. Needs import rights in Jira; test it in a test project first. Milestones are not included.",plan:true},
  {id:"agile",label:"Agile backlog (Excel)",note:"Epic, story and sub-task rows with IDs, to copy into any agile tool.",plan:true},
  {id:"mail",label:"Email draft",note:"Opens your email program with a summary. Attach the PDF yourself: browsers cannot attach files to an email."}
];
const exportMenuHTML=()=>`<div class="menu"><button class="btn" id="exportBtn" aria-haspopup="true" aria-expanded="false">Export ▾</button>
  <div class="menu-list" id="exportList" role="menu" hidden>${EXPORTS.map(e=>`<button role="menuitem" data-ex="${e.id}"><b>${e.label}</b><span>${e.note}</span></button>`).join("")}</div></div>`;
function bindExportMenu(p){
  const b=$("#exportBtn"),l=$("#exportList"),close=()=>{l.hidden=true;b.setAttribute("aria-expanded","false")};
  b.onclick=e=>{e.stopPropagation();l.hidden=!l.hidden;b.setAttribute("aria-expanded",String(!l.hidden))};
  document.addEventListener("click",function h(e){if(!l.isConnected){document.removeEventListener("click",h);return}if(!l.contains(e.target))close()});
  l.onkeydown=e=>{if(e.key==="Escape"){close();b.focus()}};
  l.querySelectorAll("[data-ex]").forEach(x=>x.onclick=async()=>{close();const id=x.dataset.ex,def=EXPORTS.find(e=>e.id===id);
    if(def.plan&&!p.plan.items.length){toast("Add work packages on the Plan and Gantt tab first.");return}
    b.disabled=true;const t=b.textContent;b.textContent="Preparing…";
    try{if(id==="pdf")await exportPDF(p);else if(id==="xlsx")await exportXLSX(p);else if(id==="jira")await exportJira(p);else if(id==="agile")await exportAgile(p);else openEmail(p)}
    catch(e){console.error(e);toast("Export failed: "+(e.message||e))}finally{b.disabled=false;b.textContent=t}});
}
const fileStem=p=>`${slug(p.title)}-${toolSlug[p.tool]||"lean"}`;
const today10=()=>new Date().toISOString().slice(0,10);
async function saveBlob(name,blob){await downloads.save({filename:name,data:blob})}

/* ----- Excel workbook ----- */
const HUMAN={s:"Suppliers",i:"Inputs",p:"Process",o:"Outputs",c:"Customers",ct:"Cycle time",co:"Changeover",pca:"% complete and accurate",ops:"People",w1:"Why 1",w2:"Why 2",w3:"Why 3",w4:"Why 4",w5:"Why 5",grr:"%GRR",ndc:"Distinct categories",lsl:"Lower spec limit",usl:"Upper spec limit",msa:"Measurement system",voc:"Voice of the customer",fmea:"FMEA",ctq:"CTQ",spec:"Specification / target",x1:"Events A",n1:"Sample A",x2:"Events B",n2:"Sample B",la:"Name A",lb:"Name B",a:"Values A",b:"Values B"};
const human=k=>HUMAN[k]||String(k).replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase()).trim();
function styleHead(row){row.eachCell(c=>{c.font={bold:true,color:{argb:"FFFFFFFF"}};c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0C2145"}};c.alignment={vertical:"middle",wrapText:true}})}
function sheetName(wb,n){n=String(n).replace(/[\\/?*[\]:]/g," ").slice(0,31);let k=n,i=2;while(wb.getWorksheet(k))k=(n.slice(0,28)+" "+i++);return k}
function writeObject(ws,obj,prefix=""){
  const scal=[],arrs=[],objs=[];
  Object.entries(obj).forEach(([k,v])=>{if(k==="tollgate")return;if(Array.isArray(v))arrs.push([k,v]);else if(v&&typeof v==="object")objs.push([k,v]);else scal.push([k,v])});
  scal.forEach(([k,v])=>{const r=ws.addRow([prefix+human(k),v??""]);r.getCell(1).font={bold:true};r.getCell(2).alignment={wrapText:true,vertical:"top"}});
  objs.forEach(([k,v])=>{ws.addRow([]);const h=ws.addRow([human(k)]);h.getCell(1).font={bold:true,size:12,color:{argb:"FF7A6A3E"}};writeObject(ws,v)});
  arrs.forEach(([k,v])=>{ws.addRow([]);const h=ws.addRow([human(k)]);h.getCell(1).font={bold:true,size:12,color:{argb:"FF7A6A3E"}};
    const rowsF=v.filter(r=>r&&typeof r==="object"&&Object.values(r).some(x=>String(x??"").trim()));if(!rowsF.length){ws.addRow(["Nothing recorded"]);return}
    const keys=Object.keys(rowsF[0]).filter(x=>typeof rowsF[0][x]!=="object");styleHead(ws.addRow(keys.map(human)));rowsF.forEach(r=>{const rr=ws.addRow(keys.map(x=>r[x]??""));rr.alignment={wrapText:true,vertical:"top"}})});
}
function planSheet(wb,p,name="Plan"){
  const ws=wb.addWorksheet(name,{views:[{state:"frozen",xSplit:3,ySplit:1}]}),{tree}=planDates(p);
  const cols=["#","Type","Item","Description","Responsible","Start","End","Days","Depends on","Status"];
  const dated=tree.filter(t=>t._eff.s!=null&&t._eff.e!=null);let weeks=[];
  if(dated.length){let s0=Math.min(...dated.map(t=>t._eff.s)),s1=Math.max(...dated.map(t=>t._eff.e));s0-=((new Date(s0).getUTCDay()+6)%7)*DAY;for(let w=s0;w<=s1;w+=7*DAY)weeks.push(w)}
  styleHead(ws.addRow([...cols,...weeks.map(w=>new Date(w))]));
  ws.getRow(1).eachCell((c,i)=>{if(i>cols.length){c.numFmt="dd mmm";c.alignment={textRotation:90,horizontal:"center"}}});
  tree.forEach(t=>{const code=x=>tree.find(y=>y.id===x)?.code;
    const r=ws.addRow([t.code,PTYPES[t.type],"   ".repeat(t.depth)+(t.title||""),t.desc||"",t.owner||"",t.type==="ms"?null:t._eff.s!=null?new Date(t._eff.s):null,t._eff.e!=null?new Date(t._eff.e):null,t.type!=="ms"&&t._eff.s!=null&&t._eff.e!=null?Math.round((t._eff.e-t._eff.s)/DAY)+1:null,(t.deps||[]).map(code).filter(Boolean).join(", "),""]);
    r.getCell(6).numFmt=r.getCell(7).numFmt="dd mmm yyyy";if(t.depth===0)r.font={bold:true};
    r.getCell(10).dataValidation={type:"list",allowBlank:true,formulae:['"Not started,In progress,Done,Blocked"']};
    weeks.forEach((w,i)=>{const{s,e}=t._eff;if(s==null||e==null)return;if(s<=w+6*DAY&&e>=w){const c=r.getCell(cols.length+1+i);c.fill={type:"pattern",pattern:"solid",fgColor:{argb:t.type==="ms"?"FF7A6A3E":t.type==="wp"?"FF0C2145":t.type==="story"?"FFC3B598":"FF8C95A3"}}}})});
  [6,12,40,36,18,13,13,7,12,13].forEach((w,i)=>ws.getColumn(i+1).width=w);weeks.forEach((_,i)=>ws.getColumn(cols.length+1+i).width=3.2);
  return ws;
}
async function exportXLSX(p){
  if(!window.ExcelJS)throw new Error("The Excel library did not load. Reload the app.");
  const wb=new ExcelJS.Workbook();wb.creator="Lean Navigator";wb.created=new Date();
  const sum=wb.addWorksheet("Summary");sum.getColumn(1).width=28;sum.getColumn(2).width=90;
  const t=sum.addRow([p.title]);t.font={bold:true,size:16,color:{argb:"FF0C2145"}};
  const cv=COVER[p.tool](p);[["Method",p.tool],["Status",STATUSES[p.status]],["Current stage",ST[p.phase].name],["Created",fmtDate(p.created)],["Last updated",fmtDate(p.updated)],["Exported",fmtDate(new Date().toISOString())],...cv.people,...cv.summary].forEach(([k,v])=>{const r=sum.addRow([k,v??""]);r.getCell(1).font={bold:true};r.getCell(2).alignment={wrapText:true,vertical:"top"}});
  sum.addRow([]);styleHead(sum.addRow(["Stage","Status / decision"]));DEF[p.tool].order.forEach(k=>sum.addRow([ST[k].name,`${stageStatus(p,k)}${tgOf(p,k).decision?", decision: "+tgOf(p,k).decision:""}`]));
  for(const k of DEF[p.tool].order){const ws=wb.addWorksheet(sheetName(wb,ST[k].name));ws.getColumn(1).width=30;for(let i=2;i<=10;i++)ws.getColumn(i).width=24;
    writeObject(ws,p[ST[k].key]);const tg=tgOf(p,k);ws.addRow([]);const h=ws.addRow([DEF[p.tool].gate]);h.getCell(1).font={bold:true,size:12,color:{argb:"FF7A6A3E"}};
    ST[k].tg.forEach(([c,l])=>ws.addRow([l,tg.checks[c]?"Yes":"No"]));ws.addRow(["Decision",tg.decision||""]);ws.addRow(["Notes",tg.notes||""])}
  if(p.plan.items.length)planSheet(wb,p);
  const st=p.people.stakeholders.filter(s=>s.name);
  if(st.length){const ws=wb.addWorksheet("Stakeholders");styleHead(ws.addRow(["Name or group","Role","Influence","Interest","Approach","Attitude now","Attitude needed","Action"]));st.forEach(s=>ws.addRow([s.name,s.role,num(s.influence),num(s.interest),sQuad(s),s.current,s.desired,s.action]));[24,22,10,10,16,14,16,50].forEach((w,i)=>ws.getColumn(i+1).width=w)}
  if(st.length){const ws=wb.addWorksheet("RACI"),rows=raciRows(p),cells=p.people.raci.cells;styleHead(ws.addRow(["Activity",...st.map(s=>s.name)]));rows.forEach(r=>ws.addRow([r.label,...st.map(s=>(cells[r.key]||{})[s.id]||"")]));ws.getColumn(1).width=36;st.forEach((_,i)=>ws.getColumn(i+2).width=14);ws.addRow([]);ws.addRow(["R = responsible, does the work. A = accountable, one per row. C = consulted. I = informed."])}
  const buf=await wb.xlsx.writeBuffer();await saveBlob(`${fileStem(p)}-${today10()}.xlsx`,new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));toast("Excel workbook saved.");
}

/* ----- Backlog rows shared by Jira CSV and agile Excel ----- */
function backlogRows(p){
  const {tree}=planDates(p),items=tree.filter(t=>t.type!=="ms"),ids={};
  const order=[...items.filter(t=>t.type==="wp"),...items.filter(t=>t.type==="story"),...items.filter(t=>t.type==="sub")]; // parents before children
  order.forEach((t,i)=>ids[t.id]=String(i+1));
  return order.map(t=>({issueId:ids[t.id],parent:t.parent?ids[t.parent]||"":"",level:t.type==="wp"?"Epic":t.type==="story"?"Story":"Subtask",code:t.code,summary:t.title||PTYPES[t.type]+" "+t.code,description:t.desc||"",assignee:t.owner||"",start:t._eff.s!=null?ds(t._eff.s):"",due:t._eff.e!=null?ds(t._eff.e):"",blockedBy:(t.deps||[]).map(d=>ids[d]).filter(Boolean)}));
}
const csvCell=v=>{v=String(v??"");return /[",\n\r]/.test(v)?`"${v.replace(/"/g,'""')}"`:v};
async function exportJira(p){
  const rows=backlogRows(p),maxDeps=Math.max(0,...rows.map(r=>r.blockedBy.length));
  const head=["Issue ID","Parent","Issue Type","Summary","Description","Assignee","Start date","Due date",...Array(maxDeps).fill("Blocked by")];
  const body=rows.map(r=>[r.issueId,r.parent,r.level,r.summary,r.description,r.assignee,r.start,r.due,...Array.from({length:maxDeps},(_,i)=>r.blockedBy[i]||"")]);
  const csv=[head,...body].map(r=>r.map(csvCell).join(",")).join("\r\n");
  await saveBlob(`${fileStem(p)}-jira-${today10()}.csv`,new Blob([csv],{type:"text/csv;charset=utf-8"}));
  showJiraTips(rows.length,maxDeps>0);
}
function showJiraTips(n,deps){
  $("#modalRoot").innerHTML=`<div class="overlay" id="ov"><div class="modal panel" role="dialog" aria-modal="true" aria-labelledby="jh"><div class="panel-head"><h2 id="jh">Importing into Jira Cloud</h2></div><div class="panel-body small">
   <p style="margin-top:0">${n} items saved. Test the import in a test project before using a real one.</p>
   <ol><li>In Jira, start the CSV import (in Jira Cloud usually Settings, System, External system import, CSV). This normally needs Jira administrator rights.</li>
   <li>Choose the file, the target project, and set the date format to <code>yyyy-MM-dd</code>.</li>
   <li>Map the columns: <b>Issue ID</b> to Issue ID, <b>Parent</b> to Parent, <b>Issue Type</b> to Issue Type, <b>Summary</b>, <b>Description</b>, <b>Start date</b> and <b>Due date</b> to the matching fields.${deps?" Map <b>Blocked by</b> to the issue link \"Blocks\" (inward), so the item is blocked by the listed items.":""}</li>
   <li><b>Assignee</b>: map it only if the names are exactly the Jira users' names or email addresses. Otherwise leave it unmapped and assign in Jira.</li>
   <li>If your Jira calls sub-tasks "Sub-task" instead of "Subtask", tick "Map field value" for Issue Type and map Subtask to it.</li></ol>
   <p class="muted">The Parent column holds the Issue ID of the parent row, as Jira Cloud expects. Epics come first in the file so that their children can find them.</p>
   <div class="row"><button class="btn" id="jClose">Close</button></div></div></div></div>`;
  $("#jClose").onclick=()=>{$("#modalRoot").innerHTML=""};$("#ov").onclick=e=>{if(e.target.id==="ov")$("#modalRoot").innerHTML=""};$("#jClose").focus();
}
async function exportAgile(p){
  if(!window.ExcelJS)throw new Error("The Excel library did not load. Reload the app.");
  const rows=backlogRows(p),wb=new ExcelJS.Workbook(),ws=wb.addWorksheet("Backlog",{views:[{state:"frozen",ySplit:1}]});
  styleHead(ws.addRow(["ID","Parent ID","Level","Plan code","Summary","Description","Assignee","Start","Due","Blocked by (IDs)","Status"]));
  rows.forEach(r=>{const x=ws.addRow([+r.issueId,r.parent?+r.parent:null,r.level,r.code,r.summary,r.description,r.assignee,r.start?new Date(r.start):null,r.due?new Date(r.due):null,r.blockedBy.join(", "),""]);
    x.getCell(8).numFmt=x.getCell(9).numFmt="yyyy-mm-dd";x.getCell(11).dataValidation={type:"list",allowBlank:true,formulae:['"To do,In progress,Done,Blocked"']};if(r.level==="Epic")x.font={bold:true}});
  [6,9,9,9,40,40,18,12,12,14,13].forEach((w,i)=>ws.getColumn(i+1).width=w);ws.autoFilter={from:"A1",to:"K1"};
  const buf=await wb.xlsx.writeBuffer();await saveBlob(`${fileStem(p)}-backlog-${today10()}.xlsx`,new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));toast("Backlog saved.");
}
