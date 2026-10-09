/* ================= AI providers =================
   Three adapters cover most providers:
   - Anthropic (Claude) Messages API
   - Google Gemini generateContent API
   - OpenAI-compatible Chat Completions (OpenAI, Moonshot/Kimi, Mistral, DeepSeek, OpenRouter, Ollama, LM Studio...)
   Requests go straight from your browser to the provider you choose. */
var PRESETS=[
  {id:"anthropic",label:_t("Anthropic (Claude)"),kind:"anthropic",base:"https://api.anthropic.com/v1",keyUrl:"https://console.anthropic.com/settings/keys"},
  {id:"openai",label:_t("OpenAI"),kind:"openai",base:"https://api.openai.com/v1",keyUrl:"https://platform.openai.com/api-keys"},
  {id:"gemini",label:_t("Google (Gemini)"),kind:"gemini",base:"https://generativelanguage.googleapis.com/v1beta",keyUrl:"https://aistudio.google.com/apikey"},
  {id:"moonshot",label:_t("Moonshot (Kimi)"),kind:"openai",base:"https://api.moonshot.ai/v1",keyUrl:"https://platform.moonshot.ai/"},
  {id:"mistral",label:_t("Mistral"),kind:"openai",base:"https://api.mistral.ai/v1",keyUrl:"https://console.mistral.ai/"},
  {id:"deepseek",label:_t("DeepSeek"),kind:"openai",base:"https://api.deepseek.com/v1",keyUrl:"https://platform.deepseek.com/"},
  {id:"openrouter",label:_t("OpenRouter (many models)"),kind:"openai",base:"https://openrouter.ai/api/v1",keyUrl:"https://openrouter.ai/keys"},
  {id:"ollama",label:_t("Ollama (local, no data leaves your computer)"),kind:"openai",base:"http://localhost:11434/v1",keyUrl:"",noKey:true},
  {id:"custom",label:_t("Other OpenAI-compatible service"),kind:"openai",base:"",keyUrl:""}
];
/* ----- where the API key may go -----
   The key is only ever sent over https, except to a model running on this computer (localhost).
   Addresses that are not one of the providers listed above need an explicit confirmation that
   shows the exact destination, before the key is sent for the first time. */
