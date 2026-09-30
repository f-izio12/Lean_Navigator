/* ================= PDF engine ================= */
const CP1252="€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const pdfText=s=>String(s??"").replace(/✓/g,"OK").replace(/ℹ\s?/g,"").replace(/≥/g,">=").replace(/≤/g,"<=").replace(/→/g,"->").replace(/×/g,"x").replace(/[^\n\r\t\x20-\xFF]/g,c=>CP1252.includes(c)?c:"?");
function svgToPng(svg){return new Promise(res=>{try{
  const m=svg.match(/width="(\d+)" height="(\d+)"/);const w=+m[1],h=+m[2];const img=new Image();
  img.onload=()=>{try{const c=document.createElement("canvas");c.width=w*2;c.height=h*2;const x=c.getContext("2d");x.scale(2,2);x.drawImage(img,0,0);res({data:c.toDataURL("image/png"),w,h})}catch{res(null)}};
  img.onerror=()=>res(null);img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)}catch{res(null)}})}
const BLUE=[0,28,61],ORG=[232,78,16],LBL=[0,162,219],GRY=[79,95,116],LIN=[213,220,229];
function helpers(doc,pageArgs=[]){
  const M=16,PW=()=>doc.internal.pageSize.getWidth(),PH=()=>doc.internal.pageSize.getHeight(),W=()=>PW()-2*M;
  const H={doc,M,W,y:20};
  H.newPage=()=>{doc.addPage(...pageArgs);H.y=20};H.room=h=>{if(H.y+h>PH()-19)H.newPage()};
  const style={font:"helvetica",fontSize:8.5,cellPadding:1.8,textColor:BLUE,lineColor:LIN,lineWidth:.2,overflow:"linebreak",valign:"top"};
  H.h2=t=>{H.room(14);doc.setFont("helvetica","bold");doc.setFontSize(11.5);doc.setTextColor(...BLUE);doc.text(pdfText(t),M,H.y);doc.setDrawColor(...ORG);doc.setLineWidth(.6);doc.line(M,H.y+1.8,M+14,H.y+1.8);H.y+=7};
  H.para=(t,o={})=>{const empty=!String(t||"").trim();if(empty)t=o.empty||"Nothing recorded.";doc.setFont("helvetica",o.bold?"bold":"normal");doc.setFontSize(o.size||9);doc.setTextColor(...(o.color||(empty?GRY:BLUE)));
    doc.splitTextToSize(pdfText(t),W()).forEach(l=>{H.room(5);doc.text(l,M,H.y);H.y+=4.3});H.y+=2};
  H.kv=rs=>{doc.autoTable({startY:H.y,body:rs.map(([k,v])=>[pdfText(k),pdfText(String(v??"").trim()||"-")]),theme:"grid",styles:style,columnStyles:{0:{cellWidth:50,fontStyle:"bold",fillColor:[232,238,245]}},margin:{left:M,right:M}});H.y=doc.lastAutoTable.finalY+6};
  H.tbl=(head,rs,widths)=>{const body=rs.filter(r=>r.some(c=>String(c??"").trim()));if(!body.length){H.para("");return}
    const cs={};(widths||[]).forEach((w,i)=>{if(w)cs[i]={cellWidth:w}});
    doc.autoTable({startY:H.y,head:[head.map(pdfText)],body:body.map(r=>r.map(c=>pdfText(c))),theme:"grid",styles:style,headStyles:{fillColor:BLUE,textColor:255,fontStyle:"bold"},columnStyles:cs,margin:{left:M,right:M},showHead:"everyPage"});H.y=doc.lastAutoTable.finalY+6};
  H.img=async(svg,maxW)=>{if(!svg)return;const r=await svgToPng(svg);if(!r){H.para("(Chart could not be rendered in this browser.)",{color:GRY});return}
    const w=Math.min(maxW||W(),r.w*.26,W()),h=w*r.h/r.w;H.room(h+4);doc.addImage(r.data,"PNG",M,H.y,w,h);H.y+=h+6};
  return H;
}
function rowsOf(arr,keys){return arr.map(r=>keys.map(k=>typeof k==="function"?k(r):r[k]??""))}
const COVER={};
async function buildPDF(p){
  const {jsPDF}=window.jspdf,d=DEF[p.tool],isA3=p.tool==="A3 problem solving",land=p.tool==="Value stream mapping";
  const doc=new jsPDF({unit:"mm",format:isA3?"a3":"a4",orientation:isA3||land?"landscape":"portrait"});
  const H=helpers(doc,isA3?["a4","portrait"]:[]),M=H.M;
  if(isA3){await a3Sheet(doc,p);H.newPage();H.para("Appendix: full A3 record",{bold:true,size:12})}
  else{
    const cv=COVER[p.tool](p),PW=doc.internal.pageSize.getWidth();
    doc.setFillColor(...BLUE);doc.rect(0,0,PW,58,"F");doc.setFillColor(...ORG);doc.rect(M,16,2.5,28,"F");
    doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(...LBL);doc.text(pdfText(p.tool+" project report"),M+7,21);
    doc.setFont("helvetica","bold");doc.setFontSize(19);doc.setTextColor(255,255,255);doc.splitTextToSize(pdfText(p.title),PW-2*M-10).slice(0,2).forEach((l,i)=>doc.text(l,M+7,31+i*8));
    H.y=70;H.kv([["Status",STATUSES[p.status]],["Current stage",p.status==="closed"?"Closed ("+ST[p.phase].name+")":ST[p.phase].name],["Created",fmtDate(p.created)],["Last updated",fmtDate(p.updated)],["Report generated",fmtDate(new Date().toISOString())],...cv.people]);
    H.h2("Summary");H.kv(cv.summary);
  }
  H.h2("Stage overview");H.tbl(["Stage","Status",d.gate+" checks done","Decision"],d.order.map(k=>[ST[k].name,stageStatus(p,k),progress(p,k)+"%",({go:"Go",rework:"Rework",stop:"Stop"})[tgOf(p,k).decision]||"-"]));
  for(const k of d.order){
    H.newPage();const PW=doc.internal.pageSize.getWidth(),Wd=PW-2*M;
    doc.setFillColor(...BLUE);doc.rect(M,H.y-6,Wd,16,"F");doc.setFillColor(...ORG);doc.rect(M,H.y+10,Wd,1.2,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(18);doc.setTextColor(...ORG);doc.text(ST[k].letter,M+5,H.y+5.5);doc.setFontSize(13);doc.setTextColor(255,255,255);doc.text(pdfText(ST[k].name),M+16,H.y+5);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text(pdfText(stageStatus(p,k)),M+Wd-5,H.y+5,{align:"right"});H.y+=20;
    if(stageStatus(p,k)==="Not started"){H.para("Not started.");continue}
    await PDFSEC[k](H,p);
    const t=tgOf(p,k);H.h2(ST[k].name+": "+d.gate.toLowerCase());H.tbl(["Check","Done"],ST[k].tg.map(([c,l])=>[l,t.checks[c]?"Yes":"No"]),[null,20]);
    H.kv([["Decision",{go:ST[k].next?"Go to "+ST[ST[k].next].name:"Project closed",rework:"Rework",stop:"Stop the project"}[t.decision]||"No decision recorded"],["Notes",t.notes]]);
  }
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){doc.setPage(i);const PW=doc.internal.pageSize.getWidth(),PHh=doc.internal.pageSize.getHeight();doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(...GRY);doc.text(pdfText(trunc(p.title,80)),M,PHh-7);doc.text(`Page ${i} of ${n}`,PW-M,PHh-7,{align:"right"})}
  return doc.output("blob");
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
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...LBL);doc.text(pdfText(`Owner: ${a.owner||"-"}    Mentor: ${a.mentor||"-"}    Started: ${fmtDate(a.date)||"-"}    Status: ${STATUSES[p.status]}, ${ST[p.phase].name}`),18,21);
  const block=async(n,title,x,y,w,h,fill)=>{doc.setDrawColor(...LIN);doc.setLineWidth(.3);doc.rect(x,y,w,h);doc.setFillColor(232,238,245);doc.rect(x,y,w,7,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(...ORG);doc.text(String(n),x+3,y+5);doc.setTextColor(...BLUE);doc.text(pdfText(title),x+9,y+5);
    doc.setFont("helvetica","normal");doc.setTextColor(...BLUE);await fill(x+3,y+10,w-6,h-13)};
  const img=async(svg,x,y,w,h)=>{const r=await svgToPng(svg);if(!r)return 0;let iw=w,ih=w*r.h/r.w;if(ih>h){ih=h;iw=h*r.w/r.h}doc.addImage(r.data,"PNG",x,y,iw,ih);return ih};
  const L=12,R=214,CW=194,T=32;
  await block(1,"Background",L,T,CW,38,(x,y,w,h)=>fitText(doc,a.background,x,y,w,h));
  await block(2,"Current condition",L,T+40,CW,72,async(x,y,w,h)=>{const d=parseNums(a.currentData);let used=0;
    const txt=a.current+(a.metric?`\n\nKey metric: ${a.metric}${a.currentValue?" = "+a.currentValue:""}`:"");
    if(d.length>1){used=fitText(doc,txt,x,y,w,h*.42);await img(lineChart({values:d,title:a.metric||"Current condition",lines:[{v:stats(d).median,label:"Median",c:C.light,dash:1}]}),x,y+used+2,w,h-used-3)}else fitText(doc,txt,x,y,w,h)});
  await block(3,"Target condition",L,T+114,CW,30,(x,y,w,h)=>fitText(doc,a.target+(a.targetValue?`\nTarget value: ${a.targetValue}`:"")+(a.targetDate?`   By: ${fmtDate(a.targetDate)}`:""),x,y,w,h));
  await block(4,"Root cause analysis",L,T+146,CW,109,async(x,y,w,h)=>{let used=0;
    if(fishCount(a.fishbone)){used=await img(fishboneChart(a.fishbone,a.current||p.title),x,y,w,h*.55)+2}
    const ch=a.whys.filter(z=>z.problem||z.root).map(z=>`${z.problem||"Symptom"}: ${[z.w1,z.w2,z.w3,z.w4,z.w5].filter(Boolean).join(" > ")}${z.root?" > ROOT CAUSE: "+z.root:""}`).join("\n");
    fitText(doc,(a.rootSummary?"Root cause: "+a.rootSummary+"\n\n":"")+ch,x,y+used,w,h-used)});
  await block(5,"Countermeasures",R,T,CW,80,(x,y,w,h)=>fitText(doc,filled(dd.counter,["counter"]).map((z,i)=>`${i+1}. ${z.counter}${z.cause?"  [root cause: "+z.cause+"]":""}${z.effect?"  Expected: "+z.effect:""}${z.owner?"  ("+z.owner+")":""}`).join("\n")||"-",x,y,w,h));
  await block(6,"Implementation plan",R,T+82,CW,66,(x,y,w,h)=>fitText(doc,filled(dd.actions,["action"]).map(z=>`[${z.status}] ${z.action}${z.owner?" - "+z.owner:""}${z.due?", due "+fmtDate(z.due):""}`).join("\n")||"-",x,y,w,h));
  await block(7,"Follow-up and next steps",R,T+150,CW,105,async(x,y,w,h)=>{const pre=parseNums(a.currentData),post=parseNums(c.afterData);let used=0;
    const b=num(c.before)??num(a.currentValue),af=num(c.after);
    const txt=[b!=null&&af!=null?`Result: ${fmt(b)} -> ${fmt(af)}${a.targetValue?" (target "+a.targetValue+")":""}`:"",c.method?"Measured by: "+c.method:"",c.worked?"Worked: "+c.worked:"",c.notworked?"Did not work: "+c.notworked:"",ac.standardise?"Standard: "+ac.standardise:"",ac.share?"Share: "+ac.share:"",ac.open?"Open: "+ac.open:""].filter(Boolean).join("\n");
    if(post.length>1){used=await img(lineChart({values:[...pre,...post],title:"Before and after",lines:[{v:num(a.targetValue),label:"Target",c:C.orange,dash:1}],flagIdx:post.map((_,i)=>pre.length+i)}),x,y,w,h*.45)+2}
    fitText(doc,txt,x,y+used,w,h-used)});
}

