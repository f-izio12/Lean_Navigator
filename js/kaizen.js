/* ================= Kaizen event ================= */
var WASTES=["Transport","Inventory","Motion","Waiting","Overproduction","Overprocessing","Defects","Skills (unused talent)"];
Object.assign(BLANK,{
 "kzevent.obs":{step:"",waste:"Waiting",observation:"",impact:""},
 "kzevent.ideas":{idea:"",waste:"",status:"Not tried",result:""},
 "kzevent.metrics":{metric:"",unit:"",before:"",after:"",target:""},
 "kzfollow.news":{item:"",owner:"",due:"",status:"Open"},
 "kzfollow.audits":{date:"",finding:"",sustained:"Yes"}
});
Object.assign(STAGEBLANK,{
 kzprep:()=>({problem:"",scopeStart:"",scopeEnd:"",objectives:"",outScope:"",constraints:"",sponsor:"",leader:"",team:"",start:"",end:"",prework:"",walk:"",informed:"",agenda:"",logistics:""}),
 kzevent:()=>({obs:rows("kzevent.obs"),ideas:rows("kzevent.ideas"),metrics:rows("kzevent.metrics"),changes:""}),
 kzfollow:()=>({news:rows("kzfollow.news"),audits:rows("kzfollow.audits"),reportout:"",lessons:""})
});
registerTool("Kaizen event",{gate:_t("Checkpoint"),stages:[
 {id:"kzp",letter:"P",name:_t("Prepare"),key:"kzprep",tabs:[["charter",_t("Event charter")],["prework",_t("Pre-work")],["agenda",_t("Agenda and logistics")]],
  tg:[["scope",_t("Scope has a clear start and end point and fits in the event")],["objectives",_t("Objectives are measurable")],["team",_t("Team includes people who do the work, plus a sponsor")],["baseline",_t("Baseline data collected before the event")],["freed",_t("Team members are released from normal work for the event")],["sponsor",_t("Sponsor has approved the charter and will attend the report-out")]],
  focus:"scope narrow enough for 3 to 5 days, with clear start and end; measurable objectives; team includes operators and at least one outsider; sponsor committed; baseline data and a process walk done before the event; constraints and boundaries of authority clear."},
 {id:"kze",letter:"E",name:_t("Event"),key:"kzevent",tabs:[["waste",_t("Waste walk")],["ideas",_t("Ideas and try-storming")],["results",_t("Before and after")]],
  tg:[["observed",_t("Current state observed at the place of work, waste recorded by type")],["tried",_t("Ideas tried during the event, not only listed")],["measured",_t("Results measured against the baseline")],["standard",_t("New standard work documented")],["reportout",_t("Report-out given to the sponsor")]],
  focus:"waste observed directly and classified correctly; ideas actually tried (try-storming) rather than listed; results measured with the same metric as the baseline; changes documented as new standard work; unrealistic claims challenged."},
 {id:"kzf",letter:"F",name:_t("Follow-up"),key:"kzfollow",tabs:[["news",_t("Kaizen newspaper")],["audits",_t("Sustain audits")],["reportout",_t("Report-out and lessons")]],
  tg:[["closed",_t("Open items closed within 30 days")],["audited",_t("Sustain audits done (e.g. at 30, 60 and 90 days)")],["sustained",_t("Results sustained at the last audit")],["lessons",_t("Lessons learned shared")],["sponsor",_t("Sponsor has closed the event")]],
  focus:"open items have owners and dates and are closed within about 30 days; sustain audits done and honest; results held after 90 days; slippage acknowledged with a response."}
]});
CONTEXT["Kaizen event"]=p=>({problem:p.kzprep.problem,objectives:p.kzprep.objectives,scope:p.kzprep.scopeStart+" to "+p.kzprep.scopeEnd});

TABS.kzp.charter=()=>`${inp("kzprep.problem",_t("Problem or opportunity"),_t("What is wrong today, with numbers. No solutions."),{rows:3})}
  <div class="grid2">${inp("kzprep.scopeStart",_t("Process starts at"),_t("First step in scope."),{rows:1})}${inp("kzprep.scopeEnd",_t("Process ends at"),_t("Last step in scope."),{rows:1})}</div>
  ${inp("kzprep.objectives",_t("Objectives"),_t("Measurable targets for the end of the event. One per line."),{rows:3})}
  <div class="grid2">${inp("kzprep.outScope",_t("Out of scope"),"",{rows:2})}${inp("kzprep.constraints",_t("Constraints"),_t("Budget, systems or rules the team cannot change."),{rows:2})}</div>
  <fieldset><legend>${_t("Team")}</legend><div class="grid3">${inp("kzprep.sponsor",_t("Sponsor"),"",{rows:1})}${inp("kzprep.leader",_t("Event leader"),"",{rows:1})}${inp("kzprep.team",_t("Team"),_t("Names and roles. Include people who do the work."),{rows:1})}</div></fieldset>
  <div class="grid2">${inp("kzprep.start",_t("First day"),"",{type:"date"})}${inp("kzprep.end",_t("Last day"),"",{type:"date"})}</div><div class="flags" id="kzflags"></div>`;
