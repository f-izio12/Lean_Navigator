/* ================= charts (fixed colours: shared by screen and PDF) ================= */
const C={blue:"#0C2145",orange:"#A3422A",light:"#7A6A3E",grey:"#8C95A3",line:"#E2DCCB",text:"#0C2145",pale:"#F4EFE1",gold:"#C3B598"};
const FONT="Jost, Verdana, Arial, sans-serif";
const svgOpen=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}"><rect width="${w}" height="${h}" fill="#fff"/>`;
function lineChart({values,title,lines:hl=[],flagIdx=[],w=760,h=300}){
  if(!values.length)return "";
  const all=[...values,...hl.map(l=>l.v).filter(v=>v!=null&&Number.isFinite(v))];
  let lo=Math.min(...all),hi=Math.max(...all);if(lo===hi){lo-=1;hi+=1}const pad=(hi-lo)*.1;lo-=pad;hi+=pad;
  const L=56,R=110,T=34,B=36,pw=w-L-R,ph=h-T-B;
  const X=i=>L+(values.length===1?pw/2:i*pw/(values.length-1)),Y=v=>T+ph-(v-lo)/(hi-lo)*ph,flags=new Set(flagIdx);
  let g=svgOpen(w,h)+`<text x="${L}" y="20" font-size="13" font-weight="700" fill="${C.text}">${esc(title)}</text>`;
  for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4,y=Y(v);g+=`<line x1="${L}" x2="${L+pw}" y1="${y}" y2="${y}" stroke="${C.line}"/><text x="${L-6}" y="${y+4}" font-size="10" text-anchor="end" fill="${C.grey}">${esc(fmt(v,2))}</text>`}
  hl.forEach(l=>{if(l.v==null||!Number.isFinite(l.v))return;const y=Y(l.v);g+=`<line x1="${L}" x2="${L+pw}" y1="${y}" y2="${y}" stroke="${l.c}" stroke-width="1.5" ${l.dash?'stroke-dasharray="6 4"':""}/><text x="${L+pw+6}" y="${y+4}" font-size="10" fill="${l.c}">${esc(l.label)} ${esc(fmt(l.v,2))}</text>`});
  g+=`<polyline fill="none" stroke="${C.blue}" stroke-width="1.5" points="${values.map((v,i)=>X(i)+","+Y(v)).join(" ")}"/>`;
  values.forEach((v,i)=>{g+=`<circle cx="${X(i)}" cy="${Y(v)}" r="${flags.has(i)?4.5:3}" fill="${flags.has(i)?C.orange:C.blue}"/>`});
  const step=Math.max(1,Math.ceil(values.length/15));
  values.forEach((v,i)=>{if(i%step===0||i===values.length-1)g+=`<text x="${X(i)}" y="${T+ph+16}" font-size="10" text-anchor="middle" fill="${C.grey}">${i+1}</text>`});
  return g+`</svg>`;
}
function paretoChart(rs,w=760,h=320,title="Pareto"){
  const d=rs.map(r=>({cat:r.cat,n:num(r.count)||0})).filter(r=>r.cat&&r.n>0).sort((a,b)=>b.n-a.n);
  if(!d.length)return{svg:"",vital:[],total:0};
  const total=d.reduce((a,b)=>a+b.n,0);let cum=0;d.forEach(r=>{cum+=r.n;r.cum=cum/total*100});
  const vital=[];for(const r of d){vital.push(r.cat);if(r.cum>=80)break}
  const L=50,R=50,T=30,B=80,pw=w-L-R,ph=h-T-B,bw=pw/d.length,max=d[0].n;
  let g=svgOpen(w,h)+`<text x="${L}" y="18" font-size="13" font-weight="700" fill="${C.text}">${esc(title)} (n = ${total})</text>`;
  const y80=T+ph-.8*ph;g+=`<line x1="${L}" x2="${L+pw}" y1="${y80}" y2="${y80}" stroke="${C.light}" stroke-dasharray="6 4"/><text x="${L+pw+4}" y="${y80+4}" font-size="10" fill="${C.light}">80%</text>`;
  d.forEach((r,i)=>{const bh=r.n/max*ph,x=L+i*bw+bw*.12;g+=`<rect x="${x}" y="${T+ph-bh}" width="${bw*.76}" height="${bh}" fill="${vital.includes(r.cat)?C.blue:C.grey}"/><text x="${x+bw*.38}" y="${T+ph-bh-4}" font-size="10" text-anchor="middle" fill="${C.text}">${r.n}</text>`;
    g+=`<text transform="translate(${x+bw*.38},${T+ph+12}) rotate(35)" font-size="10" fill="${C.text}">${esc(trunc(r.cat,18))}</text>`});
  g+=`<polyline fill="none" stroke="${C.orange}" stroke-width="2" points="${d.map((r,i)=>(L+i*bw+bw/2)+","+(T+ph-r.cum/100*ph)).join(" ")}"/>`;
  d.forEach((r,i)=>{g+=`<circle cx="${L+i*bw+bw/2}" cy="${T+ph-r.cum/100*ph}" r="3" fill="${C.orange}"/>`});
  g+=`<line x1="${L}" x2="${L+pw}" y1="${T+ph}" y2="${T+ph}" stroke="${C.text}"/>`;
  return{svg:g+`</svg>`,vital,total,d};
}
function wrapWords(t,n,max){const w=String(t||"").split(/\s+/),out=[];let l="";for(const x of w){if((l+" "+x).trim().length>n){if(l)out.push(l);l=x}else l=(l+" "+x).trim()}if(l)out.push(l);return out.slice(0,max).map((s,i)=>i===max-1&&out.length>max?trunc(s,n-1)+"…":s)}
const BONES=[["people","People"],["method","Method"],["machine","Machine"],["material","Material"],["measurement","Measurement"],["environment","Environment"]];
function fishboneChart(fb,effect,w=900,h=440){
  const sy=h/2;let g=svgOpen(w,h)+`<line x1="30" y1="${sy}" x2="700" y2="${sy}" stroke="${C.blue}" stroke-width="3"/><rect x="700" y="${sy-60}" width="190" height="120" fill="${C.blue}"/>`;
  wrapWords(effect||"Effect (problem)",22,5).forEach((l,i)=>g+=`<text x="712" y="${sy-38+i*18}" font-size="11" fill="#fff">${esc(l)}</text>`);
  BONES.forEach(([k,label],i)=>{
    const top=i<3,bx=[230,450,670][i%3],ex=bx-130,ey=top?40:h-40;
    g+=`<line x1="${bx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${C.blue}" stroke-width="2"/><text x="${ex}" y="${top?ey-10:ey+18}" font-size="12" font-weight="700" fill="${C.orange}" text-anchor="middle">${label}</text>`;
    lines(fb[k]).slice(0,6).forEach((it,j)=>{const t=(j+1)/7,y=top?sy-(sy-ey)*t:sy+(ey-sy)*t,x=bx-(bx-ex)*t;
      g+=`<line x1="${x-4}" y1="${y}" x2="${x-14}" y2="${y}" stroke="${C.grey}"/><text x="${x-16}" y="${y+4}" font-size="10" text-anchor="end" fill="${C.text}">${esc(trunc(it,26))}</text>`});
  });
  return g+`</svg>`;
}
function quadrant(impact,effort){const hi=impact>=3.5,lo=effort<=2.5;return hi&&lo?"Quick win":hi?"Major project":lo?"Fill-in":"Reconsider"}
function matrixChart(sol,w=420,h=340){
  const L=50,T=20,pw=w-L-20,ph=h-T-50,X=e=>L+(e-.5)/5*pw,Y=i=>T+ph-(i-.5)/5*ph;
  let g=svgOpen(w,h)+`<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="none" stroke="${C.line}"/><line x1="${L+pw/2}" y1="${T}" x2="${L+pw/2}" y2="${T+ph}" stroke="${C.line}"/><line x1="${L}" y1="${T+ph/2}" x2="${L+pw}" y2="${T+ph/2}" stroke="${C.line}"/>`;
  [["Quick wins",L+6,T+16],["Major projects",L+pw/2+6,T+16],["Fill-ins",L+6,T+ph-8],["Reconsider",L+pw/2+6,T+ph-8]].forEach(([t,x,y])=>g+=`<text x="${x}" y="${y}" font-size="10" fill="${C.grey}">${t}</text>`);
  g+=`<text x="${L+pw/2}" y="${h-12}" font-size="11" text-anchor="middle" fill="${C.text}">Effort (1 low to 5 high)</text><text transform="translate(16,${T+ph/2}) rotate(-90)" font-size="11" text-anchor="middle" fill="${C.text}">Impact</text>`;
  sol.forEach((s,i)=>{const im=num(s.impact),ef=num(s.effort);if(!s.solution||im==null||ef==null)return;const x=X(ef)+((i%3)-1)*8,y=Y(im)+((i%2)?6:-6);
    g+=`<circle cx="${x}" cy="${y}" r="10" fill="${quadrant(im,ef)==="Quick win"?C.orange:C.blue}"/><text x="${x}" y="${y+4}" font-size="10" fill="#fff" text-anchor="middle">${i+1}</text>`});
  return g+`</svg>`;
}
function groupPlot(groups,title,w=640,h=300){
  if(!groups.length)return "";
  const all=groups.flatMap(g=>g.vals);let lo=Math.min(...all),hi=Math.max(...all);if(lo===hi){lo-=1;hi+=1}const pad=(hi-lo)*.1;lo-=pad;hi+=pad;
  const L=60,R=20,T=34,B=40,pw=w-L-R,ph=h-T-B,cw=pw/groups.length,Y=v=>T+ph-(v-lo)/(hi-lo)*ph;
  let g=svgOpen(w,h)+`<text x="${L}" y="20" font-size="13" font-weight="700" fill="${C.text}">${esc(title)}</text>`;
  for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4,y=Y(v);g+=`<line x1="${L}" x2="${L+pw}" y1="${y}" y2="${y}" stroke="${C.line}"/><text x="${L-6}" y="${y+4}" font-size="10" text-anchor="end" fill="${C.grey}">${esc(fmt(v,2))}</text>`}
  groups.forEach((gr,i)=>{const cx=L+cw*i+cw/2,st=stats(gr.vals);
    gr.vals.forEach((v,j)=>{g+=`<circle cx="${cx+((j*37)%21-10)*Math.min(1,cw/80)}" cy="${Y(v)}" r="3" fill="${C.blue}" fill-opacity=".6"/>`});
    g+=`<line x1="${cx-cw*.3}" x2="${cx+cw*.3}" y1="${Y(st.mean)}" y2="${Y(st.mean)}" stroke="${C.orange}" stroke-width="3"/>`;
    g+=`<text x="${cx}" y="${T+ph+16}" font-size="10" text-anchor="middle" fill="${C.text}">${esc(trunc(gr.label,16))}</text><text x="${cx}" y="${T+ph+30}" font-size="9" text-anchor="middle" fill="${C.grey}">mean ${esc(fmt(st.mean))}, n ${st.n}</text>`});
  return g+`</svg>`;
}
function scatterChart(x,y,fit,xl,yl,w=640,h=320){
  const pad=(a,b)=>{let lo=Math.min(...a),hi=Math.max(...a);if(lo===hi){lo-=1;hi+=1}const p=(hi-lo)*.08;return[lo-p,hi+p]};
  const [x0,x1]=pad(x),[y0,y1]=pad(y),L=60,R=20,T=24,B=44,pw=w-L-R,ph=h-T-B,X=v=>L+(v-x0)/(x1-x0)*pw,Y=v=>T+ph-(v-y0)/(y1-y0)*ph;
  let g=svgOpen(w,h);
  for(let k=0;k<=4;k++){const vy=y0+(y1-y0)*k/4,vx=x0+(x1-x0)*k/4;g+=`<line x1="${L}" x2="${L+pw}" y1="${Y(vy)}" y2="${Y(vy)}" stroke="${C.line}"/><text x="${L-6}" y="${Y(vy)+4}" font-size="10" text-anchor="end" fill="${C.grey}">${esc(fmt(vy,2))}</text><text x="${X(vx)}" y="${T+ph+14}" font-size="10" text-anchor="middle" fill="${C.grey}">${esc(fmt(vx,2))}</text>`}
  x.forEach((v,i)=>g+=`<circle cx="${X(v)}" cy="${Y(y[i])}" r="3.5" fill="${C.blue}" fill-opacity=".7"/>`);
  if(fit)g+=`<line x1="${X(x0)}" y1="${Y(fit.b0+fit.b1*x0)}" x2="${X(x1)}" y2="${Y(fit.b0+fit.b1*x1)}" stroke="${C.orange}" stroke-width="2"/>`;
  g+=`<text x="${L+pw/2}" y="${h-6}" font-size="11" text-anchor="middle" fill="${C.text}">${esc(xl||"X")}</text><text transform="translate(14,${T+ph/2}) rotate(-90)" font-size="11" text-anchor="middle" fill="${C.text}">${esc(yl||"Y")}</text>`;
  return g+`</svg>`;
}
function barCompare(items,title,w=640,h=280){
  const d=items.filter(r=>num(r.before)!=null&&num(r.after)!=null);if(!d.length)return "";
  const L=20,T=34,B=46,pw=w-2*L,ph=h-T-B,gw=pw/d.length;
  let g=svgOpen(w,h)+`<text x="${L}" y="20" font-size="13" font-weight="700" fill="${C.text}">${esc(title)}</text>`;
  g+=`<rect x="${w-190}" y="10" width="10" height="10" fill="${C.grey}"/><text x="${w-176}" y="19" font-size="10" fill="${C.text}">Before</text><rect x="${w-120}" y="10" width="10" height="10" fill="${C.orange}"/><text x="${w-106}" y="19" font-size="10" fill="${C.text}">After</text>`;
  d.forEach((r,i)=>{const b=num(r.before),a=num(r.after),m=Math.max(Math.abs(b),Math.abs(a))||1,x=L+i*gw,bw=gw*.3;
    [[b,C.grey,x+gw*.18],[a,C.orange,x+gw*.52]].forEach(([v,c,xx])=>{const bh=Math.abs(v)/m*(ph-14);g+=`<rect x="${xx}" y="${T+ph-bh}" width="${bw}" height="${bh}" fill="${c}"/><text x="${xx+bw/2}" y="${T+ph-bh-3}" font-size="10" text-anchor="middle" fill="${C.text}">${esc(fmt(v))}</text>`});
    g+=`<text x="${x+gw/2}" y="${T+ph+16}" font-size="10" text-anchor="middle" fill="${C.text}">${esc(trunc(r.metric||r.label||"",22))}</text>`});
  return g+`<line x1="${L}" x2="${L+pw}" y1="${T+ph}" y2="${T+ph}" stroke="${C.text}"/></svg>`;
}
