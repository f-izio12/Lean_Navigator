/* ================= A3 problem solving ================= */
Object.assign(BLANK,{
 "a3plan.whys":{...WHYBLANK},
 "a3do.counter":{counter:"",cause:"",effect:"",owner:""},
 "a3do.actions":{action:"",owner:"",due:"",status:"Open"}
});
Object.assign(STAGEBLANK,{
 a3plan:()=>({owner:"",mentor:"",date:"",background:"",current:"",metric:"",currentValue:"",currentData:"",target:"",targetValue:"",targetDate:"",fishbone:FISHBLANK(),whys:rows("a3plan.whys"),rootSummary:""}),
 a3do:()=>({counter:rows("a3do.counter"),actions:rows("a3do.actions")}),
 a3check:()=>({method:"",before:"",after:"",afterData:"",worked:"",notworked:""}),
 a3act:()=>({standardise:"",share:"",open:""})
});
registerTool("A3 problem solving",{gate:_t("Mentor check"),stages:[
 {id:"a3p",letter:"P",name:_t("Plan"),key:"a3plan",tabs:[["background",_t("Background")],["current",_t("Current condition")],["target",_t("Target")],["analysis",_t("Root cause analysis")]],
  tg:[["theme",_t("Theme and background explain why this matters now")],["facts",_t("Current condition is based on facts seen at the place of work (gemba), with numbers")],["target",_t("Target is measurable, dated and uses the current-condition metric")],["cause",_t("Analysis reaches a root cause, not a symptom")],["mentor",_t("Mentor has challenged and agreed the Plan side")]],
  focus:"background links to an organisational need; current condition is factual, observed at the gemba, quantified, free of solutions; target measurable and dated on the same metric; root cause analysis goes past symptoms, 5 Whys without leaps, causes supported by observation."},
 {id:"a3d",letter:"D",name:_t("Do"),key:"a3do",tabs:[["counter",_t("Countermeasures")],["plan",_t("Implementation plan")]],
  tg:[["linked",_t("Every countermeasure addresses a stated root cause")],["effect",_t("Expected effect of each countermeasure is stated")],["plan",_t("Actions have one owner and a date each")],["mentor",_t("Mentor has agreed the countermeasures")]],
  focus:"countermeasures (not 'solutions') each attack a root cause from the analysis; expected effect stated; small, fast, reversible experiments preferred; actions with single owners and dates."},
 {id:"a3c",letter:"C",name:_t("Check"),key:"a3check",tabs:[["followup",_t("Follow-up and results")]],
  tg:[["measured",_t("Results measured with the same metric as the current condition")],["target",_t("Result compared honestly with the target")],["learn",_t("What worked and what did not is recorded")],["mentor",_t("Mentor has reviewed the results")]],
  focus:"results measured with the same metric and method as the current condition; honest comparison with target; unexpected effects noted; learning captured even if the target was missed."},
 {id:"a3a",letter:"A",name:_t("Act"),key:"a3act",tabs:[["standardise",_t("Standardise and share")]],
  tg:[["standard",_t("Successful countermeasures are standardised")],["share",_t("Learning is shared with teams that have similar processes")],["open",_t("Remaining issues have a next step")],["mentor",_t("Mentor has closed the A3")]],
  focus:"what becomes the new standard and how it is documented; horizontal deployment (yokoten) to similar areas; open issues have a next A3 or owner; the A3 tells a coherent story from background to follow-up."}
]});
CONTEXT["A3 problem solving"]=p=>({background:p.a3plan.background,current:p.a3plan.current,target:p.a3plan.target,rootCause:p.a3plan.rootSummary});

TABS.a3p.background=()=>`<div class="grid3">${inp("a3plan.owner",_t("A3 owner"),_t("The person who solves the problem."),{rows:1})}${inp("a3plan.mentor",_t("Mentor"),_t("Coaches the owner and challenges the thinking."),{rows:1})}${inp("a3plan.date",_t("Date started"),"",{type:"date"})}</div>
  ${inp("a3plan.background",_t("Background"),_t("Why this problem, why now, and how it connects to a team or organisational goal."),{rows:5})}`;
