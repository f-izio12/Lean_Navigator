/* ================= Encrypted vault =================
   All data (projects and settings, including any AI key) is encrypted in the browser
   with AES-GCM 256. A random data key is wrapped twice: once with a key derived from
   the password, once with a key derived from the recovery code (PBKDF2-SHA256).
   Nothing leaves the device unless you link a file or download a backup, and those
   contain the same encrypted vault. */
const IDB={
  db:null,
  open(){return this.db?Promise.resolve(this.db):new Promise((res,rej)=>{const r=indexedDB.open("lean-navigator",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>{this.db=r.result;res(this.db)};r.onerror=()=>rej(r.error)})},
  async get(k){const db=await this.open();return new Promise((res,rej)=>{const r=db.transaction("kv").objectStore("kv").get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async set(k,v){const db=await this.open();return new Promise((res,rej)=>{const t=db.transaction("kv","readwrite");t.objectStore("kv").put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})},
  async del(k){const db=await this.open();return new Promise((res,rej)=>{const t=db.transaction("kv","readwrite");t.objectStore("kv").delete(k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
};
const b64=u8=>{let s="";const a=new Uint8Array(u8);for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const rnd=n=>crypto.getRandomValues(new Uint8Array(n));
const TE=new TextEncoder(),TD=new TextDecoder();
const ITER=600000;
const B32="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeRecoveryCode(){const b=rnd(25);let s="";for(const x of b)s+=B32[x%32];return s.match(/.{5}/g).join("-")}
const normCode=c=>String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
async function kek(secret,salt,iter){
  const base=await crypto.subtle.importKey("raw",TE.encode(secret),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt,iterations:iter},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function wrap(dk,secret){const salt=rnd(16),iv=rnd(12),k=await kek(secret,salt,ITER);return{salt:b64(salt),iv:b64(iv),wrapped:b64(await crypto.subtle.encrypt({name:"AES-GCM",iv},k,dk))}}
async function unwrap(w,secret,iter){const k=await kek(secret,unb64(w.salt),iter);return new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(w.iv)},k,unb64(w.wrapped)))}
const aesKey=dk=>crypto.subtle.importKey("raw",dk,"AES-GCM",false,["encrypt","decrypt"]);
function validVault(v){return v&&v.format==="lean-navigator-vault"&&v.pass&&v.rec&&v.data&&v.data.iv&&v.data.ct}

const Vault={
  rec:null,       // the stored (encrypted) vault record
  dk:null,        // raw data key, in memory only while unlocked
  state:null,     // decrypted {projects, settings}
  fileHandle:null,
  fileStatus:"",fileOk:false,
  fileBlocked:false, // true when the synced file could not be opened: it is then left untouched
  preferLocal:false, // true right after a restore: the restored copy wins over the synced file
  async load(){this.rec=await IDB.get("vault");try{this.fileHandle=await IDB.get("fileHandle")||null}catch{this.fileHandle=null}return this.rec},
  async create(pass){
    const dk=rnd(32),code=makeRecoveryCode();
    this.rec={format:"lean-navigator-vault",version:1,savedAt:new Date().toISOString(),kdf:{alg:"PBKDF2-SHA256",iter:ITER},pass:await wrap(dk,pass),rec:await wrap(dk,normCode(code)),data:null};
    this.dk=dk;this.state={projects:[],settings:{ai:null,lastBackup:null}};
    await this.seal();return code;
  },
  /* Decrypts a vault record without making it the active one. Returns {dk,state} or throws. */
  async decrypt(rec,secret,byCode){
    const w=byCode?rec.rec:rec.pass;
    let dk;try{dk=await unwrap(w,byCode?normCode(secret):secret,rec.kdf.iter)}catch{throw new Error(byCode?_t("This recovery code does not open the vault."):_t("Wrong password."))}
    const data=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(rec.data.iv)},await aesKey(dk),unb64(rec.data.ct));
    const state=JSON.parse(TD.decode(data));
    if(!state||typeof state!=="object"||Array.isArray(state))throw new Error(_t("The vault content is not valid."));
    return{dk,state};
  },
  async open(rec,secret,byCode,opened){
    const {dk,state}=opened||await this.decrypt(rec,secret,byCode);
    this.rec=rec;this.dk=dk;this.state=state;
    this.state.projects=this.state.projects||[];this.state.settings=this.state.settings||{ai:null,lastBackup:null};
  },
  /* Revision counter. It lives INSIDE the encrypted data and goes up by one at every save, so it
     cannot be changed without the key. When the browser copy and the synced file differ, the copy
     with the higher revision wins: an older file put back in place cannot silently replace newer work.
     savedAt (outside the encryption) is only used for vaults saved before version 1.2.3. */
  rev:st=>Number.isSafeInteger(st&&st.rev)&&st.rev>=0?st.rev:0,
  async seal(){
    if(!this.dk)throw new Error(_t("You are logged out."));
    this.state.rev=this.rev(this.state)+1;
    const iv=rnd(12),ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},await aesKey(this.dk),TE.encode(JSON.stringify(this.state)));
    this.rec={...this.rec,savedAt:new Date().toISOString(),data:{iv:b64(iv),ct:b64(ct)}};
    await IDB.set("vault",this.rec);
    await this.writeFile();
  },
  async setPass(pass){this.rec={...this.rec,pass:await wrap(this.dk,pass)};await this.seal()},
  async newCode(){const code=makeRecoveryCode();this.rec={...this.rec,rec:await wrap(this.dk,normCode(code))};await this.seal();return code},
  lock(){this.dk=null;this.state=null},
  json(){return JSON.stringify(this.rec,null,1)},
  async replace(rec){if(!validVault(rec))throw new Error(_t("This file is not a Lean Navigator vault."));this.rec=rec;this.lock();this.preferLocal=true;await IDB.set("vault",rec)},
  async destroy(){await IDB.del("vault");await IDB.del("fileHandle");this.rec=null;this.fileHandle=null;this.lock()},

  /* ----- linked file (Chrome and Edge on desktop) ----- */
  fileSupported:()=>typeof window.showSaveFilePicker==="function",
  async linkFile(){
    const h=await window.showSaveFilePicker({suggestedName:"lean-navigator-vault.json",types:[{description:_t("Lean Navigator vault"),accept:{"application/json":[".json"]}}]});
    this.fileHandle=h;this.fileBlocked=false;await IDB.set("fileHandle",h);await this.writeFile();
  },
  async openFile(){
    const [h]=await window.showOpenFilePicker({types:[{description:_t("Lean Navigator vault"),accept:{"application/json":[".json"]}}]});
    const rec=JSON.parse(await (await h.getFile()).text());if(!validVault(rec))throw new Error(_t("This file is not a Lean Navigator vault."));
    if((await h.requestPermission({mode:"readwrite"}))!=="granted")throw new Error(_t("Permission to use the file was refused."));
    this.fileHandle=h;this.fileBlocked=false;await IDB.set("fileHandle",h);await this.replace(rec);
  },
  async unlinkFile(){this.fileHandle=null;this.fileOk=false;this.fileBlocked=false;await IDB.del("fileHandle");this.fileStatus=""},
  async filePermission(ask){
    if(!this.fileHandle)return false;
    try{let p=await this.fileHandle.queryPermission({mode:"readwrite"});if(p!=="granted"&&ask)p=await this.fileHandle.requestPermission({mode:"readwrite"});return p==="granted"}catch{return false}
  },
  async readFile(){try{const rec=JSON.parse(await (await this.fileHandle.getFile()).text());return validVault(rec)?rec:null}catch{return null}},
  async writeFile(){
    if(!this.fileHandle||!this.rec||this.fileBlocked)return; // a file that did not open with this password is never overwritten
    try{if(!(await this.filePermission(false))){this.fileOk=false;this.fileStatus=_t("File not updated: permission needed");return}
      const w=await this.fileHandle.createWritable();await w.write(this.json());await w.close();this.fileOk=true;this.fileTime=new Date().toLocaleTimeString(uiLocale(),{hour:"2-digit",minute:"2-digit"});this.fileStatus=_t("File saved {time}",{time:this.fileTime})}
    catch(e){this.fileOk=false;this.fileStatus=(_t("File not updated: {x}",{x:e.message||"error"}))}
  }
};
