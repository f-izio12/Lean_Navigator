/* ================= Digital 5S: shared drives, mailboxes, team sites ================= */
const S5=[["sort","Sort"],["order","Set in order"],["shine","Shine"],["standard","Standardise"],["sustain","Sustain"]];
const S5Q={
 sort:["Files and folders nobody needs any more have been removed or archived","Duplicates and personal copies are gone","Outdated versions are removed or clearly archived"],
 order:["The folder structure is logical and agreed","Anyone in the team can find a key document in under a minute","File names follow a convention"],
 shine:["No broken links or shortcuts","Access rights are correct (no former colleagues, no unnecessary access)","Storage is within limits and not growing unchecked"],
 standard:["Naming and folder rules are written down","Retention rules (how long to keep what) are clear","New team members are told the rules"],
 sustain:["Audits are done on a fixed rhythm","Audit results are shared with the team","Issues found in audits are fixed"]};
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
registerTool("5S",{gate:"Check",stages:[
 {id:"s1",letter:"1",name:"Sort",key:"fsort",tabs:[["scope","Scope"],["audit","Baseline audit"],["red","Red-tag list"]],
  tg:[["scope","Digital workspace and its owner are defined"],["audit","Baseline audit done"],["retention","Retention and legal obligations checked before deleting anything"],["red","Red-tag decisions taken and carried out"]],
  focus:"clear scope and owner; baseline audit honest; nothing deleted that must be kept for legal, research-integrity or archive reasons; decisions per item with an owner."},
 {id:"s2",letter:"2",name:"Set in order",key:"forder",tabs:[["structure","Structure and naming"]],
  tg:[["structure","Folder structure agreed with the people who use it"],["naming","Naming convention defined with examples"]],
  focus:"structure follows how the team works, not the org chart; shallow enough to navigate; naming convention concrete with examples, including dates and versions."},
 {id:"s3",letter:"3",name:"Shine",key:"fshine",tabs:[["clean","Clean-up"]],
  tg:[["links","Broken links and shortcuts fixed"],["access","Access rights reviewed"],["measured","Clean-up measured (before and after)"]],
  focus:"concrete issues with before and after numbers; access review done, including leavers and external guests."},
 {id:"s4",letter:"4",name:"Standardise",key:"fstandard",tabs:[["rules","Standard"]],
  tg:[["written","Rules written down in one place"],["onboard","Rules included in onboarding"]],
  focus:"rules short and findable; covers naming, structure, versions, retention and access; part of onboarding."},
 {id:"s5",letter:"5",name:"Sustain",key:"fsustain",tabs:[["audits","Audits"]],
  tg:[["rhythm","Audit rhythm agreed and owned"],["repeat","At least one follow-up audit done"],["held","Scores held or improved since the baseline"]],
  focus:"audit rhythm with an owner; follow-up audits done and compared with the baseline; slippage acted on."}
]});
CONTEXT["5S"]=p=>({workspace:p.fsort.space,kind:p.fsort.kind,problem:p.fsort.problem});
const qKeys=()=>S5.flatMap(([k])=>S5Q[k].map((_,i)=>k+i));
function auditScores(sc){return S5.map(([k,l])=>{const v=S5Q[k].map((_,i)=>num(sc[k+i])).filter(x=>x!=null);return{k,l,avg:v.length?v.reduce((a,b)=>a+b,0)/v.length:null}})}
function radar(series,w=420,h=360){
  const cx=w/2,cy=h/2+6,R=Math.min(w,h)/2-60,n=5,pt=(i,v)=>[cx+R*v/4*Math.sin(2*Math.PI*i/n),cy-R*v/4*Math.cos(2*Math.PI*i/n)];
  let g=svgOpen(w,h);for(let r=1;r<=4;r++)g+=`<polygon points="${S5.map((_,i)=>pt(i,r).join(",")).join(" ")}" fill="none" stroke="${C.line}"/>`;
  S5.forEach(([,l],i)=>{const [x,y]=pt(i,4.7);g+=`<line x1="${cx}" y1="${cy}" x2="${pt(i,4)[0]}" y2="${pt(i,4)[1]}" stroke="${C.line}"/><text x="${x}" y="${y+4}" font-size="11" text-anchor="middle" fill="${C.text}">${l}</text>`});
  series.forEach(s=>{if(s.vals.every(v=>v==null))return;g+=`<polygon points="${s.vals.map((v,i)=>pt(i,v||0).join(",")).join(" ")}" fill="${s.c}" fill-opacity=".18" stroke="${s.c}" stroke-width="2"/>`});
  series.forEach((s,i)=>g+=`<rect x="12" y="${12+i*16}" width="10" height="10" fill="${s.c}"/><text x="28" y="${21+i*16}" font-size="10" fill="${C.text}">${esc(s.label)}</text>`);
  return g+`</svg>`;
}
const auditHTML=(path,sc,lead="Score each statement from 0 (not at all) to 4 (fully true). Be honest: this is your starting point.")=>`<p class="lead">${lead}</p>
 ${S5.map(([k,l])=>`<fieldset><legend>${l}</legend>${S5Q[k].map((q,i)=>`<div class="aq"><span>${esc(q)}</span><select data-bind="${path}.${k}${i}" aria-label="${esc(q)}">${["","0","1","2","3","4"].map(v=>`<option ${String(sc[k+i]??"")===v?"selected":""}>${v}</option>`).join("")}</select></div>`).join("")}</fieldset>`).join("")}`;
