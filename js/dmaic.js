/* ================= DMAIC ================= */
Object.assign(BLANK,{
 "define.voc":{customer:"",voice:"",driver:"",ctq:"",spec:""},
 "measure.plan":{metric:"",type:"Y",definition:"",source:"",sample:"",who:""},
 "measure.map":{step:"",kind:"VA",time:""},
 "analyse.pareto":{cat:"",count:""},
 "analyse.causes":{cause:"",test:"",evidence:"",result:"Pending"},
 "analyse.whys":{...WHYBLANK},
 "improve.solutions":{solution:"",cause:"",impact:"3",effort:"3"},
 "improve.fmea":{mode:"",effect:"",s:"",o:"",d:"",action:""},
 "improve.actions":{action:"",owner:"",due:"",status:"Open"},
 "control.plan":{metric:"",target:"",method:"",freq:"",owner:"",reaction:""}
});
Object.assign(STAGEBLANK,{
 define:()=>({charter:{businessCase:"",problem:"",baseline:"",goal:"",inScope:"",outScope:"",sponsor:"",processOwner:"",lead:"",team:"",start:"",tollgateDate:"",benefit:""},sipoc:{s:"",i:"",p:"",o:"",c:""},voc:rows("define.voc")}),
 measure:()=>({plan:rows("measure.plan"),msa:{method:"",grr:"",ndc:"",notes:""},baseline:{data:"",unit:"",lsl:"",usl:"",notes:""},map:rows("measure.map")}),
 analyse:()=>({fishbone:FISHBLANK(),whys:rows("analyse.whys"),pareto:rows("analyse.pareto"),tests:[],causes:rows("analyse.causes")}),
 improve:()=>({solutions:rows("improve.solutions"),fmea:rows("improve.fmea"),pilot:{scope:"",duration:"",criteria:"",before:"",after:"",notes:""},actions:rows("improve.actions")}),
 control:()=>({plan:rows("control.plan"),chart:{data:"",notes:""},closure:{docs:"",handover:"",finance:"",lessons:"",closedOn:""}})
});
registerTool("DMAIC",{gate:"Tollgate",stages:[
 {id:"D",letter:"D",name:"Define",key:"define",tabs:[["charter","Project charter"],["sipoc","SIPOC"],["voc","Voice of the customer"],["notes","Advisor notes"]],
  tg:[["problem","Problem statement describes the gap, with no cause or solution in it"],["baseline","Current performance is quantified (baseline metric with source)"],["goal","Goal is SMART and tied to the baseline metric"],["scope","In-scope and out-of-scope boundaries are written and agreed"],["roles","Sponsor and process owner are named and have accepted"],["sipoc","SIPOC is complete, with 4 to 7 high-level process steps"],["ctq","Voice of the customer is translated into measurable CTQs"],["benefit","Expected benefit (money, time, quality, risk) is estimated"],["plan","Timeline to the Measure tollgate is agreed"],["signoff","Sponsor has reviewed and signed off the charter"]],
  focus:"problem statement free of causes and solutions, quantified and time-bound; baseline and goal use the same metric; goal SMART and realistic; scope clear and winnable; roles filled; SIPOC 4 to 7 steps and consistent with scope; CTQs measurable and traceable to the voice of the customer; credible business case."},
 {id:"M",letter:"M",name:"Measure",key:"measure",tabs:[["plan","Data collection plan"],["msa","Measurement system"],["baseline","Baseline and capability"],["map","As-is process map"]],
  tg:[["plan","Data collection plan with operational definitions for Y and key Xs"],["msa","Measurement system checked and acceptable"],["baseline","Baseline data collected (at least 20 to 30 points)"],["stable","Baseline is stable enough to interpret, or signals are explained"],["capability","Baseline capability or sigma level calculated"],["map","As-is process mapped with value-added and non-value-added steps"],["goalcheck","Goal re-confirmed against the real baseline"],["signoff","Sponsor has signed off the Measure tollgate"]],
  focus:"operational definitions precise enough for two people to get the same number; data covers the Y and key Xs; measurement system checked and acceptable; sample size adequate; baseline stable or signals explained; capability interpreted correctly (not on unstable data); as-is map realistic with VA/NVA split; goal still realistic given the baseline."},
 {id:"A",letter:"A",name:"Analyse",key:"analyse",tabs:[["fishbone","Cause and effect"],["whys","5 Whys"],["pareto","Pareto"],["tests","Hypothesis tests"],["validation","Root cause validation"]],
  tg:[["fishbone","Potential causes brainstormed with people who do the work"],["whys","Causal chains followed to a controllable root cause"],["pareto","Vital few categories identified"],["tested","Suspected causes tested statistically where data allows"],["validated","Root causes validated with data, not opinion"],["quantified","Impact of each root cause on the Y is estimated"],["signoff","Sponsor has signed off the Analyse tollgate"]],
  focus:"causes are hypotheses until tested; 5 Whys reach controllable causes without leaps; Pareto stratification sensible; hypothesis tests chosen correctly for the data type, assumptions respected, p-values interpreted correctly (failing to reject is not proof of no effect, statistical is not practical significance); validation uses data, not opinion; correlation not confused with causation."},
 {id:"I",letter:"I",name:"Improve",key:"improve",tabs:[["solutions","Solutions"],["fmea","Risk (FMEA)"],["pilot","Pilot"],["actions","Implementation plan"]],
  tg:[["solutions","Each validated root cause has at least one solution"],["prioritised","Solutions prioritised on impact and effort"],["fmea","Risks assessed and high-risk failure modes mitigated"],["pilot","Pilot run with success criteria defined before starting"],["results","Pilot results meet the goal"],["plan","Full implementation plan has owners and dates"],["signoff","Sponsor has signed off the Improve tollgate"]],
  focus:"every solution targets a confirmed root cause; prioritisation sensible; FMEA covers the new process and high risks are mitigated; pilot had pre-defined success criteria and results meet the goal; implementation plan has single owners and dates."},
 {id:"C",letter:"C",name:"Control",key:"control",tabs:[["controlplan","Control plan"],["chart","Control chart"],["closure","Handover and closure"]],
  tg:[["controlplan","Control plan with owners and reaction plans"],["chart","Process is in statistical control at the new level"],["standard","Standard work and documentation updated, people trained"],["handover","Process owner has formally accepted the process"],["finance","Benefits validated (by finance where money is claimed)"],["lessons","Lessons learned recorded and shared"],["signoff","Sponsor has signed off project closure"]],
  focus:"control plan has owners, frequencies and reaction plans; control chart shows stability at the new level; documentation and training complete; process owner accepted; benefits validated against the charter; lessons learned useful."}
]});
CONTEXT.DMAIC=p=>({problem:p.define.charter.problem,baseline:p.define.charter.baseline,goal:p.define.charter.goal});

