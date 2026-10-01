/* ================= Portfolio: shared state for pipeline, Just do it log and Hoshin ================= */
const PF=()=>{const s=Vault.state;s.portfolio=s.portfolio||{};const p=s.portfolio;p.ideas=p.ideas||[];p.jdi=p.jdi||[];p.plans=p.plans||[];p.parents=p.parents||[];return p};
let pfTimer=null;
function savePF(){Vault.dirty=true;updateSaveBar();clearTimeout(pfTimer);pfTimer=setTimeout(()=>persistAll(),700)}
const IDEA_ST=["New","Under review","Started","Just do it","Parked","Rejected"];
/* every Hoshin priority the user can link to: own plans and imported parent plans */
function allPriorities(){const out=[];[...PF().plans.map(p=>({p,own:true})),...PF().parents.map(p=>({p,own:false}))].forEach(({p,own})=>(p.priorities||[]).forEach((x,i)=>{if(x.text&&x.text.trim())out.push({id:x.id,code:"P"+(i+1),text:x.text,plan:p.name||"Untitled plan",level:p.level,own})}));return out}
const priLabel=id=>{const x=allPriorities().find(q=>q.id===id);return x?`${x.plan}: ${x.code} ${trunc(x.text,50)}`:""};
const priSelect=(cur,attr)=>`<select ${attr}><option value="">No strategic link</option>${allPriorities().map(x=>`<option value="${x.id}" ${x.id===cur?"selected":""}>${esc(trunc(`${x.plan} (${x.level}): ${x.code} ${x.text}`,90))}</option>`).join("")}</select>`;

/* ----- binding helper for objects outside a project ----- */
function bindRoot(el,root,after){
  el.querySelectorAll("[data-o]").forEach(i=>{const h=()=>{setPath(root,i.dataset.o,i.value);savePF();after&&after(i)};i.addEventListener(i.tagName==="SELECT"||i.type==="date"?"change":"input",h)});
}

