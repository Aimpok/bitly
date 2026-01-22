// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ⚠️ ВСТАВЬ СЮДА ДАННЫЕ СО СВОЕГО СКРИНШОТА
const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "ТВОЙ_PROJECT_ID.firebaseapp.com",
  projectId: "ТВОЙ_PROJECT_ID",
  storageBucket: "ТВОЙ_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "ТВОЙ_SENDER_ID",
  appId: "ТВОЙ_APP_ID",
  measurementId: "ТВОЙ_MEASUREMENT_ID"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };