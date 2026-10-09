/* ================= DMADV (Define, Measure, Analyse, Design, Verify) ================= */
var KANO=["Must-be","Performance","Delighter","Indifferent"];
Object.assign(BLANK,{
 "dvmeasure.voc":{customer:"",voice:"",need:""},
 "dvmeasure.kano":{need:"",category:"Performance",importance:"3"},
 "dvmeasure.ctqs":{id:"",ctq:"",measure:"",target:"",lsl:"",usl:"",importance:"3",need:""},
 "dvanalyse.concepts":{id:"",name:"",desc:""},
 "dvdesign.features":{id:"",feature:"",desc:""},
 "dvdesign.dfmea":{mode:"",effect:"",s:"",o:"",d:"",action:""},
 "dvverify.plan":{metric:"",target:"",method:"",freq:"",owner:"",reaction:""}
});
Object.assign(STAGEBLANK,{
 dvdefine:()=>({opportunity:"",whyNew:"",goal:"",inScope:"",outScope:"",risks:"",sponsor:"",processOwner:"",lead:"",team:"",start:"",gateDate:"",benefit:""}),
 dvmeasure:()=>({voc:rows("dvmeasure.voc"),kano:rows("dvmeasure.kano"),ctqs:rows("dvmeasure.ctqs")}),
 dvanalyse:()=>({concepts:rows("dvanalyse.concepts",2),datum:"",pugh:{},selected:"",rationale:""}),
 dvdesign:()=>({features:rows("dvdesign.features"),hoq:{},detail:"",dfmea:rows("dvdesign.dfmea"),predicted:{}}),
 dvverify:()=>({scope:"",duration:"",criteria:"",actual:{},notes:"",handover:"",docs:"",plan:rows("dvverify.plan"),lessons:""})
});
registerTool("DMADV",{gate:_t("Tollgate"),stages:[
 {id:"vD",letter:"D",name:_t("Define"),key:"dvdefine",tabs:[["charter",_t("Design charter")],["notes",_t("Advisor notes")]],
  tg:[["whynew",_t("It is clear why a new design is needed rather than improving the existing process")],["goal",_t("Goal is measurable and dated")],["scope",_t("Scope and boundaries are agreed")],["risks",_t("Main design risks are named")],["roles",_t("Sponsor and future process owner are named")],["signoff",_t("Sponsor has signed off the design charter")]],
  focus:"a convincing reason to design new instead of improving the existing process (otherwise DMAIC is the right method); measurable dated goal; clear scope; design risks named; future process owner involved from the start."},
 {id:"vM",letter:"M",name:_t("Measure"),key:"dvmeasure",tabs:[["voc",_t("Voice of the customer")],["kano",_t("Kano analysis")],["ctq",_t("CTQs and targets")]],
  tg:[["voc",_t("Customer needs gathered from real customers, not assumed")],["kano",_t("Needs classified (must-be, performance, delighter)")],["ctq",_t("CTQs are measurable, with targets or specification limits")],["trace",_t("Every CTQ traces back to a customer need")],["signoff",_t("Sponsor has signed off the Measure tollgate")]],
  focus:"needs collected from real customers by interview, survey or observation; Kano categories plausible (must-bes are not delighters); CTQs measurable with targets or limits; every CTQ traces to a need and every important need has a CTQ."},
 {id:"vA",letter:"A",name:_t("Analyse"),key:"dvanalyse",tabs:[["concepts",_t("Design concepts")],["pugh",_t("Pugh matrix")],["select",_t("Concept selection")]],
  tg:[["alts",_t("At least three genuinely different concepts were generated")],["pugh",_t("Concepts compared against the CTQs, not on gut feeling")],["select",_t("The selected concept is justified, including how its weak points will be handled")],["signoff",_t("Sponsor has signed off the Analyse tollgate")]],
  focus:"real alternatives, not one idea with variations; Pugh comparison against weighted CTQs with a sensible datum; selection follows the evidence or explains why not; weak points of the chosen concept are addressed, possibly by borrowing from other concepts."},
 {id:"vG",letter:"D",name:_t("Design"),key:"dvdesign",tabs:[["hoq",_t("House of Quality")],["detail",_t("Detailed design")],["dfmea",_t("Design FMEA")],["scorecard",_t("Design scorecard")]],
  tg:[["hoq",_t("CTQs translated into design features (House of Quality)")],["covered",_t("Every important CTQ is served by at least one strong design feature")],["detail",_t("Detailed design documented")],["dfmea",_t("Design risks assessed and high-risk failure modes mitigated")],["predict",_t("Predicted performance meets every CTQ target")],["signoff",_t("Sponsor has signed off the Design tollgate")]],
  focus:"House of Quality relationships plausible; important CTQs covered by strong features; features without any CTQ link questioned; detailed design concrete enough to build; design FMEA complete with mitigations; predicted CTQ performance honest and meeting targets."},
 {id:"vV",letter:"V",name:_t("Verify"),key:"dvverify",tabs:[["pilot",_t("Pilot and verification")],["handover",_t("Handover and control")]],
  tg:[["pilot",_t("Pilot run with success criteria defined in advance")],["meets",_t("Actual performance meets every CTQ")],["control",_t("Control plan with owners and reaction plans")],["handover",_t("Process owner has formally accepted the new process")],["lessons",_t("Lessons learned recorded")],["signoff",_t("Sponsor has signed off project closure")]],
  focus:"pilot realistic in scope and duration; CTQ results measured, not estimated; gaps against targets acknowledged with actions; control plan with reaction plans; formal handover to the process owner."}
]});
CONTEXT.DMADV=p=>({opportunity:p.dvdefine.opportunity,whyNew:p.dvdefine.whyNew,goal:p.dvdefine.goal,ctqs:p.dvmeasure.ctqs.filter(c=>c.ctq)});
var withIds=a=>{a.forEach(x=>x.id||(x.id=uidGen()));return a};
var ctqList=p=>withIds(p.dvmeasure.ctqs).filter(c=>c.ctq.trim());
function ctqStatus(c,v){const x=num(v),L=num(c.lsl),U=num(c.usl);if(x==null)return{t:"",cls:""};if(L==null&&U==null)return{t:"Check against target",cls:""};
  const ok=(L==null||x>=L)&&(U==null||x<=U);if(!ok)return{t:"Misses",cls:"bad"};
  const span=L!=null&&U!=null?U-L:Math.abs((L??U))*.2||1,margin=Math.min(L!=null?x-L:Infinity,U!=null?U-x:Infinity);
  return margin<span*.1?{t:"Meets, narrowly",cls:"warn"}:{t:"Meets",cls:"good"}}

