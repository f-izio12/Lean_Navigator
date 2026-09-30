/* ================= App shell: vault screens, settings, storage, start-up ================= */
const APP_VERSION="1.0.0";
let saveChain=Promise.resolve();
function persistAll(){saveChain=saveChain.then(async()=>{Vault.state.projects=S.projects;await Vault.seal();updateBanner()});return saveChain}
store={save:()=>persistAll(),remove:async id=>{S.projects=S.projects.filter(x=>x.id!==id);await persistAll()}};
downloads={save:async({filename,data})=>{const u=URL.createObjectURL(data);const a=document.createElement("a");a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}};
const nav=show=>{$("#navHome").hidden=!show;$("#navSettings").hidden=!show;$("#navLock").hidden=!show};
const pwOK=p=>p.length>=10;

/* ----- screens ----- */
function screen(html){nav(false);$("#banner").hidden=true;$("#app").innerHTML=`<div class="gate panel"><div class="panel-body">${html}</div></div>`;$("#app").querySelector("input")?.focus()}
function showWelcome(){
  screen(`<h2>Welcome to Lean Navigator</h2>
   <p class="muted">Your projects are stored in this browser, encrypted with a passphrase only you know. Nothing is sent anywhere unless you connect an AI provider.</p>
   <h3 class="gh">Start a new vault</h3>
   <div class="field"><label for="p1">Choose a passphrase</label><div class="hint">At least 10 characters. A short sentence is easier to remember and harder to guess.</div><input id="p1" type="password" autocomplete="new-password"></div>
   <div class="field"><label for="p2">Repeat the passphrase</label><input id="p2" type="password" autocomplete="new-password"></div>
   <div class="flags" id="err"></div><button class="btn hot" id="create">Create vault</button>
   <h3 class="gh">Or continue from a vault file</h3>
   <p class="small muted">A vault file is a backup or synced file from Lean Navigator on another device.</p>
   <div class="row">${Vault.fileSupported()?`<button class="btn alt" id="openLinked">Open and keep syncing a vault file</button>`:""}<label class="btn alt" for="restoreIn">Restore from a backup file</label><input id="restoreIn" type="file" accept=".json,application/json" hidden></div>`);
  $("#create").onclick=async()=>{const a=$("#p1").value,b=$("#p2").value;
    if(!pwOK(a))return $("#err").innerHTML=flagsHTML(["The passphrase needs at least 10 characters."]);
    if(a!==b)return $("#err").innerHTML=flagsHTML(["The two passphrases are different."]);
    $("#create").disabled=true;$("#create").textContent="Creating…";const code=await Vault.create(a);showCode(code,true)};
  bindRestore();
}
function bindRestore(){
  const o=$("#openLinked");if(o)o.onclick=async()=>{try{await Vault.openFile();showUnlock("Vault file linked. Enter the passphrase of that vault.")}catch(e){if(e.name!=="AbortError")toast(e.message)}};
  const r=$("#restoreIn");if(r)r.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const rec=JSON.parse(await f.text());if(Vault.rec&&!confirm("Replace the vault in this browser with the one in this file? Anything not in the file is lost."))return;await Vault.replace(rec);showUnlock("Backup restored. Enter the passphrase of that vault.")}catch(err){toast(err.message||"Could not read the file.")}};
}
function showCode(code,first){
  screen(`<h2>Your recovery code</h2>
   <p>If you forget your passphrase, this code is the only way back into your data. There is no server and no password reset by email.</p>
   <div class="code" id="code">${esc(code)}</div>
   <div class="row"><button class="btn alt" id="copy">Copy</button></div>
   <p class="small muted">Store it in a password manager or print it. It is shown only now.</p>
   <label class="chk"><input type="checkbox" id="ok"> I have stored the recovery code somewhere safe</label>
   <button class="btn hot" id="go" disabled>Continue</button>`);
  $("#copy").onclick=async()=>{try{await navigator.clipboard.writeText(code);toast("Copied.")}catch{toast("Select the code and copy it manually.")}};
  $("#ok").onchange=e=>$("#go").disabled=!e.target.checked;
  $("#go").onclick=()=>first?showOnboarding():openSettings();
}
function showOnboarding(){
  screen(`<h2>Two optional steps</h2>
   <h3 class="gh">1. Keep a copy of your vault in a file</h3>
   ${Vault.fileSupported()?`<p class="small">Choose a file on your computer or in a synced folder (SURFdrive, OneDrive, Dropbox). The app updates it after every change and reads the newest copy when it starts. You can also do this later in Settings.</p><button class="btn alt" id="link">Choose a file</button> <span class="small muted" id="linkState"></span>`
     :`<p class="small">This browser cannot keep a file in sync. Use <b>Download backup</b> in Settings regularly; the app reminds you after 7 days. Chrome or Edge on a computer can sync to a file automatically.</p>`}
   <h3 class="gh">2. Connect an AI provider</h3>
   <p class="small">Needed only for the advisor chat and the black belt review. Everything else works without it. You can do this in Settings at any time.</p>
   <button class="btn hot" id="done">Open Lean Navigator</button>`);
  const l=$("#link");if(l)l.onclick=async()=>{try{await Vault.linkFile();$("#linkState").textContent="Linked: "+Vault.fileHandle.name}catch(e){if(e.name!=="AbortError")toast(e.message)}};
  $("#done").onclick=enterApp;
}
function showUnlock(msg){
  screen(`<h2>Unlock Lean Navigator</h2>${msg?`<div class="flag info">${esc(msg)}</div>`:""}
   ${Vault.fileHandle?`<p class="small muted">Synced file: ${esc(Vault.fileHandle.name)}. The browser may ask permission to use it.</p>`:""}
   <div class="field"><label for="pw">Passphrase</label><input id="pw" type="password" autocomplete="current-password"></div>
   <div class="flags" id="err"></div><button class="btn hot" id="unlock">Unlock</button>
   <details class="more"><summary>Forgot your passphrase?</summary>
     <div class="field"><label for="rc">Recovery code</label><input id="rc" autocomplete="off" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"></div>
     <div class="field"><label for="n1">New passphrase</label><input id="n1" type="password" autocomplete="new-password"></div>
     <div class="field"><label for="n2">Repeat new passphrase</label><input id="n2" type="password" autocomplete="new-password"></div>
     <div class="flags" id="err2"></div><button class="btn" id="recover">Recover and set new passphrase</button></details>
   <details class="more"><summary>Other options</summary>
     <div class="row">${Vault.fileSupported()?`<button class="btn alt" id="openLinked">Use a different vault file</button>`:""}<label class="btn alt" for="restoreIn">Restore from a backup file</label><input id="restoreIn" type="file" accept=".json,application/json" hidden>
     <button class="btn alt" id="wipe">Delete this vault and start over</button></div></details>`);
  $("#pw").onkeydown=e=>{if(e.key==="Enter")$("#unlock").click()};
  $("#unlock").onclick=()=>doUnlock($("#pw").value,false,$("#err"),$("#unlock"));
  $("#recover").onclick=async()=>{const a=$("#n1").value,b=$("#n2").value;
    if(!pwOK(a))return $("#err2").innerHTML=flagsHTML(["The new passphrase needs at least 10 characters."]);
    if(a!==b)return $("#err2").innerHTML=flagsHTML(["The two passphrases are different."]);
    if(await doUnlock($("#rc").value,true,$("#err2"),$("#recover"))){await Vault.setPass(a);toast("New passphrase set. Your recovery code still works.")}};
  $("#wipe").onclick=async()=>{if(prompt('This permanently deletes all projects in this browser. Type DELETE to confirm.')!=="DELETE")return;await Vault.destroy();showWelcome()};
  bindRestore();
}
async function doUnlock(secret,byCode,errEl,btn){
  if(!secret)return false;
  const hasFile=!!Vault.fileHandle,granted=hasFile?await Vault.filePermission(true):false; // ask while the click still counts as a user action
  btn.disabled=true;const label=btn.textContent;btn.textContent="Unlocking…";
  try{
    let rec=Vault.rec,fromFile=false;
    if(granted){const f=await Vault.readFile();if(f&&(!rec||f.savedAt>rec.savedAt)){rec=f;fromFile=true}}
    await Vault.open(rec,secret,byCode);
    if(fromFile)await IDB.set("vault",rec);else if(granted)await Vault.writeFile();
    if(hasFile&&!granted)Vault.fileStatus="File not in use: permission not given";
    enterApp();return true;
  }catch(e){errEl.innerHTML=flagsHTML([e.message||"Could not unlock."]);btn.disabled=false;btn.textContent=label;return false}
}
async function enterApp(){
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
  if(Vault.fileHandle&&Vault.fileStatus.startsWith("File not"))msg=`${Vault.fileStatus}. <button class="btn link" id="bnFix">Reconnect the file</button>`;
  else if(!Vault.fileHandle&&S.projects.length&&days>7)msg=`${last?"Your last backup is "+Math.floor(days)+" days old.":"You have no backup yet."} Data kept only in the browser can be lost if browser data is cleared. <button class="btn link" id="bnBackup">Download backup</button>`;
  b.innerHTML=msg;b.hidden=!msg;
  const f=$("#bnFix");if(f)f.onclick=async()=>{if(await Vault.filePermission(true)){await Vault.writeFile();updateBanner();toast(Vault.fileStatus)}};
  const d=$("#bnBackup");if(d)d.onclick=downloadBackup;
}
const _render=render;render=function(){_render();updateBanner()};
async function downloadBackup(){
  await persistAll();
  await downloads.save({filename:`lean-navigator-backup-${new Date().toISOString().slice(0,10)}.json`,data:new Blob([Vault.json()],{type:"application/json"})});
  Vault.state.settings.lastBackup=new Date().toISOString();await persistAll();toast("Backup downloaded. It is encrypted with your passphrase.");
}

