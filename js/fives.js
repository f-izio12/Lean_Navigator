/* ================= Digital 5S: shared drives, mailboxes, team sites ================= */
var S5=[["sort",_tc("5S","Sort")],["order",_tc("5S","Set in order")],["shine",_tc("5S","Shine")],["standard",_tc("5S","Standardise")],["sustain",_tc("5S","Sustain")]];
var S5Q={
 sort:[_t("Files and folders nobody needs any more have been removed or archived"),_t("Duplicates and personal copies are gone"),_t("Outdated versions are removed or clearly archived")],
 order:[_t("The folder structure is logical and agreed"),_t("Anyone in the team can find a key document in under a minute"),_t("File names follow a convention")],
 shine:[_t("No broken links or shortcuts"),_t("Access rights are correct (no former colleagues, no unnecessary access)"),_t("Storage is within limits and not growing unchecked")],
 standard:[_t("Naming and folder rules are written down"),_t("Retention rules (how long to keep what) are clear"),_t("New team members are told the rules")],
 sustain:[_t("Audits are done on a fixed rhythm"),_t("Audit results are shared with the team"),_t("Issues found in audits are fixed")]};
Object.assign(BLANK,{
 "fsort.red":{item:"",location:"",decision:"Archive",owner:"",done:"No"},
 "fshine.issues":{issue:"",before:"",after:"",action:""},
 "fsustain.audits":{date:"",who:"",notes:""}
});
Object.assign(STAGEBLANK,{
 fsort:()=>({space:"",kind:"Shared drive",owner:"",users:"",problem:"",baseline:{},red:rows("fsort.red"),retention:""}),
 forder:()=>({structure:"",naming:"",rules:""}),
 fshine:()=>({issues:rows("fshine.issues")}),
 fstandard:()=>({standard:"",where:"",onboarding:""}),
 fsustain:()=>({rhythm:"",audits:rows("fsustain.audits"),scores:{}})
});
registerTool("5S",{gate:_t("Check"),stages:[
 {id:"s1",letter:"1",name:_tc("5S","Sort"),key:"fsort",tabs:[["scope",_t("Scope")],["audit",_t("Baseline audit")],["red",_t("Red-tag list")]],
  tg:[["scope",_t("Digital workspace and its owner are defined")],["audit",_t("Baseline audit done")],["retention",_t("Retention and legal obligations checked before deleting anything")],["red",_t("Red-tag decisions taken and carried out")]],
  focus:"clear scope and owner; baseline audit honest; nothing deleted that must be kept for legal, research-integrity or archive reasons; decisions per item with an owner."},
 {id:"s2",letter:"2",name:_tc("5S","Set in order"),key:"forder",tabs:[["structure",_t("Structure and naming")]],
  tg:[["structure",_t("Folder structure agreed with the people who use it")],["naming",_t("Naming convention defined with examples")]],
  focus:"structure follows how the team works, not the org chart; shallow enough to navigate; naming convention concrete with examples, including dates and versions."},
 {id:"s3",letter:"3",name:_tc("5S","Shine"),key:"fshine",tabs:[["clean",_t("Clean-up")]],
  tg:[["links",_t("Broken links and shortcuts fixed")],["access",_t("Access rights reviewed")],["measured",_t("Clean-up measured (before and after)")]],
  focus:"concrete issues with before and after numbers; access review done, including leavers and external guests."},
 {id:"s4",letter:"4",name:_tc("5S","Standardise"),key:"fstandard",tabs:[["rules",_t("Standard")]],
  tg:[["written",_t("Rules written down in one place")],["onboard",_t("Rules included in onboarding")]],
  focus:"rules short and findable; covers naming, structure, versions, retention and access; part of onboarding."},
 {id:"s5",letter:"5",name:_tc("5S","Sustain"),key:"fsustain",tabs:[["audits",_t("Audits")]],
  tg:[["rhythm",_t("Audit rhythm agreed and owned")],["repeat",_t("At least one follow-up audit done")],["held",_t("Scores held or improved since the baseline")]],
  focus:"audit rhythm with an owner; follow-up audits done and compared with the baseline; slippage acted on."}
]});
CONTEXT["5S"]=p=>({workspace:p.fsort.space,kind:p.fsort.kind,problem:p.fsort.problem});
var qKeys=()=>S5.flatMap(([k])=>S5Q[k].map((_,i)=>k+i));
function auditScores(sc){return S5.map(([k,l])=>{const v=S5Q[k].map((_,i)=>num(sc[k+i])).filter(x=>x!=null);return{k,l,avg:v.length?v.reduce((a,b)=>a+b,0)/v.length:null}})}
function radar(series,w=420,h=360){
  const cx=w/2,cy=h/2+6,R=Math.min(w,h)/2-60,n=5,pt=(i,v)=>[cx+R*v/4*Math.sin(2*Math.PI*i/n),cy-R*v/4*Math.cos(2*Math.PI*i/n)];
  let g=svgOpen(w,h);for(let r=1;r<=4;r++)g+=`<polygon points="${S5.map((_,i)=>pt(i,r).join(",")).join(" ")}" fill="none" stroke="${C.line}"/>`;
  S5.forEach(([,l],i)=>{const [x,y]=pt(i,4.7);g+=`<line x1="${cx}" y1="${cy}" x2="${pt(i,4)[0]}" y2="${pt(i,4)[1]}" stroke="${C.line}"/><text x="${x}" y="${y+4}" font-size="11" text-anchor="middle" fill="${C.text}">${l}</text>`});
  series.forEach(s=>{if(s.vals.every(v=>v==null))return;g+=`<polygon points="${s.vals.map((v,i)=>pt(i,v||0).join(",")).join(" ")}" fill="${s.c}" fill-opacity=".18" stroke="${s.c}" stroke-width="2"/>`});
  series.forEach((s,i)=>g+=`<rect x="12" y="${12+i*16}" width="10" height="10" fill="${s.c}"/><text x="28" y="${21+i*16}" font-size="10" fill="${C.text}">${esc(s.label)}</text>`);
  return g+`</svg>`;
}
var auditHTML=(path,sc,lead=_t("Score each statement from 0 (not at all) to 4 (fully true). Be honest: this is your starting point."))=>`<p class="lead">${lead}</p>
 ${S5.map(([k,l])=>`<fieldset><legend>${l}</legend>${S5Q[k].map((q,i)=>`<div class="aq"><span>${esc(q)}</span><select data-bind="${path}.${k}${i}" aria-label="${esc(q)}">${["","0","1","2","3","4"].map(v=>`<option value="${esc(v)}" ${String(sc[k+i]??"")===v?"selected":""}>${esc(_tv(v))}</option>`).join("")}</select></div>`).join("")}</fieldset>`).join("")}`;
