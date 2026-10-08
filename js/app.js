/* Anti-framing: the app refuses to run inside another page, so a hostile site cannot overlay it
   and trick you into clicking (clickjacking). GitHub Pages cannot send a frame-ancestors header,
   so this check is done here, before anything is unlocked or any handler is attached. */
if((()=>{try{return window.top!==window.self}catch{return true}})()){
  const h=document.createElement("main");h.style.cssText="font-family:Jost,system-ui,sans-serif;padding:24px;max-width:520px";
  const t1=document.createElement("h2");t1.textContent=_t("Lean Navigator cannot run inside another page");
  const t2=document.createElement("p");t2.textContent=_t("For your security it only works in its own browser tab.");
  const a=document.createElement("a");a.href=location.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent=_t("Open Lean Navigator in a new tab");
  const t3=document.createElement("p");t3.appendChild(a);h.append(t1,t2,t3);document.body.replaceChildren(h);
  throw new Error(_t("Lean Navigator refused to run inside a frame."));
}
/* ================= App shell: vault screens, settings, storage, start-up ================= */
const APP_VERSION="1.3.0";
let saveChain=Promise.resolve();
function persistAll(){saveChain=saveChain.then(async()=>{Vault.state.projects=S.projects;await Vault.seal();if(Vault.fileHandle&&Vault.fileOk)Vault.dirty=false;updateBanner();updateSaveBar()});return saveChain}
const _scheduleSave=scheduleSave;scheduleSave=function(p){Vault.dirty=true;_scheduleSave(p);updateSaveBar()};
store={save:()=>persistAll(),remove:async id=>{S.projects=S.projects.filter(x=>x.id!==id);await persistAll()}};
downloads={save:async({filename,data})=>{const u=URL.createObjectURL(data);const a=document.createElement("a");a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}};
const nav=show=>{["#navHome","#navPipeline","#navStrategy","#navSettings","#navLock"].forEach(s=>$(s).hidden=!show)};
const pwOK=p=>p.length>=10;

