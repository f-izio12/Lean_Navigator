/* ================= Stakeholders and RACI (project level, every method) ================= */
var ATT=["","Resistant","Sceptical","Neutral","Supportive","Champion"];
BLANK["people.stakeholders"]={id:"",name:"",role:"",influence:"3",interest:"3",current:"Neutral",desired:"Supportive",action:""};
var sQuad=s=>{const i=num(s.influence)||0,n=num(s.interest)||0,hi=i>=3.5,hn=n>=3.5;return hi&&hn?"Manage closely":hi?"Keep satisfied":hn?"Keep informed":"Monitor"};
function powerGrid(st,w=460,h=380){
  const L=50,T=20,pw=w-L-20,ph=h-T-50,X=v=>L+(v-.5)/5*pw,Y=v=>T+ph-(v-.5)/5*ph;
  let g=svgOpen(w,h)+`<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="none" stroke="${C.line}"/><line x1="${L+pw/2}" y1="${T}" x2="${L+pw/2}" y2="${T+ph}" stroke="${C.line}"/><line x1="${L}" y1="${T+ph/2}" x2="${L+pw}" y2="${T+ph/2}" stroke="${C.line}"/>`;
  [[_t("Keep satisfied"),L+6,T+14],[_t("Manage closely"),L+pw/2+6,T+14],[_t("Monitor"),L+6,T+ph-8],[_t("Keep informed"),L+pw/2+6,T+ph-8]].forEach(([t,x,y])=>g+=`<text x="${x}" y="${y}" font-size="10" fill="${C.grey}">${t}</text>`);
  g+=`<text x="${L+pw/2}" y="${h-12}" font-size="11" text-anchor="middle" fill="${C.text}">${_t("Interest (1 to 5)")}</text><text transform="translate(16,${T+ph/2}) rotate(-90)" font-size="11" text-anchor="middle" fill="${C.text}">${_t("Influence")}</text>`;
  st.filter(s=>s.name).forEach((s,i)=>{const x=X(num(s.interest)||1)+((i%3)-1)*9,y=Y(num(s.influence)||1)+((i%2)?7:-7),bad=["Resistant","Sceptical"].includes(s.current);
    g+=`<circle cx="${x}" cy="${y}" r="5" fill="${bad?C.orange:C.blue}"/><text x="${x+8}" y="${y+4}" font-size="9" fill="${C.text}">${esc(trunc(s.name,16))}</text>`});
  return g+`</svg>`;
}
function stakeFlags(st){const f=[];st.filter(s=>s.name).forEach(s=>{const gap=ATT.indexOf(s.desired)-ATT.indexOf(s.current);
  if(sQuad(s)==="Manage closely"&&gap>0&&!s.action.trim())f.push(`${_t("{sName}: high influence and interest, attitude must move from {current} to {desired}, but no action is planned.",{sName:s.name,current:s.current,desired:s.desired})}`);
  if(["Resistant","Sceptical"].includes(s.current)&&(num(s.influence)||0)>=4)f.push(`${_t("{sName} is {x} and influential: a risk to the project. Plan a conversation early.",{sName:s.name,x:s.current.toLowerCase()})}`)});
  if(!f.length&&st.some(s=>s.name))f.push(_t("✓ No high-risk stakeholders without an action."));return f}
