/* ================= Hypothesis tests (DMAIC Analyse) ================= */
var TESTS=["2-sample t-test","Paired t-test","One-way ANOVA","Chi-square test","2-proportion test","Correlation and regression"];
var TESTHELP={
 "2-sample t-test":_t("Are the averages of two independent groups different? Example: processing time for requests handled by team A against team B. Uses Welch's version, which does not assume equal variances."),
 "Paired t-test":_t("Did the same items change between two measurements? Example: the same 15 orders processed before and after a new checklist. Values must be in the same order in both lists."),
 "One-way ANOVA":_t("Are the averages of three or more groups different? Example: turnaround time by team."),
 "Chi-square test":_t("Are two categorical variables related? Example: is the error type linked to the submission channel? Enter counts, not percentages."),
 "2-proportion test":_t("Is the defect rate different between two groups? Example: 18 of 120 returned against 7 of 110 returned."),
 "Correlation and regression":_t("Does Y move with X? Example: order size against processing time. Shows the strength of the relationship, not the cause.")
};
var newTest=()=>({name:"",type:TESTS[0],alpha:"0.05",a:"",b:"",la:"",lb:"",groups:"",x1:"",n1:"",x2:"",n2:"",notes:""});
function verdict(pv,alpha,h1){return pv<alpha?_t("Reject the null hypothesis (p {pv} < {alpha}). The data supports that {x}.",{pv:fmtP(pv),alpha:alpha,x:h1.charAt(0).toLowerCase()+h1.slice(1)}):`${_t("Fail to reject the null hypothesis (p {pv} ≥ {alpha}). No evidence that {x}. This does not prove there is no effect: the sample may be too small.",{pv:fmtP(pv),alpha:alpha,x:h1.charAt(0).toLowerCase()+h1.slice(1)})}`}
function runTest(t){
  const alpha=num(t.alpha)||0.05,w=[];
  try{
  if(t.type==="2-sample t-test"){const a=parseNums(t.a),b=parseNums(t.b);if(a.length<2||b.length<2)return{ok:false,error:_t("Enter at least 2 values per group.")};
    const A=stats(a),B=stats(b),va=A.sd**2/A.n,vb=B.sd**2/B.n,se=Math.sqrt(va+vb);if(!se)return{ok:false,error:_t("No variation in the data.")};
    const tv=(A.mean-B.mean)/se,df=(va+vb)**2/(va**2/(A.n-1)+vb**2/(B.n-1)),pv=pT2(tv,df),tc=tInv(1-.95,df),diff=A.mean-B.mean;
    if(A.n<15||B.n<15)w.push(_t("Small samples: the t-test assumes roughly normal data. Check the dot plot for strong skew or outliers."));
    const la=t.la||_t("Group A"),lb=t.lb||_t("Group B");
    return{ok:true,p:pv,alpha,rows:[[(_t("{la} mean (n)",{la:la})),`${fmt(A.mean)} (${A.n})`],[(_t("{lb} mean (n)",{lb:lb})),`${fmt(B.mean)} (${B.n})`],[_t("Difference"),fmt(diff)],[_t("95% CI of difference"),`${fmt(diff-tc*se)} to ${fmt(diff+tc*se)}`],["t",fmt(tv,3)],["df",fmt(df,1)],["p-value",fmtP(pv)]],
      summary:verdict(pv,alpha,`${_t("the means of {la} and {lb} differ",{la:la,lb:lb})}`),warn:w,svg:groupPlot([{label:la,vals:a},{label:lb,vals:b}],_t("Individual values and means"))}}
  if(t.type==="Paired t-test"){const a=parseNums(t.a),b=parseNums(t.b);if(a.length!==b.length)return{ok:false,error:`${_t("Both lists need the same number of values (now {aCount} and {bCount}).",{aCount:a.length,bCount:b.length})}`};if(a.length<2)return{ok:false,error:_t("Enter at least 2 pairs.")};
    const d=b.map((v,i)=>v-a[i]),D=stats(d);if(!D.sd)return{ok:false,error:_t("All differences are identical: nothing to test.")};
    const se=D.sd/Math.sqrt(D.n),tv=D.mean/se,df=D.n-1,pv=pT2(tv,df),tc=tInv(.05,df);
    if(D.n<15)w.push(_t("Small sample: the paired t-test assumes the differences are roughly normal."));
    const la=t.la||_t("Before"),lb=t.lb||_t("After");
    return{ok:true,p:pv,alpha,rows:[[_t("Pairs"),D.n],[la+" mean",fmt(stats(a).mean)],[lb+" mean",fmt(stats(b).mean)],[(_t("Mean difference ({lb} minus {la})",{lb:lb,la:la})),fmt(D.mean)],[_t("95% CI"),`${fmt(D.mean-tc*se)} to ${fmt(D.mean+tc*se)}`],["t",fmt(tv,3)],["df",df],["p-value",fmtP(pv)]],
      summary:verdict(pv,alpha,`${_t("there is a mean change between {la} and {lb}",{la:la,lb:lb})}`),warn:w,svg:groupPlot([{label:la,vals:a},{label:lb,vals:b}],_t("Individual values and means"))}}
  if(t.type==="One-way ANOVA"){const g=parseGroups(t.groups);if(g.length<2||g.some(x=>x.vals.length<2))return{ok:false,error:_t("Enter at least 2 groups with 2 or more values each, one group per line.")};
    const all=g.flatMap(x=>x.vals),N=all.length,gm=all.reduce((s,v)=>s+v,0)/N,k=g.length;
    const st=g.map(x=>stats(x.vals)),ssb=st.reduce((s,x)=>s+x.n*(x.mean-gm)**2,0),ssw=g.reduce((s,x,i)=>s+x.vals.reduce((q,v)=>q+(v-st[i].mean)**2,0),0);
    const d1=k-1,d2=N-k;if(!ssw)return{ok:false,error:_t("No variation inside the groups.")};const F=(ssb/d1)/(ssw/d2),pv=pF(F,d1,d2);
    const sds=st.map(x=>x.sd).filter(Boolean);if(sds.length&&Math.max(...sds)/Math.min(...sds)>2)w.push(_t("Group standard deviations differ by more than a factor 2. ANOVA assumes similar variation; treat the p-value with caution."));
    if(pv<alpha)w.push(_t("ANOVA tells you at least one group differs, not which one. Compare the pairs that matter with 2-sample tests."));
    return{ok:true,p:pv,alpha,rows:[...g.map((x,i)=>[(_t("{label} mean (n)",{label:x.label})),`${fmt(st[i].mean)} (${st[i].n})`]),["F",fmt(F,3)],["df",`${d1}, ${d2}`],["p-value",fmtP(pv)],[_t("R² (share of variation explained by group)"),fmt(ssb/(ssb+ssw)*100,1)+"%"]],
      summary:verdict(pv,alpha,_t("at least one group mean differs")),warn:w,svg:groupPlot(g,_t("Individual values and means"))}}
  if(t.type==="Chi-square test"){const g=parseGroups(t.groups);if(g.length<2)return{ok:false,error:_t("Enter at least 2 rows of counts.")};const c=g[0].vals.length;if(c<2||g.some(x=>x.vals.length!==c))return{ok:false,error:_t("Every row needs the same number of counts (at least 2).")};
    const rt=g.map(x=>x.vals.reduce((a,b)=>a+b,0)),ct=Array.from({length:c},(_,j)=>g.reduce((a,x)=>a+x.vals[j],0)),N=rt.reduce((a,b)=>a+b,0);if(!N||ct.some(v=>!v)||rt.some(v=>!v))return{ok:false,error:_t("Every row and column needs at least one count.")};
    let chi=0,low=0;g.forEach((x,i)=>x.vals.forEach((o,j)=>{const e=rt[i]*ct[j]/N;chi+=(o-e)**2/e;if(e<5)low++}));
    const df=(g.length-1)*(c-1),pv=pChi(chi,df);if(low/(g.length*c)>.2)w.push(`${_t("{low} cells have an expected count below 5. The chi-square approximation is unreliable: combine categories or collect more data.",{low:low})}`);
    return{ok:true,p:pv,alpha,rows:[[_t("Rows × columns"),`${g.length} × ${c}`],[_t("Total count"),N],[_t("Chi-square"),fmt(chi,3)],["df",df],["p-value",fmtP(pv)],[_t("Cramér's V (strength, 0 to 1)"),fmt(Math.sqrt(chi/(N*(Math.min(g.length,c)-1))),2)]],
      summary:verdict(pv,alpha,_t("the two categorical variables are related")),warn:w}}
  if(t.type==="2-proportion test"){const x1=num(t.x1),n1=num(t.n1),x2=num(t.x2),n2=num(t.n2);if([x1,n1,x2,n2].some(v=>v==null)||!n1||!n2||x1>n1||x2>n2||x1<0||x2<0)return{ok:false,error:_t("Enter the number of events and the sample size for both groups.")};
    const p1=x1/n1,p2=x2/n2,pp=(x1+x2)/(n1+n2),se=Math.sqrt(pp*(1-pp)*(1/n1+1/n2));if(!se)return{ok:false,error:_t("Both proportions are 0% or 100%: nothing to test.")};
    const z=(p1-p2)/se,pv=pZ2(z),se2=Math.sqrt(p1*(1-p1)/n1+p2*(1-p2)/n2);
    if([x1,n1-x1,x2,n2-x2].some(v=>v<5))w.push(_t("Fewer than 5 events or non-events in a group: the normal approximation is weak. Collect more data or use an exact test."));
    const la=t.la||_t("Group A"),lb=t.lb||_t("Group B");
    return{ok:true,p:pv,alpha,rows:[[la,`${_t("{x1} of {n1} ({x}%)",{x1:x1,n1:n1,x:fmt(p1*100,1)})}`],[lb,`${_t("{x2} of {n2} ({x}%)",{x2:x2,n2:n2,x:fmt(p2*100,1)})}`],[_t("Difference"),fmt((p1-p2)*100,1)+" points"],[_t("95% CI of difference"),`${_t("{x} to {x2} points",{x:fmt((p1-p2-1.96*se2)*100,1),x2:fmt((p1-p2+1.96*se2)*100,1)})}`],["z",fmt(z,3)],["p-value",fmtP(pv)]],
      summary:verdict(pv,alpha,`${_t("the proportions of {la} and {lb} differ",{la:la,lb:lb})}`),warn:w,svg:barCompare([{label:_t("Proportion (%)"),before:p1*100,after:p2*100}],`${_t("{la} (grey) against {lb} (orange)",{la:la,lb:lb})}`)}}
  if(t.type==="Correlation and regression"){const x=parseNums(t.a),y=parseNums(t.b);if(x.length!==y.length)return{ok:false,error:`${_t("X and Y need the same number of values (now {xCount} and {yCount}).",{xCount:x.length,yCount:y.length})}`};if(x.length<4)return{ok:false,error:_t("Enter at least 4 pairs.")};
    const X=stats(x),Y=stats(y),n=x.length,sxy=x.reduce((s,v,i)=>s+(v-X.mean)*(y[i]-Y.mean),0),sxx=x.reduce((s,v)=>s+(v-X.mean)**2,0),syy=y.reduce((s,v)=>s+(v-Y.mean)**2,0);
    if(!sxx||!syy)return{ok:false,error:_t("X or Y has no variation.")};
    const r=sxy/Math.sqrt(sxx*syy),b1=sxy/sxx,b0=Y.mean-b1*X.mean,tv=Math.abs(r)>=1?Infinity:r*Math.sqrt((n-2)/(1-r*r)),pv=Number.isFinite(tv)?pT2(tv,n-2):0;
    w.push(_t("Correlation is not causation. A third factor can drive both X and Y."));if(n<20)w.push(_t("Fewer than 20 pairs: one outlier can create or hide the relationship. Check the scatter plot."));
    const lx=t.la||"X",ly=t.lb||"Y";
    return{ok:true,p:pv,alpha,rows:[[_t("Pairs"),n],[_t("Pearson r"),fmt(r,3)],["R²",fmt(r*r*100,1)+"%"],[_t("Equation"),`${ly} = ${fmt(b0,3)} + ${fmt(b1,4)} × ${lx}`],[_t("p-value (slope)"),fmtP(pv)]],
      summary:verdict(pv,alpha,`${_t("{ly} is linearly related to {lx}",{ly:ly,lx:lx})}`)+` ${_t("{lx} explains {x}% of the variation in {ly}.",{lx:lx,x:fmt(r*r*100,0),ly:ly})}`,warn:w,svg:scatterChart(x,y,{b0,b1},lx,ly)}}
  }catch(e){return{ok:false,error:(_t("Could not calculate: {message}",{message:e.message}))}}
  return null;
}
function testInputs(t,i){
  const P=`analyse.tests.${i}`,ta=(k,l,h,rows=6)=>`<div class="field"><label for="${P}.${k}">${l}</label>${h?`<div class="hint">${h}</div>`:""}<textarea id="${P}.${k}" data-bind="${P}.${k}" rows="${rows}">${esc(t[k])}</textarea></div>`,
    ip=(k,l,ph)=>`<div class="field"><label for="${P}.${k}">${l}</label><input id="${P}.${k}" data-bind="${P}.${k}" value="${esc(t[k])}" ${ph?`placeholder="${esc(ph)}"`:""}></div>`;
  switch(t.type){
    case "2-sample t-test":return `<div class="grid2">${ip("la",_t("Name of group A"),_t("e.g. Team A"))}${ip("lb",_t("Name of group B"),_t("e.g. Team B"))}${ta("a",_t("Group A values"),_t("One per line, or separated by spaces or semicolons."))}${ta("b",_t("Group B values"),"")}</div>`;
    case "Paired t-test":return `<div class="grid2">${ip("la",_t("First measurement"),_t("Before"))}${ip("lb",_t("Second measurement"),_t("After"))}${ta("a",_t("First values"),_t("Same order as the second list."))}${ta("b",_t("Second values"),"")}</div>`;
    case "One-way ANOVA":return ta("groups",_t("Groups"),_t("One group per line: name, colon, values. Example: Team A: 12 15 11 14"),7);
    case "Chi-square test":return ta("groups",_t("Contingency table (counts)"),_t("One row per line, optionally with a label. Example: Web form: 30 12 8"),7);
    case "2-proportion test":return `<div class="grid2">${ip("la",_t("Name of group A"),"")}${ip("lb",_t("Name of group B"),"")}</div><div class="grid2"><div class="grid2">${ip("x1",_t("Events in A"),_t("e.g. 18"))}${ip("n1",_t("Sample size A"),_t("e.g. 120"))}</div><div class="grid2">${ip("x2",_t("Events in B"),_t("e.g. 7"))}${ip("n2",_t("Sample size B"),_t("e.g. 110"))}</div></div>`;
    case "Correlation and regression":return `<div class="grid2">${ip("la",_t("X name"),_t("e.g. Order size (items)"))}${ip("lb",_t("Y name"),_t("e.g. Processing time (hours)"))}${ta("a",_t("X values"),_t("Same order as Y."))}${ta("b",_t("Y values"),"")}</div>`;
  }
  return "";
}
TABS.A.tests=p=>`<p class="lead">${_t("Test a suspected cause with data. Pick the test by data type: continuous data and 2 groups, 2-sample or paired t-test; 3 or more groups, ANOVA; counts in categories, chi-square; yes/no rates, 2-proportion; two continuous variables, correlation.")}</p>
  ${p.analyse.tests.map((t,i)=>`<div class="card test">
    <div class="grid3">${`<div class="field"><label for="tn${i}">${_t("Hypothesis being tested")}</label><input id="tn${i}" data-bind="analyse.tests.${i}.name" value="${esc(t.name)}" placeholder="${_t("e.g. Team affects processing time")}"></div>`}
      <div class="field"><label for="tt${i}">${_t("Test")}</label><select id="tt${i}" data-bind="analyse.tests.${i}.type" data-rerender="1">${TESTS.map(x=>`<option value="${esc(x)}" ${x===t.type?"selected":""}>${esc(_tv(x))}</option>`).join("")}</select></div>
      <div class="field"><label for="ta${i}">${_t("Significance level (α)")}</label><select id="ta${i}" data-bind="analyse.tests.${i}.alpha">${["0.10","0.05","0.01"].map(x=>`<option value="${esc(x)}" ${x===t.alpha?"selected":""}>${esc(_tv(x))}</option>`).join("")}</select></div></div>
    <div class="flag info" style="margin-bottom:12px">${esc(TESTHELP[t.type])}</div>
    ${testInputs(t,i)}
    <div id="tres${i}"></div>
    <div class="field"><label for="tno${i}">${_t("Practical interpretation")}</label><div class="hint">${_t("Is the difference big enough to matter to the customer or the process?")}</div><textarea id="tno${i}" data-bind="analyse.tests.${i}.notes" rows="2">${esc(t.notes)}</textarea></div>
    <div class="row-actions"><button class="btn alt" data-tolink="${i}">${_t("Add to root cause validation")}</button><button class="x" data-deltest="${i}">${_t("Remove test")}</button></div>
  </div>`).join("")}
  <button class="btn" id="addTest">${_t("Add a test")}</button>`;