/* ----- Define ----- */
TABS.vD.charter=()=>`${inp("dvdefine.opportunity",_t("Opportunity"),_t("What needs to exist that does not today, for whom, and why now."),{rows:3})}
 ${inp("dvdefine.whyNew",_t("Why a new design"),_t("Why improving the existing process (DMAIC) is not enough."),{rows:3})}
 ${inp("dvdefine.goal",_t("Goal"),_t("Measurable and dated, e.g. launch the service by 1 June 2027 meeting all must-be CTQs."),{rows:2})}
 <div class="grid2">${inp("dvdefine.inScope",_t("In scope"),"",{rows:3})}${inp("dvdefine.outScope",_t("Out of scope"),"",{rows:3})}</div>
 ${inp("dvdefine.risks",_t("Main design risks"),_t("Technical, organisational, adoption, legal or privacy risks."),{rows:3})}
 <fieldset><legend>${_t("Team")}</legend><div class="grid2">${inp("dvdefine.sponsor",_t("Sponsor"),"",{rows:1})}${inp("dvdefine.processOwner",_t("Future process owner"),_t("Involve them from the start: they will run it."),{rows:1})}${inp("dvdefine.lead",_t("Project lead / belt"),"",{rows:1})}${inp("dvdefine.team",_t("Core team"),"",{rows:1})}</div></fieldset>
 <div class="grid2">${inp("dvdefine.start",_t("Start date"),"",{type:"date"})}${inp("dvdefine.gateDate",_t("Define tollgate date"),"",{type:"date"})}</div>
 ${inp("dvdefine.benefit",_t("Expected benefit"),"",{rows:2})}`;