/* ----- settings ----- */
async function openSettings(){
  if(!Vault.state)return;
  const ai=Vault.state.settings.ai||{},pre=PRESETS.find(p=>p.id===ai.preset)||PRESETS[0];
  let persisted=null;try{persisted=navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():null}catch{}
  nav(true);
  $("#app").innerHTML=`<div class="settings">
   <div class="proj-head"><h2>Settings</h2><button class="btn alt" id="back">Back to the library</button></div>
   <section class="panel"><div class="panel-head"><h3>AI provider</h3><span class="small muted">${sample?"Connected: "+esc(PRESETS.find(p=>p.id===ai.preset)?.label||ai.kind)+", "+esc(ai.model):"Not connected"}</span></div><div class="panel-body">
     <p class="small muted" style="margin-top:0">Requests go directly from this browser to the provider, with the key you enter here. The key is stored encrypted in your vault. Charges are billed by the provider on your own account.</p>
     <div class="grid2"><div class="field"><label for="aiP">Provider</label><select id="aiP">${PRESETS.map(p=>`<option value="${p.id}" ${p.id===pre.id?"selected":""}>${esc(p.label)}</option>`).join("")}</select></div>
     <div class="field"><label for="aiM">Model name</label><div class="hint">Exactly as written in your provider's documentation.</div><input id="aiM" value="${esc(ai.model||"")}"></div></div>
     <div class="field"><label for="aiB">Base URL</label><input id="aiB" value="${esc(ai.base||pre.base)}"></div>
     <div class="field"><label for="aiK">API key</label><div class="hint" id="aiKh"></div><input id="aiK" type="password" autocomplete="off" placeholder="${ai.key?"Saved. Type a new key to replace it.":""}"></div>
     <div class="flags" id="aiMsg"></div>
     <div class="row"><button class="btn" id="aiTest">Test and save</button>${ai.model?`<button class="btn alt" id="aiDel">Disconnect</button>`:""}</div>
   </div></section>
   <section class="panel"><div class="panel-head"><h3>Storage and backup</h3></div><div class="panel-body">
     <p class="small" style="margin-top:0">Browser storage: <b>${persisted===true?"protected from automatic clean-up":persisted===false?"may be cleared by the browser when space runs low, or after 7 days of no use in Safari":"status unknown"}</b>.</p>
     ${Vault.fileSupported()?`<p class="small">Synced file: <b>${Vault.fileHandle?esc(Vault.fileHandle.name):"none"}</b>${Vault.fileStatus?` <span class="muted">(${esc(Vault.fileStatus)})</span>`:""}</p>
       <div class="row"><button class="btn alt" id="fLink">${Vault.fileHandle?"Change file":"Choose a file to keep in sync"}</button>${Vault.fileHandle?`<button class="btn alt" id="fUnlink">Stop syncing</button>`:""}</div>`
       :`<p class="small">This browser cannot keep a file in sync automatically. Use Chrome or Edge on a computer for that, or download backups here.</p>`}
     <div class="row" style="margin-top:12px"><button class="btn alt" id="bDown">Download backup</button><label class="btn alt" for="restoreIn">Restore from a backup file</label><input id="restoreIn" type="file" accept=".json,application/json" hidden></div>
     <p class="small muted">Last backup: ${Vault.state.settings.lastBackup?fmtDate(Vault.state.settings.lastBackup):"never"}. Backups and synced files are encrypted: they open only with your passphrase or recovery code.</p>
   </div></section>
   <section class="panel"><div class="panel-head"><h3>Security</h3></div><div class="panel-body">
     <div class="grid2"><div class="field"><label for="c1">New passphrase</label><input id="c1" type="password" autocomplete="new-password"></div><div class="field"><label for="c2">Repeat new passphrase</label><input id="c2" type="password" autocomplete="new-password"></div></div>
     <div class="flags" id="cErr"></div>
     <div class="row"><button class="btn alt" id="cSave">Change passphrase</button><button class="btn alt" id="newCode">Create a new recovery code</button><button class="btn alt" id="lock2">Lock now</button></div>
   </div></section>
   <p class="small muted">Lean Navigator ${APP_VERSION}. Open source under the MIT licence.</p></div>`;
  const setHint=()=>{const p=PRESETS.find(x=>x.id===$("#aiP").value);$("#aiKh").innerHTML=p.noKey?"Not needed for a local model.":p.keyUrl?`Get a key at <a href="${p.keyUrl}" target="_blank" rel="noopener">${esc(p.keyUrl.replace(/^https:\/\//,""))}</a>.`:""};
  $("#aiP").onchange=()=>{const p=PRESETS.find(x=>x.id===$("#aiP").value);$("#aiB").value=p.base;setHint()};setHint();
  $("#aiTest").onclick=async()=>{const p=PRESETS.find(x=>x.id===$("#aiP").value);
    const cfg={preset:p.id,kind:p.kind,base:$("#aiB").value.trim(),model:$("#aiM").value.trim(),key:$("#aiK").value.trim()||(ai.preset===p.id?ai.key:""),noKey:!!p.noKey};
    if(!cfg.base||!cfg.model)return $("#aiMsg").innerHTML=flagsHTML(["Enter the base URL and the model name."]);
    if(!cfg.key&&!cfg.noKey)return $("#aiMsg").innerHTML=flagsHTML(["Enter the API key."]);
    $("#aiTest").disabled=true;$("#aiMsg").innerHTML=flagsHTML(["ℹ Testing the connection…"]);
    try{const r=await aiCall(cfg,'Reply with exactly this JSON and nothing else: {"ok": true}');if(!r||r.ok!==true)throw new Error("Unexpected answer from the model.");
      Vault.state.settings.ai=cfg;sample=makeAI(cfg);await persistAll();openSettings();toast("AI provider connected.")}
    catch(e){$("#aiMsg").innerHTML=flagsHTML([e.message]);$("#aiTest").disabled=false}};
  const del=$("#aiDel");if(del)del.onclick=async()=>{Vault.state.settings.ai=null;sample=null;await persistAll();openSettings()};
  const fl=$("#fLink");if(fl)fl.onclick=async()=>{try{await Vault.linkFile();openSettings();toast("File linked and saved.")}catch(e){if(e.name!=="AbortError")toast(e.message)}};
  const fu=$("#fUnlink");if(fu)fu.onclick=async()=>{await Vault.unlinkFile();openSettings()};
  $("#bDown").onclick=async()=>{await downloadBackup();openSettings()};
  $("#restoreIn").onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!confirm("Replace everything in this browser with the backup? Projects not in the backup are lost."))return;
    try{const rec=JSON.parse(await f.text());await Vault.replace(rec);S.projects=[];sample=null;showUnlock("Backup restored. Enter the passphrase of that backup.")}catch(err){toast(err.message||"Could not read the file.")}};
  $("#cSave").onclick=async()=>{const a=$("#c1").value,b=$("#c2").value;if(!pwOK(a))return $("#cErr").innerHTML=flagsHTML(["At least 10 characters."]);if(a!==b)return $("#cErr").innerHTML=flagsHTML(["The two passphrases are different."]);await Vault.setPass(a);$("#c1").value=$("#c2").value="";$("#cErr").innerHTML=flagsHTML(["✓ Passphrase changed."])};
  $("#newCode").onclick=async()=>{if(!confirm("The old recovery code will stop working. Continue?"))return;showCode(await Vault.newCode(),false)};
  $("#lock2").onclick=lockNow;$("#back").onclick=()=>{S.view="home";render()};
}

/* ----- start-up ----- */
$("#navHome").onclick=()=>{S.view="home";S.current=null;render()};
$("#navSettings").onclick=openSettings;
$("#navLock").onclick=lockNow;
window.addEventListener("pagehide",()=>{if(Vault.state)persistAll()});
(async function boot(){
  if(!window.crypto||!crypto.subtle||!window.indexedDB){$("#app").innerHTML=`<div class="gate panel"><div class="panel-body"><h2>This browser is not supported</h2><p>Lean Navigator needs a recent browser opened over https or localhost.</p></div></div>`;return}
  if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
  const rec=await Vault.load();rec?showUnlock():showWelcome();
})();