/* ================= Pipeline ================= */
const ideaScore=x=>{const b=num(x.benefit)||0,e=num(x.effort)||0;return b&&e?b*(6-e)+(x.link?3:0):0};
function renderPipeline(){
  const pf=PF(),tab=S.pipeTab||"ideas",flt=S.pipeFilter||"open";
  const open=x=>["New","Under review"].includes(x.status);
  const list=pf.ideas.filter(x=>flt==="all"||(flt==="open"?open(x):x.status===flt)).sort((a,b)=>(!a.title.trim()-!b.title.trim())*-1||ideaScore(b)-ideaScore(a));
  $("#app").innerHTML=`<div class="proj-head"><h2>Pipeline</h2><span class="muted small">Collect improvement ideas, score them, and decide: start a project, just do it, park or reject.</span>
    <div style="margin-left:auto" class="row"><button class="btn" id="addIdea">Add idea</button><button class="btn alt" id="pipeXlsx">Export to Excel</button></div></div>
   <div class="pviews">${[["ideas",`Ideas (${pf.ideas.filter(open).length} open)`],["jdi",`Just do it log (${pf.jdi.filter(j=>j.done!=="Yes").length} open)`]].map(([k,l])=>`<button class="pv" data-ptab="${k}" aria-selected="${tab===k}">${l}</button>`).join("")}</div>
   <div class="sheet solo" id="pipeSheet"></div>`;
  $("#addIdea").onclick=()=>{pf.ideas.unshift({id:uidGen(),title:"",problem:"",proposer:"",added:new Date().toISOString().slice(0,10),benefit:"3",effort:"3",link:"",status:"New",note:"",projectId:""});S.pipeTab="ideas";S.pipeFilter="open";savePF();renderPipeline();setTimeout(()=>document.querySelector(".idea input")?.focus())};
  $("#pipeXlsx").onclick=()=>exportPipeline().catch(e=>toast("Export failed: "+e.message));
  document.querySelectorAll("[data-ptab]").forEach(b=>b.onclick=()=>{S.pipeTab=b.dataset.ptab;renderPipeline()});
  const el=$("#pipeSheet");
  if(tab==="jdi")return renderJDI(el);
  el.innerHTML=infoBlock("pf.ideas")+`<div class="filters">${[["open","Open"],["all","All"],...IDEA_ST.slice(2).map(s=>[s,s])].map(([k,l])=>`<button class="chip" data-flt="${k}" aria-pressed="${flt===k}">${l}</button>`).join("")}</div>
   ${list.length?list.map(x=>ideaCard(x)).join(""):`<p class="muted">No ideas in this view. ${flt==="open"?"Add one with <b>Add idea</b>.":""}</p>`}
   ${pf.ideas.some(open)?`<h4>Benefit against effort (open ideas)</h4><div class="chartbox" style="max-width:460px">${matrixChart(pf.ideas.filter(open).map(x=>({solution:x.title||"?",impact:x.benefit,effort:x.effort})))}</div><p class="small muted">Numbers follow the order of the open ideas above.</p>`:""}`;
  el.querySelectorAll("[data-flt]").forEach(b=>b.onclick=()=>{S.pipeFilter=b.dataset.flt;renderPipeline()});
  bind(el);
  el.querySelectorAll(".idea").forEach(card=>{const x=pf.ideas.find(i=>i.id===card.dataset.id);bindRoot(card,x,i=>{if(["benefit","effort","link"].includes(i.dataset.o))card.querySelector(".score").textContent=ideaScore(x)});
    card.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>ideaAction(x,b.dataset.act,card))});
}
function ideaCard(x){const closed=!["New","Under review"].includes(x.status),proj=x.projectId&&S.projects.find(p=>p.id===x.projectId);
  return `<div class="card idea" data-id="${x.id}"><div class="idea-head"><input data-o="title" value="${esc(x.title)}" placeholder="Idea in a few words" aria-label="Idea"><span class="status ${closed?"closed":"ongoing"}">${esc(x.status)}</span><span class="score" title="Score: benefit × (6 − effort), +3 if linked to a strategic priority">${ideaScore(x)}</span></div>
   <div class="grid2"><div class="field"><label>Problem or opportunity</label><textarea data-o="problem" rows="2">${esc(x.problem)}</textarea></div>
   <div><div class="grid3"><div class="field"><label>Benefit</label><select data-o="benefit">${["1","2","3","4","5"].map(v=>`<option ${v===x.benefit?"selected":""}>${v}</option>`).join("")}</select></div><div class="field"><label>Effort</label><select data-o="effort">${["1","2","3","4","5"].map(v=>`<option ${v===x.effort?"selected":""}>${v}</option>`).join("")}</select></div><div class="field"><label>Status</label><select data-o="status">${IDEA_ST.map(v=>`<option ${v===x.status?"selected":""}>${v}</option>`).join("")}</select></div></div>
   <div class="grid2"><div class="field"><label>Proposed by</label><input data-o="proposer" value="${esc(x.proposer)}"></div><div class="field"><label>Added</label><input type="date" data-o="added" value="${esc(x.added)}"></div></div></div></div>
   <div class="field"><label>Strategic link</label>${priSelect(x.link,'data-o="link"')}</div>
   ${x.note?`<p class="small muted">Note: ${esc(x.note)}</p>`:""}${proj?`<p class="small">Project: <button class="btn link" data-act="open">${esc(proj.title)}</button> (${esc(proj.tool)})</p>`:""}
   <div class="row idea-acts">${closed?`<button class="btn alt" data-act="reopen">Reopen</button>`:`<select data-start aria-label="Method"><option value="">Start as project with…</option>${BUILT().map(t=>`<option>${t}</option>`).join("")}<option value="__advisor">Ask the advisor which method</option></select><button class="btn" data-act="start">Start</button><button class="btn alt" data-act="jdi">Just do it</button><button class="btn alt" data-act="park">Park</button><button class="btn alt" data-act="reject">Reject</button>`}<button class="x" data-act="del" aria-label="Delete idea">×</button></div></div>`}
async function ideaAction(x,act,card){
  const pf=PF();
  if(act==="del"){if(!confirm("Delete this idea?"))return;pf.ideas=pf.ideas.filter(i=>i.id!==x.id);savePF();return renderPipeline()}
  if(act==="open"){return openProject(x.projectId)}
  if(act==="reopen"){x.status="Under review";x.note="";savePF();return renderPipeline()}
  if(act==="park"||act==="reject"){const r=prompt(act==="park"?"Why park it, and when to look again?":"Why reject it? (helps the proposer understand)");if(r===null)return;x.status=act==="park"?"Parked":"Rejected";x.note=r;savePF();return renderPipeline()}
  if(act==="jdi"){if((num(x.effort)||0)>=4&&!confirm("Effort is high for a Just do it. Continue anyway?"))return;
    pf.jdi.unshift({id:uidGen(),what:x.title||x.problem,owner:"",due:"",done:"No",result:"",ideaId:x.id,link:x.link});x.status="Just do it";savePF();S.pipeTab="jdi";toast("Moved to the Just do it log.");return renderPipeline()}
  if(act==="start"){const m=card.querySelector("[data-start]").value;if(!m){toast("Choose a method, or ask the advisor.");return}
    if(!x.title.trim()){toast("Give the idea a title first.");return}
    if(m==="__advisor"){S.pendingIdea=x.id;S.view="home";S.chat=[];render();$("#inp").value=`${x.title}. ${x.problem}`.trim();$("#inp").focus();toast("Describe more if you can, then press Send.");return}
    S.pendingIdea=x.id;await createProject(m,x.title)}
}
/* called from createProject (ui.js) */
function linkIdeaToProject(p){const id=S.pendingIdea;S.pendingIdea=null;if(!id)return;const x=PF().ideas.find(i=>i.id===id);if(!x)return;
  x.status="Started";x.projectId=p.id;p.hoshinLink=x.link||"";if(x.problem&&!p.advisorNotes)p.advisorNotes="From the pipeline: "+x.problem;savePF()}

