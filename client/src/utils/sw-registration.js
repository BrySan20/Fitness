// Service Worker
const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
  );
  
  export function registerSW() {
    if ('serviceWorker' in navigator) {
      const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
      
      if (publicUrl.origin !== window.location.origin) {
        return;
      }
  
      window.addEventListener('load', () => {
        const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
  
        if (isLocalhost) {
          checkValidServiceWorker(swUrl);
        } else {
          registerValidSW(swUrl);
        }
      });
    }
  }
  
  function registerValidSW(swUrl) {
    navigator.serviceWorker
      .register(swUrl)
      .then(registration => {
        console.log('SW registrado correctamente:', registration);
  
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          
          if (installingWorker == null) {
            return;
          }
  
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('Nueva versión del SW disponible');
                showUpdateAvailable(registration);
              } else {
                console.log('SW instalado por primera vez');
                showOfflineReady();
              }
            }
          });
        });
  
        // Verificar actualizaciones cada hora
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch(error => {
        console.error('Error registrando SW:', error);
      });
  }
  
  function checkValidServiceWorker(swUrl) {
    fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    })
      .then(response => {
        const contentType = response.headers.get('content-type');
        
        if (
          response.status === 404 ||
          (contentType != null && contentType.indexOf('javascript') === -1)
        ) {
          // SW no encontrado o no es JS
          navigator.serviceWorker.ready.then(registration => {
            registration.unregister().then(() => {
              window.location.reload();
            });
          });
        } else {
          registerValidSW(swUrl);
        }
      })
      .catch(() => {
        console.log('Sin conexión a internet. App corriendo en modo offline.');
      });
  }
  
  function showUpdateAvailable(registration) {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <div class="update-icon">🔄</div>
        <div class="update-text">
          <h4>Nueva versión disponible</h4>
          <p>Hay una actualización lista para instalar</p>
        </div>
        <div class="update-actions">
          <button id="update-btn" class="btn-update">Actualizar</button>
          <button id="dismiss-btn" class="btn-dismiss">×</button>
        </div>
      </div>
    `;
  
    // Estilos inline
    const styles = `
      <style>
        .update-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #1e293b, #334155);
          border: 1px solid rgba(99, 102, 241, 0.5);
          border-radius: 12px;
          padding: 1rem;
          color: #f8fafc;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          max-width: 320px;
          backdrop-filter: blur(10px);
          animation: slideInRight 0.3s ease-out;
        }
        
        .update-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .update-icon {
          font-size: 1.5rem;
          animation: rotate 2s linear infinite;
        }
        
        .update-text h4 {
          margin: 0 0 0.25rem 0;
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .update-text p {
          margin: 0;
          font-size: 0.8rem;
          color: #cbd5e1;
        }
        
        .update-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .btn-update {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          border: none;
          border-radius: 6px;
          color: white;
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 600;
        }
        
        .btn-dismiss {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.25rem;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .update-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
          }
        }
      </style>
    `;
  
    document.head.insertAdjacentHTML('beforeend', styles);
    document.body.appendChild(notification);
  
    // Botón actualizar
    document.getElementById('update-btn').addEventListener('click', () => {
        const worker = registration.waiting || registration.installing;
        if (worker) {
          worker.postMessage({ type: 'SKIP_WAITING' });
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
        notification.remove();
      });
  
    // Botón cerrar
    document.getElementById('dismiss-btn').addEventListener('click', () => {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    });
  
    // Auto-dismiss después de 10 segundos
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 10000);
  }
  
  function showOfflineReady() {
    const notification = document.createElement('div');
    notification.className = 'offline-ready-notification';
    notification.innerHTML = `
      <div class="offline-ready-content">
        <div class="offline-icon">📱</div>
        <div class="offline-text">
          <h4>¡App lista para usar offline!</h4>
          <p>Ahora puedes usar la aplicación sin conexión</p>
        </div>
      </div>
    `;
  
    const styles = `
      <style>
        .offline-ready-notification {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          padding: 1rem;
          color: white;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
          z-index: 10000;
          animation: slideInUp 0.5s ease-out;
        }
        
        .offline-ready-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          text-align: left;
        }
        
        .offline-icon {
          font-size: 2rem;
        }
        
        .offline-text h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .offline-text p {
          margin: 0;
          font-size: 0.85rem;
          opacity: 0.9;
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;
  
    document.head.insertAdjacentHTML('beforeend', styles);
    document.body.appendChild(notification);
  
    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
      notification.style.animation = 'slideInUp 0.5s ease-out reverse';
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }
  
  export function unregisterSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => {
          registration.unregister();
        })
        .catch(error => {
          console.error('Error unregistering SW:', error);
        });
    }
  }
  
  export function checkSWStatus() {
    if ('serviceWorker' in navigator) {
      return navigator.serviceWorker.ready.then(registration => {
        return {
          isRegistered: true,
          scope: registration.scope,
          active: !!registration.active,
          waiting: !!registration.waiting,
          installing: !!registration.installing
        };
      });
    }
    
    return Promise.resolve({ isRegistered: false });
  }
  
  export function forceSWUpdate() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
  }
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'SW_UPDATE_AVAILABLE':
          console.log('SW update available');
          break;
        case 'SW_OFFLINE_READY':
          console.log('SW offline ready');
          break;
        case 'SW_CACHE_UPDATED':
          console.log('SW cache updated:', payload);
          break;
        default:
          console.log('SW message:', event.data);
      }
    });
  }