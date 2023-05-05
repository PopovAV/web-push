import type { NextApiRequest, NextApiResponse } from 'next'
import { verify_reg } from '../../../../libs/webauthn';


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
    let resp = await verify_reg(username as string, req.body);
    res.status(200).json(resp)
  }
  catch(e: any) {
    console.error(e);
    res.status(400).json(e.message)
  }

}