/* ----- Define ----- */
TABS.D.charter=()=>`
  ${inp("define.charter.businessCase","Business case","Why this project, why now, and what it costs to leave it alone.")}
  ${inp("define.charter.problem","Problem statement","What is wrong, where, since when, how much, and the impact. No causes, no solutions.",{rows:4})}
  ${inp("define.charter.baseline","Baseline metric","The primary metric (Y), its current value and where the number comes from.",{rows:1})}
  ${inp("define.charter.goal","Goal statement","Target value for the same metric, and the date.",{rows:2})}
  <div class="grid2">${inp("define.charter.inScope","In scope","Process start and end points, sites, products, teams.")}${inp("define.charter.outScope","Out of scope","What you will explicitly not touch.")}</div>
  <fieldset><legend>Team</legend><div class="grid2">
    ${inp("define.charter.sponsor","Sponsor","Owns the business result, removes barriers.",{rows:1})}${inp("define.charter.processOwner","Process owner","Will own the process after Control.",{rows:1})}
    ${inp("define.charter.lead","Project lead / belt","",{rows:1})}${inp("define.charter.team","Core team","Names and roles.",{rows:1})}</div></fieldset>
  <div class="grid2">${inp("define.charter.start","Start date","",{type:"date"})}${inp("define.charter.tollgateDate","Define tollgate date","",{type:"date"})}</div>
  ${inp("define.charter.benefit","Expected benefit","Money, time, quality or risk, with the assumptions behind the estimate.",{rows:2})}`;