AFTER["vD.charter"]=p=>{S.refresh=()=>{setFlags("dvdefine.goal",checkGoal(p.dvdefine.goal));const w=p.dvdefine.whyNew;setFlags("dvdefine.whyNew",!w.trim()?[]:w.trim().length<40?[_t("Too short to convince a sponsor. Why can't the existing process be improved?")]:(kwLang("tool",w)||/\b(new system|new tool|software)\b/i.test(w))?[_t("A tool is not a design. Describe the service or process need the tool would serve.")]:[_t("✓ Reason stated.")])}};
TABS.vD.notes=TABS.D.notes;

/* ----- Measure ----- */
TABS.vM.voc=()=>`<p class="lead">${_t("Collect needs from real customers: interviews, surveys, observation, complaints. Write them in the customer's words first, then as a need.")}</p>${table("dvmeasure.voc",[{k:"customer",label:_t("Customer")},{k:"voice",label:_t("What they say")},{k:"need",label:_t("Underlying need")}])}`;
TABS.vM.kano=()=>`<p class="lead">${_t("Must-be needs cause dissatisfaction when missing but no delight when present. Performance needs give more satisfaction the better they are met. Delighters are unexpected. Indifferent needs barely matter.")}</p>
 ${table("dvmeasure.kano",[{k:"need",label:_t("Need")},{k:"category",label:_t("Kano category"),opts:KANO,w:"160px"},{k:"importance",label:_t("Importance (1 to 5)"),type:"number",min:1,max:5,w:"110px"}])}<div class="flags" id="kanoF"></div>`;
AFTER["vM.kano"]=p=>{S.refresh=()=>{const r=filled(p.dvmeasure.kano,["need"]),f=[];if(r.length){const c=k=>r.filter(x=>x.category===k).length;f.push(`${_t("ℹ {x} must-be, {x2} performance, {x3} delighter, {x4} indifferent.",{x:c("Must-be"),x2:c("Performance"),x3:c("Delighter"),x4:c("Indifferent")})}`);
  if(!c("Must-be"))f.push(_t("No must-be needs. Almost every service has some (security, availability, correctness). Check you have not missed them because customers take them for granted."));
  r.filter(x=>x.category==="Delighter"&&num(x.importance)>=5).forEach(x=>f.push(`${_t("\"{need}\" is a delighter with top importance. Delighters are rarely what customers rank highest; is it a performance need?",{need:trunc(x.need,40)})}`))}
  $("#kanoF").innerHTML=flagsHTML(f)}};
TABS.vM.ctq=()=>`<p class="lead">${_t("Turn each important need into a measurable CTQ. Give limits where you can: the scorecard and verification compare against them.")}</p>
 ${table("dvmeasure.ctqs",[{k:"ctq",label:"CTQ"},{k:"measure",label:_t("How measured")},{k:"target",label:_t("Target"),w:"110px"},{k:"lsl",label:_t("Lower limit"),type:"text",w:"95px"},{k:"usl",label:_t("Upper limit"),type:"text",w:"95px"},{k:"importance",label:_t("Importance (1 to 5)"),type:"number",min:1,max:5,w:"95px"},{k:"need",label:_t("Need it serves")}])}<div class="flags" id="ctqF"></div>`;
