/* ================= Kaizen event ================= */
const WASTES=["Transport","Inventory","Motion","Waiting","Overproduction","Overprocessing","Defects","Skills (unused talent)"];
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
registerTool("Kaizen event",{gate:"Checkpoint",stages:[
 {id:"kzp",letter:"P",name:"Prepare",key:"kzprep",tabs:[["charter","Event charter"],["prework","Pre-work"],["agenda","Agenda and logistics"]],
  tg:[["scope","Scope has a clear start and end point and fits in the event"],["objectives","Objectives are measurable"],["team","Team includes people who do the work, plus a sponsor"],["baseline","Baseline data collected before the event"],["freed","Team members are released from normal work for the event"],["sponsor","Sponsor has approved the charter and will attend the report-out"]],
  focus:"scope narrow enough for 3 to 5 days, with clear start and end; measurable objectives; team includes operators and at least one outsider; sponsor committed; baseline data and a process walk done before the event; constraints and boundaries of authority clear."},
 {id:"kze",letter:"E",name:"Event",key:"kzevent",tabs:[["waste","Waste walk"],["ideas","Ideas and try-storming"],["results","Before and after"]],
  tg:[["observed","Current state observed at the place of work, waste recorded by type"],["tried","Ideas tried during the event, not only listed"],["measured","Results measured against the baseline"],["standard","New standard work documented"],["reportout","Report-out given to the sponsor"]],
  focus:"waste observed directly and classified correctly; ideas actually tried (try-storming) rather than listed; results measured with the same metric as the baseline; changes documented as new standard work; unrealistic claims challenged."},
 {id:"kzf",letter:"F",name:"Follow-up",key:"kzfollow",tabs:[["news","Kaizen newspaper"],["audits","Sustain audits"],["reportout","Report-out and lessons"]],
  tg:[["closed","Open items closed within 30 days"],["audited","Sustain audits done (e.g. at 30, 60 and 90 days)"],["sustained","Results sustained at the last audit"],["lessons","Lessons learned shared"],["sponsor","Sponsor has closed the event"]],
  focus:"open items have owners and dates and are closed within about 30 days; sustain audits done and honest; results held after 90 days; slippage acknowledged with a response."}
]});
CONTEXT["Kaizen event"]=p=>({problem:p.kzprep.problem,objectives:p.kzprep.objectives,scope:p.kzprep.scopeStart+" to "+p.kzprep.scopeEnd});

TABS.kzp.charter=()=>`${inp("kzprep.problem","Problem or opportunity","What is wrong today, with numbers. No solutions.",{rows:3})}
  <div class="grid2">${inp("kzprep.scopeStart","Process starts at","First step in scope.",{rows:1})}${inp("kzprep.scopeEnd","Process ends at","Last step in scope.",{rows:1})}</div>
  ${inp("kzprep.objectives","Objectives","Measurable targets for the end of the event. One per line.",{rows:3})}
  <div class="grid2">${inp("kzprep.outScope","Out of scope","",{rows:2})}${inp("kzprep.constraints","Constraints","Budget, systems or rules the team cannot change.",{rows:2})}</div>
  <fieldset><legend>Team</legend><div class="grid3">${inp("kzprep.sponsor","Sponsor","",{rows:1})}${inp("kzprep.leader","Event leader","",{rows:1})}${inp("kzprep.team","Team","Names and roles. Include people who do the work.",{rows:1})}</div></fieldset>
  <div class="grid2">${inp("kzprep.start","First day","",{type:"date"})}${inp("kzprep.end","Last day","",{type:"date"})}</div><div class="flags" id="kzflags"></div>`;
AFTER["kzp.charter"]=p=>{S.refresh=()=>{const k=p.kzprep,f=[];setFlags("kzprep.problem",checkProblem(k.problem).filter(x=>!x.startsWith("Very short")));
  if(k.objectives.trim()){const ol=lines(k.objectives);const nn=ol.filter(o=>!hasNum(o));if(nn.length)f.push(`${nn.length} objective${nn.length>1?"s have":" has"} no number.`);else f.push("✓ All objectives have a number.")}
  if(k.start&&k.end){const d=(new Date(k.end)-new Date(k.start))/864e5+1;if(d>5)f.push(`${d} days. A kaizen event is usually 3 to 5 days; longer suggests the scope is too big.`);if(d<1)f.push("The last day is before the first day.")}
  $("#kzflags").innerHTML=flagsHTML(f)}};
TABS.kzp.prework=()=>`${inp("kzprep.prework","Baseline data collected","Which metrics, over what period, and their values. You will compare against these on the last day.",{rows:4})}
  ${inp("kzprep.walk","Process walk","Who walked the process, when, and what they saw.",{rows:3})}
  ${inp("kzprep.informed","Stakeholders informed","Who needs to know the event is happening, including those affected by changes.",{rows:2})}`;
TABS.kzp.agenda=()=>`${inp("kzprep.agenda","Agenda","Day by day.",{rows:8,ph:"Day 1: kick-off, training, go and see the process, map the current state\nDay 2: waste walk, root causes, ideas\nDay 3: try-storm the best ideas, measure\nDay 4: standardise, train, measure again\nDay 5: report-out to sponsor, follow-up plan"})}
  ${inp("kzprep.logistics","Logistics","Room, materials, access to systems, cover for the team's normal work.",{rows:3})}`;
TABS.kze.waste=()=>`<p class="lead">Walk the process and record every waste you see. One observation per row.</p>
  ${table("kzevent.obs",[{k:"step",label:"Process step"},{k:"waste",label:"Type of waste",opts:WASTES,w:"190px"},{k:"observation",label:"What you saw"},{k:"impact",label:"Impact (time, errors, cost)"}])}
  <div class="chartbox" id="wastePar"></div>`;
