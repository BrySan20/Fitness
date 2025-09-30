const express = require('express');
const router = express.Router();
const db = require('../firebase');

// Obtener todos los workouts
router.get('/workouts', async (req, res) => {
  try {
    const snapshot = await db.collection('workouts').orderBy('date', 'desc').get();
    const workouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: workouts, message: 'Entrenamientos obtenidos exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener entrenamientos', error: error.message });
  }
});

// Crear workout
router.post('/workouts', async (req, res) => {
  try {
    const { name, type, duration, calories, location, image } = req.body;
    const newWorkout = {
      name,
      type,
      duration: parseInt(duration),
      calories: parseInt(calories),
      date: new Date().toISOString(),
      location,
      image: image || null
    };
    const docRef = await db.collection('workouts').add(newWorkout);
    res.json({ success: true, data: { id: docRef.id, ...newWorkout }, message: 'Entrenamiento creado exitosamente' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al crear entrenamiento', error: error.message });
  }
});

// Eliminar workout
router.delete('/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('workouts').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: 'Entrenamiento no encontrado' });
    }
    await docRef.delete();
    res.json({ success: true, message: 'Entrenamiento eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al eliminar entrenamiento', error: error.message });
  }
});


// Obtener usuario 
router.get('/user', async (req, res) => {
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

// Actualizar configuración del usuario
router.put('/user/settings', async (req, res) => {
  try {
    const snapshot = await db.collection('users').limit(1).get();
    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const userRef = snapshot.docs[0].ref;
    const settings = req.body.settings;
    await userRef.update({ settings });
    const updatedUser = await userRef.get();
    res.json({ success: true, data: { id: updatedUser.id, ...updatedUser.data() }, message: 'Configuración actualizada' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al actualizar configuración', error: error.message });
  }
});

module.exports = router;
