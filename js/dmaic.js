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
registerTool("DMAIC",{gate:_t("Tollgate"),stages:[
 {id:"D",letter:"D",name:_t("Define"),key:"define",tabs:[["charter",_t("Project charter")],["sipoc","SIPOC"],["voc",_t("Voice of the customer")],["notes",_t("Advisor notes")]],
  tg:[["problem",_t("Problem statement describes the gap, with no cause or solution in it")],["baseline",_t("Current performance is quantified (baseline metric with source)")],["goal",_t("Goal is SMART and tied to the baseline metric")],["scope",_t("In-scope and out-of-scope boundaries are written and agreed")],["roles",_t("Sponsor and process owner are named and have accepted")],["sipoc",_t("SIPOC is complete, with 4 to 7 high-level process steps")],["ctq",_t("Voice of the customer is translated into measurable CTQs")],["benefit",_t("Expected benefit (money, time, quality, risk) is estimated")],["plan",_t("Timeline to the Measure tollgate is agreed")],["signoff",_t("Sponsor has reviewed and signed off the charter")]],
  focus:"problem statement free of causes and solutions, quantified and time-bound; baseline and goal use the same metric; goal SMART and realistic; scope clear and winnable; roles filled; SIPOC 4 to 7 steps and consistent with scope; CTQs measurable and traceable to the voice of the customer; credible business case."},
 {id:"M",letter:"M",name:_t("Measure"),key:"measure",tabs:[["plan",_t("Data collection plan")],["msa",_t("Measurement system")],["baseline",_t("Baseline and capability")],["map",_t("As-is process map")]],
  tg:[["plan",_t("Data collection plan with operational definitions for Y and key Xs")],["msa",_t("Measurement system checked and acceptable")],["baseline",_t("Baseline data collected (at least 20 to 30 points)")],["stable",_t("Baseline is stable enough to interpret, or signals are explained")],["capability",_t("Baseline capability or sigma level calculated")],["map",_t("As-is process mapped with value-added and non-value-added steps")],["goalcheck",_t("Goal re-confirmed against the real baseline")],["signoff",_t("Sponsor has signed off the Measure tollgate")]],
  focus:"operational definitions precise enough for two people to get the same number; data covers the Y and key Xs; measurement system checked and acceptable; sample size adequate; baseline stable or signals explained; capability interpreted correctly (not on unstable data); as-is map realistic with VA/NVA split; goal still realistic given the baseline."},
 {id:"A",letter:"A",name:_t("Analyse"),key:"analyse",tabs:[["fishbone",_t("Cause and effect")],["whys",_t("5 Whys")],["pareto",_t("Pareto")],["tests",_t("Hypothesis tests")],["validation",_t("Root cause validation")]],
  tg:[["fishbone",_t("Potential causes brainstormed with people who do the work")],["whys",_t("Causal chains followed to a controllable root cause")],["pareto",_t("Vital few categories identified")],["tested",_t("Suspected causes tested statistically where data allows")],["validated",_t("Root causes validated with data, not opinion")],["quantified",_t("Impact of each root cause on the Y is estimated")],["signoff",_t("Sponsor has signed off the Analyse tollgate")]],
  focus:"causes are hypotheses until tested; 5 Whys reach controllable causes without leaps; Pareto stratification sensible; hypothesis tests chosen correctly for the data type, assumptions respected, p-values interpreted correctly (failing to reject is not proof of no effect, statistical is not practical significance); validation uses data, not opinion; correlation not confused with causation."},
 {id:"I",letter:"I",name:_t("Improve"),key:"improve",tabs:[["solutions",_t("Solutions")],["fmea",_t("Risk (FMEA)")],["pilot",_t("Pilot")],["actions",_t("Implementation plan")]],
  tg:[["solutions",_t("Each validated root cause has at least one solution")],["prioritised",_t("Solutions prioritised on impact and effort")],["fmea",_t("Risks assessed and high-risk failure modes mitigated")],["pilot",_t("Pilot run with success criteria defined before starting")],["results",_t("Pilot results meet the goal")],["plan",_t("Full implementation plan has owners and dates")],["signoff",_t("Sponsor has signed off the Improve tollgate")]],
  focus:"every solution targets a confirmed root cause; prioritisation sensible; FMEA covers the new process and high risks are mitigated; pilot had pre-defined success criteria and results meet the goal; implementation plan has single owners and dates."},
 {id:"C",letter:"C",name:_t("Control"),key:"control",tabs:[["controlplan",_t("Control plan")],["chart",_t("Control chart")],["closure",_t("Handover and closure")]],
  tg:[["controlplan",_t("Control plan with owners and reaction plans")],["chart",_t("Process is in statistical control at the new level")],["standard",_t("Standard work and documentation updated, people trained")],["handover",_t("Process owner has formally accepted the process")],["finance",_t("Benefits validated (by finance where money is claimed)")],["lessons",_t("Lessons learned recorded and shared")],["signoff",_t("Sponsor has signed off project closure")]],
  focus:"control plan has owners, frequencies and reaction plans; control chart shows stability at the new level; documentation and training complete; process owner accepted; benefits validated against the charter; lessons learned useful."}
]});
CONTEXT.DMAIC=p=>({problem:p.define.charter.problem,baseline:p.define.charter.baseline,goal:p.define.charter.goal});

