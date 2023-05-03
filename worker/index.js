'use strict'

self.addEventListener('push', function (event) {
  const data = JSON.parse(event.data.text())
  event.waitUntil(
    registration.showNotification(data.title, {
      body: data.message,
      icon: '/icons/android-chrome-192x192.png',
      actions: [
        {
            action: "view-content",
            title: "Yes"
        },
        {
            action: "go-home",
            title: "No"
        }
      ],
      vibrate : [300, 100, 400]
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        let client = clientList[0]
        for (const element of clientList) {
          if (element.focused) {
            client = element
          }
        }
        return client.focus()
      }
      return clients.openWindow('/')
    })
  )
})

 self.addEventListener('pushsubscriptionchange', function(event) {
   event.waitUntil(
       Promise.all([
           Promise.resolve(event.oldSubscription ? deleteSubscription(event.oldSubscription) : true),
           Promise.resolve(event.newSubscription ? event.newSubscription : subscribePush(registration))
               .then(function(sub) { return saveSubscription(sub) })
       ])
   )
 })