/* ----- screens ----- */
function screen(html){nav(false);$("#banner").hidden=true;$("#app").innerHTML=`<div class="gate panel"><div class="panel-body">${html}</div></div>`;$("#app").querySelector("input")?.focus()}
function showWelcome(){S.screenFn=showWelcome;
  screen(`<h2>${_t("Welcome to Lean Navigator")}</h2>
   <p class="muted">${_t("Your projects are stored in this browser, encrypted with a passphrase only you know. Nothing is sent anywhere unless you connect an AI provider.")}</p>
   <div class="grid2 paths">
   <div class="path"><h3>${_t("I have a saved file")}</h3><p class="small">${_t("Use this if you worked with Lean Navigator before and the browser no longer shows your projects, or you are on another computer.")}</p>
     <div class="row"><label class="btn hot" for="restoreIn">${_t("Open my saved file")}</label><input id="restoreIn" type="file" accept=".json,application/json" hidden>${Vault.fileSupported()?`<button class="btn alt" id="openLinked">${_t("Open and keep it in sync")}</button>`:""}</div></div>
   <div class="path"><h3>${_t("I am new")}</h3>
     <div class="field"><label for="p1">${_t("Choose a passphrase")}</label><div class="hint">${_t("At least 10 characters. A short sentence is easier to remember and harder to guess.")}</div><input id="p1" type="password" autocomplete="new-password"></div>
     <div class="field"><label for="p2">${_t("Repeat the passphrase")}</label><input id="p2" type="password" autocomplete="new-password"></div>
     <div class="flags" id="err"></div><button class="btn" id="create">${_t("Create my vault")}</button></div>
   </div>`);
  $("#create").onclick=async()=>{const a=$("#p1").value,b=$("#p2").value;
    if(!pwOK(a))return $("#err").innerHTML=flagsHTML([_t("The passphrase needs at least 10 characters.")]);
    if(a!==b)return $("#err").innerHTML=flagsHTML([_t("The two passphrases are different.")]);
    $("#create").disabled=true;$("#create").textContent=_t("Creating…");const code=await Vault.create(a);showCode(code,true)};
  bindRestore();
}
function bindRestore(){
  const o=$("#openLinked");if(o)o.onclick=async()=>{try{await Vault.openFile();showUnlock(_t("Vault file linked. Enter the passphrase of that vault."))}catch(e){if(e.name!=="AbortError")toast(e.message)}};
  const r=$("#restoreIn");if(r)r.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const rec=JSON.parse(await f.text());if(Vault.rec&&!confirm(_t("Replace the vault in this browser (and in the synced file, if you use one) with the one in this file? Anything not in the file is lost.")))return;await Vault.replace(rec);showUnlock(_t("Backup restored. Enter the passphrase of that vault."))}catch(err){toast(err.message||_t("Could not read the file."))}};
}
function showCode(code,first){S.screenFn=()=>showCode(code,first);
  screen(`<h2>${_t("Your recovery code")}</h2>
   <p>${_t("If you forget your passphrase, this code is the only way back into your data. There is no server and no password reset by email.")}</p>
   <div class="code" id="code">${esc(code)}</div>
   <div class="row"><button class="btn alt" id="copy">${_t("Copy")}</button></div>
   <p class="small muted">${_t("Store it in a password manager or print it. It is shown only now.")}</p>
   <label class="chk"><input type="checkbox" id="ok"> ${_t("I have stored the recovery code somewhere safe")}</label>
   <button class="btn hot" id="go" disabled>${_t("Continue")}</button>`);
  $("#copy").onclick=async()=>{try{await navigator.clipboard.writeText(code);toast(_t("Copied."))}catch{toast(_t("Select the code and copy it manually."))}};
  $("#ok").onchange=e=>$("#go").disabled=!e.target.checked;
  $("#go").onclick=()=>first?showOnboarding():openSettings();
}
function showOnboarding(){S.screenFn=showOnboarding;
  screen(`<h2>${_t("Two optional steps")}</h2>
   <h3 class="gh">${_t("1. Keep a copy of your vault in a file")}</h3>
   ${Vault.fileSupported()?`<p class="small">${_t("Choose a file on your computer or in a synced folder (OneDrive, Google Drive, Dropbox). The app updates it after every change and reads the newest copy when it starts. You can also do this later in Settings.")}</p><button class="btn alt" id="link">${_t("Choose a file")}</button> <span class="small muted" id="linkState"></span>`
     :`<p class="small">${_t("This browser cannot keep a file in sync. Use <b>Download backup</b> in Settings regularly; the app reminds you after 7 days. Chrome or Edge on a computer can sync to a file automatically.")}</p>`}
   <h3 class="gh">${_t("2. Connect an AI provider")}</h3>
   <p class="small">${_t("Needed only for the advisor chat and the black belt review. Everything else works without it. You can do this in Settings at any time.")}</p>
   <button class="btn hot" id="done">${_t("Open Lean Navigator")}</button>`);
  const l=$("#link");if(l)l.onclick=async()=>{try{await Vault.linkFile();$("#linkState").textContent=(_t("Linked: {fileHandleName}",{fileHandleName:Vault.fileHandle.name}))}catch(e){if(e.name!=="AbortError")toast(e.message)}};
  $("#done").onclick=enterApp;
}
function showUnlock(msg){S.screenFn=()=>showUnlock(msg);
  screen(`<h2>${_t("Unlock Lean Navigator")}</h2>${msg?`<div class="flag info">${esc(msg)}</div>`:""}
   ${Vault.fileHandle?`<p class="small muted">${_t("Synced file: {fileHandleName}. The browser may ask permission to use it.",{fileHandleName:esc(Vault.fileHandle.name)})}</p>`:""}
   <div class="field"><label for="pw">${_t("Passphrase")}</label><input id="pw" type="password" autocomplete="current-password"></div>
   <div class="flags" id="err"></div><button class="btn hot" id="unlock">${_t("Unlock")}</button>
   <details class="more"><summary>${_t("Forgot your passphrase?")}</summary>
     <div class="field"><label for="rc">${_t("Recovery code")}</label><input id="rc" autocomplete="off" placeholder="${_t("XXXXX-XXXXX-XXXXX-XXXXX-XXXXX")}"></div>
     <div class="field"><label for="n1">${_t("New passphrase")}</label><input id="n1" type="password" autocomplete="new-password"></div>
     <div class="field"><label for="n2">${_t("Repeat new passphrase")}</label><input id="n2" type="password" autocomplete="new-password"></div>
     <div class="flags" id="err2"></div><button class="btn" id="recover">${_t("Recover and set new passphrase")}</button></details>
   <details class="more"><summary>${_t("Other options")}</summary>
     <div class="row">${Vault.fileSupported()?`<button class="btn alt" id="openLinked">${_t("Use a different vault file")}</button>`:""}<label class="btn alt" for="restoreIn">${_t("Restore from a backup file")}</label><input id="restoreIn" type="file" accept=".json,application/json" hidden>
     <button class="btn alt" id="wipe">${_t("Delete this vault and start over")}</button></div></details>`);
  $("#pw").onkeydown=e=>{if(e.key==="Enter")$("#unlock").click()};
  $("#unlock").onclick=()=>doUnlock($("#pw").value,false,$("#err"),$("#unlock"));
  $("#recover").onclick=async()=>{const a=$("#n1").value,b=$("#n2").value;
    if(!pwOK(a))return $("#err2").innerHTML=flagsHTML([_t("The new passphrase needs at least 10 characters.")]);
    if(a!==b)return $("#err2").innerHTML=flagsHTML([_t("The two passphrases are different.")]);
    if(await doUnlock($("#rc").value,true,$("#err2"),$("#recover"))){await Vault.setPass(a);toast(_t("New passphrase set. Your recovery code still works."))}};
  $("#wipe").onclick=async()=>{if(prompt(_t("This permanently deletes all projects in this browser. Type DELETE to confirm."))!=="DELETE")return;await Vault.destroy();showWelcome()};
  bindRestore();
}
async function doUnlock(secret,byCode,errEl,btn){
  if(!secret)return false;
  const hasFile=!!Vault.fileHandle,granted=hasFile?await Vault.filePermission(true):false; // ask while the click still counts as a user action
  btn.disabled=true;const label=btn.textContent;btn.textContent=_t("Unlocking…");
  try{
    /* Open the browser copy and the synced file, then keep the one with the higher encrypted revision. */
    let rec=Vault.rec,opened=null,fromFile=false,fileOK=granted,fileErr=null;
    if(rec){try{opened=await Vault.decrypt(rec,secret,byCode)}catch(e){if(!granted)throw e;fileErr=e}}
    const restoring=Vault.preferLocal&&!!opened;if(restoring)Vault.preferLocal=false;Vault.fileBlocked=false;
    if(granted&&!restoring){const f=await Vault.readFile();
      if(f&&JSON.stringify(f.data)!==JSON.stringify(rec&&rec.data)){
        let fo=null;try{fo=await Vault.decrypt(f,secret,byCode)}catch{}
        if(!fo){if(!opened)throw fileErr||new Error(byCode?_t("This recovery code does not open the vault."):_t("Wrong passphrase."));fileOK=false;Vault.fileBlocked=true;Vault.fileStatus=_t("File not connected: it does not open with this passphrase, so it was left unchanged")}
        else if(!opened)  {rec=f;opened=fo;fromFile=true}
        else{const rf=Vault.rev(fo.state),rl=Vault.rev(opened.state);
          if(rf>rl||(rf===rl&&rf===0&&String(f.savedAt)>String(rec.savedAt))){rec=f;opened=fo;fromFile=true}}
      }else if(!f&&!opened)throw fileErr||new Error(_t("Could not unlock."));
    }
    if(!opened)throw new Error(_t("Could not unlock."));
    await Vault.open(rec,secret,byCode,opened);
    if(fromFile)await IDB.set("vault",rec);else if(fileOK)await Vault.writeFile();
    if(hasFile&&!granted)Vault.fileStatus=_t("File not connected: permission not granted");
    enterApp();return true;
  }catch(e){errEl.innerHTML=flagsHTML([e.message||_t("Could not unlock.")]);btn.disabled=false;btn.textContent=label;return false}
}
async function enterApp(){
  sanitizeState(Vault.state);
  S.projects=(Vault.state.projects||[]).map(ensureModel);S.view="home";S.current=null;S.coach={};
  sample=makeAI(Vault.state.settings.ai);nav(true);render();
  try{if(navigator.storage&&navigator.storage.persist&&!(await navigator.storage.persisted()))await navigator.storage.persist()}catch{}
}
async function lockNow(){await persistAll().catch(()=>{});Vault.lock();S.projects=[];S.current=null;sample=null;showUnlock()}

