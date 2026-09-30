/* ================= Encrypted vault =================
   All data (projects and settings, including any AI key) is encrypted in the browser
   with AES-GCM 256. A random data key is wrapped twice: once with a key derived from
   the passphrase, once with a key derived from the recovery code (PBKDF2-SHA256).
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
  fileStatus:"",
  async load(){this.rec=await IDB.get("vault");try{this.fileHandle=await IDB.get("fileHandle")||null}catch{this.fileHandle=null}return this.rec},
  async create(pass){
    const dk=rnd(32),code=makeRecoveryCode();
    this.rec={format:"lean-navigator-vault",version:1,savedAt:new Date().toISOString(),kdf:{alg:"PBKDF2-SHA256",iter:ITER},pass:await wrap(dk,pass),rec:await wrap(dk,normCode(code)),data:null};
    this.dk=dk;this.state={projects:[],settings:{ai:null,lastBackup:null}};
    await this.seal();return code;
  },
  async open(rec,secret,byCode){
    const w=byCode?rec.rec:rec.pass;
    let dk;try{dk=await unwrap(w,byCode?normCode(secret):secret,rec.kdf.iter)}catch{throw new Error(byCode?"This recovery code does not open the vault.":"Wrong passphrase.")}
    const data=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(rec.data.iv)},await aesKey(dk),unb64(rec.data.ct));
    this.rec=rec;this.dk=dk;this.state=JSON.parse(TD.decode(data));
    this.state.projects=this.state.projects||[];this.state.settings=this.state.settings||{ai:null,lastBackup:null};
  },
  async seal(){
    if(!this.dk)throw new Error("Vault is locked.");
    const iv=rnd(12),ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},await aesKey(this.dk),TE.encode(JSON.stringify(this.state)));
    this.rec={...this.rec,savedAt:new Date().toISOString(),data:{iv:b64(iv),ct:b64(ct)}};
    await IDB.set("vault",this.rec);
    await this.writeFile();
  },
  async setPass(pass){this.rec={...this.rec,pass:await wrap(this.dk,pass)};await this.seal()},
  async newCode(){const code=makeRecoveryCode();this.rec={...this.rec,rec:await wrap(this.dk,normCode(code))};await this.seal();return code},
  lock(){this.dk=null;this.state=null},
  json(){return JSON.stringify(this.rec,null,1)},
  async replace(rec){if(!validVault(rec))throw new Error("This file is not a Lean Navigator vault.");this.rec=rec;this.lock();await IDB.set("vault",rec)},
  async destroy(){await IDB.del("vault");await IDB.del("fileHandle");this.rec=null;this.fileHandle=null;this.lock()},

  /* ----- linked file (Chrome and Edge on desktop) ----- */
  fileSupported:()=>typeof window.showSaveFilePicker==="function",
  async linkFile(){
    const h=await window.showSaveFilePicker({suggestedName:"lean-navigator-vault.json",types:[{description:"Lean Navigator vault",accept:{"application/json":[".json"]}}]});
    this.fileHandle=h;await IDB.set("fileHandle",h);await this.writeFile();
  },
  async openFile(){
    const [h]=await window.showOpenFilePicker({types:[{description:"Lean Navigator vault",accept:{"application/json":[".json"]}}]});
    const rec=JSON.parse(await (await h.getFile()).text());if(!validVault(rec))throw new Error("This file is not a Lean Navigator vault.");
    if((await h.requestPermission({mode:"readwrite"}))!=="granted")throw new Error("Permission to use the file was refused.");
    this.fileHandle=h;await IDB.set("fileHandle",h);await this.replace(rec);
  },
  async unlinkFile(){this.fileHandle=null;await IDB.del("fileHandle");this.fileStatus=""},
  async filePermission(ask){
    if(!this.fileHandle)return false;
    try{let p=await this.fileHandle.queryPermission({mode:"readwrite"});if(p!=="granted"&&ask)p=await this.fileHandle.requestPermission({mode:"readwrite"});return p==="granted"}catch{return false}
  },
  async readFile(){try{const rec=JSON.parse(await (await this.fileHandle.getFile()).text());return validVault(rec)?rec:null}catch{return null}},
  async writeFile(){
    if(!this.fileHandle||!this.rec)return;
    try{if(!(await this.filePermission(false))){this.fileStatus="File not updated: permission needed";return}
      const w=await this.fileHandle.createWritable();await w.write(this.json());await w.close();this.fileStatus="File saved "+new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
    catch(e){this.fileStatus="File not updated: "+(e.message||"error")}
  }
};
