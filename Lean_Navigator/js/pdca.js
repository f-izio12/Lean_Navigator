/* ================= PDCA: small improvements in fast cycles ================= */
Object.assign(BLANK,{"pdset.cycles":{change:"",prediction:"",done:"",result:"",learning:"",decision:"Adapt"}});
Object.assign(STAGEBLANK,{
 pdframe:()=>({problem:"",owner:"",metric:"",baseline:"",target:"",targetDate:"",baselineData:""}),
 pdset:()=>({cycles:rows("pdset.cycles")}),
 pdstd:()=>({adopted:"",where:"",share:"",next:""})
});
registerTool("PDCA",{gate:_t("Check-in"),stages:[
 {id:"pc1",letter:"1",name:_t("Set up"),key:"pdframe",tabs:[["frame",_t("Problem and target")]],
  tg:[["problem",_t("Problem described with facts and a number")],["metric",_t("One metric chosen to judge every cycle")],["target",_t("Target value and date set")]],
  focus:"small, local problem suited to PDCA; one clear metric; realistic target and date; baseline from data, not impression."},
 {id:"pc2",letter:"2",name:_t("PDCA cycles"),key:"pdset",tabs:[["cycles",_t("Cycles")],["chart",_t("Results chart")]],
  tg:[["predict",_t("Every cycle states a prediction before it starts")],["measured",_t("Every cycle measured its result on the metric")],["learned",_t("Learning is recorded, also for failed cycles")],["decided",_t("Each cycle ends with adopt, adapt or abandon")]],
  focus:"each cycle tests one change with a prediction written beforehand; results measured on the chosen metric; learning captured especially when the prediction was wrong; cycles short and small; decisions follow the evidence."},
 {id:"pc3",letter:"3",name:_t("Standardise"),key:"pdstd",tabs:[["std",_t("Standardise")]],
  tg:[["adopted",_t("The adopted change is described")],["documented",_t("It is documented where people will find it")],["shared",_t("Teams that could use it are told")]],
  focus:"what exactly became the new standard, where it is documented, who was told, and what the next improvement is."}
]});
CONTEXT.PDCA=p=>({problem:p.pdframe.problem,metric:p.pdframe.metric,baseline:p.pdframe.baseline,target:p.pdframe.target});
TABS.pc1.frame=()=>`${inp("pdframe.problem",_t("Problem"),_t("What is not good enough today, with a number."),{rows:3})}
 <div class="grid2">${inp("pdframe.owner",_t("Owner"),"",{rows:1})}${inp("pdframe.metric",_t("Metric"),_t("The one number every cycle is judged on."),{rows:1})}</div>
 <div class="grid3">${inp("pdframe.baseline",_t("Baseline value"),"",{rows:1})}${inp("pdframe.target",_t("Target value"),"",{rows:1})}${inp("pdframe.targetDate",_t("Target date"),"",{type:"date"})}</div>
 ${inp("pdframe.baselineData",_t("Baseline data (optional)"),_t("Values in time order, one per line, for the chart."),{rows:4})}`;
AFTER["pc1.frame"]=p=>{S.refresh=()=>setFlags("pdframe.problem",checkProblem(p.pdframe.problem,true))};
TABS.pc2.cycles=p=>`<p class="lead">${_t("One row per cycle. <b>Plan</b>: the change and what you predict will happen. <b>Do</b>: what you actually did. <b>Check</b>: the result on the metric and what you learned. <b>Act</b>: adopt, adapt or abandon.")}</p>
 <div class="wide"><table class="grid"><thead><tr><th>#</th><th>${_t("Plan: change")}</th><th>${_t("Plan: prediction")}</th><th>${_t("Do")}</th><th style="width:100px">${_t("Check: result")}${p.pdframe.metric?` (${esc(trunc(p.pdframe.metric,20))})`:""}</th><th>${_t("Check: learning")}</th><th style="width:120px">${_t("Act")}</th><th></th></tr></thead><tbody>
 ${p.pdset.cycles.map((c,i)=>`<tr><td class="calc">${i+1}</td>${["change","prediction","done"].map(k=>`<td><textarea data-bind="pdset.cycles.${i}.${k}">${esc(c[k])}</textarea></td>`).join("")}<td><input data-bind="pdset.cycles.${i}.result" value="${esc(c.result)}"></td><td><textarea data-bind="pdset.cycles.${i}.learning">${esc(c.learning)}</textarea></td><td><select data-bind="pdset.cycles.${i}.decision">${["Adopt","Adapt","Abandon"].map(o=>`<option value="${esc(o)}" ${o===c.decision?"selected":""}>${esc(_tv(o))}</option>`).join("")}</select></td><td><button class="x" data-del="pdset.cycles" data-i="${i}" aria-label="${_t("Remove")}">×</button></td></tr>`).join("")}
 </tbody></table></div><button class="btn alt addrow" data-add="pdset.cycles">${_t("Add cycle")}</button><div class="flags" id="cyF"></div>`;
AFTER["pc2.cycles"]=p=>{S.refresh=()=>{const r=filled(p.pdset.cycles,["change"]),f=[];r.forEach((c,i)=>{if(!c.prediction.trim())f.push(`${_t("Cycle {x} has no prediction. Without one, you cannot learn whether your understanding of the process was right.",{x:i+1})}`);if(c.result.trim()&&!c.learning.trim())f.push(`${_t("Cycle {x}: result recorded but no learning.",{x:i+1})}`)});
  if(r.length>=4&&!r.some(c=>c.decision==="Adopt"))f.push(`${_t("{rCount} cycles without adopting anything. Re-check the problem, or whether PDCA is the right method.",{rCount:r.length})}`);if(r.length&&!f.length)f.push(_t("✓ Cycles have predictions, results and learning."));$("#cyF").innerHTML=flagsHTML(f)}};
TABS.pc2.chart=p=>{const b=parseNums(p.pdframe.baselineData),r=filled(p.pdset.cycles,["change"]).map(c=>num(c.result)),res=r.filter(v=>v!=null);
  if(!b.length&&!res.length)return `<p class="muted">${_t("Enter baseline data (Set up) or cycle results to see the chart.")}</p>`;
  return `<div class="chartbox">${lineChart({values:[...b,...res],title:`${_t("{x}: baseline then cycle results (orange)",{x:p.pdframe.metric||_t("Metric")})}`,lines:[{v:num(p.pdframe.target),label:_t("Target"),c:C.orange,dash:1},{v:num(p.pdframe.baseline),label:_t("Baseline"),c:C.light}],flagIdx:res.map((_,i)=>b.length+i)})}</div>`};
TABS.pc3.std=()=>`${inp("pdstd.adopted",_t("What was adopted"),_t("The change that became the new way of working."),{rows:3})}${inp("pdstd.where",_t("Where it is documented"),"",{rows:2})}${inp("pdstd.share",_t("Who was told"),"",{rows:2})}${inp("pdstd.next",_t("Next improvement"),"",{rows:2})}`;
AUTO.pc1=p=>{const f=p.pdframe;return{problem:hasNum(f.problem),metric:!!f.metric.trim(),target:num(f.target)!=null&&!!f.targetDate}};
AUTO.pc2=p=>{const r=filled(p.pdset.cycles,["change"]);return{predict:r.length>0&&r.every(c=>c.prediction.trim()),measured:r.length>0&&r.every(c=>num(c.result)!=null),learned:r.length>0&&r.every(c=>c.learning.trim())}};
AUTO.pc3=p=>({adopted:!!p.pdstd.adopted.trim(),documented:!!p.pdstd.where.trim(),shared:!!p.pdstd.share.trim()});
