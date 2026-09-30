/* ================= home & advisor ================= */
function render(){$("#navHome").setAttribute("aria-current",S.view==="home"?"page":"false");S.view==="home"?renderHome():renderProject()}
function renderHome(){
  $("#app").innerHTML=`
  <div class="home">
    <section class="panel chat" aria-label="Project advisor">
      <div class="panel-head"><h2>Where do I start?</h2><span class="muted small">Describe the project. The advisor suggests the Lean tool to start with; you confirm or argue.</span></div>
      <div class="log" id="log" aria-live="polite"></div>
      <div class="composer">
        <textarea id="inp" placeholder="What is going wrong, where, since when, and how do you know?" aria-label="Your message"></textarea>
        <div style="display:flex;flex-direction:column;gap:6px"><button class="btn" id="send">Send</button><button class="btn alt small" id="reset">New</button></div>
      </div>
    </section>
    <section class="panel" aria-label="Project library">
      <div class="panel-head"><h2>Project library</h2><span class="muted small" id="count"></span></div>
      <div class="panel-body">
        <input class="search" id="q" type="search" placeholder="Search projects" value="${esc(S.q)}" aria-label="Search projects">
        <div class="filters" role="group" aria-label="Filter by status">${[["all","All"],["ongoing","Ongoing"],["onhold","On hold"],["closed","Closed"]].map(([k,l])=>`<button class="chip" data-f="${k}" aria-pressed="${S.filter===k}">${l}</button>`).join("")}</div>
        <ul class="plist" id="plist"></ul>
        <div class="direct"><label for="directTool" class="small muted">Already know the method? Start directly:</label>
          <div style="display:flex;gap:8px;margin-top:4px"><select id="directTool">${BUILT().map(t=>`<option>${t}</option>`).join("")}</select><button class="btn alt" id="skip">Start</button></div></div>
      </div>
    </section>
  </div>`;
  renderChat();renderList();
  $("#send").onclick=send;
  $("#inp").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}};
  $("#reset").onclick=()=>{S.chat=[];S.reco=null;S.title=null;renderChat()};
  $("#q").oninput=e=>{S.q=e.target.value;renderList()};
  document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{S.filter=b.dataset.f;document.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.f===S.filter));renderList()});
  $("#skip").onclick=()=>createProject($("#directTool").value,null);
}
function projMeta(p){if(!DEF[p.tool])return p.tool+" (workspace not built yet)";const s=ST[p.phase];return `${p.tool}, ${p.status==="closed"?"closed in "+s.name:s.name}`}
function renderList(){
  const q=S.q.toLowerCase();
  const items=S.projects.filter(p=>(S.filter==="all"||p.status===S.filter)&&(!q||(p.title+" "+p.tool).toLowerCase().includes(q))).sort((a,b)=>b.updated.localeCompare(a.updated));
  $("#count").textContent=`${S.projects.length} project${S.projects.length===1?"":"s"}`;
  $("#plist").innerHTML=items.length?items.map(p=>`<li><button data-id="${p.id}"><span class="ptitle">${esc(p.title)}</span><span class="status ${p.status}">${STATUSES[p.status]}</span>
      <span class="pmeta">${esc(projMeta(p))}, updated ${fmtDate(p.updated)}</span></button></li>`).join("")
    :`<li class="empty">${S.projects.length?"No project matches this filter.":"No projects yet. Describe one to the advisor, or start one directly below."}</li>`;
  document.querySelectorAll("#plist button").forEach(b=>b.onclick=()=>openProject(b.dataset.id));
}
function renderChat(){
  const log=$("#log");if(!log)return;let html="";
  if(!S.chat.length)html+=`<div class="msg bot">${sample?"Tell me about the problem you want to fix. Useful to include: which process, what goes wrong, how often or how much, since when, and who feels it.\n\nIf you already have a solution in mind, say so. I will probably challenge it.":"No AI provider is connected. Open Settings to connect one, or start a project directly from the library."}</div>`;
  S.chat.forEach(m=>html+=`<div class="msg ${m.role==="user"?"user":"bot"}">${esc(m.role==="user"?m.content:m.reply)}</div>`);
  if(S.busy)html+=`<div class="msg bot thinking">Thinking…</div>`;
  if(S.reco&&!S.busy){const r=S.reco,built=!!DEF[r.tool];
    html+=`<div class="reco" role="region" aria-label="Recommendation"><div class="small muted">Start with</div>
      <div><span class="tool">${esc(r.tool)}</span><span class="conf">${esc(r.confidence)} confidence</span></div>
      <p style="margin:8px 0 4px">${esc(r.rationale)}</p>${r.alternative?`<p class="small muted" style="margin:0">Alternative: ${esc(r.alternative)}</p>`:""}
      ${built?"":`<p class="small" style="margin:8px 0 0">This tool is not built yet. You can still save the project in the library.</p>`}
      <div class="actions"><button class="btn hot" id="confirm">Confirm and create project</button><button class="btn alt" id="challenge">I disagree, keep talking</button></div></div>`}
  log.innerHTML=html;log.scrollTop=log.scrollHeight;
  const c=$("#confirm");if(c)c.onclick=()=>createProject(S.reco.tool,S.title);
  const ch=$("#challenge");if(ch)ch.onclick=()=>{$("#inp").value="I'm not convinced, because ";$("#inp").focus()};
  const sb=$("#send");if(sb)sb.disabled=S.busy||!sample;
}
const ADVISOR=`You are a Lean Six Sigma Master Black Belt with 30 years of practice, acting as a triage advisor inside a project tool. The user describes an improvement project. Decide which approach they should START with, from exactly this list: ${TOOLS.join(", ")}.

Decision heuristics:
- Just do it: cause and solution already known, low risk, low cost, reversible.
- PDCA: small, local, iterative improvement with one owner.
- 5S: workplace organisation, searching, clutter, visual control.
- Kaizen event: narrow scope, the team can find and apply a fix in 3 to 5 days.
- A3 problem solving: moderate problem, one owner, root cause unknown but a data-heavy study is not needed.
- Value stream mapping: flow or lead-time problem crossing several teams where the real problem is not yet located. Often precedes DMAIC or Kaizen.
- DMAIC: existing process, recurring problem, root cause unknown, output measurable with data, variation matters, weeks to months.
- DMADV: no process exists yet, or the process must be designed or fully redesigned.

Before recommending you normally need: does a process exist, is the problem measurable and is data available, is the root cause known, is the solution known, scope and number of teams involved, urgency. Ask at most two sharp questions per turn. Recommend as soon as you have enough; do not interrogate.
Challenge weak thinking directly: a solution disguised as a problem, blame on people, vague scope, "we need a new system". No flattery. Be concise, practical, plain text, no markdown.
If the user disagrees, weigh their argument honestly: change the recommendation if they are right, hold it and explain if they are not.
Reply in British English, or in Italian if the user writes in Italian.

Respond with ONLY a JSON object, no preamble:
{"reply": "your message, max 120 words", "recommendation": null or {"tool": "one of the list", "confidence": "low|medium|high", "rationale": "max 60 words", "alternative": "max 30 words or empty"}, "project_title": "short title (max 8 words) once the project is clear, else null"}`;
async function send(){
  const inp=$("#inp"),text=inp.value.trim();if(!text||S.busy||!sample)return;
  inp.value="";S.chat.push({role:"user",content:text});S.busy=true;S.reco=null;renderChat();
  const turns=S.chat.map((m,i)=>m.role==="user"?{role:"user",content:i===0?ADVISOR+"\n\nUser's first message:\n"+m.content:m.content}:{role:"assistant",content:JSON.stringify({reply:m.reply,recommendation:m.reco||null,project_title:m.title||null})});
  try{const out=await sample.json(turns);
    const reply=String(out.reply||"").trim()||"I did not get that. Could you rephrase?";
    const reco=out.recommendation&&TOOLS.includes(out.recommendation.tool)?out.recommendation:null;
    S.chat.push({role:"assistant",reply,reco,title:out.project_title||null});S.reco=reco;if(out.project_title)S.title=out.project_title;
  }catch(e){S.chat.pop();inp.value=text;toast("The advisor could not answer: "+(e&&e.message?e.message:"unknown error"))}
  finally{S.busy=false;renderChat()}
}
async function createProject(tool,title){
  const notes=S.chat.map(m=>m.role==="user"?"You: "+m.content:"Advisor: "+m.reply).join("\n\n");
  const p=newProject(title||"New "+tool+" project",tool,notes);
  S.projects.push(p);try{await store.save(p)}catch{toast("Project created but not saved. Check your access.")}
  S.chat=[];S.reco=null;S.title=null;openProject(p.id);
}
function openProject(id){const p=S.projects.find(x=>x.id===id);ensureModel(p);S.current=p;S.view="project";if(DEF[p.tool]){S.stage=p.phase;S.tab=ST[p.phase].tabs[0][0]}render();window.scrollTo(0,0)}

