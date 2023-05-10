import type { NextApiRequest, NextApiResponse } from 'next'
import { AuthInitResp, auth_init } from '../../../libs/opaque'
import  serverEnv  from './serverEnv'

type InitData = {
  username: string
  initiation: Array<number>
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthInitResp| any>
) {

  try {
    const crypto = await import('node:crypto');
    globalThis.crypto = crypto.webcrypto;
  } catch (err) {
    console.error('crypto support is disabled!');
  }
  try {
    let resp = await auth_init(req, serverEnv, res);
    res.status(200).json(resp)
  }
  catch(e: any) {
    console.error(e);
    res.status(400).json(e.message)
  }
}