/* ----- Define ----- */
TABS.D.charter=()=>`
  ${inp("define.charter.businessCase",_t("Business case"),_t("Why this project, why now, and what it costs to leave it alone."))}
  ${inp("define.charter.problem",_t("Problem statement"),_t("What is wrong, where, since when, how much, and the impact. No causes, no solutions."),{rows:4})}
  ${inp("define.charter.baseline",_t("Baseline metric"),_t("The primary metric (Y), its current value and where the number comes from."),{rows:1})}
  ${inp("define.charter.goal",_t("Goal statement"),_t("Target value for the same metric, and the date."),{rows:2})}
  <div class="grid2">${inp("define.charter.inScope",_t("In scope"),_t("Process start and end points, sites, products, teams."))}${inp("define.charter.outScope",_t("Out of scope"),_t("What you will explicitly not touch."))}</div>
  <fieldset><legend>${_t("Team")}</legend><div class="grid2">
    ${inp("define.charter.sponsor",_t("Sponsor"),_t("Owns the business result, removes barriers."),{rows:1})}${inp("define.charter.processOwner",_t("Process owner"),_t("Will own the process after Control."),{rows:1})}
    ${inp("define.charter.lead",_t("Project lead / belt"),"",{rows:1})}${inp("define.charter.team",_t("Core team"),_t("Names and roles."),{rows:1})}</div></fieldset>
  <div class="grid2">${inp("define.charter.start",_t("Start date"),"",{type:"date"})}${inp("define.charter.tollgateDate",_t("Define tollgate date"),"",{type:"date"})}</div>
  ${inp("define.charter.benefit",_t("Expected benefit"),_t("Money, time, quality or risk, with the assumptions behind the estimate."),{rows:2})}`;
AFTER["D.charter"]=p=>{S.refresh=()=>{setFlags("define.charter.problem",checkProblem(p.define.charter.problem));setFlags("define.charter.goal",checkGoal(p.define.charter.goal))}};
TABS.D.sipoc=p=>{const cols=[["s","S",_t("Suppliers")],["i","I",_t("Inputs")],["p","P",_t("Process")],["o","O",_t("Outputs")],["c","C",_t("Customers")]];
  return `<p class="lead">${_t("One item per line. Fill Process first, then outputs and customers, then inputs and suppliers.")}</p>
  <div class="sipoc">${cols.map(([k,l,n])=>`<div class="col"><h3><span>${l}</span>${n}</h3><textarea data-bind="define.sipoc.${k}" aria-label="${n}">${esc(p.define.sipoc[k])}</textarea></div>`).join("")}</div><div class="flags" id="sipocFlags"></div>`};