/* ----- DMAIC sections ----- */
COVER.DMAIC=p=>{const c=p.define.charter;return{people:[["Sponsor",c.sponsor],["Process owner",c.processOwner],["Project lead",c.lead],["Core team",c.team]],summary:[["Problem",c.problem],["Baseline",c.baseline],["Goal",c.goal],["Expected benefit",c.benefit]]}};
PDFSEC.D=async(H,p)=>{const c=p.define.charter;
  H.h2("Project charter");H.kv([["Business case",c.businessCase],["Problem statement",c.problem],["Baseline metric",c.baseline],["Goal statement",c.goal],["In scope",c.inScope],["Out of scope",c.outScope],["Sponsor",c.sponsor],["Process owner",c.processOwner],["Project lead",c.lead],["Core team",c.team],["Start date",fmtDate(c.start)],["Define tollgate date",fmtDate(c.tollgateDate)],["Expected benefit",c.benefit]]);
  H.h2("SIPOC");const s=p.define.sipoc,cols=["s","i","p","o","c"].map(k=>lines(s[k])),n=Math.max(0,...cols.map(x=>x.length));
  H.tbl(["Suppliers","Inputs","Process","Outputs","Customers"],Array.from({length:n},(_,i)=>cols.map(x=>x[i]||"")));
  H.h2("Voice of the customer");H.tbl(["Customer","What they say","Key driver","CTQ","Specification / target"],rowsOf(p.define.voc,["customer","voice","driver","ctq","spec"]))};
