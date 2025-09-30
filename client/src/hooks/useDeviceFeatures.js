import { useState, useEffect } from 'react';

export const useDeviceFeatures = () => {
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSupported, setIsSupported] = useState({
    geolocation: false,
    camera: false,
    deviceMotion: false,
    notifications: false
  });

  useEffect(() => {
    checkDeviceSupport();
    
    checkPermissions();

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, []);

  const checkDeviceSupport = () => {
    setIsSupported({
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      deviceMotion: 'DeviceMotionEvent' in window,
      notifications: 'Notification' in window && 'serviceWorker' in navigator
    });
  };

  const checkPermissions = async () => {
    if ('permissions' in navigator) {
      try {
        const notificationPermission = await navigator.permissions.query({ name: 'notifications' });
        setPermissionStatus(notificationPermission.state);
        
        notificationPermission.addEventListener('change', () => {
          setPermissionStatus(notificationPermission.state);
        });
      } catch (error) {
        console.log('Permissions API not fully supported');
        setPermissionStatus(Notification.permission);
      }
    } else {
      setPermissionStatus(Notification.permission);
    }
  };

  // Geolocalización
  const requestLocation = () => {
    return new Promise((resolve, reject) => {
      if (!isSupported.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          setLocation(locationData);
          
          // Guardar en localStorage 
          localStorage.setItem('lastLocation', JSON.stringify(locationData));
          
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Error desconocido';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado';
              break;
            default:
              errorMessage = error.message;
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  // Cámara
  const capturePhoto = () => {
    return new Promise((resolve, reject) => {
      if (!isSupported.camera) {
        reject(new Error('Cámara no soportada'));
        return;
      }

      const constraints = {
        video: {
          facingMode: 'environment', 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          const video = document.createElement('video');
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          video.srcObject = stream;
          video.play();

          video.addEventListener('loadedmetadata', () => {
            // Configurar canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Crear modal para vista previa
            createCameraModal(video, canvas, context, stream, resolve, reject);
          });
        })
        .catch((error) => {
          let errorMessage = 'Error al acceder a la cámara';
          
          if (error.name === 'NotAllowedError') {
            errorMessage = 'Permiso de cámara denegado';
          } else if (error.name === 'NotFoundError') {
            errorMessage = 'Cámara no encontrada';
          } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Cámara no soportada';
          }
          
          reject(new Error(errorMessage));
        });
    });
  };

  const createCameraModal = (video, canvas, context, stream, resolve, reject) => {
    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    `;

    // Estilo del video
    video.style.cssText = `
      max-width: 90%;
      max-height: 70%;
      border-radius: 1rem;
      border: 2px solid #6366f1;
    `;

    // Controles
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    `;

    // Botón capturar
    const captureBtn = document.createElement('button');
    captureBtn.textContent = '📸 Capturar';
    captureBtn.style.cssText = `
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      border: none;
      border-radius: 0.5rem;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      font-weight: 600;
    `;

    // Botón cancelar
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.cssText = `
      padding: 1rem 2rem;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid #ef4444;
      border-radius: 0.5rem;
      color: #ef4444;
      font-size: 1rem;
      cursor: pointer;
      font-weight: 600;
    `;

    // Botón cambiar cámara
    const switchBtn = document.createElement('button');
    switchBtn.textContent = '🔄 Cambiar';
    switchBtn.style.cssText = `
      padding: 1rem 2rem;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      border-radius: 0.5rem;
      color: #10b981;
      font-size: 1rem;
      cursor: pointer;
      font-weight: 600;
    `;

    // Eventos
    captureBtn.addEventListener('click', () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      
      setPhoto(photoData);
      
      // Limpiar
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(modal);
      
      resolve(photoData);
    });

    cancelBtn.addEventListener('click', () => {
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(modal);
      reject(new Error('Captura cancelada'));
    });

    switchBtn.addEventListener('click', () => {
      const currentConstraints = stream.getVideoTracks()[0].getSettings();
      const newFacingMode = currentConstraints.facingMode === 'user' ? 'environment' : 'user';
      
      stream.getTracks().forEach(track => track.stop());
      
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode }
      }).then((newStream) => {
        video.srcObject = newStream;
        stream = newStream;
      }).catch(console.error);
    });

    controls.appendChild(switchBtn);
    controls.appendChild(captureBtn);
    controls.appendChild(cancelBtn);
    
    modal.appendChild(video);
    modal.appendChild(controls);
    
    document.body.appendChild(modal);
  };

  // Acelerómetro
  const handleDeviceMotion = (event) => {
    const acceleration = event.acceleration;
    const rotationRate = event.rotationRate;
    
    if (acceleration) {
      // Detectar movimiento brusco
      const totalAcceleration = Math.sqrt(
        acceleration.x ** 2 + 
        acceleration.y ** 2 + 
        acceleration.z ** 2
      );
      
      if (totalAcceleration > 15) {
        // Disparar evento personalizado para shake
        window.dispatchEvent(new CustomEvent('deviceShake', {
          detail: { acceleration, rotationRate }
        }));
      }
    }
  };

  // Monitoreo de ubicación en tiempo real
  const watchLocation = (callback) => {
    if (!isSupported.geolocation) {
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30000
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed,
          heading: position.coords.heading
        };
        
        setLocation(locationData);
        callback(locationData);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      options
    );
  };

  // Calcular distancia entre dos puntos
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // en km
  };

  return {
    // Estado
    location,
    photo,
    isSupported,
    permissionStatus,
    
    // Funciones
    requestLocation,
    capturePhoto,
    watchLocation,
    calculateDistance,
    
    // Utilidades
    clearPhoto: () => setPhoto(null),
    clearLocation: () => setLocation(null)
  };
};