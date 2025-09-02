import { withCors } from './_utils.cors.js';
import { getConfig, setConfig } from './_utils.storage.js';

async function handler(req,res){
  try{
    if(req.method === 'GET'){
      const cfg = await getConfig();
      return res.status(200).json(cfg);
    }
    if(req.method === 'POST'){
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await setConfig(body);
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:'method not allowed'});
  }catch(e){
    return res.status(500).json({ error: String(e) });
  }
}
export default withCors(handler);