PDFSEC.M=async(H,p)=>{const m=p.measure;
  H.h2("Data collection plan");H.tbl(["Metric","Y/X","Operational definition","Source","Sample","Who"],rowsOf(m.plan,["metric",r=>r.metric?r.type:"","definition","source","sample","who"]),[null,12]);
  H.h2("Measurement system analysis");H.kv([["Method",m.msa.method],["%GRR",m.msa.grr],["Distinct categories",m.msa.ndc],["Result and actions",m.msa.notes]]);
  H.h2("Baseline and capability");const x=parseNums(m.baseline.data);
  if(x.length){const st=stats(x),cap=capability(x,m.baseline.lsl,m.baseline.usl),side=longestSide(x,st.median);
    H.kv([["Unit",m.baseline.unit],["n",st.n],["Mean / median",fmt(st.mean)+" / "+fmt(st.median)],["Standard deviation",fmt(st.sd)],["Min / max",fmt(st.min)+" / "+fmt(st.max)],["Spec limits",(m.baseline.lsl||"-")+" / "+(m.baseline.usl||"-")],
      ...(cap&&cap.out!=null?[["Out of spec",cap.out+" ("+fmt(cap.out/st.n*100,1)+"%)"],["Cp / Cpk",fmt(cap.cp)+" / "+fmt(cap.cpk)],["DPMO",fmt(cap.dpmo,0)],["Sigma level",cap.sigma==null?"n/a (no defects in sample)":fmt(cap.sigma,1)]]:[]),
      ["Run chart signals",((side.len>=6?"Shift of "+side.len+" points. ":"")+(longestTrend(x)>=5?"Trend of "+longestTrend(x)+" points.":""))||"None"]]);
    await H.img(lineChart({values:x,title:"Baseline run chart"+(m.baseline.unit?" ("+m.baseline.unit+")":""),lines:[{v:st.median,label:"Median",c:C.light,dash:1},{v:num(m.baseline.lsl),label:"LSL",c:C.orange},{v:num(m.baseline.usl),label:"USL",c:C.orange}],flagIdx:side.len>=6?side.idx:[]}))}
  else H.para("No baseline data entered.");
  if(m.baseline.notes)H.para("Interpretation: "+m.baseline.notes);
  H.h2("As-is process map");H.tbl(["Step","Type","Time"],rowsOf(m.map,["step",r=>r.step?r.kind:"","time"]),[null,22,30]);
  const pc=pceOf(filled(m.map,["step"]));if(pc.tot)H.para(`Process cycle efficiency: ${fmt(pc.pce,1)}% value-added time (VA ${fmt(pc.va)}, NNVA ${fmt(pc.nnva)}, NVA ${fmt(pc.nva)}).`)};