AFTER["kzp.charter"]=p=>{S.refresh=()=>{const k=p.kzprep,f=[];setFlags("kzprep.problem",checkProblem(k.problem,true));
  if(k.objectives.trim()){const ol=lines(k.objectives);const nn=ol.filter(o=>!hasNum(o));if(nn.length)f.push(`${_t("{nnCount} objective{x} no number.",{nnCount:nn.length,x:nn.length>1?_t("s have"):" has"})}`);else f.push(_t("✓ All objectives have a number."))}
  if(k.start&&k.end){const d=(new Date(k.end)-new Date(k.start))/864e5+1;if(d>5)f.push(`${_t("{d} days. A kaizen event is usually 3 to 5 days; longer suggests the scope is too big.",{d:d})}`);if(d<1)f.push(_t("The last day is before the first day."))}
  $("#kzflags").innerHTML=flagsHTML(f)}};
TABS.kzp.prework=()=>`${inp("kzprep.prework",_t("Baseline data collected"),_t("Which metrics, over what period, and their values. You will compare against these on the last day."),{rows:4})}
  ${inp("kzprep.walk",_t("Process walk"),_t("Who walked the process, when, and what they saw."),{rows:3})}
  ${inp("kzprep.informed",_t("Stakeholders informed"),_t("Who needs to know the event is happening, including those affected by changes."),{rows:2})}`;
TABS.kzp.agenda=()=>`${inp("kzprep.agenda",_t("Agenda"),_t("Day by day."),{rows:8,ph:_t("Day 1: kick-off, training, go and see the process, map the current state\nDay 2: waste walk, root causes, ideas\nDay 3: try-storm the best ideas, measure\nDay 4: standardise, train, measure again\nDay 5: report-out to sponsor, follow-up plan")})}
  ${inp("kzprep.logistics",_t("Logistics"),_t("Room, materials, access to systems, cover for the team's normal work."),{rows:3})}`;
TABS.kze.waste=()=>`<p class="lead">${_t("Walk the process and record every waste you see. One observation per row.")}</p>
  ${table("kzevent.obs",[{k:"step",label:_t("Process step")},{k:"waste",label:_t("Type of waste"),opts:WASTES,w:"190px"},{k:"observation",label:_t("What you saw")},{k:"impact",label:_t("Impact (time, errors, cost)")}])}
  <div class="chartbox" id="wastePar"></div>`;
AFTER["kze.waste"]=p=>{S.refresh=()=>{const cnt={};filled(p.kzevent.obs,["observation"]).forEach(o=>cnt[o.waste]=(cnt[o.waste]||0)+1);
  const r=paretoChart(Object.entries(cnt).map(([cat,count])=>({cat:_tv(cat),count})),640,300,_t("Waste by type"));$("#wastePar").innerHTML=r.svg||_t("<p class=\"muted small\" style=\"margin:8px\">Record observations to see where the waste concentrates.</p>")}};
TABS.kze.ideas=()=>`<p class="lead">${_t("Try ideas during the event, quickly and cheaply. An idea on a list is not a result.")}</p>
  ${table("kzevent.ideas",[{k:"idea",label:_t("Idea")},{k:"waste",label:_t("Waste it removes")},{k:"status",label:_t("Status"),opts:["Not tried","Trying","Kept","Dropped"],w:"130px"},{k:"result",label:_t("What happened")}])}<div class="flags" id="ideaFlags"></div>`;
