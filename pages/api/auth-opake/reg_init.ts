import type { NextApiRequest, NextApiResponse } from 'next'
import { InitResp, register_init } from '../../../libs/opaque'
import  getEnv  from './serverEnv'

type InitData = {
  username: string
  initiation: Array<number>
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InitResp | any>
) {
  let crypto;
  try {
    const crypto = await import('node:crypto');
    globalThis.crypto = crypto.webcrypto;
  } catch (err) {
    console.error('crypto support is disabled!');
  }

  try {
    const env = await getEnv()
    let resp = await register_init(req, env);
    res.status(200).json(resp)
  }
  catch(e : any) {
    console.error(e);
    res.status(400).json(e.message)
  }
}