TABS.s1.scope=()=>`<div class="grid2">${inp("fsort.space",_t("Digital workspace"),_t("For example: the team's shared drive, the support mailbox, the project site."),{rows:1})}${inp("fsort.kind",_t("Type"),"",{options:["Shared drive","Mailbox","Team site or channel","Cloud folder","Other"]})}</div>
 <div class="grid2">${inp("fsort.owner",_t("Owner"),_t("Who decides what stays."),{rows:1})}${inp("fsort.users",_t("Users"),_t("Who works in it."),{rows:1})}</div>
 ${inp("fsort.problem",_t("Problem"),_t("What goes wrong today, with a number if you can: time spent searching, duplicates, storage used, wrong versions sent."),{rows:3})}
 ${inp("fsort.retention",_t("Retention and legal check"),_t("What must be kept, for how long, and by whom (records management, contracts, personal data). Check this before anything is deleted."),{rows:3})}`;
TABS.s1.audit=p=>auditHTML("fsort.baseline",p.fsort.baseline)+`<div class="chartbox" id="radar1" style="max-width:460px"></div>`;
AFTER["s1.audit"]=p=>{S.refresh=()=>{$("#radar1").innerHTML=radar([{label:_t("Baseline"),c:C.blue,vals:auditScores(p.fsort.baseline).map(s=>s.avg)}])}};
TABS.s1.red=()=>`<p class="lead">${_t("\"Red-tag\" every item whose place is doubtful and decide: delete, archive, keep or move. Deletion only after the retention check on the Scope tab.")}</p>
 ${table("fsort.red",[{k:"item",label:_t("Item or folder")},{k:"location",label:_t("Location")},{k:"decision",label:_t("Decision"),opts:["Delete","Archive","Keep","Move"],w:"120px"},{k:"owner",label:_t("Owner"),w:"140px"},{k:"done",label:_t("Done"),opts:["No","Yes"],w:"80px"}])}<div class="flags" id="redF"></div>`;
AFTER["s1.red"]=p=>{S.refresh=()=>{const r=filled(p.fsort.red,["item"]),f=[];if(r.some(x=>x.decision==="Delete")&&!p.fsort.retention.trim())f.push(_t("Items are marked for deletion but the retention check (Scope tab) is empty. Check legal and archive obligations first."));if(r.length)f.push(_t("ℹ {a} of {b} decisions carried out.",{a:r.filter(x=>x.done==="Yes").length,b:r.length}));$("#redF").innerHTML=flagsHTML(f)}};
TABS.s2.structure=()=>`${inp("forder.structure",_t("Folder structure"),_t("The agreed top levels and what goes where. Keep it shallow: three or four levels at most."),{rows:8,ph:_t("01 Management\n02 Projects\n   2026-Repository-selection\n03 Procedures\n99 Archive")})}
 ${inp("forder.naming",_t("Naming convention"),_t("With two or three examples."),{rows:4,ph:_t("YYYY-MM-DD_Topic_Version, e.g. 2026-10-01_Retention-policy_v2.docx")})}${inp("forder.rules",_t("Other rules"),_t("Versions, drafts, personal folders, links instead of copies."),{rows:3})}`;
