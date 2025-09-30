const API_BASE_URL = process.env.REACT_APP_API_URL || '';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // Si hay error de red, intentar obtener datos del cache
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        const cachedData = this.getCachedData(endpoint);
        if (cachedData) {
          console.log('Using cached data due to network error');
          return cachedData;
        }
      }
      
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Métodos de caché
  setCachedData(key, data) {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        expires: Date.now() + (5 * 60 * 1000) 
      }));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  getCachedData(key) {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data, expires } = JSON.parse(cached);
        if (Date.now() < expires) {
          return data;
        } else {
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to get cached data:', error);
    }
    return null;
  }

  // Endpoints de entrenamientos
  async getWorkouts() {
    const data = await this.request('/workouts');
    this.setCachedData('/workouts', data);
    return data;
  }

  async createWorkout(workoutData) {
    const data = await this.request('/workouts', {
      method: 'POST',
      body: JSON.stringify(workoutData),
    });
    
    // Invalidar caché después de crear
    this.invalidateCache(['/workouts', '/stats']);
    return data;
  }

  async updateWorkout(id, workoutData) {
    const data = await this.request(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workoutData),
    });
    
    this.invalidateCache(['/workouts', '/stats']);
    return data;
  }

  async deleteWorkout(id) {
    const data = await this.request(`/workouts/${id}`, {
      method: 'DELETE',
    });
    
    this.invalidateCache(['/workouts', '/stats']);
    return data;
  }

  // Endpoint de estadísticas
  async getStats() {
    const data = await this.request('/stats');
    this.setCachedData('/stats', data);
    return data;
  }

  // Endpoints de usuario
  async getUser() {
    const data = await this.request('/user');
    this.setCachedData('/user', data);
    return data;
  }

  async updateUserSettings(settings) {
    const data = await this.request('/user/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
    
    this.invalidateCache(['/user']);
    return data;
  }

  // Utilidades de caché
  invalidateCache(keys) {
    keys.forEach(key => {
      localStorage.removeItem(`cache_${key}`);
    });
  }

  clearAllCache() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Manejo offline
  async syncOfflineData() {
    const pendingWorkouts = JSON.parse(localStorage.getItem('pendingWorkouts') || '[]');
    const syncResults = [];

    for (const workout of pendingWorkouts) {
      try {
        const result = await this.createWorkout(workout);
        if (result.success) {
          syncResults.push({ workout, status: 'success' });
        }
      } catch (error) {
        syncResults.push({ workout, status: 'error', error: error.message });
      }
    }

    // Limpiar datos sincronizados exitosamente
    const failedWorkouts = syncResults
      .filter(result => result.status === 'error')
      .map(result => result.workout);
    
    localStorage.setItem('pendingWorkouts', JSON.stringify(failedWorkouts));

    return syncResults;
  }

  // Guardar datos para sincronización offline
  saveForOfflineSync(data, type = 'workout') {
    const key = `pending${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ ...data, _tempId: Date.now() });
    localStorage.setItem(key, JSON.stringify(existing));
  }

  // Health check del API
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Subida de archivos (imágenes)
  async uploadFile(file, type = 'image') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch(`${this.baseURL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Batch 
  async batchCreateWorkouts(workouts) {
    const data = await this.request('/workouts/batch', {
      method: 'POST',
      body: JSON.stringify({ workouts }),
    });
    
    this.invalidateCache(['/workouts', '/stats']);
    return data;
  }

  // Export/Import data
  async exportData() {
    return await this.request('/export');
  }

  async importData(data) {
    const result = await this.request('/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.clearAllCache();
    return result;
  }

  // Analytics
  async getAnalytics(period = '30d') {
    const data = await this.request(`/analytics?period=${period}`);
    this.setCachedData(`/analytics/${period}`, data);
    return data;
  }

  // Search
  async searchWorkouts(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return await this.request(`/workouts/search?${params}`);
  }

  // Real-time features
  subscribeToUpdates(callback) {
    if ('EventSource' in window) {
      const eventSource = new EventSource(`${this.baseURL}/api/events`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data);
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        eventSource.close();
      };

      return eventSource;
    }
    return null;
  }

  // Network status monitoring
  isOnline() {
    return navigator.onLine;
  }

  onNetworkChange(callback) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Instancia singleton
export const apiService = new ApiService();