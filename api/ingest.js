import { withCors } from './_utils.cors.js';
import { saveReading, getConfig } from './_utils.storage.js';

async function handler(req, res){
  try{
    const method = req.method || 'GET';
    const q = method === 'GET' ? req.query : req.body;
    const key = process.env.INGEST_KEY;
    if(key && q.key !== key){
      return res.status(401).json({ok:false, error:'unauthorized'});
    }
    const temp = parseFloat(q.temp);
    const umid = parseFloat(q.umid);
    const error = String(q.error||'false') === 'true';
    const now = new Date();
    const rec = { ts: now.toISOString(), ms: now.getTime(), temp, umid, error };
    if(!error && (!Number.isFinite(temp) || !Number.isFinite(umid))){
      return res.status(400).json({ok:false, error:'invalid values'});
    }
    await saveReading(rec);
    const cfg = await getConfig();
    return res.status(200).json({ok:true, saved: rec, limites: {temp: cfg.limite_temp, umid: cfg.limite_umidade}});
  }catch(e){
    return res.status(500).json({ok:false, error: String(e)});
  }
}
export default withCors(handler);
