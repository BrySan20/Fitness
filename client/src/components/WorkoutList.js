import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { toast, ToastContainer } from '../components/Toast';
import './WorkoutList.css';

const WorkoutList = () => {
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      const result = await apiService.getWorkouts();
      
      if (result.success) {
        setWorkouts(result.data);
        storageService.cacheWorkouts(result.data);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      // Cargar desde caché si hay error
      const cachedWorkouts = storageService.getCachedWorkouts();
      setWorkouts(cachedWorkouts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('¿Estás seguro de eliminar este entrenamiento?')) {
      return;
    }

    try {
      const result = await apiService.deleteWorkout(workoutId);
      
      if (result.success) {
        setWorkouts(workouts.filter(w => w.id !== workoutId));
        toast.success('Entrenamiento eliminado exitosamente');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Error al eliminar entrenamiento');
    }
  };

  // Filtrar y ordenar entrenamientos
  const filteredAndSortedWorkouts = workouts
    .filter(workout => {
      const matchesType = filterType === 'all' || workout.type === filterType;
      const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'calories':
          return b.calories - a.calories;
        case 'duration':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

  const getWorkoutTypeIcon = (type) => {
    const icons = {
      cardio: '🏃‍♂️',
      strength: '🏋️‍♀️',
      flexibility: '🤸‍♂️',
      sports: '⚽',
      other: '🏃‍♂️'
    };
    return icons[type] || icons.other;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="workout-list-loading">
        <div className="loading-spinner"></div>
        <p>Cargando entrenamientos...</p>
      </div>
    );
  }

  return (
    <>
    <ToastContainer />
    <div className="workout-list-container">
      <div className="workout-list-header">
        <h1>💪 Mis Entrenamientos</h1>
        <p>Historial completo de tus sesiones</p>
      </div>
  
      {/* Controles de filtro y búsqueda */}
      <div className="workout-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Buscar entrenamientos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-container">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los tipos</option>
            <option value="cardio">🏃‍♂️ Cardio</option>
            <option value="strength">🏋️‍♀️ Fuerza</option>
            <option value="flexibility">🤸‍♂️ Flexibilidad</option>
            <option value="sports">⚽ Deportes</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">📅 Por fecha</option>
            <option value="name">📝 Por nombre</option>
            <option value="calories">🔥 Por calorías</option>
            <option value="duration">⏱️ Por duración</option>
          </select>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-value">{workouts.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {workouts.reduce((sum, w) => sum + w.calories, 0).toLocaleString()}
          </span>
          <span className="stat-label">Calorías</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {Math.round(workouts.reduce((sum, w) => sum + w.duration, 0) / 60)}h
          </span>
          <span className="stat-label">Tiempo</span>
        </div>
      </div>

      {/* Lista de entrenamientos */}
      {filteredAndSortedWorkouts.length === 0 ? (
        <div className="no-workouts">
          <div className="no-workouts-icon">🏃‍♂️</div>
          <h3>No se encontraron entrenamientos</h3>
          <p>
            {searchTerm || filterType !== 'all' 
              ? 'Intenta cambiar los filtros de búsqueda' 
              : 'Comienza tu primer entrenamiento hoy'
            }
          </p>
        </div>
      ) : (
        <div className="workouts-grid">
          {filteredAndSortedWorkouts.map((workout) => (
            <div 
              key={workout.id} 
              className="workout-card"
              onClick={() => setSelectedWorkout(workout)}
            >
              <div className="workout-card-header">
                <div className="workout-type-icon">
                  {getWorkoutTypeIcon(workout.type)}
                </div>
                <div className="workout-meta">
                  <h3 className="workout-name">{workout.name}</h3>
                  <div className="workout-date">
                    {formatDate(workout.date)} • {formatTime(workout.date)}
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWorkout(workout.id);
                  }}
                  aria-label="Eliminar entrenamiento"
                >
                  🗑️
                </button>
              </div>

              <div className="workout-stats">
                <div className="stat">
                  <span className="stat-icon">⏱️</span>
                  <span className="stat-text">{workout.duration} min</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">🔥</span>
                  <span className="stat-text">{workout.calories} cal</span>
                </div>
                {workout.location && (
                  <div className="stat">
                    <span className="stat-icon">📍</span>
                    <span className="stat-text">
                      {workout.location.lat.toFixed(2)}, {workout.location.lng.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {workout.image && (
                <div className="workout-image-preview">
                  <img 
                    src={workout.image} 
                    alt={`Imagen de ${workout.name}`}
                    loading="lazy"
                  />
                </div>
              )}

              <div className="workout-type-badge">
                <span className="badge badge-primary">
                  {workout.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles del entrenamiento */}
      {selectedWorkout && (
        <div className="workout-modal-overlay" onClick={() => setSelectedWorkout(null)}>
          <div className="workout-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-container">
                <span className="modal-icon">
                  {getWorkoutTypeIcon(selectedWorkout.type)}
                </span>
                <h2>{selectedWorkout.name}</h2>
              </div>
              <button 
                className="modal-close"
                onClick={() => setSelectedWorkout(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="workout-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Tipo</span>
                  <span className="detail-value">{selectedWorkout.type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Duración</span>
                  <span className="detail-value">{selectedWorkout.duration} minutos</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Calorías</span>
                  <span className="detail-value">{selectedWorkout.calories}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Fecha</span>
                  <span className="detail-value">
                    {new Date(selectedWorkout.date).toLocaleString('es-MX')}
                  </span>
                </div>
                {selectedWorkout.location && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Latitud</span>
                      <span className="detail-value">{selectedWorkout.location.lat.toFixed(6)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Longitud</span>
                      <span className="detail-value">{selectedWorkout.location.lng.toFixed(6)}</span>
                    </div>
                  </>
                )}
              </div>

              {selectedWorkout.image && (
                <div className="workout-full-image">
                  <img 
                    src={selectedWorkout.image} 
                    alt={`Imagen completa de ${selectedWorkout.name}`}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    // Compartir entrenamiento
                    if (navigator.share) {
                      navigator.share({
                        title: `Entrenamiento: ${selectedWorkout.name}`,
                        text: `Completé ${selectedWorkout.name} - ${selectedWorkout.duration} min, ${selectedWorkout.calories} cal`,
                        url: window.location.href
                      });
                    } else {
                      // Fallback: copiar al portapapeles
                      const shareText = `Completé ${selectedWorkout.name} - ${selectedWorkout.duration} min, ${selectedWorkout.calories} cal 💪`;
                      navigator.clipboard.writeText(shareText);
                      toast.success('Texto copiado al portapapeles');
                    }
                  }}
                >
                  📤 Compartir
                </button>
                
                <button
                  className="btn-danger"
                  onClick={() => {
                    setSelectedWorkout(null);
                    handleDeleteWorkout(selectedWorkout.id);
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        className="fab"
        onClick={() => window.location.href = '/'}
        aria-label="Agregar nuevo entrenamiento"
      >
        <span>+</span>
      </button>
    </div>
    </>
  );
};

export default WorkoutList;