/* ----- banner: backup reminder and file status ----- */
function updateBanner(){
  const b=$("#banner");if(!Vault.state){b.hidden=true;return}
  const st=Vault.state.settings,last=st.lastBackup?new Date(st.lastBackup):null,days=last?(Date.now()-last)/864e5:Infinity;
  let msg="";
  if(Vault.fileHandle&&(Vault.fileStatus&&!Vault.fileOk))msg=`${Vault.fileStatus}. <button class="btn link" id="bnFix">${_t("Reconnect the file")}</button>`;
  b.innerHTML=msg;b.hidden=!msg;
  const f=$("#bnFix");if(f)f.onclick=async()=>{if(await Vault.filePermission(true)){await Vault.writeFile();updateBanner();toast(Vault.fileStatus)}};
  const d=$("#bnBackup");if(d)d.onclick=downloadBackup;
}
const _render=render;render=function(){S.screenFn=null;_render();updateBanner();updateSaveBar()};
async function downloadBackup(){
  await persistAll();
  await downloads.save({filename:`lean-navigator-backup-${new Date().toISOString().slice(0,10)}.json`,data:new Blob([Vault.json()],{type:"application/json"})});
  Vault.state.settings.lastBackup=new Date().toISOString();await persistAll();Vault.dirty=false;updateSaveBar();toast(_t("Backup downloaded to your Downloads folder. It is encrypted with your passphrase."));
}