TABS.s3.clean=()=>`<p class="lead">${_t("Fix what makes the workspace unreliable, and count before and after.")}</p>${table("fshine.issues",[{k:"issue",label:_t("Issue"),w:"240px"},{k:"before",label:_t("Before"),type:"text",w:"100px"},{k:"after",label:_t("After"),type:"text",w:"100px"},{k:"action",label:_t("What was done")}],{label:_t("Change")})}
 <p class="small muted">${_t("Typical issues: broken links, duplicates, files over a certain age, people with access who left, storage used.")}</p>`;
AFTER["s3.clean"]=p=>{S.refresh=()=>fillCalc("fshine.issues",chgCalc)};
TABS.s4.rules=()=>`${inp("fstandard.standard",_t("The standard"),_t("One page: structure, naming, versions, retention, access. Short enough that people read it."),{rows:8})}${inp("fstandard.where",_t("Where it lives"),"",{rows:1})}${inp("fstandard.onboarding",_t("How new colleagues learn it"),"",{rows:2})}`;
TABS.s5.audits=p=>`${inp("fsustain.rhythm",_t("Audit rhythm and owner"),_t("For example: quarterly, by the workspace owner."),{rows:1})}
 ${table("fsustain.audits",[{k:"date",label:_t("Date"),type:"date",w:"150px"},{k:"who",label:_t("Who"),w:"160px"},{k:"notes",label:_t("Findings")}])}
 <h4>${_t("Latest audit scores")}</h4>${auditHTML("fsustain.scores",p.fsustain.scores,_t("Score the same 15 statements again. The chart compares this audit with the baseline."))}<div class="chartbox" id="radar5" style="max-width:460px"></div><div class="flags" id="s5F"></div>`;
AFTER["s5.audits"]=p=>{S.refresh=()=>{const b=auditScores(p.fsort.baseline),n=auditScores(p.fsustain.scores);$("#radar5").innerHTML=radar([{label:_t("Baseline"),c:C.grey,vals:b.map(s=>s.avg)},{label:_t("Latest audit"),c:C.orange,vals:n.map(s=>s.avg)}]);
  const f=[];n.forEach((s,i)=>{if(s.avg!=null&&b[i].avg!=null&&s.avg<b[i].avg)f.push(`${_t("{l} has slipped below the baseline ({avg} against {avg2}).",{l:s.l,avg:fmt(s.avg,1),avg2:fmt(b[i].avg,1)})}`)});S5.forEach(([k,l])=>S5Q[k].forEach((q,i)=>{const a=num(p.fsort.baseline[k+i]),c=num(p.fsustain.scores[k+i]);if(a!=null&&c!=null&&c<a)f.push(`${_t("{l}: \"{q}\" dropped from {a} to {c}.",{l:l,q:q,a:a,c:c})}`)}));if(n.every(s=>s.avg!=null)&&!f.length)f.push(_t("✓ All five S at or above the baseline."));$("#s5F").innerHTML=flagsHTML(f)}};
var allScored=sc=>qKeys().every(k=>num(sc[k])!=null);
AUTO.s1=p=>{const s=p.fsort,r=filled(s.red,["item"]);return{scope:!!(s.space.trim()&&s.owner.trim()),audit:allScored(s.baseline),retention:!!s.retention.trim(),red:r.length>0&&r.every(x=>x.done==="Yes")}};
AUTO.s2=p=>({structure:!!p.forder.structure.trim(),naming:!!p.forder.naming.trim()});
AUTO.s3=p=>{const r=filled(p.fshine.issues,["issue"]);return{measured:r.length>0&&r.every(x=>num(x.before)!=null&&num(x.after)!=null)}};
AUTO.s4=p=>({written:!!p.fstandard.standard.trim()&&!!p.fstandard.where.trim(),onboard:!!p.fstandard.onboarding.trim()});
AUTO.s5=p=>{const b=auditScores(p.fsort.baseline),n=auditScores(p.fsustain.scores);return{rhythm:!!p.fsustain.rhythm.trim(),repeat:filled(p.fsustain.audits,["date"]).length>0&&allScored(p.fsustain.scores),held:allScored(p.fsustain.scores)&&n.every((s,i)=>b[i].avg==null||s.avg>=b[i].avg)}};
EXTRA.s1=p=>({baselineScores:auditScores(p.fsort.baseline)});EXTRA.s5=p=>({baseline:auditScores(p.fsort.baseline),latest:auditScores(p.fsustain.scores)});
