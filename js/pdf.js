/* ================= PDF engine ================= */
const CP1252="€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const pdfText=s=>String(s??"").replace(/✓/g,"OK").replace(/ℹ\s?/g,"").replace(/≥/g,">=").replace(/≤/g,"<=").replace(/→/g,"->").replace(/×/g,"x").replace(/[^\n\r\t\x20-\xFF]/g,c=>CP1252.includes(c)?c:"?");
function svgToPng(svg){return new Promise(res=>{try{
  const m=svg.match(/width="(\d+)" height="(\d+)"/);const w=+m[1],h=+m[2];const img=new Image();
  img.onload=()=>{try{const c=document.createElement("canvas");c.width=w*2;c.height=h*2;const x=c.getContext("2d");x.scale(2,2);x.drawImage(img,0,0);res({data:c.toDataURL("image/png"),w,h})}catch{res(null)}};
  img.onerror=()=>res(null);img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)}catch{res(null)}})}
const BLUE=[12,33,69],ORG=[195,181,152],LBL=[195,181,152],GRY=[92,107,128],LIN=[226,220,203],WARN=[163,66,42],GOLDD=[122,106,62],PALE=[244,239,225];
function helpers(doc,pageArgs=[]){
  const M=16,PW=()=>doc.internal.pageSize.getWidth(),PH=()=>doc.internal.pageSize.getHeight(),W=()=>PW()-2*M;
  const H={doc,M,W,y:20};
  H.newPage=()=>{doc.addPage(...pageArgs);H.y=20};H.room=h=>{if(H.y+h>PH()-19)H.newPage()};
  const style={font:"helvetica",fontSize:8.5,cellPadding:1.8,textColor:BLUE,lineColor:LIN,lineWidth:.2,overflow:"linebreak",valign:"top"};
  H.h2=t=>{H.room(14);doc.setFont("helvetica","bold");doc.setFontSize(11.5);doc.setTextColor(...BLUE);doc.text(pdfText(t),M,H.y);doc.setDrawColor(...ORG);doc.setLineWidth(.6);doc.line(M,H.y+1.8,M+14,H.y+1.8);H.y+=7};
  H.para=(t,o={})=>{const empty=!String(t||"").trim();if(empty)t=o.empty||"Nothing recorded.";doc.setFont("helvetica",o.bold?"bold":"normal");doc.setFontSize(o.size||9);doc.setTextColor(...(o.color||(empty?GRY:BLUE)));
    doc.splitTextToSize(pdfText(t),W()).forEach(l=>{H.room(5);doc.text(l,M,H.y);H.y+=4.3});H.y+=2};
  H.kv=rs=>{doc.autoTable({startY:H.y,body:rs.map(([k,v])=>[pdfText(k),pdfText(String(_tv(v)??"").trim()||"-")]),theme:"grid",styles:style,columnStyles:{0:{cellWidth:50,fontStyle:"bold",fillColor:PALE}},margin:{left:M,right:M}});H.y=doc.lastAutoTable.finalY+6};
  H.tbl=(head,rs,widths)=>{const body=rs.filter(r=>r.some(c=>String(c??"").trim()));if(!body.length){H.para("");return}
    const cs={};(widths||[]).forEach((w,i)=>{if(w)cs[i]={cellWidth:w}});
    doc.autoTable({startY:H.y,head:[head.map(pdfText)],body:body.map(r=>r.map(c=>pdfText(_tv(c)))),theme:"grid",styles:style,headStyles:{fillColor:BLUE,textColor:255,fontStyle:"bold"},columnStyles:cs,margin:{left:M,right:M},showHead:"everyPage"});H.y=doc.lastAutoTable.finalY+6};
  H.img=async(svg,maxW)=>{if(!svg)return;const r=await svgToPng(svg);if(!r){H.para(_t("(Chart could not be rendered in this browser.)"),{color:GRY});return}
    let w=Math.min(maxW||W(),r.w*.26,W()),h=w*r.h/r.w;const mh=doc.internal.pageSize.getHeight()-45;if(h>mh){w=w*mh/h;h=mh}H.room(h+4);doc.addImage(r.data,"PNG",M,H.y,w,h);H.y+=h+6};
  return H;
}
function rowsOf(arr,keys){return arr.map(r=>keys.map(k=>typeof k==="function"?k(r):r[k]??""))}
const COVER={};
async function buildPDF(p){
  const {jsPDF}=window.jspdf,d=DEF[p.tool],isA3=p.tool==="A3 problem solving",land=p.tool==="Value stream mapping";
  const doc=new jsPDF({unit:"mm",format:isA3?"a3":"a4",orientation:isA3||land?"landscape":"portrait"});
  const H=helpers(doc,isA3?["a4","portrait"]:[]),M=H.M;
  if(isA3){await a3Sheet(doc,p);H.newPage();H.para(_t("Appendix: full A3 record"),{bold:true,size:12})}
  else{
    const cv=COVER[p.tool](p),PW=doc.internal.pageSize.getWidth();
    doc.setFillColor(...BLUE);doc.rect(0,0,PW,58,"F");doc.setFillColor(...ORG);doc.rect(M,16,2.5,28,"F");
    doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(...LBL);doc.text(pdfText((_t("{tool} project report",{tool:p.tool}))),M+7,21);
    doc.setFont("helvetica","bold");doc.setFontSize(19);doc.setTextColor(255,255,255);doc.splitTextToSize(pdfText(p.title),PW-2*M-10).slice(0,2).forEach((l,i)=>doc.text(l,M+7,31+i*8));
    H.y=70;H.kv([[_t("Status"),STATUSES[p.status]],[_t("Current stage"),p.status==="closed"?(_t("Closed ({x})",{x:ST[p.phase].name})):ST[p.phase].name],[_t("Created"),fmtDate(p.created)],[_t("Last updated"),fmtDate(p.updated)],[_t("Report generated"),fmtDate(new Date().toISOString())],...cv.people]);
    H.h2(_t("Summary"));H.kv(cv.summary);
  }
  H.h2(_t("Stage overview"));H.tbl([_t("Stage"),_t("Status"),(_t("{gate} checks done",{gate:d.gate})),_t("Decision")],d.order.map(k=>[ST[k].name,stageStatus(p,k),progress(p,k)+"%",({go:_t("Go"),rework:_t("Rework"),stop:_t("Stop")})[tgOf(p,k).decision]||"-"]));
  for(const k of d.order){
    H.newPage();const PW=doc.internal.pageSize.getWidth(),Wd=PW-2*M;
    doc.setFillColor(...BLUE);doc.rect(M,H.y-6,Wd,16,"F");doc.setFillColor(...ORG);doc.rect(M,H.y+10,Wd,1.2,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(18);doc.setTextColor(...ORG);doc.text(ST[k].letter,M+5,H.y+5.5);doc.setFontSize(13);doc.setTextColor(255,255,255);doc.text(pdfText(ST[k].name),M+16,H.y+5);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text(pdfText(_tv(stageStatus(p,k))),M+Wd-5,H.y+5,{align:"right"});H.y+=20;
    if(stageStatus(p,k)==="Not started"){H.para(_t("Not started."));continue}
    await PDFSEC[k](H,p);
    const t=tgOf(p,k);H.h2(ST[k].name+": "+d.gate);H.tbl([_t("Check"),_t("Done")],ST[k].tg.map(([c,l])=>[l,t.checks[c]?_t("Yes"):_t("No")]),[null,20]);
    H.kv([[_t("Decision"),{go:ST[k].next?(_t("Go to {x}",{x:ST[ST[k].next].name})):_t("Project closed"),rework:_t("Rework"),stop:_t("Stop the project")}[t.decision]||_t("No decision recorded")],[_t("Notes"),t.notes]]);
  }
  await projectSectionsPdf(H,p);
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){doc.setPage(i);const PW=doc.internal.pageSize.getWidth(),PHh=doc.internal.pageSize.getHeight();doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(...GRY);doc.text(pdfText(trunc(p.title,80)),M,PHh-7);doc.text(`${_t("Page {i} of {n}",{i:i,n:n})}`,PW-M,PHh-7,{align:"right"})}
  return doc.output("blob");
}