AFTER["vM.ctq"]=p=>{S.refresh=()=>{withIds(p.dvmeasure.ctqs);const r=ctqList(p),f=[];r.forEach(c=>{if(!c.measure.trim())f.push(`${_t("\"{ctq}\" has no measurement method.",{ctq:trunc(c.ctq,40)})}`);if(!c.target.trim()&&num(c.lsl)==null&&num(c.usl)==null)f.push(`${_t("\"{ctq}\" has no target or limits.",{ctq:trunc(c.ctq,40)})}`);if(!c.need.trim())f.push(`${_t("\"{ctq}\" is not traced to a customer need.",{ctq:trunc(c.ctq,40)})}`)});
  const imp=filled(p.dvmeasure.kano,["need"]).filter(k=>k.category==="Must-be"||num(k.importance)>=4),cov=r.map(c=>c.need.toLowerCase());imp.forEach(k=>{if(!cov.some(n=>n&&(n.includes(k.need.toLowerCase().slice(0,15))||k.need.toLowerCase().includes(n.slice(0,15)))))f.push(`${_t("Important need \"{need}\" has no CTQ.",{need:trunc(k.need,40)})}`)});
  if(r.length&&!f.length)f.push(_t("✓ Every CTQ is measurable and traced to a need."));$("#ctqF").innerHTML=flagsHTML(f)}};

/* ----- Analyse ----- */
TABS.vA.concepts=()=>`<p class="lead">${_t("Generate genuinely different ways to meet the CTQs, not variations of one idea. Include the current way of working or a benchmark as a reference.")}</p>${table("dvanalyse.concepts",[{k:"name",label:_t("Concept"),w:"220px"},{k:"desc",label:_t("Description")}])}`;
function pughCalc(p){const ctq=ctqList(p),con=withIds(p.dvanalyse.concepts).filter(c=>c.name.trim()),datum=p.dvanalyse.datum||con[0]?.id,sc=p.dvanalyse.pugh;
  const tot=con.map(c=>{let plus=0,minus=0,w=0;ctq.forEach(q=>{const v=c.id===datum?"S":sc[q.id+"|"+c.id]||"S",imp=num(q.importance)||1;if(v==="+"){plus++;w+=imp}if(v==="-"){minus++;w-=imp}});return{c,plus,minus,w}});
  return{ctq,con,datum,tot}}
