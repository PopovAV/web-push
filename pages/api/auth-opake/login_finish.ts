import type { NextApiRequest, NextApiResponse } from 'next'
import { auth_finish, AuthFinishResp } from '../../../libs/opaque'
import  getEnv  from './serverEnv'



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthFinishResp|any>
) {
  try {
    const crypto = await import('node:crypto');
    globalThis.crypto = crypto.webcrypto;
  } catch (err) {
    console.error('crypto support is disabled!');
  }
  
  try {
    const env = await getEnv()
    let resp = await auth_finish(req, env, res);
    res.status(200).json(resp)
  }
  catch(e: any) {
    console.error(e);
    res.status(400).json(e.message)
  }

}