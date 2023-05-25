'use strict'

self.addEventListener("canmakepayment", (e) => {
  e.respondWith(
    new Promise((resolve, reject) => {
      someAppSpecificLogic()
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    })
  );
});

let payment_request_event;
let resolver;
let client;

// `self` is the global object in service worker
self.addEventListener("paymentrequest", async (e) => {
  if (payment_request_event) {
    // If there's an ongoing payment transaction, reject it.
    resolver.reject();
  }
  // Preserve the event for future use
  payment_request_event = e;

});

let countPush = 0

self.addEventListener('push', function (event) {
  const data = JSON.parse(event.data.text())
  if (navigator.setAppBadge) {
    countPush++
    navigator.setAppBadge(countPush)
  }
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
      vibrate: [300, 100, 400]
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  if (navigator.setAppBadge) {
    countPush = 0
    navigator.setAppBadge(0)
  }
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

self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    Promise.all([
      Promise.resolve(event.oldSubscription ? deleteSubscription(event.oldSubscription) : true),
      Promise.resolve(event.newSubscription ? event.newSubscription : subscribePush(registration))
        .then(function (sub) { return saveSubscription(sub) })
    ])
  )
})
