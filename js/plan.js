/* ================= Plan: work packages, stories, sub-tasks, milestones, dependencies, Gantt =================
   A planning draft for export to Excel or Jira. Once exported, the tasks live there. */
const PTYPES={wp:"Work package",story:"Story",sub:"Sub-task",ms:"Milestone"};
const DAY=864e5;
const pd=s=>{if(!s)return null;const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(s);return m?Date.UTC(+m[1],+m[2]-1,+m[3]):null};
const ds=t=>new Date(t).toISOString().slice(0,10);
const fmtD=t=>t==null?"":new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"});
function planTree(p){
  const it=p.plan.items,out=[];let top=0;
  it.filter(x=>!x.parent).forEach(w=>{top++;out.push({...w,code:String(top),depth:0});
    let s=0;it.filter(x=>x.parent===w.id).forEach(st=>{s++;out.push({...st,code:`${top}.${s}`,depth:1});
      let k=0;it.filter(x=>x.parent===st.id).forEach(sb=>{k++;out.push({...sb,code:`${top}.${s}.${k}`,depth:2})})})});
  return out;
}
function planDates(p){
  const tree=planTree(p),byId={};tree.forEach(t=>byId[t.id]=t);
  const eff=id=>{const t=byId[id];if(!t)return{s:null,e:null};if(t._eff)return t._eff;
    let s=pd(t.type==="ms"?t.end:t.start),e=pd(t.end);
    if(t.type==="ms"&&e!=null)s=e;
    const kids=tree.filter(x=>x.parent===id).map(x=>eff(x.id)).filter(d=>d.s!=null&&d.e!=null);
    if(kids.length&&(s==null||e==null)){s=s??Math.min(...kids.map(k=>k.s));e=e??Math.max(...kids.map(k=>k.e));t.derived=true}
    t._eff={s,e};return t._eff};
  tree.forEach(t=>eff(t.id));return{tree,byId};
}
function planIssues(p){
  const {tree,byId}=planDates(p),issues=[],conflicts=new Set();
  tree.forEach(t=>{const{s,e}=t._eff;if(s!=null&&e!=null&&e<s)issues.push(`${t.code} ends before it starts.`);
    (t.deps||[]).forEach(d=>{const pr=byId[d];if(!pr)return;const pe=pr._eff.e;if(pe!=null&&s!=null&&s<=pe&&!(t.type==="ms"&&s>=pe)){conflicts.add(t.id);issues.push(`${t.code} starts before ${pr.code} has finished.`)}})});
  // cycles
  const seen={},stack={};let cyc=false;
  const dfs=id=>{if(stack[id]){cyc=true;return}if(seen[id])return;seen[id]=stack[id]=1;(byId[id]?.deps||[]).forEach(dfs);stack[id]=0};
  tree.forEach(t=>dfs(t.id));if(cyc)issues.unshift("The dependencies form a loop (A waits for B, B waits for A). Remove one.");
  return{issues,conflicts,cyc};
}
function fixDates(p){
  const {tree,byId}=planDates(p),{cyc}=planIssues(p);if(cyc)return{moved:0,error:"Remove the dependency loop first."};
  const raw={};p.plan.items.forEach(x=>raw[x.id]=x);
  const order=[],seen={};const visit=id=>{if(seen[id])return;seen[id]=1;(byId[id]?.deps||[]).forEach(visit);order.push(id)};tree.forEach(t=>visit(t.id));
  let moved=0,skipped=[];
  order.forEach(id=>{const t=byId[id],r=raw[id];if(!t||!(t.deps||[]).length)return;
    const req=Math.max(...t.deps.map(d=>byId[d]?._eff.e).filter(v=>v!=null))+DAY;if(!Number.isFinite(req))return;
    const s=t._eff.s;if(s==null||s>=req)return;
    if(t.derived){skipped.push(t.code);return}
    const delta=req-s;
    if(r.type==="ms"){r.end=ds(pd(r.end)+delta)}else{r.start=ds(pd(r.start)+delta);if(r.end)r.end=ds(pd(r.end)+delta)}
    t._eff={s:t._eff.s+delta,e:t._eff.e!=null?t._eff.e+delta:null};moved++;
    // children of a moved parent move with it
    tree.filter(x=>x.parent===id||tree.find(y=>y.id===x.parent&&y.parent===id)).forEach(k=>{const rk=raw[k.id];if(rk.start)rk.start=ds(pd(rk.start)+delta);if(rk.end)rk.end=ds(pd(rk.end)+delta)});
  });
  return{moved,skipped};
}
function parseDeps(p,text,selfId){
  const {tree}=planDates(p),codes={};tree.forEach(t=>codes[t.code]=t.id);
  const out=[],bad=[];String(text||"").split(/[,;\s]+/).filter(Boolean).forEach(c=>{const id=codes[c];if(!id||id===selfId)bad.push(c);else if(!out.includes(id))out.push(id)});
  return{ids:out,bad};
}
function ganttSVG(p,opts={}){
  const {tree}=planDates(p),{conflicts}=planIssues(p),rows=tree.filter(t=>t._eff.s!=null&&t._eff.e!=null);
  if(!rows.length)return "";
  let s0=Math.min(...rows.map(r=>r._eff.s)),s1=Math.max(...rows.map(r=>r._eff.e));
  s0-=((new Date(s0).getUTCDay()+6)%7)*DAY;s1+=DAY*3;const days=Math.round((s1-s0)/DAY)+1;
  const LW=opts.labelW||280,dw=Math.max(3,Math.min(26,(opts.width||900-LW)/days)),RH=24,T=44,W=LW+days*dw+20,H=T+tree.length*RH+16;
  const X=t=>LW+(t-s0)/DAY*dw,rowY={};tree.forEach((t,i)=>rowY[t.id]=T+i*RH);
  let g=svgOpen(Math.round(W),H)+`<defs><marker id="ga" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="${C.grey}"/></marker></defs>`;
  // month and week header
  let lastM=-1;for(let d=0;d<days;d++){const t=s0+d*DAY,dt=new Date(t),x=X(t);
    if(dt.getUTCDay()===1){g+=`<line x1="${x}" x2="${x}" y1="${T-14}" y2="${H-10}" stroke="${C.line}"/>`;if(dw*7>=34)g+=`<text x="${x+2}" y="${T-4}" font-size="9" fill="${C.grey}">${dt.getUTCDate()}</text>`}
    if(dt.getUTCMonth()!==lastM){lastM=dt.getUTCMonth();g+=`<text x="${x+2}" y="${T-22}" font-size="10" font-weight="700" fill="${C.text}">${dt.toLocaleDateString("en-GB",{month:"short",year:"numeric",timeZone:"UTC"})}</text>`}}
  const today=Date.UTC(new Date().getFullYear(),new Date().getMonth(),new Date().getDate());
  if(today>=s0&&today<=s1)g+=`<line x1="${X(today)}" x2="${X(today)}" y1="${T-14}" y2="${H-10}" stroke="${C.orange}" stroke-dasharray="4 3"/><text x="${X(today)+3}" y="${H-2}" font-size="9" fill="${C.orange}">today</text>`;
  tree.forEach((t,i)=>{const y=rowY[t.id];if(i%2===0)g+=`<rect x="0" y="${y}" width="${W}" height="${RH}" fill="#F7F9FB"/>`;
    g+=`<text x="${6+t.depth*14}" y="${y+16}" font-size="10" ${t.depth===0?'font-weight="700"':""} fill="${C.text}">${esc(t.code+"  "+trunc(t.title||PTYPES[t.type],38-t.depth*3))}</text>`;
    const {s,e}=t._eff;if(s==null||e==null)return;
    if(t.type==="ms"){const x=X(e)+dw/2,c=y+RH/2;g+=`<polygon points="${x},${c-7} ${x+7},${c} ${x},${c+7} ${x-7},${c}" fill="${C.orange}"/>`;return}
    const x=X(s),w=Math.max(dw,(e-s)/DAY*dw+dw),h=t.type==="wp"?14:t.type==="story"?11:8,col=t.type==="wp"?C.blue:t.type==="story"?C.light:C.grey;
    g+=`<rect x="${x}" y="${y+(RH-h)/2}" width="${w}" height="${h}" fill="${col}" ${t.derived?'fill-opacity=".55"':""} ${conflicts.has(t.id)?`stroke="${C.orange}" stroke-width="2.5"`:""}/>`;
  });
  tree.forEach(t=>(t.deps||[]).forEach(d=>{const pr=tree.find(x=>x.id===d);if(!pr||pr._eff.e==null||t._eff.s==null)return;
    const x1=pr.type==="ms"?X(pr._eff.e)+dw/2+7:X(pr._eff.e)+dw,y1=rowY[pr.id]+RH/2,x2=t.type==="ms"?X(t._eff.e)+dw/2-7:X(t._eff.s),y2=rowY[t.id]+RH/2,mx=Math.max(x1+6,Math.min(x2-6,x1+12));
    g+=`<path d="M${x1},${y1} H${mx} V${y2} H${x2}" fill="none" stroke="${conflicts.has(t.id)?C.orange:C.grey}" stroke-width="1.2" marker-end="url(#ga)"/>`}));
  g+=`<line x1="${LW-4}" x2="${LW-4}" y1="${T-30}" y2="${H-10}" stroke="${C.line}"/>`;
  return g+`</svg>`;
}

