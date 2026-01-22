import { db } from './firebase-config.js';
import { 
    doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const tg = window.Telegram.WebApp;

// --- USER LOGIC ---

// Получаем данные юзера из TG
export function getTgUser() {
    if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
        // Для тестов в браузере
        return { id: 'test_user_777', username: 'TestBuilder', first_name: 'Dev' };
    }
    return tg.initDataUnsafe.user;
}

export function getUserRef() {
    const user = getTgUser();
    return doc(db, "users", user.id.toString());
}

// Создание или загрузка профиля
export async function initUser() {
    const user = getTgUser();
    const userRef = getUserRef();
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        const newUser = {
            id: user.id,
            username: user.username || 'Anon',
            firstName: user.first_name || '',
            balance: 0,        // BLYX (игровая валюта)
            starsBalance: 0,   // Реальные Stars
            createdAt: new Date().toISOString(),
            portfolio: {},     // Формат: { "BTC": { amount: 0.001, buyPrice: 90000 } }
            transactions: []   
        };
        await setDoc(userRef, newUser);
        return newUser;
    } else {
        return snap.data();
    }
}

// Слушать изменения баланса юзера
export function subscribeToUser(callback) {
    const userRef = getUserRef();
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) callback(doc.data());
    });
}

// --- MARKET LOGIC (Рынок) ---

// Функция заливки начальных данных рынка (запустить один раз, если база пустая)
export async function initMarketDataIfNeeded() {
    const tokensRef = collection(db, "tokens");
    const snap = await getDocs(tokensRef);
    
    if (snap.empty) {
        console.log("База токенов пуста. Создаем начальный рынок...");
        const batch = writeBatch(db);
        
        const initialTokens = [
            { id: "BTC", name: "Bitcoin", price: 96500.00, change: -1.2, image: "Sprites/token_btc.png", description: "Digital Gold" },
            { id: "ETH", name: "Ethereum", price: 3450.50, change: 2.1, image: "Sprites/token_eth.png", description: "Smart Contracts" },
            { id: "TON", name: "Toncoin", price: 5.40, change: 5.0, image: "Sprites/token_ton.png", description: "The Open Network" },
            { id: "USDT", name: "Tether", price: 1.00, change: 0.01, image: "Sprites/token_usdt.png", description: "Stablecoin" },
            { id: "BLYX", name: "Blyx Coin", price: 0.15, change: 15.4, image: "Sprites/Blyx.png", description: "Native Token" },
            { id: "DOGS", name: "Dogs", price: 0.0044, change: -3.5, image: "Sprites/token_dogs.png", description: "Meme Coin" }
        ];

        initialTokens.forEach(token => {
            const ref = doc(db, "tokens", token.id);
            batch.set(ref, token);
        });

        await batch.commit();
        console.log("Рынок инициализирован!");
    }
}

// Слушать цены рынка в реальном времени
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