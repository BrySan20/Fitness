import React, { useState, useEffect } from 'react';
import './Toast.css';

let toastId = 0;
let toastCallbacks = [];

export const showToast = (message, type = 'info', duration = 3000) => {
  const id = toastId++;
  const toast = { id, message, type, duration };
  
  toastCallbacks.forEach(callback => callback(toast));
  
  return id;
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const addToast = (toast) => {
      console.log('Adding toast:', toast);
      setToasts(prev => [...prev, toast]);
      
      if (toast.duration > 0) {
        setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
      }
    };

    toastCallbacks.push(addToast);

    return () => {
      toastCallbacks = toastCallbacks.filter(cb => cb !== addToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'location': return '📍';
      case 'camera': return '📸';
      default: return '🔔';
    }
  };

  console.log('ToastContainer rendering, toasts:', toasts); // DEBUG

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className="toast-icon">{getIcon(toast.type)}</span>
          <span className="toast-message">{toast.message}</span>
          <button 
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export const toast = {
  success: (message, duration = 3000) => showToast(message, 'success', duration),
  error: (message, duration = 3000) => showToast(message, 'error', duration),
  warning: (message, duration = 3000) => showToast(message, 'warning', duration),
  info: (message, duration = 3000) => showToast(message, 'info', duration),
  location: (message, duration = 3000) => showToast(message, 'location', duration),
  camera: (message, duration = 3000) => showToast(message, 'camera', duration),
};