TABS.a3p.current=()=>`${inp("a3plan.current",_t("Current condition"),_t("What happens today, observed where the work is done. Facts and numbers, no causes, no solutions."),{rows:6})}
  <div class="grid2">${inp("a3plan.metric",_t("Key metric"),_t("The one number that shows the problem."),{rows:1})}${inp("a3plan.currentValue",_t("Current value"),"",{rows:1})}</div>
  ${inp("a3plan.currentData",_t("Current data (optional)"),_t("Values in time order, one per line, to show a run chart."),{rows:5})}<div id="a3cur"></div>`;
AFTER["a3p.current"]=p=>{S.refresh=()=>{const f=checkProblem(p.a3plan.current,true);setFlags("a3plan.current",f);
  const x=parseNums(p.a3plan.currentData),st=stats(x);$("#a3cur").innerHTML=x.length>1?`<div class="chartbox">${lineChart({values:x,title:(_t("Current condition{x}",{x:p.a3plan.metric?": "+p.a3plan.metric:""})),lines:[{v:st.median,label:_t("Median"),c:C.light,dash:1}]})}</div>`:""}};
TABS.a3p.target=()=>`${inp("a3plan.target",_t("Target condition"),_t("What will be different, measured with the same metric, and by when."),{rows:3})}
  <div class="grid2">${inp("a3plan.targetValue",_t("Target value"),"",{rows:1})}${inp("a3plan.targetDate",_t("Target date"),"",{type:"date"})}</div><div class="flags" id="a3tflags"></div>`;
AFTER["a3p.target"]=p=>{S.refresh=()=>{const a=p.a3plan,f=!a.target.trim()?[]:checkGoal(a.target+" "+(a.targetValue||"")+" "+(a.targetDate?"2026":""));const c=num(a.currentValue),t=num(a.targetValue);
  if(c!=null&&t!=null&&c!==0)f.push(`${_t("ℹ Target means a change of {x}% on the current value.",{x:fmt((t-c)/Math.abs(c)*100,0)})}`);if(!a.metric)f.push(_t("No key metric on the Current condition tab: the target has nothing to be measured against."));$("#a3tflags").innerHTML=flagsHTML(f)}};
TABS.a3p.analysis=()=>`<p class="lead">${_t("Start broad with cause and effect, then follow the most likely causes with 5 Whys. Go and see before you write a \"why\".")}</p>
  <h4>${_t("Cause and effect")}</h4>${fishHTML("a3plan.fishbone")}<h4>${_t("5 Whys")}</h4>${whysHTML("a3plan.whys")}
  <div style="margin-top:18px">${inp("a3plan.rootSummary",_t("Root cause summary"),_t("The one to three root causes the countermeasures will target, and the evidence for each."),{rows:3})}</div>`;
