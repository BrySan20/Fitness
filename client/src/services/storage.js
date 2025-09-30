class StorageService {
    constructor() {
      this.isSupported = typeof Storage !== 'undefined';
      this.prefix = 'fitness_tracker_';
    }
  
    // Métodos de localStorage
    setItem(key, value, expiration = null) {
      if (!this.isSupported) {
        console.warn('LocalStorage no soportado');
        return false;
      }
  
      try {
        const data = {
          value,
          timestamp: Date.now(),
          expiration: expiration ? Date.now() + expiration : null
        };
  
        localStorage.setItem(
          this.prefix + key, 
          JSON.stringify(data)
        );
        return true;
      } catch (error) {
        console.error('Error guardando en localStorage:', error);
        return false;
      }
    }
  
    getItem(key) {
      if (!this.isSupported) return null;
  
      try {
        const item = localStorage.getItem(this.prefix + key);
        if (!item) return null;
  
        const data = JSON.parse(item);
        
        // Verificar expiración
        if (data.expiration && Date.now() > data.expiration) {
          this.removeItem(key);
          return null;
        }
  
        return data.value;
      } catch (error) {
        console.error('Error obteniendo de localStorage:', error);
        return null;
      }
    }
  
    removeItem(key) {
      if (!this.isSupported) return false;
  
      try {
        localStorage.removeItem(this.prefix + key);
        return true;
      } catch (error) {
        console.error('Error eliminando de localStorage:', error);
        return false;
      }
    }
  
    clear() {
      if (!this.isSupported) return false;
  
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
        return true;
      } catch (error) {
        console.error('Error limpiando localStorage:', error);
        return false;
      }
    }
  
    // Configuraciones de usuario
    saveUserSettings(settings) {
      return this.setItem('user_settings', settings);
    }
  
    getUserSettings() {
      const defaultSettings = {
        theme: 'dark',
        language: 'es',
        units: 'metric',
        notifications: {
          enabled: true,
          workoutReminders: true,
          goalNotifications: true,
          motivationalMessages: true,
          reminderTimes: ['09:00', '18:00']
        },
        privacy: {
          shareLocation: false,
          shareWorkouts: false,
          publicProfile: false
        },
        goals: {
          weeklyWorkouts: 4,
          weeklyMinutes: 150,
          weeklyCalories: 1500
        }
      };
  
      const saved = this.getItem('user_settings');
      return saved ? { ...defaultSettings, ...saved } : defaultSettings;
    }
  
    // Cache de datos offline
    cacheWorkouts(workouts) {
      return this.setItem('cached_workouts', workouts, 24 * 60 * 60 * 1000); // 24 horas
    }
  
    getCachedWorkouts() {
      return this.getItem('cached_workouts') || [];
    }
  
    cacheStats(stats) {
      return this.setItem('cached_stats', stats, 60 * 60 * 1000); // 1 hora
    }
  
    getCachedStats() {
      return this.getItem('cached_stats');
    }
  
    // Datos pendientes
    addPendingWorkout(workout) {
      const pending = this.getPendingWorkouts();
      const workoutWithId = { ...workout, _tempId: Date.now() };
      pending.push(workoutWithId);
      return this.setItem('pending_workouts', pending);
    }
  
    getPendingWorkouts() {
      return this.getItem('pending_workouts') || [];
    }
  
    removePendingWorkout(tempId) {
      const pending = this.getPendingWorkouts();
      const updated = pending.filter(w => w._tempId !== tempId);
      return this.setItem('pending_workouts', updated);
    }
  
    clearPendingWorkouts() {
      return this.removeItem('pending_workouts');
    }
  
    // Historial y estadísticas
    saveWorkoutHistory(workouts) {
      return this.setItem('workout_history', workouts);
    }
  
    getWorkoutHistory() {
      return this.getItem('workout_history') || [];
    }
  
    addToWorkoutHistory(workout) {
      const history = this.getWorkoutHistory();
      history.unshift(workout);
      
      if (history.length > 100) {
        history.splice(100);
      }
      
      return this.saveWorkoutHistory(history);
    }
  
    // Favoritos y plantillas
    saveFavoriteWorkouts(favorites) {
      return this.setItem('favorite_workouts', favorites);
    }
  
    getFavoriteWorkouts() {
      return this.getItem('favorite_workouts') || [];
    }
  
    addFavoriteWorkout(workout) {
      const favorites = this.getFavoriteWorkouts();
      const exists = favorites.find(f => f.name === workout.name && f.type === workout.type);
      
      if (!exists) {
        favorites.push({
          ...workout,
          favoriteId: Date.now(),
          addedDate: new Date().toISOString()
        });
        return this.saveFavoriteWorkouts(favorites);
      }
      
      return false;
    }
  
    removeFavoriteWorkout(favoriteId) {
      const favorites = this.getFavoriteWorkouts();
      const updated = favorites.filter(f => f.favoriteId !== favoriteId);
      return this.saveFavoriteWorkouts(updated);
    }
  
    // Plantillas de entrenamiento
    saveWorkoutTemplates(templates) {
      return this.setItem('workout_templates', templates);
    }
  
    getWorkoutTemplates() {
      return this.getItem('workout_templates') || this.getDefaultTemplates();
    }
  
    getDefaultTemplates() {
      return [
        {
          id: 1,
          name: 'Cardio Básico',
          type: 'cardio',
          estimatedDuration: 30,
          estimatedCalories: 300,
          description: 'Entrenamiento cardiovascular básico',
          exercises: ['Correr', 'Saltar cuerda', 'Burpees']
        },
        {
          id: 2,
          name: 'Fuerza Completa',
          type: 'strength',
          estimatedDuration: 45,
          estimatedCalories: 400,
          description: 'Entrenamiento de fuerza para todo el cuerpo',
          exercises: ['Sentadillas', 'Flexiones', 'Dominadas', 'Plancha']
        },
        {
          id: 3,
          name: 'Flexibilidad',
          type: 'flexibility',
          estimatedDuration: 20,
          estimatedCalories: 80,
          description: 'Estiramientos y yoga',
          exercises: ['Yoga', 'Estiramientos', 'Meditación']
        }
      ];
    }
  
    addWorkoutTemplate(template) {
      const templates = this.getWorkoutTemplates();
      const newTemplate = {
        ...template,
        id: Date.now(),
        createdDate: new Date().toISOString()
      };
      templates.push(newTemplate);
      return this.saveWorkoutTemplates(templates);
    }
  
    // Progreso y metas
    saveProgress(progress) {
      return this.setItem('user_progress', progress);
    }
  
    getProgress() {
      const defaultProgress = {
        totalWorkouts: 0,
        totalMinutes: 0,
        totalCalories: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyGoals: {
          workouts: 0,
          minutes: 0,
          calories: 0
        },
        monthlyStats: {},
        lastWorkoutDate: null,
        achievements: []
      };
  
      const saved = this.getProgress();
      return saved ? { ...defaultProgress, ...saved } : defaultProgress;
    }
  
    updateProgress(workoutData) {
      const progress = this.getProgress();
      const today = new Date().toDateString();
      
      // Actualizar estadísticas básicas
      progress.totalWorkouts += 1;
      progress.totalMinutes += workoutData.duration;
      progress.totalCalories += workoutData.calories;
      
      // Actualizar racha
      if (progress.lastWorkoutDate === today) {
      } else if (this.isConsecutiveDay(progress.lastWorkoutDate)) {
        progress.currentStreak += 1;
      } else {
        progress.currentStreak = 1;
      }
      
      progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
      progress.lastWorkoutDate = today;
      
      // Actualizar estadísticas semanales
      this.updateWeeklyProgress(progress, workoutData);
      
      // Verificar logros
      this.checkAchievements(progress);
      
      return this.saveProgress(progress);
    }
  
    isConsecutiveDay(lastDate) {
      if (!lastDate) return false;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      return new Date(lastDate).toDateString() === yesterday.toDateString();
    }
  
    updateWeeklyProgress(progress, workoutData) {
      const thisWeek = this.getWeekStart();
      
      if (!progress.weeklyStats) progress.weeklyStats = {};
      if (!progress.weeklyStats[thisWeek]) {
        progress.weeklyStats[thisWeek] = { workouts: 0, minutes: 0, calories: 0 };
      }
      
      progress.weeklyStats[thisWeek].workouts += 1;
      progress.weeklyStats[thisWeek].minutes += workoutData.duration;
      progress.weeklyStats[thisWeek].calories += workoutData.calories;
    }
  
    getWeekStart() {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day;
      return new Date(now.setDate(diff)).toDateString();
    }
  
    checkAchievements(progress) {
      const achievements = progress.achievements || [];
      const newAchievements = [];
  
      // Logros por cantidad de entrenamientos
      const workoutMilestones = [1, 5, 10, 25, 50, 100, 250, 500];
      workoutMilestones.forEach(milestone => {
        if (progress.totalWorkouts >= milestone && 
            !achievements.find(a => a.type === 'workouts' && a.value === milestone)) {
          newAchievements.push({
            type: 'workouts',
            value: milestone,
            name: `${milestone} Entrenamientos`,
            description: `Has completado ${milestone} entrenamientos`,
            date: new Date().toISOString(),
            icon: '🏃‍♂️'
          });
        }
      });
  
      // Logros por racha
      const streakMilestones = [3, 7, 14, 30, 60, 100];
      streakMilestones.forEach(milestone => {
        if (progress.currentStreak >= milestone && 
            !achievements.find(a => a.type === 'streak' && a.value === milestone)) {
          newAchievements.push({
            type: 'streak',
            value: milestone,
            name: `Racha de ${milestone} días`,
            description: `Has entrenado ${milestone} días consecutivos`,
            date: new Date().toISOString(),
            icon: '🔥'
          });
        }
      });
  
      // Logros por calorías
      const calorieMilestones = [1000, 5000, 10000, 25000, 50000];
      calorieMilestones.forEach(milestone => {
        if (progress.totalCalories >= milestone && 
            !achievements.find(a => a.type === 'calories' && a.value === milestone)) {
          newAchievements.push({
            type: 'calories',
            value: milestone,
            name: `${milestone} Calorías`,
            description: `Has quemado ${milestone} calorías en total`,
            date: new Date().toISOString(),
            icon: '🔥'
          });
        }
      });
  
      if (newAchievements.length > 0) {
        progress.achievements = [...achievements, ...newAchievements];
        
        // Notificar sobre nuevos logros
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('newAchievements', {
            detail: newAchievements
          }));
        }
      }
    }
  
    // Exportar/Importar datos
    exportAllData() {
      const data = {
        settings: this.getUserSettings(),
        workouts: this.getCachedWorkouts(),
        history: this.getWorkoutHistory(),
        favorites: this.getFavoriteWorkouts(),
        templates: this.getWorkoutTemplates(),
        progress: this.getProgress(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
  
      return data;
    }
  
    importData(data) {
        try {
          if (data.settings) this.saveUserSettings(data.settings);
          if (data.workouts) this.cacheWorkouts(data.workouts);
          if (data.history) this.saveWorkoutHistory(data.history);
          if (data.favorites) this.saveFavoriteWorkouts(data.favorites);
          if (data.templates) this.saveWorkoutTemplates(data.templates);
        } catch (error) {
          console.error('Error importando datos:', error);
        }
      }
  }
  
  export const storageService = new StorageService();
  