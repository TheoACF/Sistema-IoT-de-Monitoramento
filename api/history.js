import { withCors } from './_utils.cors.js';
import { listReadings } from './_utils.storage.js';

async function handler(req,res){
  try{
    const { limit = '60', format } = req.query;
    const series = await listReadings({limit: parseInt(limit)});
    const latest = series.length ? series[series.length-1] : null;

    if(format === 'csv'){
      const header = 'ts,temp,umid,error\n';
      const body = series.map(r => `${r.ts},${r.temp},${r.umid},${r.error? 'true':'false'}`).join('\n');
      res.setHeader('Content-Type','text/csv; charset=UTF-8');
      return res.status(200).send(header+body);
    }

    return res.status(200).json({ latest, series });
  } catch(e){
    return res.status(500).json({ error: String(e) });
  }
}
export default withCors(handler);
