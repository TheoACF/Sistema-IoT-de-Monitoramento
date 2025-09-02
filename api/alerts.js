import { withCors } from './_utils.cors.js';
import { latestReading, getConfig } from './_utils.storage.js';

async function handler(req,res){
  try{
    const last = await latestReading();
    const cfg = await getConfig();
    const alerts = [];
    const now = Date.now();

    if(!last){
      return res.status(200).json({ alerts, counts:{ativos:0, total:0}, lastSeen:null });
    }

    const lastMs = last.ms || Date.parse(last.ts);
    if(now - lastMs > 5*60*1000){
      alerts.push({ nivel:'Crítico', tipo:'Offline', msg:'Dispositivo offline (>5min)', ts:new Date().toISOString() });
    }
    if(last.error){
      alerts.push({ nivel:'Atenção', tipo:'Sensor', msg:'Falha de sensor (error=true)', ts:last.ts });
    }
    if(Number.isFinite(last.temp) && last.temp > Number(cfg.limite_temp ?? 30)){
      alerts.push({ nivel:'Crítico', tipo:'Temperatura', msg:`Temperatura ${last.temp}°C acima do limite ${cfg.limite_temp}°C`, ts:last.ts });
    }
    if(Number.isFinite(last.umid) && last.umid < Number(cfg.limite_umidade ?? 30)){
      alerts.push({ nivel:'Atenção', tipo:'Umidade', msg:`Umidade ${last.umid}% abaixo do limite ${cfg.limite_umidade}%`, ts:last.ts });
    }

    return res.status(200).json({ alerts, counts:{ativos:alerts.length, total:alerts.length}, lastSeen:new Date(lastMs).toISOString() });
  }catch(e){
    return res.status(500).json({ error: String(e) });
  }
}
export default withCors(handler);