AFTER["A.tests"]=p=>{
  S.refresh=()=>{p.analyse.tests.forEach((t,i)=>{const el=$("#tres"+i);if(!el)return;const r=runTest(t);
    if(!r||!r.ok){el.innerHTML=r&&r.error&&(t.a||t.b||t.groups||t.x1)?flagsHTML([r.error]):"";return}
    el.innerHTML=`<div class="result ${r.p<r.alpha?"sig":""}"><b>${esc(r.summary)}</b></div>${statsHTML(r.rows.map(([l,v])=>[l,esc(String(v))]))}${r.svg?`<div class="chartbox">${r.svg}</div>`:""}<div class="flags">${flagsHTML(r.warn.map(x=>"ℹ "+x))}</div>`})};
  setTimeout(()=>{
    const add=$("#addTest");if(add)add.onclick=()=>{p.analyse.tests.push(newTest());scheduleSave(p);renderSheet()};
    document.querySelectorAll("[data-deltest]").forEach(b=>b.onclick=()=>{if(!confirm(_t("Remove this test?")))return;p.analyse.tests.splice(+b.dataset.deltest,1);scheduleSave(p);renderSheet()});
    document.querySelectorAll("[data-tolink]").forEach(b=>b.onclick=()=>{const t=p.analyse.tests[+b.dataset.tolink],r=runTest(t);if(!r||!r.ok){toast(_t("Run the test with valid data first."));return}
      const row={cause:t.name||_t("(unnamed hypothesis)"),test:t.type+", α "+t.alpha,evidence:r.summary+(t.notes?" "+t.notes:""),result:"Pending"};
      const c=p.analyse.causes;if(c.length===1&&!c[0].cause&&!c[0].test&&!c[0].evidence)c[0]=row;else c.push(row);scheduleSave(p);toast(_t("Added to root cause validation. Set its status there."))});
  });
};