AFTER["D.sipoc"]=p=>{S.refresh=()=>{const n=lines(p.define.sipoc.p).length,f=[];if(n&&n<4)f.push(`${_t("Only {n} process step{x}. Too coarse to scope anything.",{n:n,x:n===1?"":"s"})}`);if(n>7)f.push(`${_t("{n} steps. SIPOC is a high-level view; detailed mapping belongs in Measure.",{n:n})}`);if(n>=4&&n<=7)f.push(`${_t("✓ {n} process steps.",{n:n})}`);$("#sipocFlags").innerHTML=flagsHTML(f)}};
TABS.D.voc=()=>`<p class="lead">${_t("A CTQ without a specification or target is still a wish.")}</p>${table("define.voc",[{k:"customer",label:_t("Customer")},{k:"voice",label:_t("What they say")},{k:"driver",label:_t("Key driver")},{k:"ctq",label:_t("CTQ (measurable)")},{k:"spec",label:_t("Specification / target")}])}`;
TABS.D.notes=p=>p.advisorNotes?`<p style="white-space:pre-wrap;margin:0">${esc(p.advisorNotes)}</p>`:`<p class="muted">${_t("No advisor conversation for this project.")}</p>`;

/* ----- Measure ----- */
TABS.M.plan=()=>table("measure.plan",[{k:"metric",label:_t("Metric")},{k:"type",label:_t("Y or X"),opts:["Y","X"],w:"80px"},{k:"definition",label:_t("Operational definition")},{k:"source",label:_t("Data source")},{k:"sample",label:_t("Sample size and frequency")},{k:"who",label:_t("Who collects")}]);
TABS.M.msa=()=>`${inp("measure.msa.method",_t("Method"),"",{options:["","Gauge R&R (variable data)","Attribute agreement analysis","Data audit (transactional or system data)","Not done"]})}
  <div class="grid2">${inp("measure.msa.grr",_t("%GRR (study variation)"),_t("Gauge R&R only."),{rows:1})}${inp("measure.msa.ndc",_t("Number of distinct categories"),_t("Gauge R&R only. 5 or more is acceptable."),{rows:1})}</div>
  ${inp("measure.msa.notes",_t("Result and actions"),_t("What you checked, what you found, what you changed."),{rows:4})}<div class="flags" id="msaFlags"></div>`;
AFTER["M.msa"]=p=>{S.refresh=()=>{const m=p.measure.msa,g=num(m.grr),n=num(m.ndc),f=[];
  if(m.method==="Not done")f.push(_t("No measurement check. Every conclusion from here on is exposed."));
  if(m.method.startsWith("Gauge")){if(g==null)f.push(_t("Enter the %GRR."));else if(g<10)f.push(_t("✓ %GRR below 10: measurement system acceptable."));else if(g<=30)f.push(_t("%GRR between 10 and 30: marginal. Acceptable only with justification."));else f.push(_t("%GRR above 30: not fit for use. Fix it before collecting the baseline."));
    if(n!=null&&n<5)f.push(_t("Fewer than 5 distinct categories: the gauge cannot discriminate between parts."))}
  if(m.method.startsWith("Data audit"))f.push(_t("ℹ For system data, check a sample against the source record: missing values, timestamps, how the field is really filled in."));
  $("#msaFlags").innerHTML=flagsHTML(f)}};
TABS.M.baseline=()=>`<p class="lead">${_t("Paste the baseline data in time order, one value per line. Decimal comma or point both work.")}</p>
  <div class="grid2">${inp("measure.baseline.data",_t("Baseline data (time order)"),"",{rows:8})}<div>${inp("measure.baseline.unit",_t("Unit"),_t("e.g. days, minutes, % errors"),{rows:1})}<div class="grid2">${inp("measure.baseline.lsl",_t("Lower spec limit"),_t("Empty if one-sided"),{rows:1})}${inp("measure.baseline.usl",_t("Upper spec limit"),"",{rows:1})}</div></div></div>
  <div id="baseOut"></div>${inp("measure.baseline.notes",_t("Interpretation"),_t("What does the baseline tell you? Is the goal still realistic?"),{rows:3})}`;
