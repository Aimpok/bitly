// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ⚠️ ВСТАВЬ СЮДА ДАННЫЕ СО СВОЕГО СКРИНШОТА
const firebaseConfig = {
  apiKey: "AIzaSyB9j-8rgCEkFM3XeMnV-XKiSrw8fmMc5GY",
  authDomain: "bitylyyy.firebaseapp.com",
  projectId: "bitylyyy",
  storageBucket: "bitylyyy.firebasestorage.app",
  messagingSenderId: "209004998916",
  appId: "1:209004998916:web:adc08c60a8a6d8409b2051",
  measurementId: "G-WYVKFLSX50"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
