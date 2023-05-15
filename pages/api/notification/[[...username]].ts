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

async function PushAll(subscription: Subscription, username: string) {

  const subscriptions = await store.get(`webpush:${username}`, null) as Subscription[] ?? [];
  const key = subscription.keys.p256dh;
  const exist = subscriptions.find(s => s.keys.p256dh == key);

  if (exist == undefined) {
    subscriptions.push(subscription)
    await store.put("webpush:" + username, subscriptions, null);
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
      const subscriptions = await store.get(`webpush:${login}`, null) as Subscription[] ?? [];
      const key = subscription.keys.p256dh;
      const newSubscriptions = subscriptions.filter(s => s.keys.p256dh != key);
      await store.put("webpush:" + login, newSubscriptions, null);
      res.statusCode = 200;
      res.end()
      return;
    }
  }

  res.statusCode = 422;
  res.end()

}




export default Notification;
