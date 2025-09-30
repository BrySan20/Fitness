import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      path: '/',
      icon: '🏠',
      label: 'Inicio',
      activeIcon: '🏡'
    },
    {
      path: '/workouts',
      icon: '💪',
      label: 'Entrenamientos',
      activeIcon: '🏋️‍♂️'
    },
    {
      path: '/stats',
      icon: '📊',
      label: 'Estadísticas',
      activeIcon: '📈'
    },
    {
      path: '/profile',
      icon: '👤',
      label: 'Perfil',
      activeIcon: '👨‍💼'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    
    // Haptic feedback si está disponible
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <nav className="bottom-navigation">
      <div className="nav-container">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              onClick={() => handleNavigation(item.path)}
              aria-label={item.label}
            >
              <div className="nav-icon">
                <span className="icon-emoji">
                  {isActive ? item.activeIcon : item.icon}
                </span>
                {isActive && <div className="nav-indicator"></div>}
              </div>
              <span className={`nav-label ${isActive ? 'nav-label-active' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Indicador de conexión */}
      <div className="connection-indicator">
        <div className={`connection-dot ${navigator.onLine ? 'online' : 'offline'}`}></div>
      </div>
    </nav>
  );
};

export default Navigation;