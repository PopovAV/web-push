import { useEffect, useState } from 'react'
import Container from '../components/Container'
import Button from '@mui/material/Button';
import { Stack } from '@mui/material';

const base64ToUint8Array = (base64: string | any[]) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(b64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const Index = () => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | undefined>(undefined)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | undefined>(undefined)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'workbox' in window) {
      // run only in browser
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub != null && !(sub.expirationTime && Date.now() > sub.expirationTime - 5 * 60 * 1000)) {
            setSubscription(sub)
            setIsSubscribed(true)
          }
        })
        setRegistration(reg)
      })
    }
  }, [])

  const subscribeButtonOnClick = async (event: { preventDefault: () => void }) => {
    event.preventDefault()
    const sub = await registration?.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "")
    })
    // TODO: you should call your API to save subscription data on server in order to send web push notification from server
    setSubscription(sub)
    setIsSubscribed(true)
    console.log('web push subscribed!')
    console.log(sub)
  }

  const unsubscribeButtonOnClick = async (event: { preventDefault: () => void }) => {
    event.preventDefault()
    await subscription?.unsubscribe()
    // TODO: you should call your API to delete or invalidate subscription data on server
    setSubscription(undefined)
    setIsSubscribed(false)
    console.log('web push unsubscribed!')
  }

  const sendNotificationButtonOnClick = async (event: { preventDefault: () => void }) => {
    event.preventDefault()
    if (subscription == null) {
      console.error('web push not subscribed')
      return
    }

    await fetch('/api/notification', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        subscription
      })
    })
  }

  return (
    <Container title='WebPush'>
      <Stack>
        <Button onClick={subscribeButtonOnClick} disabled={isSubscribed}>
          Subscribe
        </Button>
        <Button onClick={unsubscribeButtonOnClick} disabled={!isSubscribed}>
          Unsubscribe
        </Button>
        <Button onClick={sendNotificationButtonOnClick} disabled={!isSubscribed}>
          Send Notification
        </Button>
      </Stack>
    </Container>
  )
}

export default Index
