import type { NextApiRequest, NextApiResponse } from 'next'
import { delete_keys, get_keys } from '../../../../libs/webauthn';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {

    let crypto;
    try {
      const crypto = await import('node:crypto');
      globalThis.crypto = crypto.webcrypto;
    } catch (err) {
      console.error('crypto support is disabled!');
    }

    try {

        const { username } = req.query;
        if(req.method=="DELETE"){
          await delete_keys(username as string);
          res.status(200);
        }
        else{
          let keys =  await get_keys(username as string);
          res.status(200).json({ keys : keys} );
        }
    }
    catch (e: any) {
        console.error(e);
        res.status(400).json({ error: e.message })
    }

}