/* ----- Plan view ----- */
function renderPlanView(el){
  const p=S.current,{tree}=planDates(p),{issues,conflicts}=planIssues(p);
  const row=t=>{const r=p.plan.items.find(x=>x.id===t.id),ms=t.type==="ms";
    return `<tr class="pl d${t.depth} ${conflicts.has(t.id)?"conf":""}"><td class="pcode">${t.code}</td>
     <td><div class="pt" style="padding-left:${t.depth*16}px"><span class="badge ${esc(t.type)}">${PTYPES[t.type]}</span><input data-pi="${esc(t.id)}" data-k="title" value="${esc(r.title)}" placeholder="${ms?"Milestone name":"Title"}" aria-label="Title"></div></td>
     <td><textarea data-pi="${esc(t.id)}" data-k="desc" aria-label="Description" rows="1">${esc(r.desc||"")}</textarea></td>
     <td><input data-pi="${esc(t.id)}" data-k="owner" value="${esc(r.owner||"")}" placeholder="Name" aria-label="Responsible"></td>
     <td>${ms?"":`<input type="date" data-pi="${esc(t.id)}" data-k="start" value="${esc(r.start||"")}" aria-label="Start" ${t.derived&&!r.start?`title="Taken from its items"`:""}>`}</td>
     <td><input type="date" data-pi="${esc(t.id)}" data-k="end" value="${esc(r.end||"")}" aria-label="${ms?"Date":"End"}"></td>
     <td class="calc">${!ms&&t._eff.s!=null&&t._eff.e!=null?Math.round((t._eff.e-t._eff.s)/DAY)+1:""}${t.derived&&!ms?"*":""}</td>
     <td><input data-pi="${esc(t.id)}" data-k="deps" value="${esc((r.deps||[]).map(d=>tree.find(x=>x.id===d)?.code).filter(Boolean).join(", "))}" placeholder="e.g. 1.2" aria-label="Depends on"></td>
     <td class="acts">${t.type==="wp"?`<button class="x" data-addc="${esc(t.id)}" data-ct="story" title="Add a story">+ story</button>`:t.type==="story"?`<button class="x" data-addc="${esc(t.id)}" data-ct="sub" title="Add a sub-task">+ sub-task</button>`:""}<button class="x" data-pdel="${esc(t.id)}" aria-label="Remove">×</button></td></tr>`};
  el.innerHTML=infoBlock("pv.plan")+`<p class="lead">A planning draft: work packages become epics, stories stay stories, sub-tasks stay sub-tasks when you export to Jira or Excel. "Depends on" means the item starts after the listed items finish (use the codes in the first column).</p>
   <div class="wide"><table class="grid plan"><thead><tr><th>#</th><th style="min-width:260px">Item</th><th style="min-width:160px">Description</th><th style="width:140px">Responsible</th><th style="width:140px">Start</th><th style="width:140px">End / date</th><th style="width:50px">Days</th><th style="width:110px">Depends on</th><th></th></tr></thead>
   <tbody>${tree.map(row).join("")||`<tr><td colspan="9" class="muted">No items yet.</td></tr>`}</tbody></table></div>
   <div class="row" style="margin-top:12px"><button class="btn alt" id="addWP">Add work package</button><button class="btn alt" id="addMS">Add milestone</button><button class="btn alt" id="fixD" ${issues.length?"":"disabled"}>Fix dates to respect dependencies</button></div>
   <p class="small muted">* Dates taken from the items below it. Days are calendar days, weekends included.</p>
   <div class="flags" id="planFlags">${flagsHTML(issues.length?issues:tree.length?["✓ Dates and dependencies are consistent."]:[])}</div>
   <div class="chartbox" id="gantt">${ganttSVG(p)||'<p class="muted small" style="margin:8px">Add dates to see the Gantt chart.</p>'}</div>`;
  const save=()=>{scheduleSave(p)};
  el.querySelectorAll("[data-pi]").forEach(i=>{const r=p.plan.items.find(x=>x.id===i.dataset.pi),k=i.dataset.k;
    if(k==="deps")i.addEventListener("change",()=>{const {ids,bad}=parseDeps(p,i.value,r.id);r.deps=ids;save();renderPlanView(el);if(bad.length)toast(`Unknown or invalid code: ${bad.join(", ")}`)});
    else if(i.type==="date")i.addEventListener("change",()=>{r[k]=i.value;save();renderPlanView(el)});
    else i.addEventListener("input",()=>{r[k]=i.value;save();if(k==="title"){const gEl=$("#gantt");clearTimeout(i._t);i._t=setTimeout(()=>{gEl.innerHTML=ganttSVG(p)||""},400)}})});
  const add=(type,parent)=>{p.plan.items.push({id:uidGen(),type,parent:parent||null,title:"",desc:"",owner:"",start:"",end:"",deps:[]});save();renderPlanView(el)};
  $("#addWP").onclick=()=>add("wp");$("#addMS").onclick=()=>add("ms");
  el.querySelectorAll("[data-addc]").forEach(b=>b.onclick=()=>{const it=p.plan.items,par=b.dataset.addc;
    // insert after the parent's last descendant to keep order readable
    add(b.dataset.ct,par)});
  el.querySelectorAll("[data-pdel]").forEach(b=>b.onclick=()=>{const id=b.dataset.pdel,kill=new Set([id]);let grew=true;while(grew){grew=false;p.plan.items.forEach(x=>{if(x.parent&&kill.has(x.parent)&&!kill.has(x.id)){kill.add(x.id);grew=true}})}
    if(kill.size>1&&!confirm(`Remove this item and the ${kill.size-1} item(s) under it?`))return;
    p.plan.items=p.plan.items.filter(x=>!kill.has(x.id));p.plan.items.forEach(x=>x.deps=(x.deps||[]).filter(d=>!kill.has(d)));save();renderPlanView(el)});
  $("#fixD").onclick=()=>{const r=fixDates(p);if(r.error)return toast(r.error);save();renderPlanView(el);toast(`${r.moved} item(s) moved.`+(r.skipped.length?` Not moved (dates come from their items): ${r.skipped.join(", ")}.`:""))};
  bind(el);
}