/* ----- save to file, save bar and close guard ----- */
async function saveToFile(){
  if(!Vault.state)return;
  if(Vault.fileSupported()){
    try{
      if(Vault.fileHandle&&await Vault.filePermission(true)){await persistAll();if(Vault.fileOk){Vault.dirty=false;updateSaveBar();toast((_t("Saved to {fileHandleName}.",{fileHandleName:Vault.fileHandle.name})));return}}
      await Vault.linkFile();await persistAll();Vault.dirty=false;Vault.state.settings.lastBackup=new Date().toISOString();await persistAll();updateSaveBar();
      toast(_t("Saved. From now on this file is updated automatically after every change."));
    }catch(e){if(e.name!=="AbortError")toast((_t("Could not save the file: {message}",{message:e.message})))}
  }else await downloadBackup();
}
function updateSaveBar(){
  const el=$("#saveBar");if(!el||!Vault.state)return;
  const synced=Vault.fileHandle&&Vault.fileOk,last=Vault.state.settings.lastBackup;
  const state=synced&&!Vault.dirty?`<span class="dot ok"></span>${_t("Saved to <b>{file}</b> at {time}",{file:esc(Vault.fileHandle.name),time:esc(Vault.fileTime||"")})}`
    :Vault.dirty?`<span class="dot warn"></span>${_t("Changes saved in this browser only")}${last?`${_t(". Last file copy: {last}",{last:fmtDate(last)})}`:""}`
    :last?`<span class="dot ok"></span>${_t("File copy saved {last}",{last:fmtDate(last)})}`:`<span class="dot warn"></span>${_t("No file copy yet")}`;
  el.innerHTML=`<div class="sb-state small">${state}</div><div class="row"><button class="btn ${Vault.dirty||!last&&!synced?"hot":"alt"} small" id="sbSave">${_t("Save to file")}</button><label class="btn alt small" for="sbOpen">${_t("Open a saved file")}</label><input id="sbOpen" type="file" accept=".json,application/json" hidden></div>`;
  $("#sbSave").onclick=saveToFile;
  $("#sbOpen").onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!confirm(_t("Open this file instead of the projects in this browser (and in the synced file, if you use one)? Projects that are not in the file are lost.")))return;
    try{const rec=JSON.parse(await f.text());await Vault.replace(rec);S.projects=[];sample=null;showUnlock(_t("File loaded. Enter the passphrase of that file."))}catch(err){toast(err.message||_t("Could not read the file."))}};
}
let closeOK=false;
function showSaveModal(){
  if(!Vault.state||!Vault.dirty||$("#ov"))return;
  $("#modalRoot").innerHTML=`<div class="overlay" id="ov"><div class="modal panel" role="dialog" aria-modal="true" aria-labelledby="smh">
    <div class="panel-head"><h2 id="smh">${_t("Save your work before closing")}</h2></div>
    <div class="panel-body"><p style="margin-top:0">${_t("Your latest changes are stored in this browser only. Browsers can delete this data, for example when history is cleared. Save a copy to a file to be safe.")}</p>
    <p class="small muted">${_t("{x} Next time, if the browser kept your data you will see your projects as usual; if not, use <b>Open a saved file</b>.",{x:Vault.fileSupported()?_t("You choose where the file goes: your laptop, OneDrive, Google Drive, Dropbox. After that it updates itself."):_t("The file goes to your Downloads folder.")})}</p>
    <div class="row"><button class="btn hot" id="smSave">${_t("Save to file")}</button><button class="btn alt" id="smLeave">${_t("Close without saving")}</button><button class="btn alt" id="smCancel">${_t("Keep working")}</button></div></div></div></div>`;
  const close=()=>{$("#modalRoot").innerHTML=""};
  $("#smSave").onclick=async()=>{await saveToFile();if(!Vault.dirty){close();toast(_t("Saved. You can close the browser now."))}};
  $("#smLeave").onclick=()=>{closeOK=true;close();toast(_t("OK. You can close the browser now."))};
  $("#smCancel").onclick=close;$("#smSave").focus();
}
window.addEventListener("beforeunload",e=>{
  if(!Vault.state||!Vault.dirty||closeOK)return;
  persistAll();
  e.preventDefault();e.returnValue="";
  setTimeout(()=>setTimeout(showSaveModal,0),200); // runs only if the person chooses to stay
});

