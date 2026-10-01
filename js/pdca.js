/* ================= PDCA: small improvements in fast cycles ================= */
Object.assign(BLANK,{"pdset.cycles":{change:"",prediction:"",done:"",result:"",learning:"",decision:"Adapt"}});
Object.assign(STAGEBLANK,{
 pdframe:()=>({problem:"",owner:"",metric:"",baseline:"",target:"",targetDate:"",baselineData:""}),
 pdset:()=>({cycles:rows("pdset.cycles")}),
 pdstd:()=>({adopted:"",where:"",share:"",next:""})
});
registerTool("PDCA",{gate:"Check-in",stages:[
 {id:"pc1",letter:"1",name:"Set up",key:"pdframe",tabs:[["frame","Problem and target"]],
  tg:[["problem","Problem described with facts and a number"],["metric","One metric chosen to judge every cycle"],["target","Target value and date set"]],
  focus:"small, local problem suited to PDCA; one clear metric; realistic target and date; baseline from data, not impression."},
 {id:"pc2",letter:"2",name:"PDCA cycles",key:"pdset",tabs:[["cycles","Cycles"],["chart","Results chart"]],
  tg:[["predict","Every cycle states a prediction before it starts"],["measured","Every cycle measured its result on the metric"],["learned","Learning is recorded, also for failed cycles"],["decided","Each cycle ends with adopt, adapt or abandon"]],
  focus:"each cycle tests one change with a prediction written beforehand; results measured on the chosen metric; learning captured especially when the prediction was wrong; cycles short and small; decisions follow the evidence."},
 {id:"pc3",letter:"3",name:"Standardise",key:"pdstd",tabs:[["std","Standardise"]],
  tg:[["adopted","The adopted change is described"],["documented","It is documented where people will find it"],["shared","Teams that could use it are told"]],
  focus:"what exactly became the new standard, where it is documented, who was told, and what the next improvement is."}
]});
CONTEXT.PDCA=p=>({problem:p.pdframe.problem,metric:p.pdframe.metric,baseline:p.pdframe.baseline,target:p.pdframe.target});
TABS.pc1.frame=()=>`${inp("pdframe.problem","Problem","What is not good enough today, with a number.",{rows:3})}
 <div class="grid2">${inp("pdframe.owner","Owner","",{rows:1})}${inp("pdframe.metric","Metric","The one number every cycle is judged on.",{rows:1})}</div>
 <div class="grid3">${inp("pdframe.baseline","Baseline value","",{rows:1})}${inp("pdframe.target","Target value","",{rows:1})}${inp("pdframe.targetDate","Target date","",{type:"date"})}</div>
 ${inp("pdframe.baselineData","Baseline data (optional)","Values in time order, one per line, for the chart.",{rows:4})}`;
AFTER["pc1.frame"]=p=>{S.refresh=()=>setFlags("pdframe.problem",checkProblem(p.pdframe.problem).filter(x=>!x.startsWith("Very short")))};
TABS.pc2.cycles=p=>`<p class="lead">One row per cycle. <b>Plan</b>: the change and what you predict will happen. <b>Do</b>: what you actually did. <b>Check</b>: the result on the metric and what you learned. <b>Act</b>: adopt, adapt or abandon.</p>
 <div class="wide"><table class="grid"><thead><tr><th>#</th><th>Plan: change</th><th>Plan: prediction</th><th>Do</th><th style="width:100px">Check: result${p.pdframe.metric?` (${esc(trunc(p.pdframe.metric,20))})`:""}</th><th>Check: learning</th><th style="width:120px">Act</th><th></th></tr></thead><tbody>
 ${p.pdset.cycles.map((c,i)=>`<tr><td class="calc">${i+1}</td>${["change","prediction","done"].map(k=>`<td><textarea data-bind="pdset.cycles.${i}.${k}">${esc(c[k])}</textarea></td>`).join("")}<td><input data-bind="pdset.cycles.${i}.result" value="${esc(c.result)}"></td><td><textarea data-bind="pdset.cycles.${i}.learning">${esc(c.learning)}</textarea></td><td><select data-bind="pdset.cycles.${i}.decision">${["Adopt","Adapt","Abandon"].map(o=>`<option ${o===c.decision?"selected":""}>${o}</option>`).join("")}</select></td><td><button class="x" data-del="pdset.cycles" data-i="${i}" aria-label="Remove">×</button></td></tr>`).join("")}
 </tbody></table></div><button class="btn alt addrow" data-add="pdset.cycles">Add cycle</button><div class="flags" id="cyF"></div>`;
AFTER["pc2.cycles"]=p=>{S.refresh=()=>{const r=filled(p.pdset.cycles,["change"]),f=[];r.forEach((c,i)=>{if(!c.prediction.trim())f.push(`Cycle ${i+1} has no prediction. Without one, you cannot learn whether your understanding of the process was right.`);if(c.result.trim()&&!c.learning.trim())f.push(`Cycle ${i+1}: result recorded but no learning.`)});
  if(r.length>=4&&!r.some(c=>c.decision==="Adopt"))f.push(`${r.length} cycles without adopting anything. Re-check the problem, or whether PDCA is the right method.`);if(r.length&&!f.length)f.push("✓ Cycles have predictions, results and learning.");$("#cyF").innerHTML=flagsHTML(f)}};
TABS.pc2.chart=p=>{const b=parseNums(p.pdframe.baselineData),r=filled(p.pdset.cycles,["change"]).map(c=>num(c.result)),res=r.filter(v=>v!=null);
  if(!b.length&&!res.length)return `<p class="muted">Enter baseline data (Set up) or cycle results to see the chart.</p>`;
  return `<div class="chartbox">${lineChart({values:[...b,...res],title:`${p.pdframe.metric||"Metric"}: baseline then cycle results (orange)`,lines:[{v:num(p.pdframe.target),label:"Target",c:C.orange,dash:1},{v:num(p.pdframe.baseline),label:"Baseline",c:C.light}],flagIdx:res.map((_,i)=>b.length+i)})}</div>`};
TABS.pc3.std=()=>`${inp("pdstd.adopted","What was adopted","The change that became the new way of working.",{rows:3})}${inp("pdstd.where","Where it is documented","",{rows:2})}${inp("pdstd.share","Who was told","",{rows:2})}${inp("pdstd.next","Next improvement","",{rows:2})}`;
AUTO.pc1=p=>{const f=p.pdframe;return{problem:hasNum(f.problem),metric:!!f.metric.trim(),target:num(f.target)!=null&&!!f.targetDate}};
AUTO.pc2=p=>{const r=filled(p.pdset.cycles,["change"]);return{predict:r.length>0&&r.every(c=>c.prediction.trim()),measured:r.length>0&&r.every(c=>num(c.result)!=null),learned:r.length>0&&r.every(c=>c.learning.trim())}};
AUTO.pc3=p=>({adopted:!!p.pdstd.adopted.trim(),documented:!!p.pdstd.where.trim(),shared:!!p.pdstd.share.trim()});