TABS.s1.scope=()=>`<div class="grid2">${inp("fsort.space","Digital workspace","For example: the team's shared drive, the support mailbox, the project site.",{rows:1})}${inp("fsort.kind","Type","",{options:["Shared drive","Mailbox","Team site or channel","Cloud folder","Other"]})}</div>
 <div class="grid2">${inp("fsort.owner","Owner","Who decides what stays.",{rows:1})}${inp("fsort.users","Users","Who works in it.",{rows:1})}</div>
 ${inp("fsort.problem","Problem","What goes wrong today, with a number if you can: time spent searching, duplicates, storage used, wrong versions sent.",{rows:3})}
 ${inp("fsort.retention","Retention and legal check","What must be kept, for how long, and by whom (records management, research data, personal data). Check this before anything is deleted.",{rows:3})}`;
TABS.s1.audit=p=>auditHTML("fsort.baseline",p.fsort.baseline)+`<div class="chartbox" id="radar1" style="max-width:460px"></div>`;
AFTER["s1.audit"]=p=>{S.refresh=()=>{$("#radar1").innerHTML=radar([{label:"Baseline",c:C.blue,vals:auditScores(p.fsort.baseline).map(s=>s.avg)}])}};
TABS.s1.red=()=>`<p class="lead">"Red-tag" every item whose place is doubtful and decide: delete, archive, keep or move. Deletion only after the retention check on the Scope tab.</p>
 ${table("fsort.red",[{k:"item",label:"Item or folder"},{k:"location",label:"Location"},{k:"decision",label:"Decision",opts:["Delete","Archive","Keep","Move"],w:"120px"},{k:"owner",label:"Owner",w:"140px"},{k:"done",label:"Done",opts:["No","Yes"],w:"80px"}])}<div class="flags" id="redF"></div>`;
AFTER["s1.red"]=p=>{S.refresh=()=>{const r=filled(p.fsort.red,["item"]),f=[];if(r.some(x=>x.decision==="Delete")&&!p.fsort.retention.trim())f.push("Items are marked for deletion but the retention check (Scope tab) is empty. Check legal and archive obligations first.");if(r.length)f.push(`ℹ ${r.filter(x=>x.done==="Yes").length} of ${r.length} decisions carried out.`);$("#redF").innerHTML=flagsHTML(f)}};
TABS.s2.structure=()=>`${inp("forder.structure","Folder structure","The agreed top levels and what goes where. Keep it shallow: three or four levels at most.",{rows:8,ph:"01 Management\n02 Projects\n   2026-Repository-selection\n03 Procedures\n99 Archive"})}
 ${inp("forder.naming","Naming convention","With two or three examples.",{rows:4,ph:"YYYY-MM-DD_Topic_Version, e.g. 2026-10-01_Retention-policy_v2.docx"})}${inp("forder.rules","Other rules","Versions, drafts, personal folders, links instead of copies.",{rows:3})}`;
