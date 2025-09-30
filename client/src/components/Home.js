import React, { useState, useEffect } from 'react';
import { useDeviceFeatures } from '../hooks/useDeviceFeatures';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { sendNotification } from '../services/notifications';
import { toast, ToastContainer } from '../components/Toast';
import './Home.css';

const Home = () => {
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCalories: 0,
    totalDuration: 0,
    thisWeek: 0,
    avgCaloriesPerWorkout: 0
  });
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    type: 'cardio',
    duration: '',
    calories: ''
  });

  const {
    location,
    requestLocation,
    capturePhoto,
    photo,
    isSupported,
    permissionStatus
  } = useDeviceFeatures();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, workoutsData] = await Promise.all([
        apiService.getStats(),
        apiService.getWorkouts()
      ]);

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (workoutsData.success) {
        setWorkouts(workoutsData.data.slice(0, 3)); // Solo los últimos 3
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Cargar datos desde localStorage si no hay conexión
      const cachedData = storageService.getItem('cachedStats');
      if (cachedData) {
        setStats(cachedData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    
    if (!newWorkout.name.trim() || !newWorkout.duration || !newWorkout.calories) {
      toast.error('Por favor completa todos los campos');
      return;
    }

      const workoutData = {
        ...newWorkout,
        location: location || null,
        image: photo || null,
        duration: parseInt(newWorkout.duration),
        calories: parseInt(newWorkout.calories)
      };

      try {
      const result = await apiService.createWorkout(workoutData);
      
      if (result.success) {
        await loadData();
        setNewWorkout({
          name: '',
          type: 'cardio',
          duration: '',
          calories: ''
        });
        setShowAddForm(false);

        sendNotification('¡Entrenamiento registrado!', {
          body: `Has completado: ${workoutData.name}`,
          icon: '/logo192.png'
        });

        toast.success('¡Entrenamiento agregado exitosamente!');
      }
    } catch (error) {
      console.error('Error creating workout:', error);
      
      const pendingWorkouts = JSON.parse(localStorage.getItem('pendingWorkouts') || '[]');
      pendingWorkouts.push({ ...workoutData, id: Date.now() });
      localStorage.setItem('pendingWorkouts', JSON.stringify(pendingWorkouts));
      
      toast.warning('Sin conexión. El entrenamiento se sincronizará cuando vuelvas a estar online.');
      setShowAddForm(false);
    }
  };

  const handleLocationRequest = async () => {
    try {
      const coords = await requestLocation();
      
      if (coords) {
        toast.location(
          `Ubicación obtenida: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
        );
      }
    } catch (error) {
      toast.error('Error al obtener ubicación: ' + error.message);
    }
  };

  const handlePhotoCapture = async () => {
    try {
      await capturePhoto();
      if (photo) {
        toast.camera('Foto capturada exitosamente');
      }
    } catch (error) {
      toast.error('Error al capturar foto: ' + error.message);
    }
  };

  const getMotivationalMessage = () => {
    const messages = [
      "¡Cada día es una nueva oportunidad!",
      "Tu único límite eres tú mismo",
      "El progreso, no la perfección",
      "¡Hoy es el día perfecto para entrenar!",
      "La constancia es la clave del éxito"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (isLoading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tu progreso...</p>
      </div>
    );
  }

  return (
    <>
    <ToastContainer />

    <div className="home-container">
      <div className="home-header">
        <div className="greeting">
          <h1>¡Hola Atleta! 👋</h1>
          <p className="motivational-message">{getMotivationalMessage()}</p>
        </div>
        
        <button 
          className="add-workout-btn"
          onClick={() => setShowAddForm(true)}
        >
          <span>+</span>
        </button>
      </div>

      {/* Estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">🏃‍♂️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalWorkouts}</span>
            <span className="stat-label">Entrenamientos</span>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalCalories}</span>
            <span className="stat-label">Calorías</span>
          </div>
        </div>

        <div className="stat-card accent">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalDuration}</span>
            <span className="stat-label">Minutos</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.thisWeek}</span>
            <span className="stat-label">Esta semana</span>
          </div>
        </div>
      </div>

      {/* Entrenamientos recientes */}
      <div className="recent-workouts">
        <h2>Entrenamientos Recientes</h2>
        {workouts.length > 0 ? (
          <div className="workout-list">
            {workouts.map((workout) => (
              <div key={workout.id} className="workout-card">
                <div className="workout-type-icon">
                  {workout.type === 'cardio' ? '🏃‍♂️' : workout.type === 'strength' ? '🏋️‍♀️' : '🤸‍♂️'}
                </div>
                <div className="workout-info">
                  <h3>{workout.name}</h3>
                  <div className="workout-details">
                    <span>{workout.duration} min</span>
                    <span>{workout.calories} cal</span>
                    <span>{new Date(workout.date).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-workouts">
            <p>¡Aún no tienes entrenamientos!</p>
            <p>Comienza tu primer entrenamiento hoy 🚀</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            className="action-btn location"
            onClick={handleLocationRequest}
            disabled={!isSupported.geolocation}
          >
            <span className="action-icon">📍</span>
            <span>Ubicación</span>
            {location && <small>✓ Obtenida</small>}
          </button>

          <button 
            className="action-btn camera"
            onClick={handlePhotoCapture}
            disabled={!isSupported.camera}
          >
            <span className="action-icon">📸</span>
            <span>Foto</span>
            {photo && <small>✓ Capturada</small>}
          </button>

          <button 
            className="action-btn notification"
            onClick={() => sendNotification('Test', { body: 'Notificación de prueba' })}
            disabled={permissionStatus !== 'granted'}
          >
            <span className="action-icon">🔔</span>
            <span>Notificar</span>
          </button>
        </div>
      </div>

      {/* Modal para agregar entrenamiento */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Entrenamiento</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddWorkout} className="workout-form">
              <div className="form-group">
                <label>Nombre del entrenamiento</label>
                <input
                  type="text"
                  value={newWorkout.name}
                  onChange={(e) => setNewWorkout({...newWorkout, name: e.target.value})}
                  placeholder="Ej: Cardio matutino"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo de entrenamiento</label>
                <select
                  value={newWorkout.type}
                  onChange={(e) => setNewWorkout({...newWorkout, type: e.target.value})}
                >
                  <option value="cardio">Cardio 🏃‍♂️</option>
                  <option value="strength">Fuerza 🏋️‍♀️</option>
                  <option value="flexibility">Flexibilidad 🤸‍♂️</option>
                  <option value="sports">Deportes ⚽</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duración (min)</label>
                  <input
                    type="number"
                    value={newWorkout.duration}
                    onChange={(e) => setNewWorkout({...newWorkout, duration: e.target.value})}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Calorías</label>
                  <input
                    type="number"
                    value={newWorkout.calories}
                    onChange={(e) => setNewWorkout({...newWorkout, calories: e.target.value})}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-extras">
                {location && (
                  <div className="location-info">
                    📍 Ubicación: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                )}
                
                {photo && (
                  <div className="photo-info">
                    📸 Foto capturada ✓
                  </div>
                )}
              </div>

              <button type="submit" className="submit-btn">
                Agregar Entrenamiento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Home;