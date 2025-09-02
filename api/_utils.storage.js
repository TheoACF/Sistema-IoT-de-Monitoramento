import fs from 'fs';
import path from 'path';

let admin = null;
let db = null;

function initFirebaseIfAvailable(){
  if(db) return;
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  const url = process.env.FIREBASE_DB_URL;
  if(!svc || !url) return;
  const json = JSON.parse(Buffer.from(svc, 'base64').toString('utf8'));
  const firebaseAdmin = require('firebase-admin');
  if(!firebaseAdmin.apps.length){
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(json),
      databaseURL: url
    });
  }
  admin = firebaseAdmin;
  db = admin.database();
}

function localFilePath(){
  // Em dev local podemos usar public/dados.txt
  return path.join(process.cwd(), 'public', 'dados.txt');
}

export async function saveReading(rec){
  initFirebaseIfAvailable();
  const toSave = { ...rec };
  if(db){
    await db.ref('leituras').push(toSave);
    return true;
  }
  // local fallback (dev)
  const line = JSON.stringify(toSave) + '\n';
  fs.mkdirSync(path.join(process.cwd(),'public'), {recursive:true});
  fs.appendFileSync(localFilePath(), line, 'utf8');
  return true;
}

export async function listReadings({limit=50, from=null, to=null}={}){
  initFirebaseIfAvailable();
  if(db){
    // busca últimos N
    const snap = await db.ref('leituras').limitToLast(limit).once('value');
    const val = snap.val() || {};
    const arr = Object.values(val);
    return arr.sort((a,b)=> (a.ms||new Date(a.ts).getTime()) - (b.ms||new Date(b.ts).getTime()));
  } else {
    if(!fs.existsSync(localFilePath())) return [];
    const lines = fs.readFileSync(localFilePath(), 'utf8').trim().split('\n').filter(Boolean);
    const arr = lines.map(l=>{ try{return JSON.parse(l);}catch(e){return null;}}).filter(Boolean);
    return arr.slice(-limit);
  }
}

export async function latestReading(){
  const arr = await listReadings({limit:1});
  return arr.length ? arr[arr.length-1] : null;
}

export async function getConfig(){
  initFirebaseIfAvailable();
  if(db){
    const snap = await db.ref('config').once('value');
    return snap.val() || {};
  } else {
    const p = path.join(process.cwd(), 'public', 'config.json');
    try{
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }catch(e){ return {}; }
  }
}

export async function setConfig(cfg){
  initFirebaseIfAvailable();
  if(db){
    await db.ref('config').set(cfg);
    return true;
  } else {
    const p = path.join(process.cwd(), 'public', 'config.json');
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8');
    return true;
  }
}
