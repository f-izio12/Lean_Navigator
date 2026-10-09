/* ================= Just do it: small, obvious fixes, on one page ================= */
var JDI="Just do it";
var JDI_TOOLS=["A3 problem solving","PDCA"];
Object.assign(STAGEBLANK,{
 jdo:()=>({problem:"",cause:"",crit:{cause:"",fix:"",risk:"",quick:""},what:"",owner:"",due:"",done:"No",doneDate:"",
   measure:"",before:"",after:"",evidence:"",standard:"",told:"",parent:{id:"",title:"",tool:""}})
});
registerTool(JDI,{gate:_t("Done check"),stages:[
 {id:"jd",letter:"✓",name:_t("Just do it"),key:"jdo",tabs:[["page",_t("The fix")]],
  tg:[["crit",_t("All four entry questions answered yes")],["done",_t("The fix is done")],["evidence",_t("Before and after values recorded on one measure")],["hold",_t("The fix is built into the standard and the people involved were told")]],
  focus:"is this really a Just do it: cause known, fix known, low risk, done within about two weeks; if not, say plainly that it needs PDCA (small tests) or A3 (cause not known); the fix is one specific change with one owner and a date; evidence on one measure, before and after, shows the problem went away, not just that the task was done; the fix is built into the standard (procedure, template, system setting) and the people involved were told."}
]});
CONTEXT[JDI]=p=>({problem:p.jdo.problem,cause:p.jdo.cause,fix:p.jdo.what,partOf:p.jdo.parent.title?p.jdo.parent.tool+": "+p.jdo.parent.title:""});
var JDI_Q=[["cause",_t("Is the cause known?")],["fix",_t("Is the fix known and agreed?")],["risk",_t("Is the risk low (easy to undo, nobody harmed if it fails)?")],["quick",_t("Can it be done within about two weeks?")]];
var jdV=v=>typeof _tv==="function"?_tv(v):v; /* stored values stay English, shown in the interface language */
var jdiNo=p=>JDI_Q.filter(([k])=>p.jdo.crit[k]==="No");
var yn=(path,v)=>`<select data-bind="${path}" data-rerender="1">${[["",""],["Yes","Yes"],["No","No"]].map(([k,l])=>`<option value="${k}" ${v===k?"selected":""}>${esc(jdV(l))}</option>`).join("")}</select>`;
TABS.jd.page=p=>{const j=p.jdo,par=j.parent&&j.parent.id?S.projects.find(x=>x.id===j.parent.id):null;
 return `${par?`<div class="banner">${_t("Part of <b>{title}</b> ({tool}).",{title:esc(par.title),tool:esc(par.tool)})} <button class="btn link" id="jdParent">${_t("Open it")}</button></div>`:""}
 <h3>${_t("1. Is it really a Just do it?")}</h3>
 ${inp("jdo.problem",_t("Problem"),_t("What goes wrong, where, and how often or how much."),{rows:2})}
 ${inp("jdo.cause",_t("Known cause"),_t("Why it happens. If you have to guess, it is not a Just do it."),{rows:2})}
 <table class="grid jdq"><tbody>${JDI_Q.map(([k,l])=>`<tr><td>${l}</td><td style="width:110px">${yn("jdo.crit."+k,j.crit[k])}</td></tr>`).join("")}</tbody></table>
 <div class="flags" id="jdCritF"></div><div id="jdEsc"></div>
 <h3>${_t("2. The fix")}</h3>
 ${inp("jdo.what",_t("What changes"),_t("One specific change."),{rows:2})}
 <div class="grid3">${inp("jdo.owner",_t("Owner"),"",{rows:1})}${inp("jdo.due",_t("Due"),"",{type:"date"})}<div class="field"><div class="lab"><label for="jdDone">${_t("Done")}</label></div><select id="jdDone" data-bind="jdo.done" data-rerender="1">${["No","Yes"].map(v=>`<option value="${v}" ${j.done===v?"selected":""}>${esc(jdV(v))}</option>`).join("")}</select></div></div>
 <div class="flags" id="jdFixF"></div>
 <h3>${_t("3. Evidence")}</h3>
 <div class="grid3 jd-ev">${inp("jdo.measure",_t("What you measure"),_t("One number that shows the problem."),{rows:1})}${inp("jdo.before",_t("Before"),"",{rows:1})}${inp("jdo.after",_t("After"),"",{rows:1})}</div>
 ${inp("jdo.evidence",_t("How it was checked"),_t("When and how the after value was measured."),{rows:2})}
 <div class="flags" id="jdEvF"></div>
 <h3>${_t("4. Hold the gain")}</h3>
 ${inp("jdo.standard",_t("Built into the standard"),_t("Which procedure, template, checklist or system setting now contains the fix."),{rows:2})}
 ${inp("jdo.told",_t("Who was told"),_t("The people who work with it, and anyone who might undo it by accident."),{rows:2})}`};