/* ----- settings ----- */
async function openSettings(){S.screenFn=openSettings;
  if(!Vault.state)return;
  const ai=Vault.state.settings.ai||{},pre=PRESETS.find(p=>p.id===ai.preset)||PRESETS[0];
  let persisted=null;try{persisted=navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():null}catch{}
  nav(true);
  $("#app").innerHTML=`<div class="settings">
   <div class="proj-head"><h2>${_t("Settings")}</h2><button class="btn alt" id="back">${_t("Back to the library")}</button></div>
   <section class="panel"><div class="panel-head"><h3>${_t("AI provider")}</h3><span class="small muted">${sample?_t("Connected: ")+esc(PRESETS.find(p=>p.id===ai.preset)?.label||ai.kind)+", "+esc(ai.model):_t("Not connected")}</span></div><div class="panel-body">
     <p class="small muted" style="margin-top:0">${_t("Requests go directly from this browser to the provider, with the key you enter here. The key is stored encrypted in your vault. Charges are billed by the provider on your own account.")}</p>
     <div class="grid2"><div class="field"><label for="aiP">${_t("Provider")}</label><select id="aiP">${PRESETS.map(p=>`<option value="${esc(p.id)}" ${p.id===pre.id?"selected":""}>${esc(p.label)}</option>`).join("")}</select></div>
     <div class="field"><label for="aiM">${_t("Model name")}</label><div class="hint">${_t("An ID such as gemini-3.5-flash-lite, not a product name. Use Load models to pick from the list your key can use.")}</div><div class="row nowrap"><input id="aiM" list="aiML" value="${esc(ai.model||"")}" autocomplete="off"><button class="btn alt" id="aiLoad" type="button">${_t("Load models")}</button></div><datalist id="aiML"></datalist></div></div>
     <div class="field"><label for="aiB">${_t("Base URL")}</label><div class="hint">${_t("Filled in when you choose a provider. Change it only for \"Other\" or a local server.")}</div><input id="aiB" value="${esc(ai.base||pre.base)}"></div>
     <div class="field"><label for="aiK">${_t("API key")}</label><div class="hint" id="aiKh"></div><input id="aiK" type="password" autocomplete="off" placeholder="${ai.key?_t("Saved. Type a new key to replace it."):""}"></div>
     <div class="flags" id="aiMsg"></div>
     <div class="row"><button class="btn" id="aiTest">${_t("Test and save")}</button>${ai.model?`<button class="btn alt" id="aiDel">${_t("Disconnect")}</button>`:""}</div>
     <details class="more guide"><summary>${_t("Guide: connecting an AI provider")}</summary>
       <h4>${_t("How it works")}</h4><p>${_t("The advisor and the black belt review send your project text to the provider you choose, using your own API key. Everything else in Lean Navigator works without AI. The API key is not the same as a chat subscription: API use is billed separately by the provider, per request.")}</p>
       <h4>${_t("Getting a key")}</h4><p>${_t("Choose the provider above and follow the link under \"API key\". Create a key, copy it once (most providers show it only once) and paste it here. Set a monthly spending limit in the provider's billing settings; a review costs very little, but a limit protects you if a key leaks.")}</p>
       <h4>${_t("Choosing a model")}</h4><p>${_t("Click <b>Load models</b> after entering your key: it lists the models your key can use, so you don't have to guess names. Model names change often and older models are switched off, so a name copied from an old tutorial may no longer work. For the black belt review, choose a capable mid-sized model (for example a \"flash\" or \"sonnet\" class model); the smallest \"lite\" or \"mini\" models answer faster but miss more weak points. If a model is busy, the app retries twice by itself.")}</p>
       <h4>${_t("Privacy")}</h4><p>${_t("Only the text of the request goes to the provider. Check your organisation's rules before sending project data about people or confidential processes to an external AI service. To keep everything on your computer, run a local model with Ollama.")}</p>
       <h4>${_t("Common messages")}</h4>
       <table class="grid small"><thead><tr><th>${_t("Message")}</th><th>${_t("Meaning and fix")}</th></tr></thead><tbody>
        <tr><td>${_t("Did not accept the request (400)")}</td><td>${_t("Usually a wrong model name. Use Load models.")}</td></tr>
        <tr><td>${_t("Rejected the API key (401, 403)")}</td><td>${_t("Key mistyped, revoked, or without access to that model. Create a new key.")}</td></tr>
        <tr><td>${_t("Not found (404)")}</td><td>${_t("Model name unknown or switched off, or the base URL is wrong. Use Load models and the standard base URL.")}</td></tr>
        <tr><td>${_t("Rate limit or quota (429)")}</td><td>${_t("Too many requests, or the free quota or spending limit is used up.")}</td></tr>
        <tr><td>${_t("Busy or temporary problem (500, 503)")}</td><td>${_t("The provider is overloaded. Wait, or choose a lighter model. Your settings are saved anyway.")}</td></tr>
        <tr><td>${_t("Could not reach the provider")}</td><td>${_t("No connection, or the provider blocks requests from browsers (CORS). Use OpenRouter, which allows them and offers most of the same models.")}</td></tr>
       </tbody></table>
       <h4>${_t("Local model with Ollama")}</h4><p>${_t("Install Ollama, download a model (for example <code>ollama pull llama3.1</code>) and start it allowing this site: <code>OLLAMA_ORIGINS={origin} ollama serve</code>. Then choose Ollama above and Load models.",{origin:esc(location.origin)})}</p>
     </details>
   </div></section>
   <section class="panel"><div class="panel-head"><h3>${_t("Storage and backup")}</h3></div><div class="panel-body">
     <p class="small" style="margin-top:0">${_t("Browser storage: <b>{x}</b>.",{x:persisted===true?_t("protected from automatic clean-up"):persisted===false?_t("may be cleared by the browser when space runs low, or after 7 days of no use in Safari"):_t("status unknown")})}</p>
     ${Vault.fileSupported()?`<p class="small">${_t("Synced file:")} <b>${Vault.fileHandle?esc(Vault.fileHandle.name):_t("none")}</b>${Vault.fileStatus?` <span class="muted">(${esc(Vault.fileStatus)})</span>`:""}</p>
       <div class="row"><button class="btn alt" id="fLink">${Vault.fileHandle?_t("Change file"):_t("Choose a file to keep in sync")}</button>${Vault.fileHandle?`<button class="btn alt" id="fUnlink">${_t("Stop syncing")}</button>`:""}</div>`
       :`<p class="small">${_t("This browser cannot keep a file in sync automatically. Use Chrome or Edge on a computer for that, or download backups here.")}</p>`}
     <div class="row" style="margin-top:12px"><button class="btn alt" id="bDown">${_t("Download backup")}</button><label class="btn alt" for="restoreIn">${_t("Restore from a backup file")}</label><input id="restoreIn" type="file" accept=".json,application/json" hidden></div>
     <p class="small muted">${_t("Last backup: {x}. Backups and synced files are encrypted: they open only with your passphrase or recovery code.",{x:Vault.state.settings.lastBackup?fmtDate(Vault.state.settings.lastBackup):_t("never")})}</p>
   </div></section>
   <section class="panel"><div class="panel-head"><h3>${_t("Security")}</h3></div><div class="panel-body">
     <div class="grid2"><div class="field"><label for="c1">${_t("New passphrase")}</label><input id="c1" type="password" autocomplete="new-password"></div><div class="field"><label for="c2">${_t("Repeat new passphrase")}</label><input id="c2" type="password" autocomplete="new-password"></div></div>
     <div class="flags" id="cErr"></div>
     <div class="row"><button class="btn alt" id="cSave">${_t("Change passphrase")}</button><button class="btn alt" id="newCode">${_t("Create a new recovery code")}</button><button class="btn alt" id="lock2">${_t("Lock now")}</button></div>
   </div></section>
   <p class="small muted">${_t("Lean Navigator {APP_VERSION}. Open source under the MIT licence.",{APP_VERSION:APP_VERSION})}</p></div>`;
  const setHint=()=>{const p=PRESETS.find(x=>x.id===$("#aiP").value);$("#aiKh").innerHTML=p.noKey?_t("Not needed for a local model."):p.keyUrl?`${_t("Get a key at")} <a href="${p.keyUrl}" target="_blank" rel="noopener">${esc(p.keyUrl.replace(/^https:\/\//,""))}</a>.`:""};
  $("#aiP").onchange=()=>{const p=PRESETS.find(x=>x.id===$("#aiP").value);$("#aiB").value=p.base;setHint()};setHint();
  const cfgNow=()=>{const p=PRESETS.find(x=>x.id===$("#aiP").value);return{preset:p.id,kind:p.kind,base:$("#aiB").value.trim(),model:$("#aiM").value.trim(),key:$("#aiK").value.trim()||(ai.preset===p.id?ai.key:""),noKey:!!p.noKey,confirmedOrigin:ai.confirmedOrigin||""}};
  /* Unknown provider address: show the exact destination and ask before the key is sent. */
  const confirmEndpoint=cfg=>{const st=endpointStatus(cfg);if(st==="ok")return true;
    if(st==="blocked"){$("#aiMsg").innerHTML=flagsHTML([endpointProblem(cfg.base)]);return false}
    const origin=endpointURL(cfg.base).origin;
    if(!confirm(`${_t("Your API key and your prompts will be sent to:\n\n{origin}\n\nThis is not one of the providers listed in Lean Navigator. Continue only if you know and trust this address.",{origin:origin})}`)){$("#aiMsg").innerHTML=flagsHTML([_t("Not sent. Check the base URL.")]);return false}
    cfg.confirmedOrigin=origin;return true};
  const live=()=>{const w=checkConfig(cfgNow());$("#aiMsg").innerHTML=flagsHTML(w)};
  ["#aiB","#aiM"].forEach(s=>$(s).addEventListener("input",live));
  $("#aiLoad").onclick=async()=>{const cfg=cfgNow();if(!cfg.key&&!cfg.noKey)return $("#aiMsg").innerHTML=flagsHTML([_t("Enter the API key first.")]);
    if(!confirmEndpoint(cfg))return;ai.confirmedOrigin=cfg.confirmedOrigin;
    $("#aiLoad").disabled=true;$("#aiMsg").innerHTML=flagsHTML([_t("ℹ Loading the models your key can use…")]);
    try{const ms=await listModels(cfg);$("#aiML").innerHTML=ms.map(m=>`<option value="${esc(m.id)}">${esc(m.label)}</option>`).join("");
      $("#aiMsg").innerHTML=flagsHTML([ms.length?`${_t("✓ {msCount} models available. Click the model field to choose one.",{msCount:ms.length})}`:_t("The provider returned no models for this key.")]);if(ms.length)$("#aiM").focus()}
    catch(e){$("#aiMsg").innerHTML=flagsHTML([e.message])}finally{$("#aiLoad").disabled=false}};
  $("#aiTest").onclick=async()=>{const cfg=cfgNow(),w=checkConfig(cfg);
    if(w.length)return $("#aiMsg").innerHTML=flagsHTML(w);
    if(!cfg.key&&!cfg.noKey)return $("#aiMsg").innerHTML=flagsHTML([_t("Enter the API key.")]);
    if(!confirmEndpoint(cfg))return;ai.confirmedOrigin=cfg.confirmedOrigin;
    cfg.model=normModel(cfg);
    $("#aiTest").disabled=true;$("#aiMsg").innerHTML=flagsHTML([_t("ℹ Testing the connection…")]);
    try{const r=await aiCall(cfg,'Reply with exactly this JSON and nothing else: {"ok": true}');if(!r||r.ok!==true)throw new Error(_t("Unexpected answer from the model."));
      Vault.state.settings.ai=cfg;sample=makeAI(cfg);await persistAll();openSettings();toast(_t("AI provider connected."))}
    catch(e){
      if(e.busy){Vault.state.settings.ai=cfg;sample=makeAI(cfg);await persistAll();openSettings();toast(_t("Settings saved. The provider was busy during the test; the app will retry when you use it."))}
      else{$("#aiMsg").innerHTML=flagsHTML([e.message]);$("#aiTest").disabled=false}}};
  const del=$("#aiDel");if(del)del.onclick=async()=>{Vault.state.settings.ai=null;sample=null;await persistAll();openSettings()};
  const fl=$("#fLink");if(fl)fl.onclick=async()=>{try{await Vault.linkFile();openSettings();toast(_t("File linked and saved."))}catch(e){if(e.name!=="AbortError")toast(e.message)}};
  const fu=$("#fUnlink");if(fu)fu.onclick=async()=>{await Vault.unlinkFile();openSettings()};
  $("#bDown").onclick=async()=>{await downloadBackup();openSettings()};
  $("#restoreIn").onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!confirm(_t("Replace everything in this browser, and in the synced file if you use one, with the backup? Projects not in the backup are lost.")))return;
    try{const rec=JSON.parse(await f.text());await Vault.replace(rec);S.projects=[];sample=null;showUnlock(_t("Backup restored. Enter the passphrase of that backup."))}catch(err){toast(err.message||_t("Could not read the file."))}};
  $("#cSave").onclick=async()=>{const a=$("#c1").value,b=$("#c2").value;if(!pwOK(a))return $("#cErr").innerHTML=flagsHTML([_t("At least 10 characters.")]);if(a!==b)return $("#cErr").innerHTML=flagsHTML([_t("The two passphrases are different.")]);await Vault.setPass(a);$("#c1").value=$("#c2").value="";$("#cErr").innerHTML=flagsHTML([_t("✓ Passphrase changed.")])};
  $("#newCode").onclick=async()=>{if(!confirm(_t("The old recovery code will stop working. Continue?")))return;showCode(await Vault.newCode(),false)};
  $("#lock2").onclick=lockNow;$("#back").onclick=()=>{S.view="home";render()};
}