/* ================= project view ================= */
function renderProject(){
  const p=S.current;if(!p){S.view="home";return render()}
  const d=DEF[p.tool];
  $("#app").innerHTML=`
  <div class="proj-head">
    <input class="title-input" id="ptitle" value="${esc(p.title)}" aria-label="Project title">
    <select id="pstatus" aria-label="Project status">${Object.entries(STATUSES).map(([k,l])=>`<option value="${k}" ${p.status===k?"selected":""}>${l}</option>`).join("")}</select>
    ${d?`<button class="btn" id="pdf">Download PDF</button><button class="btn alt" id="mail">Email</button>`:""}
    <button class="btn alt" id="del">Delete</button>
    <div style="flex-basis:100%" class="small muted">${esc(p.tool)}, created ${fmtDate(p.created)}. <span id="saveState" class="save-state">Saved</span></div>
  </div>
  ${d?`<div class="rail" style="grid-template-columns:repeat(${d.order.length},1fr)" role="tablist" aria-label="${esc(p.tool)} stages">
    ${d.order.map((k,i)=>{const ci=d.order.indexOf(p.phase),st=stageStatus(p,k),done=st==="Passed"||st==="Completed";
      return `<button class="stage ${done?"done":""} ${i===ci?"current":""}" data-stage="${k}" aria-current="${S.stage===k}">
      <div class="letter">${ST[k].letter}</div><div class="name">${ST[k].name}</div><div class="note">${st}</div>
      <div class="meter" aria-label="${d.gate} ${progress(p,k)}% complete"><span data-meter="${k}" style="width:${progress(p,k)}%"></span></div></button>`}).join("")}
  </div>
  <div class="work">
    <div>
      <div class="tabs" role="tablist">${ST[S.stage].tabs.map(([k,l])=>`<button class="tab" role="tab" data-t="${k}" aria-selected="${S.tab===k}">${l}</button>`).join("")}</div>
      <div class="sheet" id="sheet" role="tabpanel"></div>
    </div>
    <aside class="coach" aria-label="Black belt review"><div class="panel-head"><h3>Black belt review: ${ST[S.stage].name}</h3></div><div class="panel-body" id="coach"></div></aside>
  </div>`:`<div class="panel later"><h2>${esc(p.tool)} workspace is not built yet</h2><p class="muted">The project is saved in your library. Available methods: ${BUILT().join(", ")}.</p>
    ${p.advisorNotes?`<h3 style="margin-top:20px">Advisor conversation</h3><p style="white-space:pre-wrap">${esc(p.advisorNotes)}</p>`:""}</div>`}`;
  $("#ptitle").oninput=e=>{p.title=e.target.value||"Untitled project";scheduleSave(p)};
  $("#pstatus").onchange=e=>{p.status=e.target.value;scheduleSave(p)};
  $("#del").onclick=async()=>{if(!confirm(`Delete "${p.title}"? This cannot be undone.`))return;try{await store.remove(p.id)}catch{}S.projects=S.projects.filter(x=>x.id!==p.id);S.view="home";S.current=null;render();toast("Project deleted")};
  if(!d)return;
  $("#pdf").onclick=()=>exportPDF(p);$("#mail").onclick=()=>openEmail(p);
  document.querySelectorAll(".stage").forEach(b=>b.onclick=()=>{S.stage=b.dataset.stage;S.tab=ST[S.stage].tabs[0][0];renderProject()});
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.t===S.tab));renderSheet()});
  renderSheet();renderCoach();
}
function refreshMeters(){const p=S.current;DEF[p.tool].order.forEach(k=>{const m=document.querySelector(`[data-meter="${k}"]`);if(m)m.style.width=progress(p,k)+"%"})}

