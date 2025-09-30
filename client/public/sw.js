const CACHE_NAME = 'fitness-tracker-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Archivos en caché');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Instalación completa');
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antigua', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activación completa');
      return self.clients.claim();
    })
  );
});

// Cache para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests 
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            return new Response(JSON.stringify({
              success: false,
              message: 'Sin conexión a internet',
              offline: true,
              data: []
            }), {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Assets estáticos
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          // Agregar al caché
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(() => {
          if (request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background Sync', event.tag);
  
  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkouts());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push recibido', event);
  
  const options = {
    body: event.data ? event.data.text() : '¡Es hora de entrenar!',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Entrenamientos',
        icon: '/icon-explore.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-close.png'
      }
    ],
    tag: 'fitness-notification',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification('💪 Fitness Tracker', options)
  );
});

// Manejo de clics
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notificación clickeada', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/?from=notification')
    );
  } else if (event.action === 'close') {
    return;
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

async function syncWorkouts() {
  try {
    const pendingWorkouts = await getPendingWorkouts();
    
    for (const workout of pendingWorkouts) {
      try {
        const response = await fetch('/api/workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workout)
        });
        
        if (response.ok) {
          await removePendingWorkout(workout.id);
          console.log('Workout sincronizado:', workout.name);
        }
      } catch (error) {
        console.error('Error sincronizando workout:', error);
      }
    }
  } catch (error) {
    console.error('Error en sync:', error);
  }
}

async function getPendingWorkouts() {
  return JSON.parse(localStorage.getItem('pendingWorkouts') || '[]');
}

async function removePendingWorkout(id) {
  const pending = JSON.parse(localStorage.getItem('pendingWorkouts') || '[]');
  const updated = pending.filter(w => w.id !== id);
  localStorage.setItem('pendingWorkouts', JSON.stringify(updated));
}

// Página offline
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Registrado correctamente');