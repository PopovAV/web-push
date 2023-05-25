import { getStore } from "./store";
import webPush, { SendResult } from 'web-push'


interface PushKey {
  p256dh: string
  auth: string
}

interface Subscription {
  endpoint: string,
  expirationTTime: Date | null,
  keys: PushKey,
  deviceid: string
}

const store = getStore();

webPush.setVapidDetails(
  `mailto:${process.env.WEB_PUSH_EMAIL}`,
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "",
  process.env.WEB_PUSH_PRIVATE_KEY ?? ""
)

async function getKey(username: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(username))
  return "webpush:" + Buffer.from(digest).toString('hex')
}

export async function SaveAndGetSubscription(subscription: Subscription | null, username: string) {
  const storagekey = await getKey(username);
  const subscriptions = await store.get(storagekey, null) as Subscription[] ?? [];
  if (subscription == null) return subscriptions

  const key = subscription.keys.p256dh;
  const exist = subscriptions.find(s => s.keys.p256dh == key);
  if (exist == undefined) {
    subscriptions.push(subscription)
    await store.put(storagekey, subscriptions, null);
  }
  return subscriptions;
}

export async function PushAll(username: string, message: string | null = null, exludeDevices: string[] = []) {
  const subscriptions = await SaveAndGetSubscription(null, username);
  const results = await Promise.all(subscriptions.
    filter(x => exludeDevices.indexOf(x.deviceid) == -1).map(x => SendPush(x, message)));
  return results[0];
}

export async function SendPush(subscription: Subscription, message: string | null = null) {
  return webPush
    .sendNotification(
      subscription,
      JSON.stringify({ title: 'PWA TEST APP', message: message ?? 'Your web push notification is here!' })
    );
}

export async function DeleteSubscription(login: string, subscription: Subscription) {
  const storagekey = await getKey(login);
  const subscriptions = await store.get(storagekey, null) as Subscription[] ?? [];
  const key = subscription.keys.p256dh;
  const newSubscriptions = subscriptions.filter(s => s.keys.p256dh != key);
  await store.put(storagekey, newSubscriptions, null);
}