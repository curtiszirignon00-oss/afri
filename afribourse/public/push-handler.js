// push-handler.js
// Gestionnaire de push notifications pour le service worker
// Importé par Workbox via importScripts

// Événement push : afficher la notification
self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'AfriBourse',
      body: event.data.text(),
    };
  }

  const title = data.title || 'AfriBourse';
  const options = {
    body: data.body || '',
    icon: '/images/logo_afribourse.png',
    badge: '/AppImages/android/android-launchericon-192-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type || 'general',
    },
    actions: data.actions || [],
    tag: data.tag || 'afribourse-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Événement click sur notification : naviguer vers l'URL
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Si une fenêtre est déjà ouverte, la focus et naviguer
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Événement close notification (analytics optionnel)
self.addEventListener('notificationclose', function(event) {
  // Optionnel: tracker les notifications fermées sans clic
  console.log('[SW] Notification closed:', event.notification.tag);
});
