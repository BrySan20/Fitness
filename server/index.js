const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./firebase');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PORT || 5000;

// Sirve los archivos estáticos de React (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Sirve el index.html de React para cualquier ruta que no sea de la API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:tuemail@dominio.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

app.get('/api/notifications/public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', (req, res) => {
  const subscription = req.body;
  console.log('Nueva suscripción:', subscription);
  res.status(201).json({ success: true, message: 'Suscripción registrada' });
});

// Endpoint para enviar notificación (prueba)
app.post('/api/push/send', async (req, res) => {
  const { subscription, payload } = req.body;

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({ error: 'Error enviando notificación' });
  }
});

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../client/build')));

// Rutas API

// Crear workout
app.get('/api/workouts', async (req, res) => {
  try {
    const snapshot = await db.collection('workouts').orderBy('date', 'desc').get();
    const workouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: workouts, message: 'Entrenamientos obtenidos' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener entrenamientos', error: error.message });
  }
});

app.post('/api/workouts', async (req, res) => {
  try {
    const { name, type, duration, calories, location, image } = req.body;
    const newWorkout = {
      name,
      type,
      duration: parseInt(duration),
      calories: parseInt(calories),
      date: new Date().toISOString(),
      location: location || null,
      image: image || null
    };
    const docRef = await db.collection('workouts').add(newWorkout);
    res.json({ success: true, data: { id: docRef.id, ...newWorkout }, message: 'Entrenamiento creado' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al crear entrenamiento', error: error.message });
  }
});

app.delete('/api/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('workouts').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: 'Entrenamiento no encontrado' });
    }
    await docRef.delete();
    res.json({ success: true, message: 'Entrenamiento eliminado' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al eliminar entrenamiento', error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const snapshot = await db.collection('workouts').get();
    const workouts = snapshot.docs.map(doc => doc.data());

    // Calcular estadísticas
    const totalWorkouts = workouts.length;
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

    // Estadísticas de esta semana
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= weekStart;
    });

    const thisWeek = thisWeekWorkouts.length;
    const avgCaloriesPerWorkout = totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0;

    const stats = {
      totalWorkouts,
      totalCalories,
      totalDuration,
      thisWeek,
      avgCaloriesPerWorkout
    };

    res.json({ success: true, data: stats, message: 'Estadísticas obtenidas' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas', error: error.message });
  }
});
  
  // Obtener usuario
  app.get('/api/user', async (req, res) => {
    try {
      const snapshot = await db.collection('users').limit(1).get();
      if (snapshot.empty) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      const user = snapshot.docs[0];
      res.json({ success: true, data: { id: user.id, ...user.data() } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener usuario', error: error.message });
    }
  });
  
  app.put('/api/user/settings', async (req, res) => {
    try {
      const { settings } = req.body;
      const snapshot = await db.collection('users').limit(1).get();
      if (snapshot.empty) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      const userRef = snapshot.docs[0].ref;
      await userRef.update({ settings });
      const updatedUser = await userRef.get();
      res.json({ success: true, data: { id: updatedUser.id, ...updatedUser.data() }, message: 'Configuración actualizada' });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Error al actualizar configuración', error: error.message });
    }
  });
  
  // SSR Route
  app.get('/ssr', async (req, res) => {
    try {
      const snapshot = await db.collection('workouts').orderBy('date', 'desc').limit(10).get();
      const workouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      const totalWorkouts = workouts.length;
      const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
      const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  
      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fitness Tracker - Vista SSR</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              color: #f8fafc;
              padding: 2rem;
              min-height: 100vh;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .header {
              text-align: center;
              margin-bottom: 3rem;
              padding: 2rem;
              background: rgba(99, 102, 241, 0.1);
              border-radius: 1rem;
              border: 1px solid rgba(99, 102, 241, 0.3);
            }
            .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
            .header p { color: #cbd5e1; font-size: 1.1rem; }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 1.5rem;
              margin-bottom: 3rem;
            }
            .stat-card {
              background: linear-gradient(135deg, #1e293b, #334155);
              padding: 2rem;
              border-radius: 1rem;
              border: 1px solid rgba(99, 102, 241, 0.3);
              text-align: center;
            }
            .stat-icon { font-size: 3rem; margin-bottom: 1rem; }
            .stat-value {
              font-size: 2.5rem;
              font-weight: bold;
              background: linear-gradient(135deg, #6366f1, #ec4899);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              display: block;
              margin-bottom: 0.5rem;
            }
            .stat-label { color: #cbd5e1; font-size: 1rem; }
            .workouts-section h2 {
              font-size: 1.8rem;
              margin-bottom: 1.5rem;
              color: #f8fafc;
            }
            .workout-card {
              background: linear-gradient(135deg, #1e293b, #334155);
              padding: 1.5rem;
              border-radius: 1rem;
              border: 1px solid rgba(99, 102, 241, 0.2);
              margin-bottom: 1rem;
            }
            .workout-header {
              display: flex;
              align-items: center;
              gap: 1rem;
              margin-bottom: 1rem;
            }
            .workout-icon { font-size: 2rem; }
            .workout-name { font-size: 1.3rem; font-weight: 600; }
            .workout-details {
              display: flex;
              gap: 1.5rem;
              color: #cbd5e1;
              font-size: 0.9rem;
            }
            .workout-detail {
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            .footer {
              margin-top: 3rem;
              text-align: center;
              padding: 2rem;
              color: #94a3b8;
            }
            .btn {
              display: inline-block;
              padding: 1rem 2rem;
              background: linear-gradient(135deg, #6366f1, #ec4899);
              color: white;
              text-decoration: none;
              border-radius: 0.5rem;
              font-weight: 600;
              margin-top: 1rem;
            }
            .btn:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💪 Fitness Tracker</h1>
              <p>Vista renderizada del lado del servidor (SSR)</p>
              <small style="color: #94a3b8;">Generado el ${new Date().toLocaleString('es-MX')}</small>
            </div>
  
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">🏃‍♂️</div>
                <span class="stat-value">${totalWorkouts}</span>
                <span class="stat-label">Entrenamientos</span>
              </div>
              <div class="stat-card">
                <div class="stat-icon">🔥</div>
                <span class="stat-value">${totalCalories.toLocaleString()}</span>
                <span class="stat-label">Calorías Quemadas</span>
              </div>
              <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <span class="stat-value">${totalDuration}</span>
                <span class="stat-label">Minutos de Ejercicio</span>
              </div>
            </div>
  
            <div class="workouts-section">
              <h2>📋 Últimos Entrenamientos</h2>
              ${workouts.length > 0 ? workouts.map(w => `
                <div class="workout-card">
                  <div class="workout-header">
                    <div class="workout-icon">${getWorkoutIcon(w.type)}</div>
                    <div>
                      <div class="workout-name">${w.name}</div>
                      <div class="workout-details">
                        <div class="workout-detail">
                          <span>⏱️</span>
                          <span>${w.duration} min</span>
                        </div>
                        <div class="workout-detail">
                          <span>🔥</span>
                          <span>${w.calories} cal</span>
                        </div>
                        <div class="workout-detail">
                          <span>📅</span>
                          <span>${new Date(w.date).toLocaleDateString('es-MX')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  ${w.location ? `<div style="color: #94a3b8; font-size: 0.85rem;">📍 Ubicación: ${w.location.lat.toFixed(4)}, ${w.location.lng.toFixed(4)}</div>` : ''}
                </div>
              `).join('') : '<p style="text-align: center; color: #94a3b8;">No hay entrenamientos registrados</p>'}
            </div>
  
            <div class="footer">
              <a href="/" class="btn">Ir a la Aplicación</a>
              <p style="margin-top: 1rem;">Fitness Tracker PWA © ${new Date().getFullYear()}</p>
            </div>
          </div>
  
          <script>
            function getWorkoutIcon(type) {
              const icons = {
                cardio: '🏃‍♂️',
                strength: '🏋️‍♀️',
                flexibility: '🤸‍♂️',
                sports: '⚽'
              };
              return icons[type] || '🏃‍♂️';
            }
          </script>
        </body>
        </html>
      `;
  
      function getWorkoutIcon(type) {
        const icons = {
          cardio: '🏃‍♂️',
          strength: '🏋️‍♀️',
          flexibility: '🤸‍♂️',
          sports: '⚽'
        };
        return icons[type] || '🏃‍♂️';
      }
      
      res.send(html);
    } catch (error) {
      console.error('Error en SSR:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error - Fitness Tracker</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 3rem; background: #0f172a; color: #f8fafc; }
            h1 { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1>Error al renderizar la página</h1>
          <p>${error.message}</p>
          <a href="/" style="color: #6366f1;">Volver al inicio</a>
        </body>
        </html>
      `);
    }
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ 
      success: true, 
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Restante
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: err.message });
  });
  
  app.listen(PORT, () => {
    console.log('\n🚀 Servidor iniciado exitosamente');
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌐 Cliente: http://localhost:${PORT}`);
    console.log(`📄 SSR: http://localhost:${PORT}/ssr`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`💊 Health: http://localhost:${PORT}/api/health\n`);
  });