AFTER["kze.ideas"]=p=>{S.refresh=()=>{const r=filled(p.kzevent.ideas,["idea"]),tried=r.filter(x=>x.status!=="Not tried").length,f=[];if(r.length)f.push(tried/r.length<.3?`${_t("Only {tried} of {rCount} ideas tried. A kaizen event is about doing, not listing.",{tried:tried,rCount:r.length})}`:`✓ ${tried} of ${r.length} ideas tried, ${r.filter(x=>x.status==="Kept").length} kept.`);$("#ideaFlags").innerHTML=flagsHTML(f)}};
var chgCalc=r=>{const b=num(r.before),a=num(r.after);if(b==null||a==null||!b)return{t:""};return{t:(a-b>0?"+":"")+fmt((a-b)/Math.abs(b)*100,1)+"%"}};
TABS.kze.results=()=>`${table("kzevent.metrics",[{k:"metric",label:_t("Metric")},{k:"unit",label:_t("Unit"),w:"100px"},{k:"before",label:_t("Before"),type:"text",w:"110px"},{k:"after",label:_t("After"),type:"text",w:"110px"},{k:"target",label:_t("Target"),type:"text",w:"110px"}],{label:_t("Change")})}
  <div class="chartbox" id="kzbar"></div>${inp("kzevent.changes",_t("Changes made and new standard work"),_t("What was changed, and where the new way of working is documented."),{rows:4})}`;
AFTER["kze.results"]=p=>{S.refresh=()=>{fillCalc("kzevent.metrics",chgCalc);$("#kzbar").innerHTML=barCompare(p.kzevent.metrics,_t("Before and after"))||_t("<p class=\"muted small\" style=\"margin:8px\">Enter before and after values to compare.</p>")}};
TABS.kzf.news=()=>`<p class="lead">${_t("Everything not finished during the event. Aim to close all items within 30 days.")}</p>${table("kzfollow.news",[{k:"item",label:_t("Open item")},{k:"owner",label:_t("Owner"),w:"160px"},{k:"due",label:_t("Due"),type:"date",w:"150px"},{k:"status",label:_t("Status"),opts:["Open","In progress","Done","Blocked"],w:"130px"}])}<div class="flags" id="newsFlags"></div>`;
AFTER["kzf.news"]=p=>{S.refresh=()=>{const r=filled(p.kzfollow.news,["item"]),late=r.filter(x=>x.status!=="Done"&&x.due&&new Date(x.due)<new Date()),f=[];if(r.length)f.push(`ℹ ${r.filter(x=>x.status==="Done").length} of ${r.length} items done.`);if(late.length)f.push(`${_t("{lateCount} item{x} past the due date.",{lateCount:late.length,x:late.length>1?_t("s are"):" is"})}`);$("#newsFlags").innerHTML=flagsHTML(f)}};
TABS.kzf.audits=()=>`<p class="lead">${_t("Go back and check the new standard is still followed. Typical rhythm: 30, 60 and 90 days after the event.")}</p>${table("kzfollow.audits",[{k:"date",label:_t("Date"),type:"date",w:"150px"},{k:"finding",label:_t("What you found")},{k:"sustained",label:_t("Sustained?"),opts:["Yes","Partly","No"],w:"120px"}])}`;
TABS.kzf.reportout=()=>`${inp("kzfollow.reportout",_t("Report-out summary"),_t("Results against objectives, what changed, what is still open. Written for the sponsor."),{rows:5})}${inp("kzfollow.lessons",_t("Lessons learned"),"",{rows:3})}`;
AUTO.kzp=p=>{const k=p.kzprep;return{scope:!!(k.scopeStart.trim()&&k.scopeEnd.trim()),objectives:!!k.objectives.trim()&&lines(k.objectives).every(hasNum),team:!!(k.team.trim()&&k.sponsor.trim()),baseline:!!k.prework.trim()&&hasNum(k.prework)}};
AUTO.kze=p=>{const e=p.kzevent;return{observed:filled(e.obs,["observation"]).length>=5,tried:filled(e.ideas,["idea"]).some(x=>x.status!=="Not tried"),measured:filled(e.metrics,["metric","before","after"]).length>0,standard:!!e.changes.trim()}};
AUTO.kzf=p=>{const f=p.kzfollow,r=filled(f.news,["item"]),a=filled(f.audits,["date"]);return{closed:r.length>0&&r.every(x=>x.status==="Done"),audited:a.length>=2,sustained:a.length>0&&a[a.length-1].sustained==="Yes",lessons:!!f.lessons.trim()}};
EXTRA.kze=p=>({wasteCounts:filled(p.kzevent.obs,["observation"]).reduce((m,o)=>(m[o.waste]=(m[o.waste]||0)+1,m),{}),baselineFromPrework:p.kzprep.prework,objectives:p.kzprep.objectives});