TABS.s3.clean=()=>`<p class="lead">Fix what makes the workspace unreliable, and count before and after.</p>${table("fshine.issues",[{k:"issue",label:"Issue",w:"240px"},{k:"before",label:"Before",type:"text",w:"100px"},{k:"after",label:"After",type:"text",w:"100px"},{k:"action",label:"What was done"}],{label:"Change"})}
 <p class="small muted">Typical issues: broken links, duplicates, files over a certain age, people with access who left, storage used.</p>`;
AFTER["s3.clean"]=p=>{S.refresh=()=>fillCalc("fshine.issues",chgCalc)};
TABS.s4.rules=()=>`${inp("fstandard.standard","The standard","One page: structure, naming, versions, retention, access. Short enough that people read it.",{rows:8})}${inp("fstandard.where","Where it lives","",{rows:1})}${inp("fstandard.onboarding","How new colleagues learn it","",{rows:2})}`;
TABS.s5.audits=p=>`${inp("fsustain.rhythm","Audit rhythm and owner","For example: quarterly, by the workspace owner.",{rows:1})}
 ${table("fsustain.audits",[{k:"date",label:"Date",type:"date",w:"150px"},{k:"who",label:"Who",w:"160px"},{k:"notes",label:"Findings"}])}
 <h4>Latest audit scores</h4>${auditHTML("fsustain.scores",p.fsustain.scores,"Score the same 15 statements again. The chart compares this audit with the baseline.")}<div class="chartbox" id="radar5" style="max-width:460px"></div><div class="flags" id="s5F"></div>`;
AFTER["s5.audits"]=p=>{S.refresh=()=>{const b=auditScores(p.fsort.baseline),n=auditScores(p.fsustain.scores);$("#radar5").innerHTML=radar([{label:"Baseline",c:C.grey,vals:b.map(s=>s.avg)},{label:"Latest audit",c:C.orange,vals:n.map(s=>s.avg)}]);
  const f=[];n.forEach((s,i)=>{if(s.avg!=null&&b[i].avg!=null&&s.avg<b[i].avg)f.push(`${s.l} has slipped below the baseline (${fmt(s.avg,1)} against ${fmt(b[i].avg,1)}).`)});S5.forEach(([k,l])=>S5Q[k].forEach((q,i)=>{const a=num(p.fsort.baseline[k+i]),c=num(p.fsustain.scores[k+i]);if(a!=null&&c!=null&&c<a)f.push(`${l}: "${q}" dropped from ${a} to ${c}.`)}));if(n.every(s=>s.avg!=null)&&!f.length)f.push("✓ All five S at or above the baseline.");$("#s5F").innerHTML=flagsHTML(f)}};
const allScored=sc=>qKeys().every(k=>num(sc[k])!=null);
AUTO.s1=p=>{const s=p.fsort,r=filled(s.red,["item"]);return{scope:!!(s.space.trim()&&s.owner.trim()),audit:allScored(s.baseline),retention:!!s.retention.trim(),red:r.length>0&&r.every(x=>x.done==="Yes")}};
AUTO.s2=p=>({structure:!!p.forder.structure.trim(),naming:!!p.forder.naming.trim()});
AUTO.s3=p=>{const r=filled(p.fshine.issues,["issue"]);return{measured:r.length>0&&r.every(x=>num(x.before)!=null&&num(x.after)!=null)}};
AUTO.s4=p=>({written:!!p.fstandard.standard.trim()&&!!p.fstandard.where.trim(),onboard:!!p.fstandard.onboarding.trim()});
AUTO.s5=p=>{const b=auditScores(p.fsort.baseline),n=auditScores(p.fsustain.scores);return{rhythm:!!p.fsustain.rhythm.trim(),repeat:filled(p.fsustain.audits,["date"]).length>0&&allScored(p.fsustain.scores),held:allScored(p.fsustain.scores)&&n.every((s,i)=>b[i].avg==null||s.avg>=b[i].avg)}};
EXTRA.s1=p=>({baselineScores:auditScores(p.fsort.baseline)});EXTRA.s5=p=>({baseline:auditScores(p.fsort.baseline),latest:auditScores(p.fsustain.scores)});