AFTER["M.baseline"]=p=>{S.refresh=()=>{const b=p.measure.baseline,x=parseNums(b.data),out=$("#baseOut");if(!x.length){out.innerHTML="";return}
  const st=stats(x),cap=capability(x,b.lsl,b.usl),side=longestSide(x,st.median),tr=longestTrend(x),f=[];
  if(st.n<20)f.push(`${_t("Only {n} points. Aim for at least 20 to 30 before drawing conclusions.",{n:st.n})}`);
  if(side.len>=6)f.push(`${_t("Shift: {len} points in a row on one side of the median. Something changed in the process.",{len:side.len})}`);
  if(tr>=5)f.push(`${_t("Trend: {tr} points in a row going the same way.",{tr:tr})}`);
  if(st.n>=10&&side.len<6&&tr<5)f.push(_t("✓ No shift or trend signals on the run chart."));
  if(cap&&cap.cpk!=null)f.push(_t("ℹ Cp and Cpk assume a stable, roughly normal process. With signals above, treat them as indicative only."));
  out.innerHTML=statsHTML([["n",st.n],[_t("Mean"),fmt(st.mean)],[_t("Median"),fmt(st.median)],[_t("Std dev"),fmt(st.sd)],[_t("Min"),fmt(st.min)],[_t("Max"),fmt(st.max)],
    ...(cap&&cap.out!=null?[[_t("Out of spec"),`${cap.out} (${fmt(cap.out/st.n*100,1)}%)`],[_t("Cp"),fmt(cap.cp)],[_t("Cpk"),fmt(cap.cpk)],[_t("DPMO"),fmt(cap.dpmo,0)],[_t("Sigma level"),cap.sigma==null?_t("n/a (no defects)"):fmt(cap.sigma,1)]]:[])])+
    `<div class="chartbox">${lineChart({values:x,title:(_t("Run chart{x}",{x:b.unit?" ("+b.unit+")":""})),lines:[{v:st.median,label:_t("Median"),c:C.light,dash:1},{v:num(b.lsl),label:_t("LSL"),c:C.orange},{v:num(b.usl),label:_t("USL"),c:C.orange}],flagIdx:side.len>=6?side.idx:[]})}</div><div class="flags">${flagsHTML(f)}</div>`}};
TABS.M.map=()=>`<p class="lead">${_t("Classify each step: value-added (the customer would pay for it), necessary non-value-added (required, e.g. legal), or waste.")}</p>
  ${table("measure.map",[{k:"step",label:_t("Step")},{k:"kind",label:_t("Type"),opts:["VA","NNVA","NVA"],w:"100px"},{k:"time",label:_t("Time (same unit for all)"),type:"text",w:"160px"}])}<div class="flags" id="mapFlags"></div>`;
var pceOf=r=>{const t=k=>r.filter(x=>x.kind===k).reduce((a,x)=>a+(num(x.time)||0),0),tot=t("VA")+t("NNVA")+t("NVA");return{va:t("VA"),nnva:t("NNVA"),nva:t("NVA"),tot,pce:tot?t("VA")/tot*100:null}};
AFTER["M.map"]=p=>{S.refresh=()=>{const c=pceOf(filled(p.measure.map,["step"])),f=[];
  if(c.tot>0){f.push(`${_t("ℹ Process cycle efficiency: {pce}% value-added time ({va} of {tot}). Waste: {nva}, necessary non-value-added: {nnva}.",{pce:fmt(c.pce,1),va:fmt(c.va),tot:fmt(c.tot),nva:fmt(c.nva),nnva:fmt(c.nnva)})}`);if(c.pce<10)f.push(_t("Below 10% value-added is typical of transactional processes: most of the lead time is waiting."))}
  $("#mapFlags").innerHTML=flagsHTML(f)}};

