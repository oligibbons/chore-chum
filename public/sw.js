self.addEventListener('push', function (event) {
  let data = {};
  
  // 1. Safe Data Parsing
  // Prevents the Service Worker from crashing if the server sends bad JSON
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    console.warn('Push payload was not JSON, falling back to text.', err);
    data = {
      title: 'ChoreChum Update',
      body: event.data ? event.data.text() : 'Something happened in your household!',
    };
  }

  const title = data.title || 'ChoreChum Update';
  const message = data.body || 'Something happened in your household!';
  const icon = '/app-icon.svg';
  
  // Note: For Android, a pure monochrome PNG is highly recommended for the badge. 
  // If you add one later, change this to '/badge-icon.png'
  const badge = '/app-icon.svg'; 
  const sound = '/notification-ping-372479.mp3';

  const options = {
    body: message,
    icon: icon,
    badge: badge,
    data: {
      url: data.url || '/dashboard', // The page to open when clicked
    },
    actions: [
      { action: 'view', title: 'View Chore' }
    ],
    vibrate: [100, 50, 100],
    sound: sound,
    tag: 'chore-chum-notification',
    renotify: true
  };

  // 2. We removed the restrictive permission check here.
  // Letting the browser handle it prevents silent drops and warning messages.
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = event.notification.data.url || '/dashboard';

  // 3. Smarter Tab Routing
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Look for ANY open window of our app, regardless of the current page
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        
        // Check if the open tab belongs to our website
        if (client.url && client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus();
          
          // Navigate that existing tab to the specific chore URL
          if ('navigate' in client && client.url !== (self.location.origin + targetUrl)) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      
      // If the app is fully closed, open a brand new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});