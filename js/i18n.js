/* ================= Interface language =================
   English is the source language: every text in the code is English and is looked up in the
   dictionary of the selected language (files in i18n/). Missing entries fall back to English.
   The choice is stored unencrypted in the browser because it is needed before the vault is
   unlocked; it is validated against the fixed list of languages before use. */
const I18N_DEV=false; // true only in test builds: enables the pseudo-language "xx"
const LANGS=[["en","English (UK)"],["de","Deutsch (Beta)"],["fr","Français (Beta)"],["it","Italiano"],["nl","Nederlands"]];
const I18N={lang:"en",dict:{}};
(function(){let l="en";try{l=localStorage.getItem("leanNavigator.lang")||"en"}catch{}
  if((I18N_DEV&&l==="xx")||LANGS.some(x=>x[0]===l))I18N.lang=l;document.documentElement.lang=I18N.lang==="en"?"en-GB":I18N.lang==="xx"?"en":I18N.lang})();
const PSEUDO=s=>s.replace(/(\{\w+\})|[aeiouAEIOU]/g,(m,ph)=>ph||({a:"à",e:"è",i:"ï",o:"ö",u:"ü",A:"À",E:"È",I:"Ï",O:"Ö",U:"Ü"})[m]);
const _sub=(s,p)=>p?s.replace(/\{(\w+)\}/g,(m,n)=>Object.prototype.hasOwnProperty.call(p,n)&&p[n]!=null?String(p[n]):m):s;
function _t(k,p){
  const d=I18N.dict[I18N.lang],has=d&&Object.prototype.hasOwnProperty.call(d,k)&&typeof d[k]==="string"&&d[k];
  let s=I18N.lang==="en"?k:I18N.lang==="xx"?PSEUDO(k):has||(I18N_DEV&&I18N.mark?"⟦"+k+"⟧":k);
  if(typeof s!=="string")s=String(k);
  return _sub(s,p);
}
/* stored values (statuses, categories, units...) stay English in the data and are translated only for display */
const _tv=v=>typeof v==="string"&&v?_t(v):v;
/* Switching language without reloading the page: the files that define labels when they load
   are run again with the new language. The vault stays unlocked and no data is touched. */
const I18N_RELOAD=["charts.js","dmaic.js","hyp.js","a3.js","kaizen.js","vsm.js","dmadv.js","pdca.js","fives.js","info.js","plan.js","people.js","export.js","portfolio.js","hoshin.js","ai.js"];
async function setLanguage(l){
  if(!((I18N_DEV&&l==="xx")||LANGS.some(x=>x[0]===l))||l===I18N.lang)return;
  try{localStorage.setItem("leanNavigator.lang",l)}catch{}
  I18N.lang=l;document.documentElement.lang=l==="en"?"en-GB":l;
  for(const f of I18N_RELOAD){await new Promise((res,rej)=>{const s=document.createElement("script");s.src="js/"+f;s.onload=()=>{s.remove();res()};s.onerror=()=>rej(new Error("Could not load "+f));document.body.appendChild(s)})}
  if(I18N.onChange)I18N.onChange();
}
/* Context-specific text: the same English word can need a different translation in one place
   (for example the 5S stage "Standardise", which keeps the English name with the translation in brackets). */
function _tc(ctx,k,p){const d=I18N.dict[I18N.lang],full=ctx+"|"+k;
  if(I18N.lang!=="en"&&I18N.lang!=="xx"&&d&&Object.prototype.hasOwnProperty.call(d,full)&&typeof d[full]==="string")return _sub(d[full],p);
  return _t(k,p)}
/* lower-case a status word for running text, except in German where nouns keep their capital */
const lcStatus=s=>I18N.lang==="de"?s:String(s).toLowerCase();
/* Instruction added to every AI request: answer in the language of the user's text. */
function aiLangRule(){const n={en:"British English",de:"German (formal Sie)",fr:"French (formal vous)",it:"Italian (informal tu)",nl:"Dutch (informal je)"}[I18N.lang]||"British English";
  return "Language: write every text value in your JSON answer in the language the user's project text is written in. If that is unclear or mixed, use "+n+". Keep JSON keys, method names (DMAIC, DMADV, A3 problem solving, Kaizen event, Value stream mapping, PDCA, 5S, Just do it) and any fixed values exactly as specified in English."}
/* dates and numbers follow the interface language */
const uiLocale=()=>({en:"en-GB",de:"de-DE",fr:"fr-FR",it:"it-IT",nl:"nl-NL"})[I18N.lang]||"en-GB";
