const admin = require('firebase-admin');
const serviceAccount = require('./fitness-tracker-pwa-firebase-adminsdk-fbsvc-ab44bd97d5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;