async function projectSectionsPdf(H,p){
  const has=p.plan.items.length,st=p.people.stakeholders.filter(s=>s.name);if(!has&&!st.length)return;
  H.newPage();
  if(has){H.h2(_t("Plan"));const {tree}=planDates(p);const code=x=>tree.find(y=>y.id===x)?.code;
    H.tbl(["#",_t("Item"),_t("Responsible"),_t("Start"),_t("End"),_t("Depends on")],tree.map(t=>[t.code,(t.depth?"  ".repeat(t.depth):"")+PTYPES[t.type]+": "+(t.title||""),t.owner||"",t.type==="ms"?"":fmtD(t._eff.s),fmtD(t._eff.e),(t.deps||[]).map(code).filter(Boolean).join(", ")]),[14,null,30,20,20,22]);
    const iss=planIssues(p).issues;if(iss.length)H.para((_t("Plan warnings: {x}",{x:iss.join(" ")})),{color:WARN});
    await H.img(ganttSVG(p))}
  if(st.length){H.h2(_t("Stakeholders"));H.tbl([_t("Name"),_t("Role"),_t("Influence"),_t("Interest"),_t("Approach"),_t("Now"),_t("Needed"),_t("Action")],st.map(s=>[s.name,s.role,s.influence,s.interest,sQuad(s),s.current,s.desired,s.action]),[null,null,19,17,26,19,19,null]);await H.img(powerGrid(p.people.stakeholders),110);
    H.h2("RACI");const rows=raciRows(p),cells=p.people.raci.cells;H.tbl([_t("Activity"),...st.map(s=>s.name)],rows.map(r=>[r.label,...st.map(s=>(cells[r.key]||{})[s.id]||"")]));
    const rc=raciCheck(p);if(rc.length)H.para((_t("RACI gaps: {x}",{x:rc.join(" ")})),{color:WARN})}
}

