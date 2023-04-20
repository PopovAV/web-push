import { NextApiRequest, NextApiResponse } from 'next'
import webPush from 'web-push'

webPush.setVapidDetails(
  `mailto:{process.env.WEB_PUSH_EMAIL}`,
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY??"",
  process.env.WEB_PUSH_PRIVATE_KEY??""
)

async function  Notification(req : NextApiRequest, res : NextApiResponse) {
  if (req.method == 'POST') {
    const { subscription } = req.body

    webPush
      .sendNotification(
        subscription,
        JSON.stringify({ title: 'Hello Web Push', message: 'Your web push notification is here!' })
      )
      .then(response => {
        res.writeHead(response.statusCode, response.headers)
        .write(response.body)
      })
      .catch(err => {
        if ('statusCode' in err) {
          res.writeHead(err.statusCode, err.headers).end(err.body)
        } else {
          console.error(err)
          res.statusCode = 500
          res.end()
        }
      })
  } else {
    res.statusCode = 405
    res.end()
  }
  return Promise.resolve();
}

export default Notification
