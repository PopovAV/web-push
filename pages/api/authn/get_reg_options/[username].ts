import type { NextApiRequest, NextApiResponse } from 'next'
import { get_reg_options } from '../../../../libs/webauthn';


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

    let resp = await get_reg_options(username as string);
    res.status(200).json(resp)
  }
  catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message })
  }
}