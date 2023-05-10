import { useEffect, useState } from 'react'
import Container from '../components/Container'
import Button from '@mui/material/Button';
import { Alert, Snackbar, Stack } from '@mui/material';

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
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // run only in browser
      navigator.serviceWorker.ready.then(reg => {

        setRegistration(reg);

        console.log('get sw registration')

        reg.pushManager.getSubscription().then(sub => {
          if (sub != null && !(sub.expirationTime && Date.now() > sub.expirationTime - 5 * 60 * 1000)) {
            setSubscription(sub)
            setIsSubscribed(true)
          }
        })

      })
    }
  }, [])

  const subscribeButtonOnClick = async (event: { preventDefault: () => void }) => {
    event.preventDefault()

    if (registration == undefined) return

    console.log(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY);

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "")
      })
      if (sub != null) {
        // TODO: you should call your API to save subscription data on server in order to send web push notification from server
        setSubscription(sub)
        setIsSubscribed(true)
        ShowResult('web push subscribed!')
      }

    } catch (e: any) {
      ShowResult('error get subscription : ' + e.message, true)
    }


  }

  const unsubscribeButtonOnClick = async (event: { preventDefault: () => void }) => {
    event.preventDefault()
    await subscription?.unsubscribe()
    // TODO: you should call your API to delete or invalidate subscription data on server
    setSubscription(undefined)
    setIsSubscribed(false)
    ShowResult('web push unsubscribed!')
  }

  const sendNotificationButtonOnClick = async (event: { preventDefault: () => void }) => {
    event.preventDefault()
    if (subscription == null) {
      ShowResult('web push not subscribed', true);
      return
    }

    const response = await fetch('/api/notification', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        subscription
      })
    })
    if (response.status == 200)
      ShowResult("push sended")
    else {
      ShowResult(await response.text(),true);
    }


  }

  const [{ result, isError }, setResult] = useState({ result: "", isError: false })

  const ShowResult = (res: any, error: boolean = false) => {
    let newResult = typeof res == "string" ? res : JSON.stringify(res, null, 2);
    if (newResult != '') {
      if (!error) {
        console.info(newResult)
      } else if (error) {
        console.error(newResult)
      }
    }
    setResult({ result: newResult, isError: !!error });
  }

  return (
    <Container title='WebPush'>
      <Stack >
        <Button onClick={subscribeButtonOnClick} disabled={isSubscribed || registration == undefined}>
          Subscribe
        </Button>
        <Button onClick={unsubscribeButtonOnClick} disabled={!isSubscribed}>
          Unsubscribe
        </Button>
        <Button onClick={sendNotificationButtonOnClick} disabled={!isSubscribed}>
          Send Notification
        </Button>
        <pre >{ JSON.stringify(subscription,null, 2)}</pre >
     
      </Stack>
      <Snackbar
          open={!!result}
          autoHideDuration={6000}
          onClose={() => setResult({ result: '', isError: false })}>
          <Alert severity={!isError ? "success" : "error"} sx={{ width: '100%' }}>
            { result } 
          </Alert>
        </Snackbar>
    </Container>
    
  )
}

export default Index