AFTER["a3p.analysis"]=fishAfter("a3plan.fishbone",p=>p.a3plan.current||p.title);
TABS.a3d.counter=()=>`<p class="lead">${_t("A countermeasure is a change you expect to remove a root cause. Prefer small, fast, reversible changes.")}</p>${table("a3do.counter",[{k:"counter",label:_t("Countermeasure")},{k:"cause",label:_t("Root cause addressed")},{k:"effect",label:_t("Expected effect")},{k:"owner",label:_t("Owner"),w:"150px"}])}<div class="flags" id="cmFlags"></div>`;
AFTER["a3d.counter"]=p=>{S.refresh=()=>{const f=[];p.a3do.counter.forEach((c,i)=>{if(c.counter.trim()&&!c.cause.trim())f.push(`${_t("Countermeasure {x} has no root cause. Why would it work?",{x:i+1})}`)});if(!p.a3plan.rootSummary.trim())f.push(_t("No root cause summary on the Plan side yet."));$("#cmFlags").innerHTML=flagsHTML(f)}};
TABS.a3d.plan=()=>table("a3do.actions",[{k:"action",label:_t("Action")},{k:"owner",label:_t("Owner"),w:"160px"},{k:"due",label:_t("Due"),type:"date",w:"150px"},{k:"status",label:_t("Status"),opts:["Open","In progress","Done","Blocked"],w:"130px"}]);
TABS.a3c.followup=p=>`${inp("a3check.method",_t("How the result was measured"),_t("Same metric and method as the current condition."),{rows:2})}
  <div class="grid2">${inp("a3check.before",_t("Before"),"",{rows:1,ph:p.a3plan.currentValue})}${inp("a3check.after",_t("After"),"",{rows:1})}</div><div class="flags" id="a3res"></div>
  ${inp("a3check.afterData",_t("Data after the change (optional)"),_t("Values in time order, one per line."),{rows:5})}<div id="a3after"></div>
  <div class="grid2">${inp("a3check.worked",_t("What worked"),"",{rows:3})}${inp("a3check.notworked",_t("What did not work, and surprises"),"",{rows:3})}</div>`;
AFTER["a3c.followup"]=p=>{S.refresh=()=>{const b=num(p.a3check.before??"")??num(p.a3plan.currentValue),a=num(p.a3check.after),t=num(p.a3plan.targetValue),f=[];
  if(b!=null&&a!=null){f.push(`ℹ Change: ${fmt(a-b)}${b?` (${fmt((a-b)/Math.abs(b)*100,1)}%)`:""}.`);if(t!=null){const ok=(t<b&&a<=t)||(t>b&&a>=t)||t===a;f.push(ok?`${_t("✓ Target of {t} reached.",{t:fmt(t)})}`:`${_t("Target of {t} not reached. Record why; a missed target with good learning is still a useful A3.",{t:fmt(t)})}`)}}
  $("#a3res").innerHTML=flagsHTML(f);
  const pre=parseNums(p.a3plan.currentData),x=parseNums(p.a3check.afterData);
  $("#a3after").innerHTML=x.length>1?`<div class="chartbox">${lineChart({values:[...pre,...x],title:pre.length?_t("Before and after (orange = after)"):_t("After the change"),lines:[{v:t,label:_t("Target"),c:C.orange,dash:1}],flagIdx:x.map((_,i)=>pre.length+i)})}</div>`:""}};
TABS.a3a.standardise=()=>`${inp("a3act.standardise",_t("Standardise"),_t("What becomes the new way of working, where it is documented, and who maintains it."),{rows:4})}
  ${inp("a3act.share",_t("Share (yokoten)"),_t("Which other teams or processes could use this, and how you will tell them."),{rows:3})}
  ${inp("a3act.open",_t("Open issues and next steps"),_t("What is still unresolved, and who owns it next."),{rows:3})}`;
AUTO.a3p=p=>{const a=p.a3plan;return{theme:a.background.trim().length>40,facts:!!a.current.trim()&&hasNum(a.current),target:!!a.target.trim()&&(hasNum(a.target)||num(a.targetValue)!=null)&&(hasTime(a.target)||!!a.targetDate),cause:!!a.rootSummary.trim()&&whyOK(a.whys)}};
AUTO.a3d=p=>{const c=filled(p.a3do.counter,["counter"]);return{linked:c.length>0&&c.every(x=>x.cause.trim()),effect:c.length>0&&c.every(x=>x.effect.trim()),plan:filled(p.a3do.actions,["action","owner","due"]).length>0}};
AUTO.a3c=p=>({measured:!!p.a3check.method.trim()&&num(p.a3check.after)!=null,learn:!!(p.a3check.worked.trim()||p.a3check.notworked.trim())});
AUTO.a3a=p=>({standard:!!p.a3act.standardise.trim(),share:!!p.a3act.share.trim(),open:!!p.a3act.open.trim()});