TABS.vA.pugh=p=>{const {ctq,con,datum,tot}=pughCalc(p);if(con.length<2||!ctq.length)return `<p>${_t("Add at least two concepts and the CTQs (Measure stage) first.")}</p>`;
  const best=Math.max(...tot.map(t=>t.w));
  return `<p class="lead">${_t("Pick a reference concept (the datum). Score every other concept against it on each CTQ: better (+), same (S) or worse (−). Totals are weighted by CTQ importance.")}</p>
  <div class="field" style="max-width:320px"><label for="datum">${_t("Reference concept (datum)")}</label><select id="datum">${con.map(c=>`<option value="${esc(c.id)}" ${c.id===datum?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>
  <div class="wide"><table class="grid pugh"><thead><tr><th>CTQ</th><th>${_t("Weight")}</th>${con.map(c=>`<th>${esc(trunc(c.name,22))}${c.id===datum?_t(" (datum)"):""}</th>`).join("")}</tr></thead><tbody>
  ${ctq.map(q=>`<tr><td>${esc(q.ctq)}</td><td class="calc">${num(q.importance)||1}</td>${con.map(c=>c.id===datum?`<td class="calc muted">S</td>`:`<td><select data-pu="${esc(q.id)}|${esc(c.id)}" aria-label="${esc(c.name)}">${["S","+","-"].map(v=>`<option value="${esc(v)}" ${((p.dvanalyse.pugh[q.id+"|"+c.id])||"S")===v?"selected":""}>${esc(_tv(v))}</option>`).join("")}</select></td>`).join("")}</tr>`).join("")}
  <tr class="tot"><td>${_t("Count of + / −")}</td><td></td>${tot.map(t=>`<td class="calc">${t.plus} / ${t.minus}</td>`).join("")}</tr>
  <tr class="tot"><td>${_t("Weighted total")}</td><td></td>${tot.map(t=>`<td class="calc ${t.w===best&&t.c.id!==datum?"hi":""}">${t.w>0?"+":""}${t.w}</td>`).join("")}</tr></tbody></table></div>
  <div class="flags">${flagsHTML(tot.every(t=>t.w<=0)?[_t("No concept beats the datum. Combine the strong points of several concepts and score again.")]:[_t("ℹ Strongest against the datum: {x}. Look at its minuses: can another concept's strength fix them?",{x:tot.filter(t=>t.w===best).map(t=>t.c.name).join(", ")})])}</div>`};
AFTER["vA.pugh"]=p=>{setTimeout(()=>{const d=$("#datum");if(d)d.onchange=()=>{p.dvanalyse.datum=d.value;scheduleSave(p);renderSheet()};document.querySelectorAll("[data-pu]").forEach(s=>s.onchange=()=>{p.dvanalyse.pugh[s.dataset.pu]=s.value;scheduleSave(p);renderSheet()})})};
TABS.vA.select=p=>{const con=withIds(p.dvanalyse.concepts).filter(c=>c.name.trim());return `<div class="field"><label for="selC">${_t("Selected concept")}</label><select id="selC"><option value="">${_t("Choose…")}</option>${con.map(c=>`<option value="${esc(c.id)}" ${c.id===p.dvanalyse.selected?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>
  ${inp("dvanalyse.rationale",_t("Why this concept"),_t("The evidence for it, and how its weak points from the Pugh matrix will be handled."),{rows:5})}<div class="flags" id="selF"></div>`};
AFTER["vA.select"]=p=>{S.refresh=()=>{const {tot}=pughCalc(p),f=[],s=tot.find(t=>t.c.id===p.dvanalyse.selected),best=tot.length?Math.max(...tot.map(t=>t.w)):0;
  if(s&&s.w<best)f.push(`${_t("The selected concept does not have the highest Pugh score ({w} against {best}). That can be right, but the rationale must explain why.",{w:s.w,best:best})}`);if(s&&s.minus&&!(kwLang("weak",p.dvanalyse.rationale)||/weak|minus|risk|mitigat|borrow|combine/i.test(p.dvanalyse.rationale)))f.push(`${_t("It has {minus} minus point(s). Say how they will be handled.",{minus:s.minus})}`);$("#selF").innerHTML=flagsHTML(f)};
  setTimeout(()=>{const s=$("#selC");if(s)s.onchange=()=>{p.dvanalyse.selected=s.value;scheduleSave(p);S.refresh()}})};

/* ----- Design ----- */
function hoqCalc(p){const ctq=ctqList(p),fe=withIds(p.dvdesign.features).filter(f=>f.feature.trim()),h=p.dvdesign.hoq;
  const score=fe.map(f=>ctq.reduce((s,q)=>s+(num(h[q.id+"|"+f.id])||0)*(num(q.importance)||1),0)),tot=score.reduce((a,b)=>a+b,0);return{ctq,fe,h,score,tot}}
TABS.vG.hoq=p=>{const {ctq,fe,h,score,tot}=hoqCalc(p);
  return `<p class="lead">${_t("List the design features (how the design will deliver), then rate how strongly each feature drives each CTQ: 9 strong, 3 medium, 1 weak. The bottom row shows which features matter most.")}</p>
  ${table("dvdesign.features",[{k:"feature",label:_t("Design feature"),w:"260px"},{k:"desc",label:_t("Description")}])}
  ${ctq.length&&fe.length?`<h4>${_t("Relationship matrix")}</h4><div class="wide"><table class="grid hoq"><thead><tr><th>CTQ</th><th>${_t("Weight")}</th>${fe.map(f=>`<th>${esc(trunc(f.feature,20))}</th>`).join("")}</tr></thead><tbody>
  ${ctq.map(q=>`<tr><td>${esc(q.ctq)}</td><td class="calc">${num(q.importance)||1}</td>${fe.map(f=>`<td><select data-hq="${esc(q.id)}|${esc(f.id)}">${["","1","3","9"].map(v=>`<option value="${esc(v)}" ${(h[q.id+"|"+f.id]||"")===v?"selected":""}>${esc(_tv(v))}</option>`).join("")}</select></td>`).join("")}</tr>`).join("")}
  <tr class="tot"><td>${_t("Feature importance")}</td><td></td>${score.map(s=>`<td class="calc">${s}${tot?` (${Math.round(s/tot*100)}%)`:""}</td>`).join("")}</tr></tbody></table></div><div class="flags" id="hoqF"></div>`:`<p class="muted">${_t("Add CTQs (Measure) and features to fill the matrix.")}</p>`}`};
AFTER["vG.hoq"]=p=>{S.refresh=()=>{withIds(p.dvdesign.features);const el=$("#hoqF");if(!el)return;const {ctq,fe,h}=hoqCalc(p),f=[];
  ctq.filter(q=>(num(q.importance)||0)>=4&&!fe.some(x=>h[q.id+"|"+x.id]==="9")).forEach(q=>f.push(`${_t("Important CTQ \"{ctq}\" has no strong (9) feature. The design may not deliver it.",{ctq:trunc(q.ctq,40)})}`));
  fe.filter(x=>!ctq.some(q=>h[q.id+"|"+x.id])).forEach(x=>f.push(`${_t("Feature \"{feature}\" serves no CTQ. Gold-plating, or a missing CTQ?",{feature:trunc(x.feature,40)})}`));
  if(!f.length&&ctq.length&&fe.length)f.push(_t("✓ Important CTQs are covered and every feature serves a CTQ."));el.innerHTML=flagsHTML(f)};
  setTimeout(()=>document.querySelectorAll("[data-hq]").forEach(s=>s.onchange=()=>{p.dvdesign.hoq[s.dataset.hq]=s.value;scheduleSave(p);renderSheet()}))};
TABS.vG.detail=()=>inp("dvdesign.detail",_t("Detailed design"),_t("Process steps, roles, systems, rules, forms and service levels. Detailed enough that someone else could build it."),{rows:12});
TABS.vG.dfmea=()=>`<p class="lead">${_t("What could go wrong with the design once it runs? Score severity, occurrence and detection from 1 to 10.")}</p>${table("dvdesign.dfmea",[{k:"mode",label:_t("Failure mode")},{k:"effect",label:_t("Effect")},{k:"s",label:"S",type:"number",min:1,max:10,w:"70px"},{k:"o",label:"O",type:"number",min:1,max:10,w:"70px"},{k:"d",label:"D",type:"number",min:1,max:10,w:"70px"},{k:"action",label:_t("Mitigation")}],{label:"RPN"})}<div class="flags" id="dfF"></div>`;
AFTER["vG.dfmea"]=p=>{S.refresh=()=>{fillCalc("dvdesign.dfmea",rpnCalc);const f=[];p.dvdesign.dfmea.forEach((r,i)=>{if(rpnCalc(r).hi&&!r.action.trim())f.push(`${_t("Row {x}: high risk with no mitigation.",{x:i+1})}`)});$("#dfF").innerHTML=flagsHTML(f)}};
var ctqTable=(p,store,label)=>{const ctq=ctqList(p);if(!ctq.length)return `<p>${_t("Add CTQs in the Measure stage first.")}</p>`;
  return `<div class="wide"><table class="grid"><thead><tr><th>CTQ</th><th>${_t("Target")}</th><th>${_t("Limits")}</th><th style="width:140px">${label}</th><th>${_t("Result")}</th></tr></thead><tbody>${ctq.map(q=>`<tr><td>${esc(q.ctq)}</td><td>${esc(q.target)}</td><td>${esc([q.lsl,q.usl].map(v=>v||"–").join(" to "))}</td><td><input data-cv="${esc(q.id)}" data-store="${store}" value="${esc(getPath(p,store)[q.id]||"")}" aria-label="${label}"></td><td class="calc" id="cs_${store.replace(/\./g,"_")}_${esc(q.id)}"></td></tr>`).join("")}</tbody></table></div>`};
function bindCtqValues(p,store){document.querySelectorAll(`[data-store="${store}"]`).forEach(i=>i.oninput=()=>{getPath(p,store)[i.dataset.cv]=i.value;scheduleSave(p);refreshMeters();paintCtq(p,store)});paintCtq(p,store)}
function paintCtq(p,store){ctqList(p).forEach(q=>{const el=document.getElementById(`cs_${store.replace(/\./g,"_")}_${esc(q.id)}`);if(el){const s=ctqStatus(q,getPath(p,store)[q.id]);el.textContent=_tv(s.t);el.className="calc "+s.cls}})}
TABS.vG.scorecard=p=>`<p class="lead">${_t("Predict how the design will perform on each CTQ, from a simulation, a prototype, a benchmark or expert estimate. Write down the basis in the detailed design.")}</p>${ctqTable(p,"dvdesign.predicted",_t("Predicted value"))}`;
AFTER["vG.scorecard"]=p=>{setTimeout(()=>bindCtqValues(p,"dvdesign.predicted"))};

/* ----- Verify ----- */
TABS.vV.pilot=p=>`<div class="grid2">${inp("dvverify.scope",_t("Pilot scope"),_t("Where, who, which volume."),{rows:2})}${inp("dvverify.duration",_t("Duration"),"",{rows:1})}</div>
 ${inp("dvverify.criteria",_t("Success criteria"),_t("Written before the pilot starts."),{rows:2})}
 <h4>${_t("Measured results against the CTQs")}</h4>${ctqTable(p,"dvverify.actual",_t("Measured value"))}
 ${inp("dvverify.notes",_t("Observations"),_t("Side effects, user reactions, surprises."),{rows:3})}<div id="dvSuggest"></div>`;
AFTER["vV.pilot"]=p=>{setTimeout(()=>{bindCtqValues(p,"dvverify.actual");dvSuggestion(p)})};
TABS.vV.handover=()=>`${table("dvverify.plan",[{k:"metric",label:_t("What is controlled")},{k:"target",label:_t("Target / limits")},{k:"method",label:_t("Measurement method")},{k:"freq",label:_t("Frequency")},{k:"owner",label:_t("Owner")},{k:"reaction",label:_t("Reaction plan")}])}
 ${inp("dvverify.docs",_t("Documentation and training"),"",{rows:2})}${inp("dvverify.handover",_t("Handover to the process owner"),_t("Who accepted, when."),{rows:2})}${inp("dvverify.lessons",_t("Lessons learned"),"",{rows:3})}<div id="dvSuggest"></div>`;
AFTER["vV.handover"]=p=>{setTimeout(()=>dvSuggestion(p))};
function dvComplete(p){const v=p.dvverify,ctq=ctqList(p);return tgOf(p,"vV").decision==="go"||(ctq.length>0&&ctq.every(q=>num(v.actual[q.id])!=null)&&!!v.handover.trim()&&filled(v.plan,["metric","owner"]).length>0&&progress(p,"vV")===100)}
function dvSuggestText(p){const ctq=ctqList(p),near=ctq.filter(q=>ctqStatus(q,p.dvverify.actual[q.id]).t==="Meets, narrowly"),miss=ctq.filter(q=>ctqStatus(q,p.dvverify.actual[q.id]).t==="Misses");
  let t=_t("The new process is designed, verified and handed over. Once it has run for a few months with real volumes, consider whether it could continue as a DMAIC project to reduce variation and lock in performance.");
  if(miss.length)t+=" "+_t("Good candidates: CTQs that missed their limits in verification ({x}).",{x:miss.map(q=>q.ctq).join(", ")});
  if(near.length)t+=" "+(miss.length?_t("Also CTQs that only just met their limits ({x}).",{x:near.map(q=>q.ctq).join(", ")}):_t("Good candidates: CTQs that only just met their limits ({x}).",{x:near.map(q=>q.ctq).join(", ")}));
  if(!miss.length&&!near.length)t+=_t(" All CTQs met their limits with margin, so there may be no need: keep monitoring with the control plan.");
  return t}
function dvSuggestion(p){const el=$("#dvSuggest");if(!el)return;el.innerHTML=dvComplete(p)?`<div class="suggest">${_t("<b>Suggestion</b>")}<p>${esc(dvSuggestText(p))}</p></div>`:""}
AUTO.vD=p=>{const d=p.dvdefine;return{whynew:d.whyNew.trim().length>=40,goal:hasNum(d.goal)&&hasTime(d.goal),scope:!!(d.inScope.trim()&&d.outScope.trim()),risks:!!d.risks.trim(),roles:!!(d.sponsor.trim()&&d.processOwner.trim())}};
AUTO.vM=p=>{const r=ctqList(p);return{voc:filled(p.dvmeasure.voc,["voice"]).length>=3,kano:filled(p.dvmeasure.kano,["need"]).length>0,ctq:r.length>0&&r.every(c=>c.measure.trim()&&(c.target.trim()||num(c.lsl)!=null||num(c.usl)!=null)),trace:r.length>0&&r.every(c=>c.need.trim())}};
AUTO.vA=p=>{const {con,tot}=pughCalc(p);return{alts:con.length>=3,pugh:con.length>=2&&Object.keys(p.dvanalyse.pugh).length>0,select:!!p.dvanalyse.selected&&p.dvanalyse.rationale.trim().length>30}};
AUTO.vG=p=>{const {ctq,fe,h}=hoqCalc(p),fm=filled(p.dvdesign.dfmea,["mode","s","o","d"]);return{hoq:ctq.length>0&&fe.length>0&&Object.values(h).some(Boolean),covered:ctq.length>0&&ctq.filter(q=>(num(q.importance)||0)>=4).every(q=>fe.some(x=>h[q.id+"|"+x.id]==="9")),detail:p.dvdesign.detail.trim().length>80,dfmea:fm.length>0&&!fm.some(r=>rpnCalc(r).hi&&!r.action.trim()),predict:ctq.length>0&&ctq.every(q=>ctqStatus(q,p.dvdesign.predicted[q.id]).cls==="good"||ctqStatus(q,p.dvdesign.predicted[q.id]).cls==="warn")}};
AUTO.vV=p=>{const v=p.dvverify,ctq=ctqList(p);return{pilot:!!v.criteria.trim(),meets:ctq.length>0&&ctq.every(q=>["good","warn"].includes(ctqStatus(q,v.actual[q.id]).cls)),control:filled(v.plan,["metric","owner","reaction"]).length>0,handover:!!v.handover.trim(),lessons:!!v.lessons.trim()}};
EXTRA.vA=p=>{const {tot}=pughCalc(p);return{pughTotals:tot.map(t=>({concept:t.c.name,plus:t.plus,minus:t.minus,weighted:t.w})),selected:p.dvanalyse.concepts.find(c=>c.id===p.dvanalyse.selected)?.name}};
EXTRA.vG=p=>{const {ctq,fe,h,score}=hoqCalc(p);return{ctqs:ctq.map(q=>({ctq:q.ctq,importance:q.importance,predicted:p.dvdesign.predicted[q.id],status:ctqStatus(q,p.dvdesign.predicted[q.id]).t})),featureImportance:fe.map((f,i)=>({feature:f.feature,score:score[i]})),relationships:Object.entries(h).filter(([,v])=>v).length}};
EXTRA.vV=p=>({ctqResults:ctqList(p).map(q=>({ctq:q.ctq,lsl:q.lsl,usl:q.usl,measured:p.dvverify.actual[q.id],status:ctqStatus(q,p.dvverify.actual[q.id]).t}))});