AFTER["D.charter"]=p=>{S.refresh=()=>{setFlags("define.charter.problem",checkProblem(p.define.charter.problem));setFlags("define.charter.goal",checkGoal(p.define.charter.goal))}};
TABS.D.sipoc=p=>{const cols=[["s","S","Suppliers"],["i","I","Inputs"],["p","P","Process"],["o","O","Outputs"],["c","C","Customers"]];
  return `<p class="lead">One item per line. Fill Process first, then outputs and customers, then inputs and suppliers.</p>
  <div class="sipoc">${cols.map(([k,l,n])=>`<div class="col"><h3><span>${l}</span>${n}</h3><textarea data-bind="define.sipoc.${k}" aria-label="${n}">${esc(p.define.sipoc[k])}</textarea></div>`).join("")}</div><div class="flags" id="sipocFlags"></div>`};
AFTER["D.sipoc"]=p=>{S.refresh=()=>{const n=lines(p.define.sipoc.p).length,f=[];if(n&&n<4)f.push(`Only ${n} process step${n===1?"":"s"}. Too coarse to scope anything.`);if(n>7)f.push(`${n} steps. SIPOC is a high-level view; detailed mapping belongs in Measure.`);if(n>=4&&n<=7)f.push(`✓ ${n} process steps.`);$("#sipocFlags").innerHTML=flagsHTML(f)}};
TABS.D.voc=()=>`<p class="lead">A CTQ without a specification or target is still a wish.</p>${table("define.voc",[{k:"customer",label:"Customer"},{k:"voice",label:"What they say"},{k:"driver",label:"Key driver"},{k:"ctq",label:"CTQ (measurable)"},{k:"spec",label:"Specification / target"}])}`;
TABS.D.notes=p=>p.advisorNotes?`<p style="white-space:pre-wrap;margin:0">${esc(p.advisorNotes)}</p>`:`<p class="muted">No advisor conversation for this project.</p>`;

/* ----- Measure ----- */
TABS.M.plan=()=>table("measure.plan",[{k:"metric",label:"Metric"},{k:"type",label:"Y or X",opts:["Y","X"],w:"80px"},{k:"definition",label:"Operational definition"},{k:"source",label:"Data source"},{k:"sample",label:"Sample size and frequency"},{k:"who",label:"Who collects"}]);
TABS.M.msa=()=>`${inp("measure.msa.method","Method","",{options:["","Gauge R&R (variable data)","Attribute agreement analysis","Data audit (transactional or system data)","Not done"]})}
  <div class="grid2">${inp("measure.msa.grr","%GRR (study variation)","Gauge R&R only.",{rows:1})}${inp("measure.msa.ndc","Number of distinct categories","Gauge R&R only. 5 or more is acceptable.",{rows:1})}</div>
  ${inp("measure.msa.notes","Result and actions","What you checked, what you found, what you changed.",{rows:4})}<div class="flags" id="msaFlags"></div>`;
AFTER["M.msa"]=p=>{S.refresh=()=>{const m=p.measure.msa,g=num(m.grr),n=num(m.ndc),f=[];
  if(m.method==="Not done")f.push("No measurement check. Every conclusion from here on is exposed.");
  if(m.method.startsWith("Gauge")){if(g==null)f.push("Enter the %GRR.");else if(g<10)f.push("✓ %GRR below 10: measurement system acceptable.");else if(g<=30)f.push("%GRR between 10 and 30: marginal. Acceptable only with justification.");else f.push("%GRR above 30: not fit for use. Fix it before collecting the baseline.");
    if(n!=null&&n<5)f.push("Fewer than 5 distinct categories: the gauge cannot discriminate between parts.")}
  if(m.method.startsWith("Data audit"))f.push("ℹ For system data, check a sample against the source record: missing values, timestamps, how the field is really filled in.");
  $("#msaFlags").innerHTML=flagsHTML(f)}};
TABS.M.baseline=()=>`<p class="lead">Paste the baseline data in time order, one value per line. Decimal comma or point both work.</p>
  <div class="grid2">${inp("measure.baseline.data","Baseline data (time order)","",{rows:8})}<div>${inp("measure.baseline.unit","Unit","e.g. days, minutes, % errors",{rows:1})}<div class="grid2">${inp("measure.baseline.lsl","Lower spec limit","Empty if one-sided",{rows:1})}${inp("measure.baseline.usl","Upper spec limit","",{rows:1})}</div></div></div>
  <div id="baseOut"></div>${inp("measure.baseline.notes","Interpretation","What does the baseline tell you? Is the goal still realistic?",{rows:3})}`;