async function fishWhysPdf(H,fb,whys,effect){
  H.h2("Cause and effect");if(fishCount(fb)){await H.img(fishboneChart(fb,effect));H.tbl(["Category","Potential causes"],BONES.map(([k,l])=>[l,lines(fb[k]).join("\n")]),[34])}else H.para("");
  H.h2("5 Whys");const ch=whys.filter(w=>Object.values(w).some(v=>String(v).trim()));if(ch.length)ch.forEach((w,i)=>H.kv([["Chain "+(i+1)+": symptom",w.problem],...[1,2,3,4,5].filter(n=>w["w"+n].trim()).map(n=>["Why "+n,w["w"+n]]),["Root cause",w.root]]));else H.para("")}
PDFSEC.A=async(H,p)=>{const a=p.analyse;
  await fishWhysPdf(H,a.fishbone,a.whys,p.define.charter.problem||p.title);
  H.h2("Pareto");const pr=paretoChart(a.pareto);if(pr.d){H.tbl(["Category","Count","Cumulative %"],pr.d.map(z=>[z.cat,String(z.n),fmt(z.cum,1)+"%"]),[null,24,30]);await H.img(pr.svg);H.para("Vital few: "+pr.vital.join(", "))}else H.para("");
  H.h2("Hypothesis tests");if(!a.tests.length)H.para("No tests recorded.");
  for(const [i,t] of a.tests.entries()){const r=runTest(t);H.para(`Test ${i+1}: ${t.name||"(unnamed)"}`,{bold:true});
    if(!r||!r.ok){H.para(r&&r.error?"Not calculated: "+r.error:"No data.",{color:GRY});continue}
    H.kv([["Test",t.type],["Significance level",t.alpha],...r.rows.map(([l,v])=>[l,String(v)]),["Conclusion",r.summary],["Cautions",r.warn.join(" ")],["Practical interpretation",t.notes]]);
    if(r.svg)await H.img(r.svg,120)}
  H.h2("Root cause validation");H.tbl(["Suspected cause","How tested","Evidence and result","Status"],rowsOf(a.causes,["cause","test","evidence",r=>r.cause?r.result:""]),[null,null,null,22])};
