import { NextApiRequest, NextApiResponse } from 'next'
import webPush, { SendResult } from 'web-push'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { DeleteSubscription, PushAll, SaveAndGetSubscription, SendPush } from '../../libs/webpush'


async function sendResponse(response: SendResult, res: NextApiResponse) {
  if (response.statusCode == 201) {
    res.writeHead(response.statusCode, response.headers)
      .write(response.body)
  }
  else {
    console.error(response.body)
    res.statusCode = 500
    res.end()
  }
}

async function Notification(req: NextApiRequest, res: NextApiResponse) {

  try {
    const crypto = await import('node:crypto');
    globalThis.crypto = crypto.webcrypto;
  } catch (err) {
    console.error('crypto support is disabled!');
  }

  const { subscription } = req.body
  if (subscription != null) {
    subscription.deviceid = req.headers['x-finger-print']??[""][0];
  }

  const session = await getServerSession(req, res, authOptions);

  let login = session?.user?.email ?? null;

  if (req.method == 'POST') {
    if (login == null) {
      const response = await SendPush(subscription);
      await sendResponse(response, res);
      res.statusCode = 200;
      return;
    }
    else {
      await PushAll(login)
      res.statusCode = 201;
    }
    return;
  } else if (req.method == 'PUT') {
    if (login != null) {
      await SaveAndGetSubscription(subscription, login)
      res.statusCode = 200;
    }
    return;
  } else if (req.method == 'DELETE') {

    if (login != null) {
      await DeleteSubscription(login, subscription);
      res.statusCode = 200;
    }
  }

  res.statusCode = 422;
  res.end()
}

export default Notification;