AFTER["jd.page"]=p=>{
 const pb=$("#jdParent");if(pb)pb.onclick=()=>openProject(p.jdo.parent.id);
 S.refresh=()=>{const j=p.jdo,no=jdiNo(p),f=[];
  if(no.length){const qs=no.map(([,l])=>l).join(" ");f.push(`${_t("Not a Just do it. Answered no: {qs}",{qs:qs})}`);
   const which=JDI_TOOLS[j.crit.cause==="No"?0:1];
   $("#jdEsc").innerHTML=`<p class="small">${which===JDI_TOOLS[1]?_t("A fix that is uncertain or risky is better tested in small cycles with PDCA."):_t("When the cause is not known, find it first with A3 problem solving.")}</p><button class="btn alt" id="jdConv">${_t("Start a {which} project from this",{which:esc(which)})}</button>`;
   $("#jdConv").onclick=()=>jdiEscalate(p,which)}
  else{ $("#jdEsc").innerHTML="";if(JDI_Q.every(([k])=>j.crit[k]==="Yes"))f.push(_t("✓ Passes the entry check: cause and fix known, low risk, quick."))}
  setFlagsEl("#jdCritF",f.concat(checkProblem(j.problem,true).filter(x=>!x.startsWith("✓"))));
  const ff=[];if(j.what.trim()&&!j.owner.trim())ff.push(_t("No owner. A Just do it without an owner does not get done."));
  if(j.due){const days=(new Date(j.due)-new Date(p.created))/864e5;if(days>21)ff.push(_t("Due more than three weeks after the start. Is this still a Just do it?"));
   if(j.done!=="Yes"&&j.due<new Date().toISOString().slice(0,10))ff.push(_t("Past the due date. Finish it, or move it to PDCA or A3."))}
  setFlagsEl("#jdFixF",ff);
  const ef=[],b=num(j.before),a=num(j.after);
  if(j.done==="Yes"&&a==null)ef.push(_t("Marked done, but no after value. Done means the problem went away, not only that the task was finished."));
  if(b!=null&&a!=null&&b!==0)ef.push(`${_t("ℹ Change: {b} ({x}%).",{b:fmt(a-b),x:fmt((a-b)/Math.abs(b)*100,1)})}`);
  setFlagsEl("#jdEvF",ef)}};
var setFlagsEl=(sel,f)=>{const el=$(sel);if(el)el.innerHTML=flagsHTML(f)};
AUTO.jd=p=>{const j=p.jdo;return{crit:JDI_Q.every(([k])=>j.crit[k]==="Yes"),done:j.done==="Yes",evidence:!!j.measure.trim()&&num(j.before)!=null&&num(j.after)!=null,hold:!!j.standard.trim()&&!!j.told.trim()}};
Object.assign(INFO,{
 "jd.page":I(_t("Fix a small, obvious problem quickly, and prove it worked."),_t("The problem and its known cause, the four entry questions, the fix with an owner and a date, one measure before and after, and where the fix is now standard."),_t("That it really is a Just do it, that the evidence shows the problem went away, and that the fix will not quietly disappear.")),
 "gate.Just do it":I(_t("Confirm the fix is done, proven and built in."),_t("Tick what is true, then close."),_t("Honest ticks: a fix without an after value is a task, not an improvement."))
});