var LOCAL_HOSTS=["localhost","127.0.0.1","[::1]"];
var KNOWN_ORIGINS=PRESETS.filter(p=>/^https:/.test(p.base)).map(p=>new URL(p.base).origin);
function endpointURL(base){try{return new URL(String(base||"").trim())}catch{return null}}
function endpointProblem(base){
  const u=endpointURL(base);
  if(!u)return _t("The base URL is not a valid web address. It must start with https://");
  if(u.username||u.password)return _t("The base URL must not contain a user name or password.");
  if(u.protocol==="https:")return "";
  if(u.protocol==="http:"&&LOCAL_HOSTS.includes(u.hostname))return "";
  return _t("The base URL must start with https:// (plain http:// is allowed only for a model on this computer, such as http://localhost).");
}
function endpointStatus(cfg){
  const u=endpointURL(cfg.base);if(!u||endpointProblem(cfg.base))return "blocked";
  if(LOCAL_HOSTS.includes(u.hostname)||KNOWN_ORIGINS.includes(u.origin)||cfg.confirmedOrigin===u.origin)return "ok";
  return "confirm";
}
function assertEndpoint(cfg){
  const st=endpointStatus(cfg);
  if(st==="blocked")throw new Error(endpointProblem(cfg.base)||_t("The base URL is not allowed."));
  if(st==="confirm")throw new Error(_t("This address has not been confirmed. Open Settings and use Test and save to confirm it."));
}
function extractJSON(text){
  const t=String(text||"").replace(/```json|```/g,"").trim();
  try{return JSON.parse(t)}catch{}
  const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1))}catch{}}
  throw new Error("The model did not return valid JSON. Try again, or choose a more capable model.");
}
function providerMsg(body){let m="";try{const j=JSON.parse(body);const e=Array.isArray(j)?j[0]&&j[0].error:j.error;m=(e&&(e.message||(typeof e==="string"?e:"")))||j.message||""}catch{m=String(body||"").slice(0,200)}return String(m).trim()}
function aiError(status,body){
  const m=providerMsg(body),tail=m?` ${_t("The provider says: \"{m}\"",{m:trunc(m,220)})}`:"";
  const e=new Error(
    status===400?(_t("The provider did not accept the request. Often the model name is wrong.{tail}",{tail:tail})):
    status===401||status===403?(_t("The provider rejected the API key, or the key has no access to this model.{tail}",{tail:tail})):
    status===404?(_t("The model or address was not found. Check the model name (use Load models) and the base URL.{tail}",{tail:tail})):
    status===429?(_t("Rate limit or quota reached at the provider. Wait a moment, or check your plan and spending limit.{tail}",{tail:tail})):
    status>=500?(_t("The provider is busy or has a temporary problem. Try again in a few minutes, or choose a lighter model.{tail}",{tail:tail})):
    `${_t("Provider error {status}.",{status:status})}`+tail);
  e.status=status;e.busy=status===429||status>=500;return e;
}
var sleep=ms=>new Promise(r=>setTimeout(r,ms));
function checkConfig(cfg){
  const w=[],base=String(cfg.base||"").trim(),model=String(cfg.model||"").trim();
  if(!base)w.push("Enter the base URL. Choosing a provider fills in the standard one.");
  else{
    const e=endpointProblem(base);if(e)w.push(e);
    if(/[?&]key=|:generatecontent|\/chat\/completions|\/messages\b/i.test(base))w.push("The base URL contains a full request address. Use only the root, for example "+(PRESETS.find(p=>p.id===cfg.preset)?.base||"https://api.example.com/v1")+". If it contained your key, create a new key at the provider: this one may have been exposed.");
  }
  if(!model)w.push("Enter the model name, or use Load models.");
  else if(/\s/.test(model))w.push(`"${model}" contains spaces. Model names are IDs such as "gemini-3.5-flash" or "gpt-4.1", not product names.`);
  return w;
}
var normModel=(cfg)=>{let m=String(cfg.model||"").trim();if(cfg.kind==="gemini")m=m.replace(/^models\//,"");return m};
async function aiFetch(url,opts,tries=3){
  let last;
  for(let i=0;i<tries;i++){
    let r;
    try{r=await fetch(url,opts)}catch{throw new Error("Could not reach the provider. Check your connection. Some providers block requests made directly from a browser (CORS); see the guide below.")}
    const body=await r.text();
    if(r.ok)return body;
    last=aiError(r.status,body);
    if(!last.busy||i===tries-1)throw last;
    await sleep(i===0?2000:5000);
  }
  throw last;
}
async function aiCall(cfg,input,tries=3){
  assertEndpoint(cfg);
  const turns=typeof input==="string"?[{role:"user",content:input}]:input;
  const base=String(cfg.base||"").trim().replace(/\/+$/,""),model=normModel(cfg);
  let url,opts;
  if(cfg.kind==="anthropic"){
    url=base+"/messages";
    opts={method:"POST",headers:{"content-type":"application/json","x-api-key":cfg.key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model,max_tokens:2000,messages:turns})};
  }else if(cfg.kind==="gemini"){
    url=`${base}/models/${encodeURIComponent(model)}:generateContent`;
    opts={method:"POST",headers:{"content-type":"application/json","x-goog-api-key":cfg.key},body:JSON.stringify({contents:turns.map(t=>({role:t.role==="assistant"?"model":"user",parts:[{text:t.content}]})),generationConfig:{responseMimeType:"application/json",temperature:.3}})};
  }else{
    url=base+"/chat/completions";
    const h={"content-type":"application/json"};if(cfg.key)h.authorization="Bearer "+cfg.key;
    opts={method:"POST",headers:h,body:JSON.stringify({model,temperature:.3,messages:[{role:"system",content:"Respond with valid JSON only, no markdown."},...turns]})};
  }
  const j=JSON.parse(await aiFetch(url,opts,tries));
  let text;
  if(cfg.kind==="anthropic")text=(j.content||[]).filter(c=>c.type==="text").map(c=>c.text).join("");
  else if(cfg.kind==="gemini")text=((j.candidates||[])[0]?.content?.parts||[]).map(p=>p.text||"").join("");
  else text=j.choices?.[0]?.message?.content||"";
  return extractJSON(text);
}
async function listModels(cfg){
  assertEndpoint(cfg);
  const base=String(cfg.base||"").trim().replace(/\/+$/,"");let url,headers={};
  if(cfg.kind==="anthropic"){url=base+"/models?limit=100";headers={"x-api-key":cfg.key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"}}
  else if(cfg.kind==="gemini"){url=base+"/models?pageSize=200";headers={"x-goog-api-key":cfg.key}}
  else{url=base+"/models";if(cfg.key)headers.authorization="Bearer "+cfg.key}
  const j=JSON.parse(await aiFetch(url,{headers},1));
  if(cfg.kind==="gemini")return(j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent")).map(m=>({id:m.name.replace(/^models\//,""),label:m.displayName||""}));
  return(j.data||[]).map(m=>({id:m.id,label:m.display_name||""}));
}
var makeAI=cfg=>cfg&&cfg.model&&(cfg.key||cfg.noKey)?{json:input=>aiCall(cfg,input)}:null;
