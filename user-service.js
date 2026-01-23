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
            // Ставим заглушку для тестов
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

    // Данные, которые могут измениться в Телеграме (Ник, Имя, Аватар)
    // Telegram отдает photo_url уже в оптимизированном размере (не full HD),
    // поэтому просто сохраняем ссылку.
    const freshTgData = {
        username: user.username || 'Anon',
        first_name: user.first_name || '', // Исправил на first_name как в базе
        // Если аватарки нет, сохраняем пустую строку или null
        photoUrl: user.photo_url || '' 
    };

    if (!snap.exists()) {
        // --- НОВЫЙ ЮЗЕР ---
        const newUser = {
            id: user.id,
            ...freshTgData, // Записываем свежие данные
            balance: 0,
            starsBalance: 0,
            createdAt: new Date().toISOString(),
            portfolio: {},
            transactions: []   
        };
        await setDoc(userRef, newUser);
        return newUser;
    } else {
        // --- СУЩЕСТВУЮЩИЙ ЮЗЕР ---
        // Обязательно обновляем фото и ник, если они поменялись
        await updateDoc(userRef, freshTgData);
        
        // Возвращаем данные из базы + то, что только что обновили
        return { ...snap.data(), ...freshTgData };
    }
}

// Слушать изменения баланса юзера
export function subscribeToUser(callback) {
    const userRef = getUserRef();
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) callback({ id: doc.id, ...doc.data() });
    });
}

// --- MARKET LOGIC (Рынок) ---

export async function initMarketDataIfNeeded() {
    const tokensRef = collection(db, "tokens");
    const snap = await getDocs(tokensRef);
    
    if (snap.empty) {
        console.log("База токенов пуста. Создаем начальный рынок...");
        const batch = writeBatch(db);
        
        const initialTokens = [
            { 
                id: "BTC", name: "Bitcoin", price: 96500.00, change: -1.2, image: "Sprites/token_btc.png", description: "Digital Gold",
                marketCap: 1900000000000, maxSupply: 21000000, sold: 19000000, txCount: 50000, holdersCount: 1000000 
            },
            { 
                id: "ETH", name: "Ethereum", price: 3450.50, change: 2.1, image: "Sprites/token_eth.png", description: "Smart Contracts",
                marketCap: 400000000000, maxSupply: 120000000, sold: 120000000, txCount: 45000, holdersCount: 500000
            },
            { 
                id: "TON", name: "Toncoin", price: 5.40, change: 5.0, image: "Sprites/token_ton.png", description: "The Open Network",
                marketCap: 20000000000, maxSupply: 5000000000, sold: 3000000000, txCount: 12000, holdersCount: 150000
            },
            { 
                id: "USDT", name: "Tether", price: 1.00, change: 0.01, image: "Sprites/token_usdt.png", description: "Stablecoin",
                marketCap: 100000000000, maxSupply: 100000000000, sold: 100000000000, txCount: 99999, holdersCount: 2000000
            },
            { 
                id: "DOGS", name: "Dogs", price: 0.0044, change: -3.5, image: "Sprites/token_dogs.png", description: "Meme Coin",
                marketCap: 400000000, maxSupply: 550000000000, sold: 400000000000, txCount: 5000, holdersCount: 300000
            }
        ];

        initialTokens.forEach(token => {
            const ref = doc(db, "tokens", token.id);
            batch.set(ref, token);
        });

        await batch.commit();
        console.log("Рынок инициализирован!");
    }
}

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