/* ----- PDF ----- */
COVER[JDI]=p=>{const j=p.jdo;return{people:[[_t("Owner"),j.owner]],summary:[[_t("Problem"),j.problem],[_t("Fix"),j.what],[_t("What you measure"),j.measure],[_t("Before / after"),j.before||j.after?`${j.before||"-"} / ${j.after||"-"}`:""],[_t("Part of"),j.parent.title?`${j.parent.title} (${j.parent.tool})`:""]]}};
PDFSEC.jd=async(H,p)=>{const j=p.jdo;
 H.h2(_t("1. Is it really a Just do it?"));H.kv([[_t("Problem"),j.problem],[_t("Known cause"),j.cause],...JDI_Q.map(([k,l])=>[l,j.crit[k]||"-"])]);
 H.h2(_t("2. The fix"));H.kv([[_t("What changes"),j.what],[_t("Owner"),j.owner],[_t("Due"),fmtDate(j.due)],[_t("Done"),j.done]]);
 H.h2(_t("3. Evidence"));H.kv([[_t("What you measure"),j.measure],[_t("Before"),j.before],[_t("After"),j.after],[_t("How it was checked"),j.evidence]]);
 H.h2(_t("4. Hold the gain"));H.kv([[_t("Built into the standard"),j.standard],[_t("Who was told"),j.told]])};

XLSXVIEW.jdo=p=>{const j=p.jdo;return Object.fromEntries([[_t("Problem"),j.problem],[_t("Known cause"),j.cause],...JDI_Q.map(([k,l])=>[l,j.crit[k]]),[_t("What changes"),j.what],[_t("Owner"),j.owner],[_t("Due"),j.due],[_t("Done"),j.done],
 [_t("What you measure"),j.measure],[_t("Before"),j.before],[_t("After"),j.after],[_t("How it was checked"),j.evidence],[_t("Built into the standard"),j.standard],[_t("Who was told"),j.told],[_t("Part of"),j.parent&&j.parent.title?`${j.parent.title} (${j.parent.tool})`:""]])};

/* ----- creating a Just do it, alone or from another project ----- */
async function newJDI(o){
 const p=ensureModel(newProject(o.title||_t("New Just do it"),JDI,""));
 Object.assign(p.jdo,{problem:o.problem||"",what:o.what||"",owner:o.owner||"",due:o.due||"",done:o.done||_t("No")});
 if(o.parent)p.jdo.parent={id:o.parent.id,title:o.parent.title,tool:o.parent.tool};
 if(o.link)p.hoshinLink=o.link;if(o.ideaId)p.ideaId=o.ideaId;if(o.closed)p.status="closed";
 S.projects.push(p);try{await store.save(p)}catch{toast(_t("Project created but not saved. Check your access."))}
 return p}
async function jdiEscalate(p,tool){
 const q=ensureModel(newProject(p.title,tool,""));
 if(tool==="PDCA"){q.pdframe.problem=p.jdo.problem;q.pdframe.owner=p.jdo.owner;q.pdframe.metric=p.jdo.measure;q.pdframe.baseline=p.jdo.before}
 else{q.a3plan.background=p.jdo.problem}
 q.hoshinLink=p.hoshinLink||"";p.status="onhold";
 S.projects.push(q);try{await store.save(q);await store.save(p)}catch{}
 toast(`${_t("Started a {tool} project. The Just do it is on hold.",{tool:tool})}`);openProject(q.id)}