/* ---------- info panels ---------- */
function infoBlock(key){
  const i=INFO[key];if(!i)return "";const open=!!S.info[key];
  return `<div class="about"><button class="ibtn" data-info="${key}" aria-expanded="${open}"><span class="i" aria-hidden="true">i</span>About this step</button>
    <div class="about-body" ${open?"":"hidden"}><p><b>Purpose.</b> ${esc(i.p)}</p><p><b>What you need to fill in.</b> ${esc(i.r)}</p><p><b>What the review looks for.</b> ${esc(i.c)}</p></div></div>`;
}
function fieldInfo(path){const f=FIELDI[path];if(!f)return "";return `<button class="fi" type="button" data-fi="${path}" aria-expanded="false" aria-label="More about this field">i</button>`}
function fieldInfoBody(path){const f=FIELDI[path];if(!f)return "";return `<div class="fi-body" id="fi_${path.replace(/\./g,"_")}" hidden><p>${esc(f.w)}</p>${f.g?`<p><b>Good:</b> ${esc(f.g)}</p>`:""}${f.b?`<p><b>Weak:</b> ${esc(f.b)}</p>`:""}</div>`}

/* ---------- generic inputs ---------- */
function inp(path,label,hint,o={}){
  const v=getPath(S.current,path)??"",id="f_"+path.replace(/\./g,"_");let ctl;
  const rr=o.rerender?' data-rerender="1"':"";
  if(o.options)ctl=`<select id="${id}" data-bind="${path}"${rr}>${o.options.map(x=>`<option ${x===v?"selected":""}>${esc(x)}</option>`).join("")}</select>`;
  else if(o.type)ctl=`<input id="${id}" type="${o.type}" data-bind="${path}" value="${esc(v)}" ${o.ph?`placeholder="${esc(o.ph)}"`:""}>`;
  else if(o.rows===1)ctl=`<input id="${id}" data-bind="${path}" value="${esc(v)}" ${o.ph?`placeholder="${esc(o.ph)}"`:""}>`;
  else ctl=`<textarea id="${id}" data-bind="${path}" rows="${o.rows||3}" ${o.ph?`placeholder="${esc(o.ph)}"`:""}>${esc(v)}</textarea>`;
  return `<div class="field"><div class="lab"><label for="${id}">${label}</label>${fieldInfo(path)}</div>${fieldInfoBody(path)}${hint?`<div class="hint">${hint}</div>`:""}${ctl}<div class="flags" id="flags_${id}"></div></div>`;
}
function table(path,cols,calc){
  const rs=getPath(S.current,path);
  return `<div class="wide"><table class="grid"><thead><tr>${cols.map(c=>`<th ${c.w?`style="width:${c.w}"`:""}>${c.label}</th>`).join("")}${calc?`<th>${calc.label}</th>`:""}<th style="width:40px"></th></tr></thead><tbody>
  ${rs.map((r,i)=>`<tr>${cols.map(c=>{const b=`${path}.${i}.${c.k}`,v=r[c.k]??"";
    if(c.opts)return `<td><select data-bind="${b}" aria-label="${esc(c.label)}">${c.opts.map(o=>`<option ${o===v?"selected":""}>${esc(o)}</option>`).join("")}</select></td>`;
    if(c.type)return `<td><input type="${c.type}" ${c.min!=null?`min="${c.min}" max="${c.max}"`:""} data-bind="${b}" value="${esc(v)}" aria-label="${esc(c.label)}"></td>`;
    return `<td><textarea data-bind="${b}" aria-label="${esc(c.label)}">${esc(v)}</textarea></td>`}).join("")}
    ${calc?`<td class="calc" id="calc_${path.replace(/\./g,"_")}_${i}"></td>`:""}
    <td><button class="x" data-del="${path}" data-i="${i}" aria-label="Remove row">×</button></td></tr>`).join("")}
  </tbody></table></div><button class="btn alt addrow" data-add="${path}">Add row</button>`;
}
function fillCalc(path,calc){getPath(S.current,path).forEach((r,i)=>{const el=document.getElementById(`calc_${path.replace(/\./g,"_")}_${i}`);if(el){const o=calc(r,i);el.textContent=o.t;el.classList.toggle("hi",!!o.hi)}})}
function flagsHTML(list){return list.map(f=>`<div class="flag ${f.startsWith("✓")?"good":f.startsWith("ℹ")?"info":""}">${esc(f.replace(/^ℹ /,""))}</div>`).join("")}
function setFlags(path,list){const el=document.getElementById("flags_f_"+path.replace(/\./g,"_"));if(el)el.innerHTML=flagsHTML(list)}
function statsHTML(pairs){return `<div class="stats">${pairs.map(([l,v])=>`<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("")}</div>`}
function bind(el){
  const p=S.current;let t;
  el.querySelectorAll("[data-bind]").forEach(i=>{const h=e=>{setPath(p,e.target.dataset.bind,e.target.value);scheduleSave(p);refreshMeters();if(e.target.dataset.rerender){renderSheet();return}clearTimeout(t);t=setTimeout(()=>S.refresh&&S.refresh(),200)};i.addEventListener("input",h);if(i.tagName==="SELECT")i.addEventListener("change",h)});
  el.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{getPath(p,b.dataset.add).push({...BLANK[b.dataset.add]});scheduleSave(p);renderSheet()});
  el.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const a=getPath(p,b.dataset.del);a.splice(+b.dataset.i,1);if(!a.length)a.push({...BLANK[b.dataset.del]});scheduleSave(p);renderSheet()});
  el.querySelectorAll("[data-info]").forEach(b=>b.onclick=()=>{const k=b.dataset.info;S.info[k]=!S.info[k];b.setAttribute("aria-expanded",S.info[k]);b.nextElementSibling.hidden=!S.info[k]});
  el.querySelectorAll("[data-fi]").forEach(b=>b.onclick=()=>{const body=document.getElementById("fi_"+b.dataset.fi.replace(/\./g,"_"));const o=body.hidden;body.hidden=!o;b.setAttribute("aria-expanded",o)});
  S.refresh&&S.refresh();
}
function renderSheet(){
  const p=S.current,el=$("#sheet"),id=S.stage,o=DEF[p.tool].order,prev=o[o.indexOf(id)-1];
  S.refresh=null;let h="";
  if(prev&&o.indexOf(id)>o.indexOf(p.phase)&&S.tab!=="tollgate")h+=`<div class="banner">You are working ahead of the ${ST[prev].name} ${DEF[p.tool].gate.toLowerCase()}. Allowed, but everything here rests on an unapproved ${ST[prev].name} stage.</div>`;
  h+=infoBlock(S.tab==="tollgate"?"gate."+p.tool:id+"."+S.tab);
  if(S.tab==="tollgate"){el.innerHTML=h+tollgateHTML(id);bindTollgate(el,id);bind(el);return}
  h+=(TABS[id][S.tab]||(()=>""))(p);
  el.innerHTML=h;
  const after=AFTER[id+"."+S.tab];if(after)after(p);
  bind(el);
}

/* ---------- reusable analysis blocks ---------- */
function fishHTML(path){return `<div class="fish">${BONES.map(([k,l])=>inp(path+"."+k,l,"",{rows:4})).join("")}</div><div class="chartbox" id="fishOut"></div>`}
function fishAfter(path,effectFn){return p=>{S.refresh=()=>{$("#fishOut").innerHTML=fishboneChart(getPath(p,path),effectFn(p))}}}
function whysHTML(path){const w=getPath(S.current,path);return w.map((c,i)=>`<div class="why"><div class="row"><span>Symptom</span><input data-bind="${path}.${i}.problem" value="${esc(c.problem)}" aria-label="Symptom"></div>
    ${[1,2,3,4,5].map(n=>`<div class="row"><span>Why ${n}</span><input data-bind="${path}.${i}.w${n}" value="${esc(c["w"+n])}" aria-label="Why ${n}"></div>`).join("")}
    <div class="row"><span>Root cause</span><input data-bind="${path}.${i}.root" value="${esc(c.root)}" aria-label="Root cause"></div>
    <button class="x" data-del="${path}" data-i="${i}">Remove chain</button></div>`).join("")+`<button class="btn alt" data-add="${path}">Add chain</button>`}
const WHYBLANK={problem:"",w1:"",w2:"",w3:"",w4:"",w5:"",root:""};
const FISHBLANK=()=>({people:"",machine:"",method:"",material:"",measurement:"",environment:""});
const fishCount=fb=>BONES.reduce((n,[k])=>n+lines(fb[k]).length,0);
const whyOK=ws=>ws.some(w=>w.root.trim()&&[w.w1,w.w2,w.w3].every(v=>v.trim()));

/* ---------- tollgate ---------- */
function tollgateHTML(id){
  const p=S.current,a=autoTG(p,id),t=tgOf(p,id),s=ST[id],last=!s.next,gate=DEF[p.tool].gate;
  return `<p class="lead">Tick only what the sponsor or mentor would agree is done. The tags show what the tool can see from your entries; they don't replace your judgement.</p>
  <ul class="checks">${s.tg.map(([k,l])=>`<li><input type="checkbox" id="tg_${k}" data-c="${k}" ${t.checks[k]?"checked":""}><label for="tg_${k}">${l}${a[k]===true?'<span class="auto yes">looks done</span>':a[k]===false?'<span class="auto no">missing</span>':""}</label></li>`).join("")}</ul>
  <h3 style="margin-top:20px">${gate} decision</h3>
  <div class="decision" role="group" aria-label="${gate} decision">${[["go",last?"Close the project":"Go to "+ST[s.next].name],["rework","Rework "+s.name],["stop","Stop the project"]].map(([k,l])=>`<button class="btn alt" data-d="${k}" aria-pressed="${t.decision===k}">${l}</button>`).join("")}</div>
  <div class="field"><label for="tgNotes">Decision notes</label><textarea id="tgNotes">${esc(t.notes)}</textarea></div>`;
}
function bindTollgate(el,id){
  const p=S.current,t=tgOf(p,id),o=DEF[p.tool].order,s=ST[id];
  el.querySelectorAll("[data-c]").forEach(c=>c.onchange=e=>{t.checks[e.target.dataset.c]=e.target.checked;scheduleSave(p);refreshMeters()});
  el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{const d=b.dataset.d,i=o.indexOf(id);
    if(d==="go"&&progress(p,id)<100&&!confirm("Not every item is ticked. Record 'Go' anyway?"))return;
    t.decision=d;
    if(d==="go"){if(!s.next)p.status="closed";else if(o.indexOf(p.phase)<=i)p.phase=s.next}
    if(d==="rework"&&o.indexOf(p.phase)>i)p.phase=id;
    if(d==="stop")p.status="closed";
    scheduleSave(p);
    if(d==="go"&&s.next){S.stage=s.next;S.tab=ST[s.next].tabs[0][0];toast(`${s.name} passed. Now in ${ST[s.next].name}.`)}
    if(d==="go"&&!s.next)toast("Project closed.");
    renderProject()});
  $("#tgNotes").oninput=e=>{t.notes=e.target.value;scheduleSave(p)};
}

/* ---------- black belt review ---------- */
function stageData(p,id){
  const ctx=CONTEXT[p.tool]?CONTEXT[p.tool](p):{};
  const d={title:p.title,method:p.tool,context:ctx,stage:ST[id].name,data:p[ST[id].key]};
  if(EXTRA[id])d.computed=EXTRA[id](p);
  return d;
}
const CONTEXT={};
function renderCoach(){
  const el=$("#coach");if(!el)return;const id=S.stage,c=S.coach[S.current.id+id];
  if(!sample){el.innerHTML=`<p class="muted small">No AI provider is connected. Open Settings to connect one. The instant checks in each tab still work.</p>`;return}
  el.innerHTML=`<p class="small muted" style="margin-top:0">A strict review of your ${ST[id].name} work before the ${DEF[S.current.tool].gate.toLowerCase()}. It will not be polite about weak points.</p>
    <button class="btn hot" id="review" ${S.coachBusy?"disabled":""}>${S.coachBusy?"Reviewing…":"Review "+ST[id].name}</button>
    ${c?`<div style="margin-top:16px"><div class="verdict">${c.verdict==="ready"?"Ready to pass":"Rework before passing"}</div>${c.summary?`<p class="small">${esc(c.summary)}</p>`:""}
    ${c.issues.map(i=>`<div class="issue ${esc(i.severity)}"><b>${esc(i.field)}</b>${esc(i.issue)}<div class="small muted">${esc(i.suggestion)}</div></div>`).join("")}</div>`:""}`;
  $("#review").onclick=review;
}
async function review(){
  const p=S.current,id=S.stage;S.coachBusy=true;renderCoach();
  const prompt=`You are a Lean Six Sigma Master Black Belt with 30 years of experience reviewing the "${ST[id].name}" stage of a ${p.tool} project before its ${DEF[p.tool].gate.toLowerCase()}. Be strict, specific and constructive. No flattery. Point at concrete content. Check: ${ST[id].focus} Empty sections are issues. Use British English, or Italian if the content is in Italian.

Project data (JSON):
${JSON.stringify(stageData(p,id))}

Respond with ONLY JSON:
{"verdict":"ready" or "rework","summary":"max 40 words","issues":[{"field":"which part","severity":"high|medium|low","issue":"max 30 words","suggestion":"max 30 words"}]}
At most 8 issues, most severe first.`;
  try{const r=await sample.json(prompt);S.coach[p.id+id]={verdict:r.verdict==="ready"?"ready":"rework",summary:r.summary||"",issues:Array.isArray(r.issues)?r.issues.slice(0,8):[]}}
  catch(e){toast("The review failed: "+(e&&e.message?e.message:"unknown error"))}
  finally{S.coachBusy=false;if(S.stage===id)renderCoach()}
}