/* ----- A3 one-page sheet (A3 landscape) ----- */
function fitText(doc,t,x,y,w,h){
  t=pdfText(String(t||"").trim()||"-");
  for(const s of [9.5,9,8.5,8,7.5,7,6.5,6]){doc.setFontSize(s);const ls=doc.splitTextToSize(t,w),lh=s*.3528*1.3;if(ls.length*lh<=h){ls.forEach((l,i)=>doc.text(l,x,y+s*.3528+i*lh));return ls.length*lh}}
  doc.setFontSize(6);const lh=6*.3528*1.3,ls=doc.splitTextToSize(t,w),max=Math.floor(h/lh);ls.slice(0,max).forEach((l,i)=>doc.text(i===max-1?l.slice(0,-3)+"...":l,x,y+2.1+i*lh));return h;
}
async function a3Sheet(doc,p){
  const a=p.a3plan,dd=p.a3do,c=p.a3check,ac=p.a3act;
  doc.setFillColor(...BLUE);doc.rect(0,0,420,26,"F");doc.setFillColor(...ORG);doc.rect(12,6,2,14,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(16);doc.setTextColor(255,255,255);doc.text(pdfText(trunc(p.title,90)),18,14);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...LBL);doc.text(pdfText(`${_t("Owner: {x}    Mentor: {x2}    Started: {x3}    Status: {status}, {x4}",{x:a.owner||"-",x2:a.mentor||"-",x3:fmtDate(a.date)||"-",status:STATUSES[p.status],x4:ST[p.phase].name})}`),18,21);
  const block=async(n,title,x,y,w,h,fill)=>{doc.setDrawColor(...LIN);doc.setLineWidth(.3);doc.rect(x,y,w,h);doc.setFillColor(...PALE);doc.rect(x,y,w,7,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(...GOLDD);doc.text(String(n),x+3,y+5);doc.setTextColor(...BLUE);doc.text(pdfText(title),x+9,y+5);
    doc.setFont("helvetica","normal");doc.setTextColor(...BLUE);await fill(x+3,y+10,w-6,h-13)};
  const img=async(svg,x,y,w,h)=>{const r=await svgToPng(svg);if(!r)return 0;let iw=w,ih=w*r.h/r.w;if(ih>h){ih=h;iw=h*r.w/r.h}doc.addImage(r.data,"PNG",x,y,iw,ih);return ih};
  const L=12,R=214,CW=194,T=32;
  await block(1,_t("Background"),L,T,CW,38,(x,y,w,h)=>fitText(doc,a.background,x,y,w,h));
  await block(2,_t("Current condition"),L,T+40,CW,72,async(x,y,w,h)=>{const d=parseNums(a.currentData);let used=0;
    const txt=a.current+(a.metric?`\n\n${_t("Key metric: {metric}{x}",{metric:a.metric,x:a.currentValue?" = "+a.currentValue:""})}`:"");
    if(d.length>1){used=fitText(doc,txt,x,y,w,h*.42);await img(lineChart({values:d,title:a.metric||_t("Current condition"),lines:[{v:stats(d).median,label:_t("Median"),c:C.light,dash:1}]}),x,y+used+2,w,h-used-3)}else fitText(doc,txt,x,y,w,h)});
  await block(3,_t("Target condition"),L,T+114,CW,30,(x,y,w,h)=>fitText(doc,a.target+(a.targetValue?`\n${_t("Target value: {targetValue}",{targetValue:a.targetValue})}`:"")+(a.targetDate?`   ${_t("By: {targetDate}",{targetDate:fmtDate(a.targetDate)})}`:""),x,y,w,h));
  await block(4,_t("Root cause analysis"),L,T+146,CW,109,async(x,y,w,h)=>{let used=0;
    if(fishCount(a.fishbone)){used=await img(fishboneChart(a.fishbone,a.current||p.title),x,y,w,h*.55)+2}
    const ch=a.whys.filter(z=>z.problem||z.root).map(z=>`${z.problem||_t("Symptom")}: ${[z.w1,z.w2,z.w3,z.w4,z.w5].filter(Boolean).join(" > ")}${z.root?(" "+_t("> ROOT CAUSE: {root}",{root:z.root})):""}`).join("\n");
    fitText(doc,(a.rootSummary?(_t("Root cause: {rootSummary}",{rootSummary:a.rootSummary})+"\n\n"):"")+ch,x,y+used,w,h-used)});
  await block(5,_t("Countermeasures"),R,T,CW,80,(x,y,w,h)=>fitText(doc,filled(dd.counter,["counter"]).map((z,i)=>`${i+1}. ${z.counter}${z.cause?("  "+_t("[root cause: {cause}]",{cause:z.cause})):""}${z.effect?("  "+_t("Expected: {effect}",{effect:z.effect})):""}${z.owner?"  ("+z.owner+")":""}`).join("\n")||"-",x,y,w,h));
  await block(6,_t("Implementation plan"),R,T+82,CW,66,(x,y,w,h)=>fitText(doc,filled(dd.actions,["action"]).map(z=>`[${z.status}] ${z.action}${z.owner?" - "+z.owner:""}${z.due?(_t(", due {due}",{due:fmtDate(z.due)})):""}`).join("\n")||"-",x,y,w,h));
  await block(7,_t("Follow-up and next steps"),R,T+150,CW,105,async(x,y,w,h)=>{const pre=parseNums(a.currentData),post=parseNums(c.afterData);let used=0;
    const b=num(c.before)??num(a.currentValue),af=num(c.after);
    const txt=[b!=null&&af!=null?`Result: ${fmt(b)} -> ${fmt(af)}${a.targetValue?(" "+_t("(target {targetValue})",{targetValue:a.targetValue})):""}`:"",c.method?(_t("Measured by: {method}",{method:c.method})):"",c.worked?(_t("Worked: {worked}",{worked:c.worked})):"",c.notworked?(_t("Did not work: {notworked}",{notworked:c.notworked})):"",ac.standardise?(_t("Standard: {standardise}",{standardise:ac.standardise})):"",ac.share?(_t("Share: {share}",{share:ac.share})):"",ac.open?(_t("Open: {open}",{open:ac.open})):""].filter(Boolean).join("\n");
    if(post.length>1){used=await img(lineChart({values:[...pre,...post],title:_t("Before and after"),lines:[{v:num(a.targetValue),label:_t("Target"),c:C.orange,dash:1}],flagIdx:post.map((_,i)=>pre.length+i)}),x,y,w,h*.45)+2}
    fitText(doc,txt,x,y+used,w,h-used)});
}

/* ----- DMAIC sections ----- */
COVER.DMAIC=p=>{const c=p.define.charter;return{people:[[_t("Sponsor"),c.sponsor],[_t("Process owner"),c.processOwner],[_t("Project lead"),c.lead],[_t("Core team"),c.team]],summary:[[_t("Problem"),c.problem],[_t("Baseline"),c.baseline],[_t("Goal"),c.goal],[_t("Expected benefit"),c.benefit]]}};
PDFSEC.D=async(H,p)=>{const c=p.define.charter;
  H.h2(_t("Project charter"));H.kv([[_t("Business case"),c.businessCase],[_t("Problem statement"),c.problem],[_t("Baseline metric"),c.baseline],[_t("Goal statement"),c.goal],[_t("In scope"),c.inScope],[_t("Out of scope"),c.outScope],[_t("Sponsor"),c.sponsor],[_t("Process owner"),c.processOwner],[_t("Project lead"),c.lead],[_t("Core team"),c.team],[_t("Start date"),fmtDate(c.start)],[_t("Define tollgate date"),fmtDate(c.tollgateDate)],[_t("Expected benefit"),c.benefit]]);
  H.h2("SIPOC");const s=p.define.sipoc,cols=["s","i","p","o","c"].map(k=>lines(s[k])),n=Math.max(0,...cols.map(x=>x.length));
  H.tbl([_t("Suppliers"),_t("Inputs"),_t("Process"),_t("Outputs"),_t("Customers")],Array.from({length:n},(_,i)=>cols.map(x=>x[i]||"")));
  H.h2(_t("Voice of the customer"));H.tbl([_t("Customer"),_t("What they say"),_t("Key driver"),"CTQ",_t("Specification / target")],rowsOf(p.define.voc,["customer","voice","driver","ctq","spec"]))};
PDFSEC.M=async(H,p)=>{const m=p.measure;
  H.h2(_t("Data collection plan"));H.tbl([_t("Metric"),_t("Y/X"),_t("Operational definition"),_t("Source"),_t("Sample"),_t("Who")],rowsOf(m.plan,["metric",r=>r.metric?r.type:"","definition","source","sample","who"]),[null,12]);
  H.h2(_t("Measurement system analysis"));H.kv([[_t("Method"),m.msa.method],[_t("%GRR"),m.msa.grr],[_t("Distinct categories"),m.msa.ndc],[_t("Result and actions"),m.msa.notes]]);
  H.h2(_t("Baseline and capability"));const x=parseNums(m.baseline.data);
  if(x.length){const st=stats(x),cap=capability(x,m.baseline.lsl,m.baseline.usl),side=longestSide(x,st.median);
    H.kv([[_t("Unit"),m.baseline.unit],["n",st.n],[_t("Mean / median"),fmt(st.mean)+" / "+fmt(st.median)],[_t("Standard deviation"),fmt(st.sd)],[_t("Min / max"),fmt(st.min)+" / "+fmt(st.max)],[_t("Spec limits"),(m.baseline.lsl||"-")+" / "+(m.baseline.usl||"-")],
      ...(cap&&cap.out!=null?[[_t("Out of spec"),cap.out+" ("+fmt(cap.out/st.n*100,1)+"%)"],[_t("Cp / Cpk"),fmt(cap.cp)+" / "+fmt(cap.cpk)],[_t("DPMO"),fmt(cap.dpmo,0)],[_t("Sigma level"),cap.sigma==null?_t("n/a (no defects in sample)"):fmt(cap.sigma,1)]]:[]),
      [_t("Run chart signals"),((side.len>=6?(_t("Shift of {len} points.",{len:side.len})+" "):"")+(longestTrend(x)>=5?(_t("Trend of {x} points.",{x:longestTrend(x)})):""))||_t("None")]]);
    await H.img(lineChart({values:x,title:(_t("Baseline run chart{x}",{x:m.baseline.unit?" ("+m.baseline.unit+")":""})),lines:[{v:st.median,label:_t("Median"),c:C.light,dash:1},{v:num(m.baseline.lsl),label:_t("LSL"),c:C.orange},{v:num(m.baseline.usl),label:_t("USL"),c:C.orange}],flagIdx:side.len>=6?side.idx:[]}))}
  else H.para(_t("No baseline data entered."));
  if(m.baseline.notes)H.para((_t("Interpretation: {notes}",{notes:m.baseline.notes})));
  H.h2(_t("As-is process map"));H.tbl([_t("Step"),_t("Type"),_t("Time")],rowsOf(m.map,["step",r=>r.step?r.kind:"","time"]),[null,22,30]);
  const pc=pceOf(filled(m.map,["step"]));if(pc.tot)H.para(`${_t("Process cycle efficiency: {pce}% value-added time (VA {va}, NNVA {nnva}, NVA {nva}).",{pce:fmt(pc.pce,1),va:fmt(pc.va),nnva:fmt(pc.nnva),nva:fmt(pc.nva)})}`)};
async function fishWhysPdf(H,fb,whys,effect){
  H.h2(_t("Cause and effect"));if(fishCount(fb)){await H.img(fishboneChart(fb,effect));H.tbl([_t("Category"),_t("Potential causes")],BONES.map(([k,l])=>[l,lines(fb[k]).join("\n")]),[34])}else H.para("");
  H.h2(_t("5 Whys"));const ch=whys.filter(w=>Object.values(w).some(v=>String(v).trim()));if(ch.length)ch.forEach((w,i)=>H.kv([[(_t("Chain {i}{x}: symptom",{i:i,x:1})),w.problem],...[1,2,3,4,5].filter(n=>w["w"+n].trim()).map(n=>[(_t("Why {n}",{n:n})),w["w"+n]]),[_t("Root cause"),w.root]]));else H.para("")}
PDFSEC.A=async(H,p)=>{const a=p.analyse;
  await fishWhysPdf(H,a.fishbone,a.whys,p.define.charter.problem||p.title);
  H.h2(_t("Pareto"));const pr=paretoChart(a.pareto);if(pr.d){H.tbl([_t("Category"),_t("Count"),_t("Cumulative %")],pr.d.map(z=>[z.cat,String(z.n),fmt(z.cum,1)+"%"]),[null,24,30]);await H.img(pr.svg);H.para((_t("Vital few: {x}",{x:pr.vital.join(", ")})))}else H.para("");
  H.h2(_t("Hypothesis tests"));if(!a.tests.length)H.para(_t("No tests recorded."));
  for(const [i,t] of a.tests.entries()){const r=runTest(t);H.para(`${_t("Test {x}: {x2}",{x:i+1,x2:t.name||_t("(unnamed)")})}`,{bold:true});
    if(!r||!r.ok){H.para(r&&r.error?(_t("Not calculated: {error}",{error:r.error})):_t("No data."),{color:GRY});continue}
    H.kv([[_t("Test"),t.type],[_t("Significance level"),t.alpha],...r.rows.map(([l,v])=>[l,String(v)]),[_t("Conclusion"),r.summary],[_t("Cautions"),r.warn.join(" ")],[_t("Practical interpretation"),t.notes]]);
    if(r.svg)await H.img(r.svg,120)}
  H.h2(_t("Root cause validation"));H.tbl([_t("Suspected cause"),_t("How tested"),_t("Evidence and result"),_t("Status")],rowsOf(a.causes,["cause","test","evidence",r=>r.cause?r.result:""]),[null,null,null,22])};
PDFSEC.I=async(H,p)=>{const im=p.improve;
  H.h2(_t("Solutions"));H.tbl(["#",_t("Solution"),_t("Root cause addressed"),_t("Impact"),_t("Effort"),_t("Quadrant")],im.solutions.map((z,i)=>[z.solution?String(i+1):"",z.solution,z.cause,z.solution?z.impact:"",z.solution?z.effort:"",z.solution?solCalc(z).t:""]),[8,null,null,15,15,26]);
  if(filled(im.solutions,["solution"]).length)await H.img(matrixChart(im.solutions),95);
  H.h2(_t("Risk assessment (FMEA)"));H.tbl([_t("Failure mode"),_t("Effect"),"S","O","D","RPN",_t("Mitigation")],rowsOf(im.fmea,["mode","effect","s","o","d",r=>rpnCalc(r).t,"action"]),[null,null,9,9,9,13,null]);
  H.h2(_t("Pilot"));const pb=num(im.pilot.before),pa=num(im.pilot.after);H.kv([[_t("Scope"),im.pilot.scope],[_t("Duration"),im.pilot.duration],[_t("Success criteria"),im.pilot.criteria],[_t("Y before"),im.pilot.before],[_t("Y during pilot"),im.pilot.after],[_t("Change"),pb!=null&&pa!=null&&pb!==0?fmt(pa-pb)+" ("+fmt((pa-pb)/Math.abs(pb)*100,1)+"%)":"-"],[_t("Observations"),im.pilot.notes]]);
  H.h2(_t("Implementation plan"));actionsPdf(H,im.actions)};
function actionsPdf(H,a){H.tbl([_t("Action"),_t("Owner"),_t("Due"),_t("Status")],rowsOf(a,["action","owner",r=>r.due?fmtDate(r.due):"",r=>r.action?r.status:""]),[null,36,26,24])}
PDFSEC.C=async(H,p)=>{const co=p.control;
  H.h2(_t("Control plan"));H.tbl([_t("What"),_t("Target / limits"),_t("Method"),_t("Frequency"),_t("Owner"),_t("Reaction plan")],rowsOf(co.plan,["metric","target","method","freq","owner","reaction"]));
  H.h2(_t("Control chart"));const cx=parseNums(co.chart.data),rr=imr(cx);
  if(rr){H.kv([["n",rr.st.n],[_t("Mean"),fmt(rr.st.mean)],[_t("UCL / LCL"),fmt(rr.ucl)+" / "+fmt(rr.lcl)],[_t("Points outside limits"),rr.outside.length?rr.outside.map(i=>i+1).join(", "):_t("None")],[_t("Longest run one side of mean"),rr.run.len],[_t("Interpretation"),co.chart.notes]]);await H.img(imrSVG(cx,rr))}
  else H.para(_t("No control data entered."));
  H.h2(_t("Handover and closure"));H.kv([[_t("Standard work and documentation"),co.closure.docs],[_t("Handover to process owner"),co.closure.handover],[_t("Validated benefits"),co.closure.finance],[_t("Lessons learned"),co.closure.lessons],[_t("Closure date"),fmtDate(co.closure.closedOn)]])};

/* ----- A3 appendix sections ----- */
COVER["A3 problem solving"]=p=>({people:[[_t("Owner"),p.a3plan.owner],[_t("Mentor"),p.a3plan.mentor]],summary:[[_t("Current condition"),p.a3plan.current],[_t("Target"),p.a3plan.target]]});
PDFSEC.a3p=async(H,p)=>{const a=p.a3plan;H.h2(_t("Background"));H.kv([[_t("Owner"),a.owner],[_t("Mentor"),a.mentor],[_t("Started"),fmtDate(a.date)],[_t("Background"),a.background]]);
  H.h2(_t("Current condition"));H.kv([[_t("Current condition"),a.current],[_t("Key metric"),a.metric],[_t("Current value"),a.currentValue]]);const d=parseNums(a.currentData);if(d.length>1)await H.img(lineChart({values:d,title:a.metric||_t("Current condition"),lines:[{v:stats(d).median,label:_t("Median"),c:C.light,dash:1}]}));
  H.h2(_t("Target"));H.kv([[_t("Target condition"),a.target],[_t("Target value"),a.targetValue],[_t("Target date"),fmtDate(a.targetDate)]]);
  await fishWhysPdf(H,a.fishbone,a.whys,a.current||p.title);H.h2(_t("Root cause summary"));H.para(a.rootSummary)};
PDFSEC.a3d=async(H,p)=>{H.h2(_t("Countermeasures"));H.tbl([_t("Countermeasure"),_t("Root cause"),_t("Expected effect"),_t("Owner")],rowsOf(p.a3do.counter,["counter","cause","effect","owner"]));H.h2(_t("Implementation plan"));actionsPdf(H,p.a3do.actions)};
PDFSEC.a3c=async(H,p)=>{const c=p.a3check;H.h2(_t("Follow-up"));H.kv([[_t("Measured by"),c.method],[_t("Before"),c.before||p.a3plan.currentValue],[_t("After"),c.after],[_t("Target"),p.a3plan.targetValue],[_t("What worked"),c.worked],[_t("What did not work"),c.notworked]]);
  const pre=parseNums(p.a3plan.currentData),x=parseNums(c.afterData);if(x.length>1)await H.img(lineChart({values:[...pre,...x],title:_t("Before and after"),lines:[{v:num(p.a3plan.targetValue),label:_t("Target"),c:C.orange,dash:1}],flagIdx:x.map((_,i)=>pre.length+i)}))};
PDFSEC.a3a=async(H,p)=>{H.h2(_t("Standardise and share"));H.kv([[_t("Standard"),p.a3act.standardise],[_t("Share (yokoten)"),p.a3act.share],[_t("Open issues"),p.a3act.open]])};

/* ----- Kaizen sections ----- */
COVER["Kaizen event"]=p=>{const k=p.kzprep;return{people:[[_t("Sponsor"),k.sponsor],[_t("Event leader"),k.leader],[_t("Team"),k.team],[_t("Event dates"),[fmtDate(k.start),fmtDate(k.end)].filter(Boolean).join(" to ")]],summary:[[_t("Problem"),k.problem],[_t("Scope"),k.scopeStart||k.scopeEnd?`${k.scopeStart} to ${k.scopeEnd}`:""],[_t("Objectives"),k.objectives]]}};
PDFSEC.kzp=async(H,p)=>{const k=p.kzprep;H.h2(_t("Event charter"));H.kv([[_t("Problem or opportunity"),k.problem],[_t("Process starts at"),k.scopeStart],[_t("Process ends at"),k.scopeEnd],[_t("Objectives"),k.objectives],[_t("Out of scope"),k.outScope],[_t("Constraints"),k.constraints],[_t("Sponsor"),k.sponsor],[_t("Event leader"),k.leader],[_t("Team"),k.team],[_t("Dates"),[fmtDate(k.start),fmtDate(k.end)].filter(Boolean).join(" to ")]]);
  H.h2(_t("Pre-work"));H.kv([[_t("Baseline data"),k.prework],[_t("Process walk"),k.walk],[_t("Stakeholders informed"),k.informed]]);H.h2(_t("Agenda and logistics"));H.kv([[_t("Agenda"),k.agenda],[_t("Logistics"),k.logistics]])};
PDFSEC.kze=async(H,p)=>{const e=p.kzevent;H.h2(_t("Waste walk"));H.tbl([_t("Step"),_t("Waste"),_t("Observation"),_t("Impact")],rowsOf(e.obs,["step",r=>r.observation?r.waste:"","observation","impact"]),[null,30]);
  const cnt={};filled(e.obs,["observation"]).forEach(o=>cnt[o.waste]=(cnt[o.waste]||0)+1);const r=paretoChart(Object.entries(cnt).map(([cat,count])=>({cat:_tv(cat),count})),640,300,_t("Waste by type"));if(r.svg)await H.img(r.svg,140);
  H.h2(_t("Ideas and try-storming"));H.tbl([_t("Idea"),_t("Waste removed"),_t("Status"),_t("Result")],rowsOf(e.ideas,["idea","waste",r=>r.idea?r.status:"","result"]),[null,null,22]);
  H.h2(_t("Before and after"));H.tbl([_t("Metric"),_t("Unit"),_t("Before"),_t("After"),_t("Target"),_t("Change")],rowsOf(e.metrics,["metric","unit","before","after","target",r=>chgCalc(r).t]));const b=barCompare(e.metrics,_t("Before and after"));if(b)await H.img(b,140);
  H.h2(_t("Changes and new standard work"));H.para(e.changes)};
PDFSEC.kzf=async(H,p)=>{const f=p.kzfollow;H.h2(_t("Kaizen newspaper"));H.tbl([_t("Open item"),_t("Owner"),_t("Due"),_t("Status")],rowsOf(f.news,["item","owner",r=>r.due?fmtDate(r.due):"",r=>r.item?r.status:""]),[null,36,26,24]);
  H.h2(_t("Sustain audits"));H.tbl([_t("Date"),_t("Finding"),_t("Sustained")],rowsOf(f.audits,[r=>r.date?fmtDate(r.date):"","finding",r=>r.date||r.finding?r.sustained:""]),[28,null,24]);H.h2(_t("Report-out"));H.kv([[_t("Summary"),f.reportout],[_t("Lessons learned"),f.lessons]])};

/* ----- VSM sections ----- */
COVER["Value stream mapping"]=p=>{const c=p.vsmcur,k=vsmCalc(c.steps,c),f=vsmCalc(p.vsmfut.steps,c);return{people:[[_t("Value stream owner"),c.owner],[_t("Sponsor"),c.sponsor]],summary:[[_t("Product or service family"),c.family],[_t("Customer demand"),c.demand?`${c.demand} per ${c.period||"period"}`:""],[_t("Current lead time"),k.r.length?`${_t("{lead} {unit} (PCE {pce}%)",{lead:fmt(k.lead),unit:_tv(c.unit),pce:fmt(k.pce,1)})}`:""],[_t("Future lead time"),f.r.length?`${_t("{lead} {unit} (PCE {pce}%)",{lead:fmt(f.lead),unit:_tv(c.unit),pce:fmt(f.pce,1)})}`:""]]}};
const stepRows=(s)=>rowsOf(s,["step","ct","co","uptime","ops","wait","pca"]);
PDFSEC.vc=async(H,p)=>{const c=p.vsmcur,k=vsmCalc(c.steps,c);H.h2(_t("Scope and demand"));H.kv([[_t("Family"),c.family],[_t("Supplier"),c.supplier],[_t("Customer"),c.customer],[_t("Demand"),c.demand?`${c.demand} per ${c.period||"period"}`:""],[_t("Available time"),c.avail?`${c.avail} ${c.unit}`:""],[_t("Takt"),k.takt?fmt(k.takt)+" "+c.unit:_t("n/a")],[_t("Information flow"),c.info]]);
  H.h2(_t("Current-state map"));await H.img(vsmMap(c.steps,c,_t("Current state")));H.tbl([_t("Step"),_t("C/T"),_t("C/O"),_t("Uptime %"),_t("People"),_t("Waiting"),_t("%C&A")],stepRows(c.steps));H.para(vsmFlags(k,c.unit).join(" "));if(c.observations)H.para((_t("Observations: {observations}",{observations:c.observations})))};
PDFSEC.vf=async(H,p)=>{const f=p.vsmfut,c=p.vsmcur,a=vsmCalc(c.steps,c),b=vsmCalc(f.steps,c);H.h2(_t("Future-state map"));await H.img(vsmMap(f.steps,c,_t("Future state"),f.bursts));H.tbl([_t("Step"),_t("C/T"),_t("C/O"),_t("Uptime %"),_t("People"),_t("Waiting"),_t("%C&A")],stepRows(f.steps));
  if(a.r.length&&b.r.length)H.kv([[_t("Lead time"),`${fmt(a.lead)} -> ${fmt(b.lead)} ${c.unit}`],[_t("Processing time"),`${fmt(a.ct)} -> ${fmt(b.ct)} ${c.unit}`],[_t("PCE"),`${fmt(a.pce,1)}% -> ${fmt(b.pce,1)}%`]]);if(f.vision)H.para(f.vision);
  H.h2(_t("Kaizen bursts"));H.tbl(["#",_t("Where"),_t("Improvement"),_t("Expected effect")],f.bursts.map((z,i)=>[z.improvement?String(i+1):"",z.where,z.improvement,z.effect]),[8])};
PDFSEC.vp=async(H,p)=>{H.h2(_t("Implementation plan"));H.tbl([_t("Action"),_t("Burst / method"),_t("Owner"),_t("Due"),_t("Status")],rowsOf(p.vsmplan.actions,["action","burst","owner",r=>r.due?fmtDate(r.due):"",r=>r.action?r.status:""]));H.kv([[_t("Review rhythm"),p.vsmplan.review]])};

/* ----- DMADV sections ----- */
COVER.DMADV=p=>{const d=p.dvdefine;return{people:[[_t("Sponsor"),d.sponsor],[_t("Future process owner"),d.processOwner],[_t("Project lead"),d.lead],[_t("Core team"),d.team]],summary:[[_t("Opportunity"),d.opportunity],[_t("Why a new design"),d.whyNew],[_t("Goal"),d.goal]]}};
PDFSEC.vD=async(H,p)=>{const d=p.dvdefine;H.h2(_t("Design charter"));H.kv([[_t("Opportunity"),d.opportunity],[_t("Why a new design"),d.whyNew],[_t("Goal"),d.goal],[_t("In scope"),d.inScope],[_t("Out of scope"),d.outScope],[_t("Design risks"),d.risks],[_t("Sponsor"),d.sponsor],[_t("Future process owner"),d.processOwner],[_t("Lead"),d.lead],[_t("Team"),d.team],[_t("Start"),fmtDate(d.start)],[_t("Define tollgate"),fmtDate(d.gateDate)],[_t("Expected benefit"),d.benefit]])};
PDFSEC.vM=async(H,p)=>{const m=p.dvmeasure;H.h2(_t("Voice of the customer"));H.tbl([_t("Customer"),_t("What they say"),_t("Underlying need")],rowsOf(m.voc,["customer","voice","need"]));
  H.h2(_t("Kano analysis"));H.tbl([_t("Need"),_t("Category"),_t("Importance")],rowsOf(m.kano,["need",r=>r.need?r.category:"",r=>r.need?r.importance:""]),[null,32,24]);
  H.h2(_t("CTQs"));H.tbl(["CTQ",_t("How measured"),_t("Target"),_t("Lower"),_t("Upper"),_t("Importance"),_t("Need")],rowsOf(m.ctqs,["ctq","measure","target","lsl","usl",r=>r.ctq?r.importance:"","need"]),[null,null,22,16,16,18,null])};
PDFSEC.vA=async(H,p)=>{const a=p.dvanalyse,{ctq,con,datum,tot}=pughCalc(p);H.h2(_t("Design concepts"));H.tbl([_t("Concept"),_t("Description")],rowsOf(a.concepts,["name","desc"]),[50]);
  H.h2(_t("Pugh matrix"));if(con.length>=2&&ctq.length){H.tbl(["CTQ",_t("Weight"),...con.map(c=>c.name+(c.id===datum?_t(" (datum)"):""))],[...ctq.map(q=>[q.ctq,String(num(q.importance)||1),...con.map(c=>c.id===datum?"S":(a.pugh[q.id+"|"+c.id]||"S"))]),[_t("Weighted total"),"",...tot.map(t=>String(t.w))]])}else H.para("");
  H.h2(_t("Selection"));H.kv([[_t("Selected concept"),a.concepts.find(c=>c.id===a.selected)?.name||""],[_t("Rationale"),a.rationale]])};
PDFSEC.vG=async(H,p)=>{const d=p.dvdesign,{ctq,fe,h,score,tot}=hoqCalc(p);H.h2(_t("House of Quality"));
  if(ctq.length&&fe.length)H.tbl(["CTQ",_t("Weight"),...fe.map(f=>f.feature)],[...ctq.map(q=>[q.ctq,String(num(q.importance)||1),...fe.map(f=>h[q.id+"|"+f.id]||"")]),[_t("Feature importance"),"",...score.map(s=>s+(tot?` (${Math.round(s/tot*100)}%)`:""))]]);else H.para("");
  H.h2(_t("Detailed design"));H.para(d.detail);H.h2(_t("Design FMEA"));H.tbl([_t("Failure mode"),_t("Effect"),"S","O","D","RPN",_t("Mitigation")],rowsOf(d.dfmea,["mode","effect","s","o","d",r=>rpnCalc(r).t,"action"]),[null,null,9,9,9,13,null]);
  H.h2(_t("Design scorecard"));H.tbl(["CTQ",_t("Target"),_t("Limits"),_t("Predicted"),_t("Result")],ctq.map(q=>[q.ctq,q.target,[q.lsl,q.usl].map(v=>v||"-").join(" to "),d.predicted[q.id]||"",ctqStatus(q,d.predicted[q.id]).t]))};
PDFSEC.vV=async(H,p)=>{const v=p.dvverify,ctq=ctqList(p);H.h2(_t("Pilot and verification"));H.kv([[_t("Scope"),v.scope],[_t("Duration"),v.duration],[_t("Success criteria"),v.criteria],[_t("Observations"),v.notes]]);
  H.tbl(["CTQ",_t("Target"),_t("Limits"),_t("Measured"),_t("Result")],ctq.map(q=>[q.ctq,q.target,[q.lsl,q.usl].map(x=>x||"-").join(" to "),v.actual[q.id]||"",ctqStatus(q,v.actual[q.id]).t]));
  H.h2(_t("Handover and control"));H.tbl([_t("What"),_t("Target / limits"),_t("Method"),_t("Frequency"),_t("Owner"),_t("Reaction plan")],rowsOf(v.plan,["metric","target","method","freq","owner","reaction"]));H.kv([[_t("Documentation and training"),v.docs],[_t("Handover"),v.handover],[_t("Lessons learned"),v.lessons]]);
  if(dvComplete(p)){H.h2(_t("Suggestion"));H.para(dvSuggestText(p))}};
/* ----- PDCA sections ----- */
COVER.PDCA=p=>{const f=p.pdframe;return{people:[[_t("Owner"),f.owner]],summary:[[_t("Problem"),f.problem],[_t("Metric"),f.metric],[_t("Baseline"),f.baseline],[_t("Target"),f.target?`${f.target}${f.targetDate?" by "+fmtDate(f.targetDate):""}`:""]]}};
PDFSEC.pc1=async(H,p)=>{const f=p.pdframe;H.h2(_t("Problem and target"));H.kv([[_t("Problem"),f.problem],[_t("Owner"),f.owner],[_t("Metric"),f.metric],[_t("Baseline"),f.baseline],[_t("Target"),f.target],[_t("Target date"),fmtDate(f.targetDate)]])};
PDFSEC.pc2=async(H,p)=>{H.h2(_t("Cycles"));H.tbl(["#",_t("Change"),_t("Prediction"),_t("Done"),_t("Result"),_t("Learning"),_t("Act")],p.pdset.cycles.map((c,i)=>[c.change?String(i+1):"",c.change,c.prediction,c.done,c.result,c.learning,c.change?c.decision:""]),[8,null,null,null,18,null,18]);
  const b=parseNums(p.pdframe.baselineData),res=filled(p.pdset.cycles,["change"]).map(c=>num(c.result)).filter(v=>v!=null);if(b.length+res.length>1)await H.img(lineChart({values:[...b,...res],title:`${_t("{x}: baseline then cycles",{x:p.pdframe.metric||_t("Metric")})}`,lines:[{v:num(p.pdframe.target),label:_t("Target"),c:C.orange,dash:1}],flagIdx:res.map((_,i)=>b.length+i)}))};
PDFSEC.pc3=async(H,p)=>{const s=p.pdstd;H.h2(_t("Standardise"));H.kv([[_t("Adopted"),s.adopted],[_t("Documented in"),s.where],[_t("Shared with"),s.share],[_t("Next improvement"),s.next]])};
/* ----- 5S sections ----- */
COVER["5S"]=p=>{const s=p.fsort;return{people:[[_t("Workspace owner"),s.owner],[_t("Users"),s.users]],summary:[[_t("Workspace"),`${s.space}${s.kind?" ("+s.kind+")":""}`],[_t("Problem"),s.problem]]}};
const auditTbl=(H,sc)=>H.tbl(["S",_t("Statement"),_t("Score")],S5.flatMap(([k,l])=>S5Q[k].map((q,i)=>[i===0?l:"",q,sc[k+i]??""])),[28,null,16]);
PDFSEC.s1=async(H,p)=>{const s=p.fsort;H.h2(_t("Scope"));H.kv([[_t("Workspace"),s.space],[_t("Type"),s.kind],[_t("Owner"),s.owner],[_t("Users"),s.users],[_t("Problem"),s.problem],[_t("Retention and legal check"),s.retention]]);
  H.h2(_t("Baseline audit"));auditTbl(H,s.baseline);await H.img(radar([{label:_t("Baseline"),c:C.blue,vals:auditScores(s.baseline).map(x=>x.avg)}]),90);
  H.h2(_t("Red-tag list"));H.tbl([_t("Item"),_t("Location"),_t("Decision"),_t("Owner"),_t("Done")],rowsOf(s.red,["item","location",r=>r.item?r.decision:"","owner",r=>r.item?r.done:""]),[null,null,22,30,14])};
PDFSEC.s2=async(H,p)=>{H.h2(_t("Structure and naming"));H.kv([[_t("Folder structure"),p.forder.structure],[_t("Naming convention"),p.forder.naming],[_t("Other rules"),p.forder.rules]])};
PDFSEC.s3=async(H,p)=>{H.h2(_t("Clean-up"));H.tbl([_t("Issue"),_t("Before"),_t("After"),_t("Change"),_t("What was done")],rowsOf(p.fshine.issues,["issue","before","after",r=>chgCalc(r).t,"action"]),[null,18,18,18,null])};
PDFSEC.s4=async(H,p)=>{H.h2(_t("Standard"));H.kv([[_t("Standard"),p.fstandard.standard],[_t("Where it lives"),p.fstandard.where],[_t("Onboarding"),p.fstandard.onboarding]])};
PDFSEC.s5=async(H,p)=>{const s=p.fsustain;H.h2(_t("Audits"));H.kv([[_t("Rhythm and owner"),s.rhythm]]);H.tbl([_t("Date"),_t("Who"),_t("Findings")],rowsOf(s.audits,[r=>r.date?fmtDate(r.date):"","who","notes"]),[28,36,null]);
  H.h2(_t("Latest audit against baseline"));auditTbl(H,s.scores);await H.img(radar([{label:_t("Baseline"),c:C.grey,vals:auditScores(p.fsort.baseline).map(x=>x.avg)},{label:_t("Latest audit"),c:C.orange,vals:auditScores(s.scores).map(x=>x.avg)}]),90)};

/* ================= export & email ================= */
const slug=t=>String(t||"project").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)||"project";
const toolSlug={"DMAIC":"dmaic","A3 problem solving":"a3","Kaizen event":"kaizen","Value stream mapping":"vsm","DMADV":"dmadv","PDCA":"pdca","5S":"5s"};
async function exportPDF(p){
  if(!window.jspdf||!window.jspdf.jsPDF){toast(_t("The PDF library did not load. Reload the page and try again."));return}
  if(!downloads){toast(_t("Saving files isn't available in this view."));return}
    try{const blob=await buildPDF(p);await downloads.save({filename:`${slug(p.title)}-${toolSlug[p.tool]||"lean"}-report-${new Date().toISOString().slice(0,10)}.pdf`,data:blob});toast(_t("PDF saved."))}
  catch(e){if(e&&e.code==="declined")toast(_t("Download cancelled."));else if(e&&e.code==="rate_limited")toast(_t("A save prompt is already open."));else{console.error(e);toast((_t("The PDF could not be created. {x}",{x:e&&e.message?e.message:""})))}}
}
function emailBody(p){const cv=COVER[p.tool](p);
  return `${_t("Hello,")}

${_t("Please find attached the {tool} report for \"{title}\".",{tool:p.tool,title:p.title})}

${_t("Status: {status}, {x}.",{status:STATUSES[p.status],x:p.status==="closed"?_t("closed"):_t("currently in the {x} stage",{x:ST[p.phase].name})})}

${cv.summary.filter(([,v])=>String(v||"").trim()).map(([k,v])=>`${k}: ${v}`).join("\n")}

${_t("Stages:")}
${DEF[p.tool].order.map(k=>`${ST[k].name}: ${lcStatus(_tv(stageStatus(p,k)))}`).join("\n")}

${_t("Kind regards,")}`}
function openEmail(p){
  const root=$("#modalRoot");
  root.innerHTML=`<div class="overlay" id="ov"><div class="modal panel" role="dialog" aria-modal="true" aria-labelledby="mh">
    <div class="panel-head"><h2 id="mh">${_t("Email this project")}</h2></div>
    <div class="panel-body">
      <p class="small" style="margin-top:0">${_t("Email drafts opened from a web page can't carry attachments. Download the PDF first, then attach it to the draft.")}</p>
      <div class="field"><label for="mTo">${_t("To")}</label><input id="mTo" type="email" multiple placeholder="${_t("name@example.org")}"></div>
      <div class="field"><label for="mSub">${_t("Subject")}</label><input id="mSub" value="${esc(p.tool+" report: "+p.title)}"></div>
      <div class="field"><label for="mBody">${_t("Message")}</label><textarea id="mBody">${esc(emailBody(p))}</textarea></div>
      <div class="row"><button class="btn" id="mPdf">${_t("1. Download PDF")}</button><a class="btn hot" id="mOpen" target="_blank" rel="noopener">${_t("2. Open email draft")}</a><button class="btn alt" id="mCopy">${_t("Copy message")}</button><button class="btn alt" id="mClose">${_t("Close")}</button></div>
    </div></div></div>`;
  const upd=()=>{const b=$("#mBody").value;$("#mOpen").href=`mailto:${encodeURIComponent($("#mTo").value.trim()).replace(/%40/g,"@").replace(/%2C/g,",")}?subject=${encodeURIComponent($("#mSub").value)}&body=${encodeURIComponent(b.length>1800?b.slice(0,1800)+"\n…":b)}`};
  ["#mTo","#mSub","#mBody"].forEach(s=>$(s).oninput=upd);upd();
  const close=()=>{root.innerHTML="";$("#mail")&&$("#mail").focus()};
  $("#mClose").onclick=close;$("#ov").onclick=e=>{if(e.target.id==="ov")close()};
  document.addEventListener("keydown",function k(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",k)}});
  $("#mPdf").onclick=()=>exportPDF(p);
  $("#mCopy").onclick=async()=>{const t=`${_t("Subject: {value}\n\n{value2}",{value:$("#mSub").value,value2:$("#mBody").value})}`;try{await navigator.clipboard.writeText(t);toast(_t("Message copied."))}catch{$("#mBody").select();toast(_t("Text selected: press Ctrl+C or Cmd+C to copy."))}};
  $("#mTo").focus();
}

