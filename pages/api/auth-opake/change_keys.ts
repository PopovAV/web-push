import type { NextApiRequest, NextApiResponse } from 'next'
import  getEnv  from './serverEnv'

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
    const env = await getEnv(true)
    const  kp =env.server_ake_keypair;
    const data = { sk:kp.private_key, pk:kp.public_key }
    res.status(200).json(data)
  }
  catch(e: any) {
    console.error(e);
    res.status(400).json(e.message)
  }

}