function renderStakeView(el){
  const p=S.current;p.people.stakeholders.forEach(s=>s.id||(s.id=uidGen()));
  el.innerHTML=infoBlock("pv.stakeholders")+table("people.stakeholders",[{k:"name",label:_t("Name or group")},{k:"role",label:_t("Role")},{k:"influence",label:_t("Influence"),type:"number",min:1,max:5,w:"85px"},{k:"interest",label:_t("Interest"),type:"number",min:1,max:5,w:"85px"},{k:"current",label:_t("Attitude now"),opts:ATT.slice(1),w:"130px"},{k:"desired",label:_t("Attitude needed"),opts:ATT.slice(1),w:"130px"},{k:"action",label:_t("Engagement action")}],{label:_t("Approach")})+
   `<div class="grid2"><div class="chartbox" id="pg"></div><div class="flags" id="sfl"></div></div>`;
  S.refresh=()=>{p.people.stakeholders.forEach(s=>s.id||(s.id=uidGen()));fillCalc("people.stakeholders",s=>({t:sQuad(s),hi:sQuad(s)==="Manage closely"}));$("#pg").innerHTML=powerGrid(p.people.stakeholders);$("#sfl").innerHTML=flagsHTML(stakeFlags(p.people.stakeholders))};
  bind(el);
}
var RACIV=["","R","A","A/R","C","I"];
function raciRows(p){
  const rows=DEF[p.tool]?DEF[p.tool].order.map(k=>({key:"st:"+k,label:`${_t("{x} (stage)",{x:ST[k].name})}`})):[];
  const {tree}=planDates(p);tree.filter(t=>t.type==="wp").forEach(t=>rows.push({key:"wp:"+t.id,label:`${t.code} ${t.title||_t("Work package")}`}));
  p.people.raci.custom.forEach(c=>rows.push({key:"cu:"+c.id,label:c.label,custom:c.id}));
  return rows;
}
function raciCheck(p){
  const ppl=p.people.stakeholders.filter(s=>s.name),cells=p.people.raci.cells,f=[];
  raciRows(p).forEach(r=>{const v=ppl.map(s=>(cells[r.key]||{})[s.id]||""),a=v.filter(x=>x==="A"||x==="A/R").length,rr=v.filter(x=>x==="R"||x==="A/R").length;
    if(a===0)f.push(`${_t("{label}: nobody is Accountable.",{label:r.label})}`);if(a>1)f.push(`${_t("{label}: {a} people are Accountable. There should be exactly one.",{label:r.label,a:a})}`);if(rr===0)f.push(`${_t("{label}: nobody is Responsible for doing the work.",{label:r.label})}`)});
  return f;
}
function renderRaciView(el){
  const p=S.current,ppl=p.people.stakeholders.filter(s=>s.name),rows=raciRows(p),cells=p.people.raci.cells;
  ppl.forEach(s=>s.id||(s.id=uidGen()));
  el.innerHTML=infoBlock("pv.raci")+(ppl.length?`<p class="lead">${_t("R does the work, A owns the result and signs off (exactly one per row), C is consulted before, I is informed after.")}</p>
   <div class="wide"><table class="grid raci"><thead><tr><th style="min-width:220px">${_t("Activity")}</th>${ppl.map(s=>`<th title="${esc(s.role)}">${esc(trunc(s.name,18))}</th>`).join("")}<th></th></tr></thead><tbody>
   ${rows.map(r=>`<tr><td>${r.custom?`<input data-cu="${esc(r.custom)}" value="${esc(r.label)}" aria-label="${_t("Activity")}">`:esc(r.label)}</td>${ppl.map(s=>`<td><select data-rk="${esc(r.key)}" data-rp="${esc(s.id)}" aria-label="${esc(s.name)}">${RACIV.map(v=>`<option ${((cells[r.key]||{})[s.id]||"")===v?"selected":""}>${v}</option>`).join("")}</select></td>`).join("")}<td>${r.custom?`<button class="x" data-cdel="${esc(r.custom)}" aria-label="${_t("Remove")}">×</button>`:""}</td></tr>`).join("")}
   <tr class="tot"><td class="small muted">${_t("Rows where Responsible")}</td>${ppl.map(s=>`<td class="calc">${rows.filter(r=>["R","A/R"].includes((cells[r.key]||{})[s.id])).length}</td>`).join("")}<td></td></tr>
   </tbody></table></div><button class="btn alt addrow" id="addAct">${_t("Add activity")}</button><div class="flags" id="rfl"></div>`
   :`<p>${_t("Add people on the <b>Stakeholders</b> tab first. They become the columns of the RACI.")}</p>`);
  if(!ppl.length)return bind(el);
  const upd=()=>{const f=raciCheck(p);$("#rfl").innerHTML=flagsHTML(f.length?f:[_t("✓ Every activity has one Accountable and at least one Responsible.")])};
  el.querySelectorAll("[data-rk]").forEach(s=>s.onchange=()=>{(cells[s.dataset.rk]=cells[s.dataset.rk]||{})[s.dataset.rp]=s.value;scheduleSave(p);renderRaciView(el)});
  el.querySelectorAll("[data-cu]").forEach(i=>i.oninput=()=>{p.people.raci.custom.find(c=>c.id===i.dataset.cu).label=i.value;scheduleSave(p)});
  el.querySelectorAll("[data-cdel]").forEach(b=>b.onclick=()=>{const id=b.dataset.cdel;p.people.raci.custom=p.people.raci.custom.filter(c=>c.id!==id);delete cells["cu:"+id];scheduleSave(p);renderRaciView(el)});
  $("#addAct").onclick=()=>{p.people.raci.custom.push({id:uidGen(),label:_t("New activity")});scheduleSave(p);renderRaciView(el)};
  upd();bind(el);
}
Object.assign(INFO,{
 "pv.plan":I(_t("Draft the plan you will hand over to Excel or Jira: work packages, the stories and sub-tasks under them, milestones and dependencies."),_t("For each item a title, a responsible person, dates and, where it matters, what it depends on."),_t("Not reviewed by the AI. The tool flags items that start before what they depend on, and dependency loops.")),
 "pv.stakeholders":I(_t("Know who can help or block the change, and plan how to involve them."),_t("Each person or group, their influence and interest from 1 to 5, their attitude now and the attitude you need, and the action to get there."),_t("Influential people who are sceptical or resistant without a plan to engage them.")),
 "pv.raci":I(_t("Make clear who does the work, who owns the result, who is consulted and who is informed."),_t("Mark R, A, C or I for each person per activity. Stages and work packages are listed automatically; add other activities if needed."),_t("Exactly one Accountable and at least one Responsible on every row."))
});
