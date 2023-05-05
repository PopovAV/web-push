import type { NextApiRequest, NextApiResponse } from 'next'
import { get_auth_options, verify_auth } from '../../../../libs/webauthn';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {
    const crypto = await import('node:crypto');
    globalThis.crypto = crypto.webcrypto;
  } catch (err) {
    console.error('crypto support is disabled!');
  }

  try {
    const { username } = req.query;
    let resp = await get_auth_options(username as string);
    res.status(200).json(resp)
  }
  catch(e: any) {
    console.error(e);
    res.status(400).json(e.message)
  }

}