AFTER["M.baseline"]=p=>{S.refresh=()=>{const b=p.measure.baseline,x=parseNums(b.data),out=$("#baseOut");if(!x.length){out.innerHTML="";return}
  const st=stats(x),cap=capability(x,b.lsl,b.usl),side=longestSide(x,st.median),tr=longestTrend(x),f=[];
  if(st.n<20)f.push(`Only ${st.n} points. Aim for at least 20 to 30 before drawing conclusions.`);
  if(side.len>=6)f.push(`Shift: ${side.len} points in a row on one side of the median. Something changed in the process.`);
  if(tr>=5)f.push(`Trend: ${tr} points in a row going the same way.`);
  if(st.n>=10&&side.len<6&&tr<5)f.push("✓ No shift or trend signals on the run chart.");
  if(cap&&cap.cpk!=null)f.push("ℹ Cp and Cpk assume a stable, roughly normal process. With signals above, treat them as indicative only.");
  out.innerHTML=statsHTML([["n",st.n],["Mean",fmt(st.mean)],["Median",fmt(st.median)],["Std dev",fmt(st.sd)],["Min",fmt(st.min)],["Max",fmt(st.max)],
    ...(cap&&cap.out!=null?[["Out of spec",`${cap.out} (${fmt(cap.out/st.n*100,1)}%)`],["Cp",fmt(cap.cp)],["Cpk",fmt(cap.cpk)],["DPMO",fmt(cap.dpmo,0)],["Sigma level",cap.sigma==null?"n/a (no defects)":fmt(cap.sigma,1)]]:[])])+
    `<div class="chartbox">${lineChart({values:x,title:"Run chart"+(b.unit?" ("+b.unit+")":""),lines:[{v:st.median,label:"Median",c:C.light,dash:1},{v:num(b.lsl),label:"LSL",c:C.orange},{v:num(b.usl),label:"USL",c:C.orange}],flagIdx:side.len>=6?side.idx:[]})}</div><div class="flags">${flagsHTML(f)}</div>`}};
TABS.M.map=()=>`<p class="lead">Classify each step: value-added (the customer would pay for it), necessary non-value-added (required, e.g. legal), or waste.</p>
  ${table("measure.map",[{k:"step",label:"Step"},{k:"kind",label:"Type",opts:["VA","NNVA","NVA"],w:"100px"},{k:"time",label:"Time (same unit for all)",type:"text",w:"160px"}])}<div class="flags" id="mapFlags"></div>`;
const pceOf=r=>{const t=k=>r.filter(x=>x.kind===k).reduce((a,x)=>a+(num(x.time)||0),0),tot=t("VA")+t("NNVA")+t("NVA");return{va:t("VA"),nnva:t("NNVA"),nva:t("NVA"),tot,pce:tot?t("VA")/tot*100:null}};
AFTER["M.map"]=p=>{S.refresh=()=>{const c=pceOf(filled(p.measure.map,["step"])),f=[];
  if(c.tot>0){f.push(`ℹ Process cycle efficiency: ${fmt(c.pce,1)}% value-added time (${fmt(c.va)} of ${fmt(c.tot)}). Waste: ${fmt(c.nva)}, necessary non-value-added: ${fmt(c.nnva)}.`);if(c.pce<10)f.push("Below 10% value-added is typical of transactional processes: most of the lead time is waiting.")}
  $("#mapFlags").innerHTML=flagsHTML(f)}};

/* ----- Analyse ----- */
TABS.A.fishbone=()=>`<p class="lead">One cause per line. These are hypotheses, not findings.</p>`+fishHTML("analyse.fishbone");
AFTER["A.fishbone"]=fishAfter("analyse.fishbone",p=>p.define.charter.problem||p.title);
TABS.A.whys=()=>`<p class="lead">Follow one symptom at a time. If a "why" needs a guess, go and look.</p>`+whysHTML("analyse.whys");
TABS.A.pareto=()=>`<div class="grid2"><div>${table("analyse.pareto",[{k:"cat",label:"Category"},{k:"count",label:"Count",type:"text",w:"110px"}])}</div><div><div class="chartbox" id="parOut"></div><div class="flags" id="parFlags"></div></div></div>`;
function paretoAfter(path){return p=>{S.refresh=()=>{const r=paretoChart(getPath(p,path),560,320);$("#parOut").innerHTML=r.svg||'<p class="muted small" style="margin:8px">Add categories and counts to see the chart.</p>';
  const f=[];if(r.d){if(r.vital.length)f.push(`ℹ Vital few: ${r.vital.join(", ")} (${fmt(r.d[r.vital.length-1].cum,0)}% of ${r.total}).`);if(r.d.length>=4&&r.vital.length/r.d.length>.6)f.push("No clear Pareto effect. Try a different stratification.")}
  $("#parFlags").innerHTML=flagsHTML(f)}}}