/* ----- start-up ----- */
$("#navHome").onclick=()=>{S.view="home";S.current=null;render()};
$("#navSettings").onclick=openSettings;
$("#navPipeline").onclick=()=>{S.view="pipeline";S.current=null;render()};
$("#navStrategy").onclick=()=>{S.view="strategy";S.current=null;S.planId=null;render()};
$("#navLock").onclick=lockNow;
window.addEventListener("pagehide",()=>{if(Vault.state)persistAll()});
(async function boot(){
  if(!window.crypto||!crypto.subtle||!window.indexedDB){$("#app").innerHTML=`<div class="gate panel"><div class="panel-body"><h2>${_t("This browser is not supported")}</h2><p>${_t("Lean Navigator needs a recent browser opened over https or localhost.")}</p></div></div>`;return}
  if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
  const rec=await Vault.load();rec?showUnlock():showWelcome();
})();

/* ----- language menu ----- */
function navLabels(){[["#navHome","Projects"],["#navPipeline","Pipeline"],["#navStrategy","Strategy"],["#navSettings","Settings"],["#navLock","Lock"]].forEach(([s,l])=>{const e=$(s);if(e)e.textContent=_t(l)});const ls=$("#langSel");if(ls)ls.setAttribute("aria-label",_t("Language"))}
(function langMenu(){const sel=$("#langSel");if(!sel)return;
  sel.innerHTML=LANGS.map(([k,l])=>`<option value="${k}" ${k===I18N.lang?"selected":""}>${esc(l)}</option>`).join("");
  sel.onchange=async()=>{sel.disabled=true;try{await setLanguage(sel.value)}catch(e){toast(e.message)}finally{sel.disabled=false}};
  I18N.onChange=()=>{navLabels();if(S.screenFn)S.screenFn();else if(Vault.state)render()};
  navLabels()})();
