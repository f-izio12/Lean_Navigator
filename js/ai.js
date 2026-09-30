/* ================= AI providers =================
   Three adapters cover most providers:
   - Anthropic (Claude) Messages API
   - Google Gemini generateContent API
   - OpenAI-compatible Chat Completions (OpenAI, Moonshot/Kimi, Mistral, DeepSeek, OpenRouter, Ollama, LM Studio...)
   Requests go straight from your browser to the provider you choose. */
const PRESETS=[
  {id:"anthropic",label:"Anthropic (Claude)",kind:"anthropic",base:"https://api.anthropic.com/v1",keyUrl:"https://console.anthropic.com/"},
  {id:"openai",label:"OpenAI",kind:"openai",base:"https://api.openai.com/v1",keyUrl:"https://platform.openai.com/api-keys"},
  {id:"gemini",label:"Google (Gemini)",kind:"gemini",base:"https://generativelanguage.googleapis.com/v1beta",keyUrl:"https://aistudio.google.com/apikey"},
  {id:"moonshot",label:"Moonshot (Kimi)",kind:"openai",base:"https://api.moonshot.ai/v1",keyUrl:"https://platform.moonshot.ai/"},
  {id:"mistral",label:"Mistral",kind:"openai",base:"https://api.mistral.ai/v1",keyUrl:"https://console.mistral.ai/"},
  {id:"deepseek",label:"DeepSeek",kind:"openai",base:"https://api.deepseek.com/v1",keyUrl:"https://platform.deepseek.com/"},
  {id:"openrouter",label:"OpenRouter (many models)",kind:"openai",base:"https://openrouter.ai/api/v1",keyUrl:"https://openrouter.ai/keys"},
  {id:"ollama",label:"Ollama (local, no data leaves your computer)",kind:"openai",base:"http://localhost:11434/v1",keyUrl:"",noKey:true},
  {id:"custom",label:"Other OpenAI-compatible service",kind:"openai",base:"",keyUrl:""}
];
function extractJSON(text){
  const t=String(text||"").replace(/```json|```/g,"").trim();
  try{return JSON.parse(t)}catch{}
  const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1))}catch{}}
  throw new Error("The model did not return valid JSON. Try again, or choose a more capable model.");
}
function aiError(status,body){
  if(status===401||status===403)return new Error("The provider rejected the API key.");
  if(status===404)return new Error("Model or address not found. Check the model name and base URL.");
  if(status===429)return new Error("Rate limit or quota reached at the provider.");
  let m="";try{const j=JSON.parse(body);m=(j.error&&(j.error.message||j.error))||j.message||""}catch{m=String(body).slice(0,160)}
  return new Error(`Provider error ${status}${m?": "+m:""}`);
}
async function aiCall(cfg,input){
  const turns=typeof input==="string"?[{role:"user",content:input}]:input;
  const base=String(cfg.base||"").replace(/\/+$/,"");
  let url,opts;
  if(cfg.kind==="anthropic"){
    url=base+"/messages";
    opts={method:"POST",headers:{"content-type":"application/json","x-api-key":cfg.key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:cfg.model,max_tokens:2000,messages:turns})};
  }else if(cfg.kind==="gemini"){
    url=`${base}/models/${encodeURIComponent(cfg.model)}:generateContent`;
    opts={method:"POST",headers:{"content-type":"application/json","x-goog-api-key":cfg.key},body:JSON.stringify({contents:turns.map(t=>({role:t.role==="assistant"?"model":"user",parts:[{text:t.content}]})),generationConfig:{responseMimeType:"application/json",temperature:.3}})};
  }else{
    url=base+"/chat/completions";
    const h={"content-type":"application/json"};if(cfg.key)h.authorization="Bearer "+cfg.key;
    opts={method:"POST",headers:h,body:JSON.stringify({model:cfg.model,temperature:.3,messages:[{role:"system",content:"Respond with valid JSON only, no markdown."},...turns]})};
  }
  let r;
  try{r=await fetch(url,opts)}catch{throw new Error("Could not reach the provider. Check your connection. Some providers block requests made directly from a browser (CORS); the README explains the options.")}
  const body=await r.text();if(!r.ok)throw aiError(r.status,body);
  const j=JSON.parse(body);
  let text;
  if(cfg.kind==="anthropic")text=(j.content||[]).filter(c=>c.type==="text").map(c=>c.text).join("");
  else if(cfg.kind==="gemini")text=((j.candidates||[])[0]?.content?.parts||[]).map(p=>p.text||"").join("");
  else text=j.choices?.[0]?.message?.content||"";
  return extractJSON(text);
}
const makeAI=cfg=>cfg&&cfg.model&&(cfg.key||cfg.noKey)?{json:input=>aiCall(cfg,input)}:null;
