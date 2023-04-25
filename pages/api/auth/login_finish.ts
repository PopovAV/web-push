import type { NextApiRequest, NextApiResponse } from 'next'
import { auth_finish, AuthFinishResp } from '../../../libs/opaque'
import  serverEnv  from './serverEnv'



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthFinishResp>
) {
  let crypto;
  try {
    const crypto = await import('node:crypto');
    globalThis.crypto = crypto.webcrypto;
  } catch (err) {
    console.error('crypto support is disabled!');
  }
  try {
    let resp = await auth_finish(req, serverEnv, res);
    res.status(200).json(resp)
  }
  catch(error: any) {
    console.error(error);
    res.status(400).json(error)
  }

}