AFTER["kze.waste"]=p=>{S.refresh=()=>{const cnt={};filled(p.kzevent.obs,["observation"]).forEach(o=>cnt[o.waste]=(cnt[o.waste]||0)+1);
  const r=paretoChart(Object.entries(cnt).map(([cat,count])=>({cat,count})),640,300,"Waste by type");$("#wastePar").innerHTML=r.svg||'<p class="muted small" style="margin:8px">Record observations to see where the waste concentrates.</p>'}};
TABS.kze.ideas=()=>`<p class="lead">Try ideas during the event, quickly and cheaply. An idea on a list is not a result.</p>
  ${table("kzevent.ideas",[{k:"idea",label:"Idea"},{k:"waste",label:"Waste it removes"},{k:"status",label:"Status",opts:["Not tried","Trying","Kept","Dropped"],w:"130px"},{k:"result",label:"What happened"}])}<div class="flags" id="ideaFlags"></div>`;
AFTER["kze.ideas"]=p=>{S.refresh=()=>{const r=filled(p.kzevent.ideas,["idea"]),tried=r.filter(x=>x.status!=="Not tried").length,f=[];if(r.length)f.push(tried/r.length<.3?`Only ${tried} of ${r.length} ideas tried. A kaizen event is about doing, not listing.`:`✓ ${tried} of ${r.length} ideas tried, ${r.filter(x=>x.status==="Kept").length} kept.`);$("#ideaFlags").innerHTML=flagsHTML(f)}};
const chgCalc=r=>{const b=num(r.before),a=num(r.after);if(b==null||a==null||!b)return{t:""};return{t:(a-b>0?"+":"")+fmt((a-b)/Math.abs(b)*100,1)+"%"}};
TABS.kze.results=()=>`${table("kzevent.metrics",[{k:"metric",label:"Metric"},{k:"unit",label:"Unit",w:"100px"},{k:"before",label:"Before",type:"text",w:"110px"},{k:"after",label:"After",type:"text",w:"110px"},{k:"target",label:"Target",type:"text",w:"110px"}],{label:"Change"})}
  <div class="chartbox" id="kzbar"></div>${inp("kzevent.changes","Changes made and new standard work","What was changed, and where the new way of working is documented.",{rows:4})}`;
AFTER["kze.results"]=p=>{S.refresh=()=>{fillCalc("kzevent.metrics",chgCalc);$("#kzbar").innerHTML=barCompare(p.kzevent.metrics,"Before and after")||'<p class="muted small" style="margin:8px">Enter before and after values to compare.</p>'}};
TABS.kzf.news=()=>`<p class="lead">Everything not finished during the event. Aim to close all items within 30 days.</p>${table("kzfollow.news",[{k:"item",label:"Open item"},{k:"owner",label:"Owner",w:"160px"},{k:"due",label:"Due",type:"date",w:"150px"},{k:"status",label:"Status",opts:["Open","In progress","Done","Blocked"],w:"130px"}])}<div class="flags" id="newsFlags"></div>`;
AFTER["kzf.news"]=p=>{S.refresh=()=>{const r=filled(p.kzfollow.news,["item"]),late=r.filter(x=>x.status!=="Done"&&x.due&&new Date(x.due)<new Date()),f=[];if(r.length)f.push(`ℹ ${r.filter(x=>x.status==="Done").length} of ${r.length} items done.`);if(late.length)f.push(`${late.length} item${late.length>1?"s are":" is"} past the due date.`);$("#newsFlags").innerHTML=flagsHTML(f)}};
TABS.kzf.audits=()=>`<p class="lead">Go back and check the new standard is still followed. Typical rhythm: 30, 60 and 90 days after the event.</p>${table("kzfollow.audits",[{k:"date",label:"Date",type:"date",w:"150px"},{k:"finding",label:"What you found"},{k:"sustained",label:"Sustained?",opts:["Yes","Partly","No"],w:"120px"}])}`;
TABS.kzf.reportout=()=>`${inp("kzfollow.reportout","Report-out summary","Results against objectives, what changed, what is still open. Written for the sponsor.",{rows:5})}${inp("kzfollow.lessons","Lessons learned","",{rows:3})}`;
AUTO.kzp=p=>{const k=p.kzprep;return{scope:!!(k.scopeStart.trim()&&k.scopeEnd.trim()),objectives:!!k.objectives.trim()&&lines(k.objectives).every(hasNum),team:!!(k.team.trim()&&k.sponsor.trim()),baseline:!!k.prework.trim()&&hasNum(k.prework)}};
AUTO.kze=p=>{const e=p.kzevent;return{observed:filled(e.obs,["observation"]).length>=5,tried:filled(e.ideas,["idea"]).some(x=>x.status!=="Not tried"),measured:filled(e.metrics,["metric","before","after"]).length>0,standard:!!e.changes.trim()}};
AUTO.kzf=p=>{const f=p.kzfollow,r=filled(f.news,["item"]),a=filled(f.audits,["date"]);return{closed:r.length>0&&r.every(x=>x.status==="Done"),audited:a.length>=2,sustained:a.length>0&&a[a.length-1].sustained==="Yes",lessons:!!f.lessons.trim()}};
EXTRA.kze=p=>({wasteCounts:filled(p.kzevent.obs,["observation"]).reduce((m,o)=>(m[o.waste]=(m[o.waste]||0)+1,m),{}),baselineFromPrework:p.kzprep.prework,objectives:p.kzprep.objectives});
