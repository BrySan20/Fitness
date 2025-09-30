class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
  }

  // Solicitar permisos de notificación
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Notificaciones no soportadas en este dispositivo');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permisos de notificación concedidos');
    } else if (permission === 'denied') {
      console.log('Permisos de notificación denegados');
    } else {
      console.log('Permisos de notificación pendientes');
    }

    return permission;
  }

  // Enviar notificación local simple
  async sendLocalNotification(title, options = {}) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.warn('No se pueden enviar notificaciones');
      return false;
    }

    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'fitness-notification',
      ...options
    };

    return new Notification(title, defaultOptions);
  }

  // Notificaciones predefinidas
  async workoutReminder() {
    return await this.sendLocalNotification('🏃‍♂️ Hora de Entrenar', {
      body: '¡Es momento de mantener tu rutina de ejercicios!'
    });
  }

  async workoutCompleted(workoutName, calories) {
    return await this.sendLocalNotification('🎉 ¡Entrenamiento Completado!', {
      body: `${workoutName} - ${calories} calorías quemadas`
    });
  }

  async goalAchieved(goalType, value) {
    const goalMessages = {
      calories: `¡Meta alcanzada! ${value} calorías quemadas`,
      workouts: `¡Increíble! ${value} entrenamientos completados`,
      streak: `¡Racha de ${value} días consecutivos!`,
      time: `¡${value} minutos de ejercicio completados!`
    };

    return await this.sendLocalNotification('🎯 Meta Alcanzada', {
      body: goalMessages[goalType] || `¡Has alcanzado tu meta de ${goalType}!`
    });
  }

  async motivationalPush() {
    const messages = [
      'Tu cuerpo puede, tu mente es lo que necesitas convencer',
      'El dolor que sientes hoy será la fuerza que sentirás mañana',
      'No se trata de ser perfecto, se trata de ser mejor',
      'La única manera de hacer un gran trabajo es amar lo que haces',
      'Cada entrenamiento te acerca más a tu mejor versión'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    return await this.sendLocalNotification('💭 Motivación del Día', {
      body: randomMessage
    });
  }

  // Estado de permisos
  getPermissionStatus() {
    if (!this.isSupported) return 'not-supported';
    return Notification.permission;
  }

  // Configuraciones de usuario
  saveNotificationPreferences(preferences) {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }

  getNotificationPreferences() {
    const defaultPrefs = {
      workoutReminders: true,
      goalNotifications: true,
      motivationalMessages: true,
      soundEnabled: true,
      vibrationEnabled: true
    };

    try {
      const saved = localStorage.getItem('notificationPreferences');
      return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
    } catch (error) {
      return defaultPrefs;
    }
  }

  // Test de notificaciones
  async testNotification() {
    return await this.sendLocalNotification('🧪 Notificación de Prueba', {
      body: 'Si ves esto, las notificaciones están funcionando correctamente',
      tag: 'test-notification'
    });
  }
}

// Instancia singleton
const notificationService = new NotificationService();

// Funciones de conveniencia exportadas
export const requestNotificationPermission = () => 
  notificationService.requestPermission();

export const sendNotification = (title, options) => 
  notificationService.sendLocalNotification(title, options);

export const workoutCompleted = (name, calories) => 
  notificationService.workoutCompleted(name, calories);

export const goalAchieved = (type, value) => 
  notificationService.goalAchieved(type, value);

export const sendMotivationalPush = () => 
  notificationService.motivationalPush();

export const testNotifications = () => 
  notificationService.testNotification();

export { notificationService };