/* Items in other methods that are really Just do its */
var JDI_SRC={
 "DMAIC":p=>p.improve.solutions.filter(r=>r.solution.trim()&&solCalc(r).hi).map(r=>({row:r,what:r.solution,lab:_t("Quick win")})),
 "Value stream mapping":p=>p.vsmplan.actions.filter(r=>r.action.trim()&&/just do/i.test(r.burst)).map(r=>({row:r,what:r.action,owner:r.owner,due:r.due,lab:_t("Action")})),
 "Kaizen event":p=>p.kzfollow.news.filter(r=>r.item.trim()&&r.status!=="Done").map(r=>({row:r,what:r.item,owner:r.owner,due:r.due,lab:_t("Open item")}))
};
var jdiLinked=p=>S.projects.filter(x=>x.tool===JDI&&x.jdo&&x.jdo.parent&&x.jdo.parent.id===p.id);
function jdiCandidates(p){const f=JDI_SRC[p.tool];if(!f)return[];return f(p).filter(c=>!c.row._jdi||!S.projects.some(x=>x.id===c.row._jdi))}
function jdiPanelHTML(p){
 if(p.tool===JDI)return "";
 const c=jdiCandidates(p),l=jdiLinked(p);
 return `<section class="jdi-panel" id="jdiPanel"><h3>${_t("Just do it")}</h3>
 ${c.length?`<p>${_t("<b>This project would benefit from Just do it.</b> {x}",{x:c.length===1?_t("One item here is a quick, low-risk fix with a known cause:"):_t("These items are quick, low-risk fixes with a known cause:")})}</p>
  <ul class="jdi-c">${c.map((x,i)=>`<li><span class="small muted">${esc(x.lab)}</span> ${esc(trunc(x.what,90))} <button class="btn alt small" data-jdc="${i}">${_t("Go to Just do it")}</button></li>`).join("")}</ul>
  ${c.length>1?`<button class="btn small" id="jdAll">${_t("Start all {cCount} as Just do it",{cCount:c.length})}</button>`:""}`:""}
 ${l.length?`<p class="small muted">${_t("Linked Just do its")}</p><ul class="jdi-l">${l.map(x=>`<li><button class="btn link" data-jdo="${esc(x.id)}">${esc(x.title)}</button> <span class="small">${esc(STATUSES[x.status])}${x.jdo.done==="Yes"?_t(", done"):""}${x.jdo.after?(_t(", after: {after}",{after:esc(x.jdo.after)})):""}</span></li>`).join("")}</ul>`:""}
 <details class="more"><summary>${_t("Send another quick fix to Just do it")}</summary>
  <div class="row" style="margin-top:8px"><input id="jdNew" placeholder="${_t("What is the quick fix?")}" aria-label="${_t("What is the quick fix?")}" style="flex:1"><button class="btn alt" id="jdNewGo">${_t("Go to Just do it")}</button></div></details>
 </section>`}
function bindJdiPanel(p){
 const el=$("#jdiPanel");if(!el)return;const c=jdiCandidates(p);
 const make=async(x,open)=>{const q=await newJDI({title:trunc(x.what,80),what:x.what,owner:x.owner,due:x.due,problem:"",parent:p,link:p.hoshinLink});if(x.row)x.row._jdi=q.id;scheduleSave(p);if(open)openProject(q.id);return q};
 el.querySelectorAll("[data-jdc]").forEach(b=>b.onclick=()=>make(c[+b.dataset.jdc],true));
 const all=$("#jdAll");if(all)all.onclick=async()=>{for(const x of c)await make(x,false);toast(`${_t("{cCount} Just do its started.",{cCount:c.length})}`);renderProject()};
 el.querySelectorAll("[data-jdo]").forEach(b=>b.onclick=()=>openProject(b.dataset.jdo));
 $("#jdNewGo").onclick=()=>{const v=$("#jdNew").value.trim();if(!v)return toast(_t("Describe the quick fix first."));make({what:v},true)};
}

/* ----- the old Just do it log becomes Just do it projects (once) ----- */
async function migrateJDILog(){
 const pf=PF();if(!pf.jdi.length)return 0;let n=0;
 for(const x of pf.jdi){const q=await newJDI({title:trunc(x.what||_t("Just do it"),80),what:x.what,owner:x.owner,due:x.due,done:x.done==="Yes"?_t("Yes"):_t("No"),link:x.link,ideaId:x.ideaId,closed:x.done==="Yes"});
  if(x.result)q.jdo.evidence=x.result;n++}
 pf.jdi=[];return n}
