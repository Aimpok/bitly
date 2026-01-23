import { db } from './firebase-config.js';
import { 
    doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const tg = window.Telegram.WebApp;

// --- USER LOGIC ---

export function getTgUser() {
    // Для тестов в браузере (если открыто не в TG)
    if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
        return { 
            id: 'test_user_777', 
            username: 'TestBuilder', 
            first_name: 'Dev', 
            photo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1024px-Default_pfp.svg.png' 
        };
    }
    return tg.initDataUnsafe.user;
}

export function getUserRef() {
    const user = getTgUser();
    return doc(db, "users", user.id.toString());
}

// Создание или АПДЕЙТ профиля
export async function initUser() {
    const user = getTgUser();
    const userRef = getUserRef();
    const snap = await getDoc(userRef);

    // Подготовка имен
    const safeUsername = user.username || 'Anon';
    
    // Данные, которые обновляются при каждом входе
    // Добавляем username_lower для поиска без учета регистра
    const freshTgData = {
        username: safeUsername,
        username_lower: safeUsername.toLowerCase(), // <--- ВАЖНОЕ ИЗМЕНЕНИЕ
        first_name: user.first_name || '',
        photoUrl: user.photo_url || '' 
    };

    if (!snap.exists()) {
        // --- НОВЫЙ ЮЗЕР ---
        const newUser = {
            id: user.id,
            ...freshTgData, // Сюда попадет и username_lower
            balance: 0,        // Стартовый баланс
            starsBalance: 0,
            tradesCount: 0,    // Кол-во сделок
            tradeRating: 100,  // Рейтинг (100%)
            createdAt: new Date().toISOString(),
            portfolio: {},
            transactions: []   
        };
        await setDoc(userRef, newUser);
        return newUser;
    } else {
        // --- СУЩЕСТВУЮЩИЙ ЮЗЕР ---
        // Обновляем данные (вдруг он сменил никнейм в Телеграм)
        await updateDoc(userRef, freshTgData);
        return { ...snap.data(), ...freshTgData };
    }
}

// Слушать изменения юзера
export function subscribeToUser(callback) {
    const userRef = getUserRef();
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) callback({ id: doc.id, ...doc.data() });
    });
}

// --- MARKET LOGIC ---

// Функция очищена, чтобы не создавать BTC/ETH/USDT
export async function initMarketDataIfNeeded() {
    console.log("Market init check: Clean mode (User tokens only).");
}

// Слушать рынок
export function subscribeToMarket(callback) {
    const tokensRef = collection(db, "tokens");
    return onSnapshot(tokensRef, (snapshot) => {
        const tokens = [];
        snapshot.forEach(doc => {
            tokens.push({ id: doc.id, ...doc.data() });
        });
        callback(tokens);
    });
}