PDFSEC.I=async(H,p)=>{const im=p.improve;
  H.h2("Solutions");H.tbl(["#","Solution","Root cause addressed","Impact","Effort","Quadrant"],im.solutions.map((z,i)=>[z.solution?String(i+1):"",z.solution,z.cause,z.solution?z.impact:"",z.solution?z.effort:"",z.solution?solCalc(z).t:""]),[8,null,null,15,15,26]);
  if(filled(im.solutions,["solution"]).length)await H.img(matrixChart(im.solutions),95);
  H.h2("Risk assessment (FMEA)");H.tbl(["Failure mode","Effect","S","O","D","RPN","Mitigation"],rowsOf(im.fmea,["mode","effect","s","o","d",r=>rpnCalc(r).t,"action"]),[null,null,9,9,9,13,null]);
  H.h2("Pilot");const pb=num(im.pilot.before),pa=num(im.pilot.after);H.kv([["Scope",im.pilot.scope],["Duration",im.pilot.duration],["Success criteria",im.pilot.criteria],["Y before",im.pilot.before],["Y during pilot",im.pilot.after],["Change",pb!=null&&pa!=null&&pb!==0?fmt(pa-pb)+" ("+fmt((pa-pb)/Math.abs(pb)*100,1)+"%)":"-"],["Observations",im.pilot.notes]]);
  H.h2("Implementation plan");actionsPdf(H,im.actions)};
function actionsPdf(H,a){H.tbl(["Action","Owner","Due","Status"],rowsOf(a,["action","owner",r=>r.due?fmtDate(r.due):"",r=>r.action?r.status:""]),[null,36,26,24])}
PDFSEC.C=async(H,p)=>{const co=p.control;
  H.h2("Control plan");H.tbl(["What","Target / limits","Method","Frequency","Owner","Reaction plan"],rowsOf(co.plan,["metric","target","method","freq","owner","reaction"]));
  H.h2("Control chart");const cx=parseNums(co.chart.data),rr=imr(cx);
  if(rr){H.kv([["n",rr.st.n],["Mean",fmt(rr.st.mean)],["UCL / LCL",fmt(rr.ucl)+" / "+fmt(rr.lcl)],["Points outside limits",rr.outside.length?rr.outside.map(i=>i+1).join(", "):"None"],["Longest run one side of mean",rr.run.len],["Interpretation",co.chart.notes]]);await H.img(imrSVG(cx,rr))}
  else H.para("No control data entered.");
  H.h2("Handover and closure");H.kv([["Standard work and documentation",co.closure.docs],["Handover to process owner",co.closure.handover],["Validated benefits",co.closure.finance],["Lessons learned",co.closure.lessons],["Closure date",fmtDate(co.closure.closedOn)]])};

