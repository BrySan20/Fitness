import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Splash from './components/Splash';
import Home from './components/Home';
import WorkoutList from './components/WorkoutList';
import Navigation from './components/Navigation';
import { registerSW } from './utils/sw-registration';
import { requestNotificationPermission } from './services/notifications';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    // Registro del Service Worker
    registerSW();

    // Solicitar permisos de notificaciones
    requestNotificationPermission();

    // Manejar eventos de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA Install Prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Ocultar splash después de 3 segundos
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    const result = await installPrompt.prompt();
    console.log('Install prompt result:', result);
    setInstallPrompt(null);
  };

  if (showSplash) {
    return <Splash />;
  }

  return (
    <div className="app">
      <Router>
        {/* Barra de estado offline */}
        {!isOnline && (
          <div className="offline-banner">
            <span>📡 Sin conexión - Trabajando en modo offline</span>
          </div>
        )}

        {/* Botón de instalación PWA */}
        {installPrompt && (
          <div className="install-prompt">
            <button onClick={handleInstallClick} className="install-btn">
              📱 Instalar App
            </button>
          </div>
        )}

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workouts" element={<WorkoutList />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <Navigation />
      </Router>
    </div>
  );
}

export default App;