AFTER["A.pareto"]=paretoAfter("analyse.pareto");
TABS.A.validation=()=>table("analyse.causes",[{k:"cause",label:"Suspected cause"},{k:"test",label:"How it was tested"},{k:"evidence",label:"Evidence and result"},{k:"result",label:"Status",opts:["Pending","Confirmed","Rejected"],w:"130px"}])+`<div class="flags" id="valFlags"></div>`;
AFTER["A.validation"]=p=>{S.refresh=()=>{const f=[];p.analyse.causes.forEach((c,i)=>{if(c.result==="Confirmed"&&!c.evidence.trim())f.push(`Row ${i+1}: confirmed with no evidence recorded.`);if(c.result==="Confirmed"&&/\b(team agreed|everyone knows|vote|consensus|we think)\b/i.test(c.evidence))f.push(`Row ${i+1}: agreement is not evidence.`)});
  const n=p.analyse.causes.filter(c=>c.result==="Confirmed").length;if(n)f.push(`✓ ${n} root cause${n>1?"s":""} confirmed.`);$("#valFlags").innerHTML=flagsHTML(f)}};

/* ----- Improve ----- */
const solCalc=r=>{const i=num(r.impact),e=num(r.effort);return{t:i&&e?quadrant(i,e):"",hi:i&&e&&quadrant(i,e)==="Quick win"}};
TABS.I.solutions=()=>`<p class="lead">Score impact and effort from 1 to 5.</p>${table("improve.solutions",[{k:"solution",label:"Solution"},{k:"cause",label:"Root cause it addresses"},{k:"impact",label:"Impact",type:"number",min:1,max:5,w:"80px"},{k:"effort",label:"Effort",type:"number",min:1,max:5,w:"80px"}],{label:"Quadrant"})}
  <div class="chartbox" id="matOut" style="max-width:460px"></div><div class="flags" id="solFlags"></div>`;
AFTER["I.solutions"]=p=>{S.refresh=()=>{fillCalc("improve.solutions",solCalc);$("#matOut").innerHTML=matrixChart(p.improve.solutions);
  const f=[];p.improve.solutions.forEach((s,i)=>{if(s.solution.trim()&&!s.cause.trim())f.push(`Solution ${i+1} is not linked to a root cause. Solution looking for a problem?`)});
  if(!p.analyse.causes.some(c=>c.result==="Confirmed"))f.push("No confirmed root causes in Analyse yet. You are improving on assumptions.");
  $("#solFlags").innerHTML=flagsHTML(f)}};
const rpnCalc=r=>{const s=num(r.s),o=num(r.o),d=num(r.d);if(!s||!o||!d)return{t:""};const v=s*o*d;return{t:String(v),hi:v>=100||s>=9}};
TABS.I.fmea=()=>`<p class="lead">Score severity, occurrence and detection from 1 to 10. RPN of 100 or more, or severity 9 to 10, needs an action.</p>${table("improve.fmea",[{k:"mode",label:"Failure mode"},{k:"effect",label:"Effect"},{k:"s",label:"S",type:"number",min:1,max:10,w:"70px"},{k:"o",label:"O",type:"number",min:1,max:10,w:"70px"},{k:"d",label:"D",type:"number",min:1,max:10,w:"70px"},{k:"action",label:"Mitigation"}],{label:"RPN"})}<div class="flags" id="fmFlags"></div>`;
AFTER["I.fmea"]=p=>{S.refresh=()=>{fillCalc("improve.fmea",rpnCalc);const f=[];p.improve.fmea.forEach((r,i)=>{if(rpnCalc(r).hi&&!r.action.trim())f.push(`Row ${i+1}: high risk with no mitigation.`)});$("#fmFlags").innerHTML=flagsHTML(f)}};
TABS.I.pilot=()=>`<div class="grid2">${inp("improve.pilot.scope","Pilot scope","Where, who, which volume.",{rows:2})}${inp("improve.pilot.duration","Duration","",{rows:1})}</div>
  ${inp("improve.pilot.criteria","Success criteria","Written before the pilot. Use the project Y.",{rows:2})}
  <div class="grid2">${inp("improve.pilot.before","Y before (baseline)","A single number",{rows:1})}${inp("improve.pilot.after","Y during pilot","A single number",{rows:1})}</div>
  <div class="flags" id="pilotFlags"></div>${inp("improve.pilot.notes","Observations and side effects","",{rows:3})}`;