/* ================= Just do it log ================= */
function renderJDI(el){
  const pf=PF(),today=new Date().toISOString().slice(0,10);
  el.innerHTML=infoBlock("pf.jdi")+`<div class="wide"><table class="grid"><thead><tr><th>What</th><th style="width:150px">Owner</th><th style="width:150px">Due</th><th style="width:90px">Done</th><th>Result</th><th style="width:40px"></th></tr></thead><tbody>
   ${pf.jdi.map((j,i)=>`<tr data-j="${i}" class="${j.done!=="Yes"&&j.due&&j.due<today?"late":""}"><td><textarea data-o="what">${esc(j.what)}</textarea></td><td><input data-o="owner" value="${esc(j.owner)}"></td><td><input type="date" data-o="due" value="${esc(j.due)}"></td><td><select data-o="done">${["No","Yes"].map(v=>`<option ${v===j.done?"selected":""}>${v}</option>`).join("")}</select></td><td><textarea data-o="result">${esc(j.result)}</textarea></td><td><button class="x" data-jdel="${i}" aria-label="Remove">×</button></td></tr>`).join("")||`<tr><td colspan="6" class="muted">Nothing in the log yet.</td></tr>`}
   </tbody></table></div><button class="btn alt addrow" id="addJ">Add item</button><div class="flags" id="jF"></div>`;
  const flags=()=>{const open=pf.jdi.filter(j=>j.done!=="Yes"),late=open.filter(j=>j.due&&j.due<today),noOwn=open.filter(j=>!j.owner.trim()),f=[];
    if(late.length)f.push(`${late.length} item(s) past the due date. A Just do it that waits weeks is not quick: finish it, or move it back to the pipeline.`);
    if(noOwn.length)f.push(`${noOwn.length} item(s) without an owner.`);if(pf.jdi.length&&!f.length)f.push(`✓ ${pf.jdi.filter(j=>j.done==="Yes").length} of ${pf.jdi.length} done, nothing overdue.`);$("#jF").innerHTML=flagsHTML(f)};
  el.querySelectorAll("tr[data-j]").forEach(tr=>bindRoot(tr,pf.jdi[+tr.dataset.j],flags));
  el.querySelectorAll("[data-jdel]").forEach(b=>b.onclick=()=>{pf.jdi.splice(+b.dataset.jdel,1);savePF();renderJDI(el)});
  $("#addJ").onclick=()=>{pf.jdi.unshift({id:uidGen(),what:"",owner:"",due:"",done:"No",result:"",ideaId:"",link:""});savePF();renderJDI(el)};
  flags();bind(el);
}
async function exportPipeline(){
  const pf=PF(),wb=new ExcelJS.Workbook();wb.creator="Lean Navigator";
  const a=wb.addWorksheet("Ideas",{views:[{state:"frozen",ySplit:1}]});styleHead(a.addRow(["Idea","Problem or opportunity","Proposed by","Added","Benefit","Effort","Score","Strategic link","Status","Note","Project"]));
  pf.ideas.forEach(x=>a.addRow([x.title,x.problem,x.proposer,x.added?new Date(x.added):null,num(x.benefit),num(x.effort),ideaScore(x),priLabel(x.link),x.status,x.note,S.projects.find(p=>p.id===x.projectId)?.title||""]));
  [36,50,18,12,9,9,8,50,14,40,30].forEach((w,i)=>a.getColumn(i+1).width=w);a.getColumn(4).numFmt="yyyy-mm-dd";
  const j=wb.addWorksheet("Just do it");styleHead(j.addRow(["What","Owner","Due","Done","Result","Strategic link"]));pf.jdi.forEach(x=>j.addRow([x.what,x.owner,x.due?new Date(x.due):null,x.done,x.result,priLabel(x.link)]));[50,18,12,8,50,50].forEach((w,i)=>j.getColumn(i+1).width=w);j.getColumn(3).numFmt="yyyy-mm-dd";
  await saveBlob(`lean-navigator-pipeline-${today10()}.xlsx`,new Blob([await wb.xlsx.writeBuffer()],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));toast("Pipeline exported.");
}
Object.assign(INFO,{
 "pf.ideas":I("Keep every improvement idea in one place and choose the right ones, instead of starting whatever is loudest.","A title, the problem it solves, benefit and effort from 1 to 5, and if possible the strategic priority it serves.","Not reviewed by the AI. The score is benefit × (6 − effort), plus 3 when the idea is linked to a strategic priority. It supports the decision; it does not make it."),
 "pf.jdi":I("Small, obvious fixes: cause and solution known, low risk, quick. Record them so the improvement is visible.","What, who, by when, done or not, and the result.","Items that wait for weeks were not Just do its: move them back to the pipeline.")
});