/* ----- Analyse ----- */
TABS.A.fishbone=()=>`<p class="lead">${_t("One cause per line. These are hypotheses, not findings.")}</p>`+fishHTML("analyse.fishbone");
AFTER["A.fishbone"]=fishAfter("analyse.fishbone",p=>p.define.charter.problem||p.title);
TABS.A.whys=()=>`<p class="lead">${_t("Follow one symptom at a time. If a \"why\" needs a guess, go and look.")}</p>`+whysHTML("analyse.whys");
TABS.A.pareto=()=>`<div class="grid2"><div>${table("analyse.pareto",[{k:"cat",label:_t("Category")},{k:"count",label:_t("Count"),type:"text",w:"110px"}])}</div><div><div class="chartbox" id="parOut"></div><div class="flags" id="parFlags"></div></div></div>`;
function paretoAfter(path){return p=>{S.refresh=()=>{const r=paretoChart(getPath(p,path),560,320);$("#parOut").innerHTML=r.svg||_t("<p class=\"muted small\" style=\"margin:8px\">Add categories and counts to see the chart.</p>");
  const f=[];if(r.d){if(r.vital.length)f.push(`${_t("ℹ Vital few: {x} ({cum}% of {total}).",{x:r.vital.join(", "),cum:fmt(r.d[r.vital.length-1].cum,0),total:r.total})}`);if(r.d.length>=4&&r.vital.length/r.d.length>.6)f.push(_t("No clear Pareto effect. Try a different stratification."))}
  $("#parFlags").innerHTML=flagsHTML(f)}}}
AFTER["A.pareto"]=paretoAfter("analyse.pareto");
TABS.A.validation=()=>table("analyse.causes",[{k:"cause",label:_t("Suspected cause")},{k:"test",label:_t("How it was tested")},{k:"evidence",label:_t("Evidence and result")},{k:"result",label:_t("Status"),opts:["Pending","Confirmed","Rejected"],w:"130px"}])+`<div class="flags" id="valFlags"></div>`;
AFTER["A.validation"]=p=>{S.refresh=()=>{const f=[];p.analyse.causes.forEach((c,i)=>{if(c.result==="Confirmed"&&!c.evidence.trim())f.push(`${_t("Row {x}: confirmed with no evidence recorded.",{x:i+1})}`);if(c.result==="Confirmed"&&(kwLang("agree",c.evidence)||/\b(team agreed|everyone knows|vote|consensus|we think)\b/i.test(c.evidence)))f.push(`${_t("Row {x}: agreement is not evidence.",{x:i+1})}`)});
  const n=p.analyse.causes.filter(c=>c.result==="Confirmed").length;if(n)f.push(`${_t("✓ {n} root cause{x} confirmed.",{n:n,x:n>1?"s":""})}`);$("#valFlags").innerHTML=flagsHTML(f)}};

/* ----- Improve ----- */
var solCalc=r=>{const i=num(r.impact),e=num(r.effort);return{t:i&&e?quadrant(i,e):"",hi:i&&e&&quadrant(i,e)==="Quick win"}};
TABS.I.solutions=()=>`<p class="lead">${_t("Score impact and effort from 1 to 5.")}</p>${table("improve.solutions",[{k:"solution",label:_t("Solution")},{k:"cause",label:_t("Root cause it addresses")},{k:"impact",label:_t("Impact"),type:"number",min:1,max:5,w:"80px"},{k:"effort",label:_t("Effort"),type:"number",min:1,max:5,w:"80px"}],{label:_t("Quadrant")})}
  <div class="chartbox" id="matOut" style="max-width:460px"></div><div class="flags" id="solFlags"></div>`;
