self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
      return;
    }
  
    const data = event.data?.json() ?? {};
    const title = data.title || 'ChoreChum Update';
    const message = data.body || 'Something happened in your household!';
    const icon = '/app-icon.svg';
    const badge = '/app-icon.svg'; // Simplified monochrome icon recommended for badges
  
    // Custom Sound Logic
    // Note: iOS Web Push support for custom sounds is limited/evolving.
    // Standard browsers will attempt to play this.
    const sound = '/notification-ping-372479.mp3';
  
    const options = {
      body: message,
      icon: icon,
      badge: badge,
      data: {
        url: data.url || '/dashboard',
      },
      // Actions allow users to interact directly from the notification
      actions: [
        { action: 'view', title: 'View Chore' }
      ],
      vibrate: [100, 50, 100],
      sound: sound,
      tag: 'chore-chum-notification',
      renotify: true
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
  
    // Handle the click action
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
        // If the app is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          let client = clientList[i];
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/dashboard');
        }
      })
    );
  });
  
  // Simple caching strategy for offline fallback page could be added here
  self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
  });