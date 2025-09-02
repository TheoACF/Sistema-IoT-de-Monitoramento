import { withCors } from './_utils.cors.js';
import { latestReading, getConfig } from './_utils.storage.js';

async function handler(req,res){
  try{
    const last = await latestReading();
    const cfg = await getConfig();
    const offlineMs = 5*60*1000;
    const now = Date.now();
    const lastMs = last ? (last.ms || Date.parse(last.ts)) : null;
    const online = !!lastMs && (now - lastMs) <= offlineMs;
    return res.status(200).json({
      online,
      lastSeen: lastMs ? new Date(lastMs).toISOString() : null,
      latest: last || null,
      source: cfg.metodo_armazenamento || 'desconhecido',
      limites: { temp: cfg.limite_temp, umid: cfg.limite_umidade }
    });
  }catch(e){
    return res.status(500).json({ error: String(e) });
  }
}
export default withCors(handler);