AFTER["I.solutions"]=p=>{S.refresh=()=>{fillCalc("improve.solutions",solCalc);$("#matOut").innerHTML=matrixChart(p.improve.solutions);
  const f=[];p.improve.solutions.forEach((s,i)=>{if(s.solution.trim()&&!s.cause.trim())f.push(`${_t("Solution {x} is not linked to a root cause. Solution looking for a problem?",{x:i+1})}`)});
  if(!p.analyse.causes.some(c=>c.result==="Confirmed"))f.push(_t("No confirmed root causes in Analyse yet. You are improving on assumptions."));
  $("#solFlags").innerHTML=flagsHTML(f)}};
var rpnCalc=r=>{const s=num(r.s),o=num(r.o),d=num(r.d);if(!s||!o||!d)return{t:""};const v=s*o*d;return{t:String(v),hi:v>=100||s>=9}};
TABS.I.fmea=()=>`<p class="lead">${_t("Score severity, occurrence and detection from 1 to 10. RPN of 100 or more, or severity 9 to 10, needs an action.")}</p>${table("improve.fmea",[{k:"mode",label:_t("Failure mode")},{k:"effect",label:_t("Effect")},{k:"s",label:"S",type:"number",min:1,max:10,w:"70px"},{k:"o",label:"O",type:"number",min:1,max:10,w:"70px"},{k:"d",label:"D",type:"number",min:1,max:10,w:"70px"},{k:"action",label:_t("Mitigation")}],{label:"RPN"})}<div class="flags" id="fmFlags"></div>`;
AFTER["I.fmea"]=p=>{S.refresh=()=>{fillCalc("improve.fmea",rpnCalc);const f=[];p.improve.fmea.forEach((r,i)=>{if(rpnCalc(r).hi&&!r.action.trim())f.push(`${_t("Row {x}: high risk with no mitigation.",{x:i+1})}`)});$("#fmFlags").innerHTML=flagsHTML(f)}};
TABS.I.pilot=()=>`<div class="grid2">${inp("improve.pilot.scope",_t("Pilot scope"),_t("Where, who, which volume."),{rows:2})}${inp("improve.pilot.duration",_t("Duration"),"",{rows:1})}</div>
  ${inp("improve.pilot.criteria",_t("Success criteria"),_t("Written before the pilot. Use the project Y."),{rows:2})}
  <div class="grid2">${inp("improve.pilot.before",_t("Y before (baseline)"),_t("A single number"),{rows:1})}${inp("improve.pilot.after",_t("Y during pilot"),_t("A single number"),{rows:1})}</div>
  <div class="flags" id="pilotFlags"></div>${inp("improve.pilot.notes",_t("Observations and side effects"),"",{rows:3})}`;
AFTER["I.pilot"]=p=>{S.refresh=()=>{const b=num(p.improve.pilot.before),a=num(p.improve.pilot.after),f=[];
  if(b!=null&&a!=null&&b!==0)f.push(`${_t("ℹ Change: {b} ({x}%). Compare against the goal: \"{x2}\"",{b:fmt(a-b),x:fmt((a-b)/Math.abs(b)*100,1),x2:trunc(p.define.charter.goal||_t("no goal written"),90)})}`);
  if(b!=null&&a!=null)f.push(_t("ℹ One number before and after is not proof. Use a 2-sample test in Analyse, or a run chart of the pilot data."));
  $("#pilotFlags").innerHTML=flagsHTML(f)}};
TABS.I.actions=()=>table("improve.actions",[{k:"action",label:_t("Action")},{k:"owner",label:_t("Owner"),w:"160px"},{k:"due",label:_t("Due"),type:"date",w:"150px"},{k:"status",label:_t("Status"),opts:["Open","In progress","Done","Blocked"],w:"130px"}]);

