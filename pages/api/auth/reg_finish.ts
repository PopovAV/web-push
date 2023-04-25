import type { NextApiRequest, NextApiResponse } from 'next'
import { register_finish, FinishResp } from '../../../libs/opaque'
import  serverEnv  from './serverEnv'

type InitData = {
  username: string
  initiation: Array<number>
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FinishResp>
) {
  let crypto;
  try {
    const crypto = await import('node:crypto');
    globalThis.crypto = crypto.webcrypto;
  } catch (err) {
    console.error('crypto support is disabled!');
  }
  try {
    let resp = await register_finish(req, serverEnv);
    res.status(200).json(resp)
  }
  catch(error: any) {
    console.error(error);
    res.status(400).json(error)
  }

}