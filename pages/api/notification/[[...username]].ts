import { NextApiRequest, NextApiResponse } from 'next'
import webPush, { SendResult } from 'web-push'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { KVStorage } from '../../../libs/store'

interface PushKey {
  p256dh: string
  auth: string
}

interface Subscription {
  endpoint: string,
  expirationTTime: Date | null,
  keys: PushKey
}

const store = new KVStorage();

webPush.setVapidDetails(
  `mailto:${process.env.WEB_PUSH_EMAIL}`,
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "",
  process.env.WEB_PUSH_PRIVATE_KEY ?? ""
)

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions)
  return {
    props: {
      session,
    },
  }
}

async function getKey(username: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(username))
  return "webpush:" + Buffer.from(digest).toString('hex')
}


async function PushAll(subscription: Subscription, username: string) {

  const storagekey = await getKey(username);
  const subscriptions = await store.get(storagekey, null) as Subscription[] ?? [];
  const key = subscription.keys.p256dh;
  const exist = subscriptions.find(s => s.keys.p256dh == key);

  if (exist == undefined) {
    subscriptions.push(subscription)

    await store.put(storagekey, subscriptions, null);
  }
  const results = await Promise.all(subscriptions.map(x => SendPush(x)));
  return results[0];
}

async function SendPush(subscription: Subscription) {
  return webPush
    .sendNotification(
      subscription,
      JSON.stringify({ title: 'Hello Web Push', message: 'Your web push notification is here!' })
    );
}

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

  let crypto;
  try {
    const crypto = await import('node:crypto');
    globalThis.crypto = crypto.webcrypto;
  } catch (err) {
    console.error('crypto support is disabled!');
  }

  const { subscription } = req.body

  const { username } = req.query;

  const login = (username as string[])[0]

  if (req.method == 'POST') {

    if (username == undefined) {
      const response = await SendPush(subscription);
      await sendResponse(response, res);
    }
    else {
      await PushAll(subscription, login)
    }
    return;

  } else if (req.method == 'DELETE') {

    if (username != undefined) {
      const storagekey = await getKey(login);
      const subscriptions = await store.get(storagekey, null) as Subscription[] ?? [];
      const key = subscription.keys.p256dh;
      const newSubscriptions = subscriptions.filter(s => s.keys.p256dh != key);
      await store.put(storagekey, newSubscriptions, null);
      res.statusCode = 200;
      res.end()
      return;
    }
  }

  res.statusCode = 422;
  res.end()

}




export default Notification;