/* ----- Control ----- */
TABS.C.controlplan=()=>table("control.plan",[{k:"metric",label:_t("What is controlled")},{k:"target",label:_t("Target / limits")},{k:"method",label:_t("Measurement method")},{k:"freq",label:_t("Frequency")},{k:"owner",label:_t("Owner")},{k:"reaction",label:_t("Reaction plan (if out of limits)")}]);
TABS.C.chart=()=>`<div class="grid2">${inp("control.chart.data",_t("Data after implementation (time order)"),_t("One value per line."),{rows:8})}${inp("control.chart.notes",_t("Interpretation"),_t("Stable at the new level? What caused any signals?"),{rows:8})}</div><div id="ctlOut"></div>`;
function imrBlock(x,baseMean){const r=imr(x);if(!r)return "";const f=[];
  if(r.st.n<20)f.push(`${_t("Only {n} points. Limits are unreliable below about 20.",{n:r.st.n})}`);
  if(r.outside.length)f.push(_t("{n} point(s) outside the control limits (points {x}). Special cause: investigate.",{n:r.outside.length,x:r.outside.map(i=>i+1).join(", ")}));
  if(r.runIdx.length)f.push(`${_t("{len} points in a row on one side of the mean. The process has shifted.",{len:r.run.len})}`);
  if(!r.outside.length&&!r.runIdx.length&&r.st.n>=20)f.push(_t("✓ No out-of-control signals: the process looks stable."));
  if(baseMean!=null)f.push(`${_t("ℹ Baseline mean {baseMean} against {mean} now ({x}%).",{baseMean:fmt(baseMean),mean:fmt(r.st.mean),x:fmt((r.st.mean-baseMean)/Math.abs(baseMean||1)*100,1)})}`);
  return statsHTML([["n",r.st.n],[_t("Mean"),fmt(r.st.mean)],[_t("UCL"),fmt(r.ucl)],[_t("LCL"),fmt(r.lcl)],[_t("MR-bar"),fmt(r.mrbar)],[_t("MR UCL"),fmt(r.mrUcl)]])+
    `<div class="chartbox">${imrSVG(x,r)}</div><div class="flags">${flagsHTML(f)}</div>`}
var imrSVG=(x,r)=>lineChart({values:x,title:_t("Individuals chart"),lines:[{v:r.st.mean,label:_t("Mean"),c:C.light},{v:r.ucl,label:_t("UCL"),c:C.orange,dash:1},{v:r.lcl,label:_t("LCL"),c:C.orange,dash:1}],flagIdx:[...r.outside,...r.runIdx]});
AFTER["C.chart"]=p=>{S.refresh=()=>{const b=stats(parseNums(p.measure.baseline.data));$("#ctlOut").innerHTML=imrBlock(parseNums(p.control.chart.data),b.n?b.mean:null)}};
TABS.C.closure=()=>`
  ${inp("control.closure.docs",_t("Standard work and documentation"),_t("Which procedures, instructions or system settings changed, and who was trained."),{rows:3})}
  ${inp("control.closure.handover",_t("Handover to the process owner"),_t("Who accepted, when, and what they now monitor."),{rows:2})}
  ${inp("control.closure.finance",_t("Validated benefits"),_t("Actual results against the charter. Who validated them."),{rows:3})}
  ${inp("control.closure.lessons",_t("Lessons learned"),_t("What would you do differently? What can be replicated elsewhere?"),{rows:3})}
  ${inp("control.closure.closedOn",_t("Closure date"),"",{type:"date"})}`;

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
EXTRA.A=p=>({pareto:paretoChart(p.analyse.pareto).d||[],testResults:p.analyse.tests.map(t=>{const r=runTest(t);return r&&r.ok?{name:t.name,type:t.type,p:r.p,alpha:t.alpha,summary:r.summary,warnings:r.warn}:{name:t.name,type:t.type,error:r?r.error:_t("no data")}})});
EXTRA.I=p=>({confirmedCauses:p.analyse.causes.filter(c=>c.result==="Confirmed"),goal:p.define.charter.goal});
EXTRA.C=p=>{const r=imr(parseNums(p.control.chart.data));return{controlChart:r?{n:r.st.n,mean:r.st.mean,ucl:r.ucl,lcl:r.lcl,pointsOutside:r.outside.length,longestRun:r.run.len}:null,baselineMean:stats(parseNums(p.measure.baseline.data)).mean}};