AFTER["I.pilot"]=p=>{S.refresh=()=>{const b=num(p.improve.pilot.before),a=num(p.improve.pilot.after),f=[];
  if(b!=null&&a!=null&&b!==0)f.push(`ℹ Change: ${fmt(a-b)} (${fmt((a-b)/Math.abs(b)*100,1)}%). Compare against the goal: "${trunc(p.define.charter.goal||"no goal written",90)}"`);
  if(b!=null&&a!=null)f.push("ℹ One number before and after is not proof. Use a 2-sample test in Analyse, or a run chart of the pilot data.");
  $("#pilotFlags").innerHTML=flagsHTML(f)}};
TABS.I.actions=()=>table("improve.actions",[{k:"action",label:"Action"},{k:"owner",label:"Owner",w:"160px"},{k:"due",label:"Due",type:"date",w:"150px"},{k:"status",label:"Status",opts:["Open","In progress","Done","Blocked"],w:"130px"}]);

/* ----- Control ----- */
TABS.C.controlplan=()=>table("control.plan",[{k:"metric",label:"What is controlled"},{k:"target",label:"Target / limits"},{k:"method",label:"Measurement method"},{k:"freq",label:"Frequency"},{k:"owner",label:"Owner"},{k:"reaction",label:"Reaction plan (if out of limits)"}]);
TABS.C.chart=()=>`<div class="grid2">${inp("control.chart.data","Data after implementation (time order)","One value per line.",{rows:8})}${inp("control.chart.notes","Interpretation","Stable at the new level? What caused any signals?",{rows:8})}</div><div id="ctlOut"></div>`;
function imrBlock(x,baseMean){const r=imr(x);if(!r)return "";const f=[];
  if(r.st.n<20)f.push(`Only ${r.st.n} points. Limits are unreliable below about 20.`);
  if(r.outside.length)f.push(`${r.outside.length} point${r.outside.length>1?"s":""} outside the control limits (points ${r.outside.map(i=>i+1).join(", ")}). Special cause: investigate.`);
  if(r.runIdx.length)f.push(`${r.run.len} points in a row on one side of the mean. The process has shifted.`);
  if(!r.outside.length&&!r.runIdx.length&&r.st.n>=20)f.push("✓ No out-of-control signals: the process looks stable.");
  if(baseMean!=null)f.push(`ℹ Baseline mean ${fmt(baseMean)} against ${fmt(r.st.mean)} now (${fmt((r.st.mean-baseMean)/Math.abs(baseMean||1)*100,1)}%).`);
  return statsHTML([["n",r.st.n],["Mean",fmt(r.st.mean)],["UCL",fmt(r.ucl)],["LCL",fmt(r.lcl)],["MR-bar",fmt(r.mrbar)],["MR UCL",fmt(r.mrUcl)]])+
    `<div class="chartbox">${imrSVG(x,r)}</div><div class="flags">${flagsHTML(f)}</div>`}
const imrSVG=(x,r)=>lineChart({values:x,title:"Individuals chart",lines:[{v:r.st.mean,label:"Mean",c:C.light},{v:r.ucl,label:"UCL",c:C.orange,dash:1},{v:r.lcl,label:"LCL",c:C.orange,dash:1}],flagIdx:[...r.outside,...r.runIdx]});
AFTER["C.chart"]=p=>{S.refresh=()=>{const b=stats(parseNums(p.measure.baseline.data));$("#ctlOut").innerHTML=imrBlock(parseNums(p.control.chart.data),b.n?b.mean:null)}};
TABS.C.closure=()=>`
  ${inp("control.closure.docs","Standard work and documentation","Which procedures, instructions or system settings changed, and who was trained.",{rows:3})}
  ${inp("control.closure.handover","Handover to the process owner","Who accepted, when, and what they now monitor.",{rows:2})}
  ${inp("control.closure.finance","Validated benefits","Actual results against the charter. Who validated them.",{rows:3})}
  ${inp("control.closure.lessons","Lessons learned","What would you do differently? What can be replicated elsewhere?",{rows:3})}
  ${inp("control.closure.closedOn","Closure date","",{type:"date"})}`;