/* ----- A3 appendix sections ----- */
COVER["A3 problem solving"]=p=>({people:[["Owner",p.a3plan.owner],["Mentor",p.a3plan.mentor]],summary:[["Current condition",p.a3plan.current],["Target",p.a3plan.target]]});
PDFSEC.a3p=async(H,p)=>{const a=p.a3plan;H.h2("Background");H.kv([["Owner",a.owner],["Mentor",a.mentor],["Started",fmtDate(a.date)],["Background",a.background]]);
  H.h2("Current condition");H.kv([["Current condition",a.current],["Key metric",a.metric],["Current value",a.currentValue]]);const d=parseNums(a.currentData);if(d.length>1)await H.img(lineChart({values:d,title:a.metric||"Current condition",lines:[{v:stats(d).median,label:"Median",c:C.light,dash:1}]}));
  H.h2("Target");H.kv([["Target condition",a.target],["Target value",a.targetValue],["Target date",fmtDate(a.targetDate)]]);
  await fishWhysPdf(H,a.fishbone,a.whys,a.current||p.title);H.h2("Root cause summary");H.para(a.rootSummary)};
PDFSEC.a3d=async(H,p)=>{H.h2("Countermeasures");H.tbl(["Countermeasure","Root cause","Expected effect","Owner"],rowsOf(p.a3do.counter,["counter","cause","effect","owner"]));H.h2("Implementation plan");actionsPdf(H,p.a3do.actions)};
PDFSEC.a3c=async(H,p)=>{const c=p.a3check;H.h2("Follow-up");H.kv([["Measured by",c.method],["Before",c.before||p.a3plan.currentValue],["After",c.after],["Target",p.a3plan.targetValue],["What worked",c.worked],["What did not work",c.notworked]]);
  const pre=parseNums(p.a3plan.currentData),x=parseNums(c.afterData);if(x.length>1)await H.img(lineChart({values:[...pre,...x],title:"Before and after",lines:[{v:num(p.a3plan.targetValue),label:"Target",c:C.orange,dash:1}],flagIdx:x.map((_,i)=>pre.length+i)}))};
PDFSEC.a3a=async(H,p)=>{H.h2("Standardise and share");H.kv([["Standard",p.a3act.standardise],["Share (yokoten)",p.a3act.share],["Open issues",p.a3act.open]])};

/* ----- Kaizen sections ----- */
COVER["Kaizen event"]=p=>{const k=p.kzprep;return{people:[["Sponsor",k.sponsor],["Event leader",k.leader],["Team",k.team],["Event dates",[fmtDate(k.start),fmtDate(k.end)].filter(Boolean).join(" to ")]],summary:[["Problem",k.problem],["Scope",k.scopeStart||k.scopeEnd?`${k.scopeStart} to ${k.scopeEnd}`:""],["Objectives",k.objectives]]}};
PDFSEC.kzp=async(H,p)=>{const k=p.kzprep;H.h2("Event charter");H.kv([["Problem or opportunity",k.problem],["Process starts at",k.scopeStart],["Process ends at",k.scopeEnd],["Objectives",k.objectives],["Out of scope",k.outScope],["Constraints",k.constraints],["Sponsor",k.sponsor],["Event leader",k.leader],["Team",k.team],["Dates",[fmtDate(k.start),fmtDate(k.end)].filter(Boolean).join(" to ")]]);
  H.h2("Pre-work");H.kv([["Baseline data",k.prework],["Process walk",k.walk],["Stakeholders informed",k.informed]]);H.h2("Agenda and logistics");H.kv([["Agenda",k.agenda],["Logistics",k.logistics]])};