/* ----- automatic checks ----- */
AUTO.D=p=>{const c=p.define.charter,s=p.define.sipoc,steps=lines(s.p).length,pf=checkProblem(c.problem);
  return{problem:!!c.problem.trim()&&pf.length===1&&pf[0].startsWith("✓"),baseline:!!c.baseline.trim()&&hasNum(c.baseline),goal:!!c.goal.trim()&&hasNum(c.goal)&&hasTime(c.goal),scope:!!c.inScope.trim()&&!!c.outScope.trim(),roles:!!c.sponsor.trim()&&!!c.processOwner.trim(),sipoc:["s","i","o","c"].every(k=>s[k].trim())&&steps>=4&&steps<=7,ctq:filled(p.define.voc,["ctq","spec"]).length>0,benefit:!!c.benefit.trim(),plan:!!c.tollgateDate}};
AUTO.M=p=>{const m=p.measure,x=parseNums(m.baseline.data),st=stats(x),grr=num(m.msa.grr);
  return{plan:filled(m.plan,["metric","definition","source"]).length>0,msa:!!m.msa.method&&m.msa.method!=="Not done"&&(m.msa.method.startsWith("Gauge")?grr!=null&&grr<30:!!m.msa.notes.trim()),baseline:st.n>=20,stable:st.n>=10?longestSide(x,st.median).len<6&&longestTrend(x)<5:false,capability:st.n>=20&&(num(m.baseline.lsl)!=null||num(m.baseline.usl)!=null),map:filled(m.map,["step"]).length>=3}};
AUTO.A=p=>{const a=p.analyse;return{fishbone:fishCount(a.fishbone)>=6,whys:whyOK(a.whys),pareto:filled(a.pareto,["cat","count"]).length>=3,tested:a.tests.some(t=>{const r=runTest(t);return r&&r.ok}),validated:a.causes.some(c=>c.result==="Confirmed"&&c.evidence.trim())}};
AUTO.I=p=>{const i=p.improve,sol=filled(i.solutions,["solution"]),fm=filled(i.fmea,["mode","s","o","d"]);
  return{solutions:sol.length>0&&sol.every(s=>s.cause.trim()),prioritised:sol.length>=2,fmea:fm.length>0&&!fm.some(r=>rpnCalc(r).hi&&!r.action.trim()),pilot:!!i.pilot.criteria.trim()&&num(i.pilot.before)!=null&&num(i.pilot.after)!=null,plan:filled(i.actions,["action","owner","due"]).length>0}};
AUTO.C=p=>{const c=p.control,r=imr(parseNums(c.chart.data));return{controlplan:filled(c.plan,["metric","owner","reaction"]).length>0,chart:!!r&&r.st.n>=20&&!r.outside.length&&!r.runIdx.length,standard:!!c.closure.docs.trim(),handover:!!c.closure.handover.trim(),finance:!!c.closure.finance.trim(),lessons:!!c.closure.lessons.trim()}};
EXTRA.M=p=>{const b=p.measure.baseline,x=parseNums(b.data),st=stats(x),cap=capability(x,b.lsl,b.usl);return{baselineStats:st,cpk:cap&&cap.cpk,dpmo:cap&&cap.dpmo,longestRunOneSideOfMedian:x.length?longestSide(x,st.median).len:0,longestTrend:longestTrend(x),pce:pceOf(filled(p.measure.map,["step"]))}};
EXTRA.A=p=>({pareto:paretoChart(p.analyse.pareto).d||[],testResults:p.analyse.tests.map(t=>{const r=runTest(t);return r&&r.ok?{name:t.name,type:t.type,p:r.p,alpha:t.alpha,summary:r.summary,warnings:r.warn}:{name:t.name,type:t.type,error:r?r.error:"no data"}})});
EXTRA.I=p=>({confirmedCauses:p.analyse.causes.filter(c=>c.result==="Confirmed"),goal:p.define.charter.goal});
EXTRA.C=p=>{const r=imr(parseNums(p.control.chart.data));return{controlChart:r?{n:r.st.n,mean:r.st.mean,ucl:r.ucl,lcl:r.lcl,pointsOutside:r.outside.length,longestRun:r.run.len}:null,baselineMean:stats(parseNums(p.measure.baseline.data)).mean}};