PDFSEC.kze=async(H,p)=>{const e=p.kzevent;H.h2("Waste walk");H.tbl(["Step","Waste","Observation","Impact"],rowsOf(e.obs,["step",r=>r.observation?r.waste:"","observation","impact"]),[null,30]);
  const cnt={};filled(e.obs,["observation"]).forEach(o=>cnt[o.waste]=(cnt[o.waste]||0)+1);const r=paretoChart(Object.entries(cnt).map(([cat,count])=>({cat,count})),640,300,"Waste by type");if(r.svg)await H.img(r.svg,140);
  H.h2("Ideas and try-storming");H.tbl(["Idea","Waste removed","Status","Result"],rowsOf(e.ideas,["idea","waste",r=>r.idea?r.status:"","result"]),[null,null,22]);
  H.h2("Before and after");H.tbl(["Metric","Unit","Before","After","Target","Change"],rowsOf(e.metrics,["metric","unit","before","after","target",r=>chgCalc(r).t]));const b=barCompare(e.metrics,"Before and after");if(b)await H.img(b,140);
  H.h2("Changes and new standard work");H.para(e.changes)};
PDFSEC.kzf=async(H,p)=>{const f=p.kzfollow;H.h2("Kaizen newspaper");H.tbl(["Open item","Owner","Due","Status"],rowsOf(f.news,["item","owner",r=>r.due?fmtDate(r.due):"",r=>r.item?r.status:""]),[null,36,26,24]);
  H.h2("Sustain audits");H.tbl(["Date","Finding","Sustained"],rowsOf(f.audits,[r=>r.date?fmtDate(r.date):"","finding",r=>r.date||r.finding?r.sustained:""]),[28,null,24]);H.h2("Report-out");H.kv([["Summary",f.reportout],["Lessons learned",f.lessons]])};

/* ----- VSM sections ----- */
COVER["Value stream mapping"]=p=>{const c=p.vsmcur,k=vsmCalc(c.steps,c),f=vsmCalc(p.vsmfut.steps,c);return{people:[["Value stream owner",c.owner],["Sponsor",c.sponsor]],summary:[["Product or service family",c.family],["Customer demand",c.demand?`${c.demand} per ${c.period||"period"}`:""],["Current lead time",k.r.length?`${fmt(k.lead)} ${c.unit} (PCE ${fmt(k.pce,1)}%)`:""],["Future lead time",f.r.length?`${fmt(f.lead)} ${c.unit} (PCE ${fmt(f.pce,1)}%)`:""]]}};
const stepRows=(s)=>rowsOf(s,["step","ct","co","uptime","ops","wait","pca"]);
PDFSEC.vc=async(H,p)=>{const c=p.vsmcur,k=vsmCalc(c.steps,c);H.h2("Scope and demand");H.kv([["Family",c.family],["Supplier",c.supplier],["Customer",c.customer],["Demand",c.demand?`${c.demand} per ${c.period||"period"}`:""],["Available time",c.avail?`${c.avail} ${c.unit}`:""],["Takt",k.takt?fmt(k.takt)+" "+c.unit:"n/a"],["Information flow",c.info]]);
  H.h2("Current-state map");await H.img(vsmMap(c.steps,c,"Current state"));H.tbl(["Step","C/T","C/O","Uptime %","People","Waiting","%C&A"],stepRows(c.steps));H.para(vsmFlags(k,c.unit).join(" "));if(c.observations)H.para("Observations: "+c.observations)};
PDFSEC.vf=async(H,p)=>{const f=p.vsmfut,c=p.vsmcur,a=vsmCalc(c.steps,c),b=vsmCalc(f.steps,c);H.h2("Future-state map");await H.img(vsmMap(f.steps,c,"Future state",f.bursts));H.tbl(["Step","C/T","C/O","Uptime %","People","Waiting","%C&A"],stepRows(f.steps));
  if(a.r.length&&b.r.length)H.kv([["Lead time",`${fmt(a.lead)} -> ${fmt(b.lead)} ${c.unit}`],["Processing time",`${fmt(a.ct)} -> ${fmt(b.ct)} ${c.unit}`],["PCE",`${fmt(a.pce,1)}% -> ${fmt(b.pce,1)}%`]]);if(f.vision)H.para(f.vision);
  H.h2("Kaizen bursts");H.tbl(["#","Where","Improvement","Expected effect"],f.bursts.map((z,i)=>[z.improvement?String(i+1):"",z.where,z.improvement,z.effect]),[8])};
PDFSEC.vp=async(H,p)=>{H.h2("Implementation plan");H.tbl(["Action","Burst / method","Owner","Due","Status"],rowsOf(p.vsmplan.actions,["action","burst","owner",r=>r.due?fmtDate(r.due):"",r=>r.action?r.status:""]));H.kv([["Review rhythm",p.vsmplan.review]])};

/* ================= export & email ================= */
const slug=t=>String(t||"project").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)||"project";
const toolSlug={"DMAIC":"dmaic","A3 problem solving":"a3","Kaizen event":"kaizen","Value stream mapping":"vsm"};
async function exportPDF(p){
  if(!window.jspdf||!window.jspdf.jsPDF){toast("The PDF library did not load. Reload the page and try again.");return}
  if(!downloads){toast("Saving files isn't available in this view.");return}
  const btn=$("#pdf");if(btn){btn.disabled=true;btn.textContent="Preparing PDF…"}
  try{const blob=await buildPDF(p);await downloads.save({filename:`${slug(p.title)}-${toolSlug[p.tool]||"lean"}-report-${new Date().toISOString().slice(0,10)}.pdf`,data:blob});toast("PDF saved.")}
  catch(e){if(e&&e.code==="declined")toast("Download cancelled.");else if(e&&e.code==="rate_limited")toast("A save prompt is already open.");else{console.error(e);toast("The PDF could not be created. "+(e&&e.message?e.message:""))}}
  finally{if(btn){btn.disabled=false;btn.textContent="Download PDF"}}
}
function emailBody(p){const cv=COVER[p.tool](p);
  return `Hello,

Please find attached the ${p.tool} report for "${p.title}".

Status: ${STATUSES[p.status]}, ${p.status==="closed"?"closed":"currently in the "+ST[p.phase].name+" stage"}.

${cv.summary.filter(([,v])=>String(v||"").trim()).map(([k,v])=>`${k}: ${v}`).join("\n")}

Stages:
${DEF[p.tool].order.map(k=>`${ST[k].name}: ${stageStatus(p,k).toLowerCase()}`).join("\n")}

Kind regards,`}
function openEmail(p){
  const root=$("#modalRoot");
  root.innerHTML=`<div class="overlay" id="ov"><div class="modal panel" role="dialog" aria-modal="true" aria-labelledby="mh">
    <div class="panel-head"><h2 id="mh">Email this project</h2></div>
    <div class="panel-body">
      <p class="small" style="margin-top:0">Email drafts opened from a web page can't carry attachments. Download the PDF first, then attach it to the draft.</p>
      <div class="field"><label for="mTo">To</label><input id="mTo" type="email" multiple placeholder="name@maastrichtuniversity.nl"></div>
      <div class="field"><label for="mSub">Subject</label><input id="mSub" value="${esc(p.tool+" report: "+p.title)}"></div>
      <div class="field"><label for="mBody">Message</label><textarea id="mBody">${esc(emailBody(p))}</textarea></div>
      <div class="row"><button class="btn" id="mPdf">1. Download PDF</button><a class="btn hot" id="mOpen" target="_blank" rel="noopener">2. Open email draft</a><button class="btn alt" id="mCopy">Copy message</button><button class="btn alt" id="mClose">Close</button></div>
    </div></div></div>`;
  const upd=()=>{const b=$("#mBody").value;$("#mOpen").href=`mailto:${encodeURIComponent($("#mTo").value.trim()).replace(/%40/g,"@").replace(/%2C/g,",")}?subject=${encodeURIComponent($("#mSub").value)}&body=${encodeURIComponent(b.length>1800?b.slice(0,1800)+"\n…":b)}`};
  ["#mTo","#mSub","#mBody"].forEach(s=>$(s).oninput=upd);upd();
  const close=()=>{root.innerHTML="";$("#mail")&&$("#mail").focus()};
  $("#mClose").onclick=close;$("#ov").onclick=e=>{if(e.target.id==="ov")close()};
  document.addEventListener("keydown",function k(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",k)}});
  $("#mPdf").onclick=()=>exportPDF(p);
  $("#mCopy").onclick=async()=>{const t=`Subject: ${$("#mSub").value}\n\n${$("#mBody").value}`;try{await navigator.clipboard.writeText(t);toast("Message copied.")}catch{$("#mBody").select();toast("Text selected: press Ctrl+C or Cmd+C to copy.")}};
  $("#mTo").focus();
}

