/* user-service.js */

import { db } from './firebase-config.js';
import { 
    doc, getDoc, setDoc, updateDoc, onSnapshot, collection 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const tg = window.Telegram.WebApp;

// ==========================================
// 1. УМНАЯ ОЧИСТКА КЭША (Reload vs Navigate)
// ==========================================
try {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && navEntries[0].type === 'reload') {
        // Если это обновление страницы (свайп вниз или кнопка) — чистим всё
        console.log("Page Reloaded: Clearing Cache");
        sessionStorage.clear();
    } else {
        console.log("Page Navigated: Keeping Cache");
    }
} catch (e) {
    console.log("Nav API not supported, skipping cache clear logic");
}

// ==========================================
// 2. ФУНКЦИИ ПОЛЬЗОВАТЕЛЯ
// ==========================================

export function getTgUser() {
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

// Инициализация с мгновенным возвратом из кэша
export async function initUser() {
    const user = getTgUser();
    const userRef = getUserRef();

    // 1. ПРОВЕРКА КЭША (Мгновенная загрузка)
    const cachedUser = sessionStorage.getItem(`user_${user.id}`);
    
    // Подготовка свежих данных из телеграм
    const safeUsername = user.username || 'Anon';
    const freshTgData = {
        username: safeUsername,
        username_lower: safeUsername.toLowerCase(),
        first_name: user.first_name || '',
        photoUrl: user.photo_url || '' 
    };

    // Фоновая функция обновления (запускается всегда, но не блокирует UI если есть кэш)
    const fetchAndCache = async () => {
        const snap = await getDoc(userRef);
        let finalData;

        if (!snap.exists()) {
            // Новый юзер
            finalData = {
                id: user.id,
                ...freshTgData,
                balance: 0,
                starsBalance: 0,
                tradesCount: 0,
                tradeRating: 100,
                createdAt: new Date().toISOString(),
                portfolio: {},
                transactions: []   
            };
            await setDoc(userRef, finalData);
        } else {
            // Старый юзер
            await updateDoc(userRef, freshTgData);
            finalData = { ...snap.data(), ...freshTgData };
        }
        
        // Сохраняем в SessionStorage
        sessionStorage.setItem(`user_${user.id}`, JSON.stringify(finalData));
        return finalData;
    };

    // ЛОГИКА ВОЗВРАТА:
    if (cachedUser) {
        // Если есть кэш — возвращаем его МГНОВЕННО, а запрос делаем в фоне
        // (чтобы обновить кэш для следующего раза)
        fetchAndCache().catch(console.error); 
        return JSON.parse(cachedUser);
    } else {
        // Если кэша нет (первый вход) — ждем загрузку
        return await fetchAndCache();
    }
}

// Подписка на юзера (с поддержкой кэша)
export function subscribeToUser(callback) {
    const user = getTgUser();
    const userRef = getUserRef();
    
    // 1. Сразу отдаем кэш, если есть
    const cachedUser = sessionStorage.getItem(`user_${user.id}`);
    if (cachedUser) {
        callback(JSON.parse(cachedUser));
    }

    // 2. Слушаем реальные изменения
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            // Обновляем кэш при любом изменении в базе
            sessionStorage.setItem(`user_${user.id}`, JSON.stringify(data));
            callback(data);
        }
    });
}

// ==========================================
// 3. ФУНКЦИИ РЫНКА (MARKET)
// ==========================================

export async function initMarketDataIfNeeded() {
    // В данном проекте токены создаются пользователями, 
    // поэтому предзагрузка не требуется, оставляем пустым для совместимости.
}

// Подписка на рынок (с кэшем)
export function subscribeToMarket(callback) {
    const tokensRef = collection(db, "tokens");

    // 1. Сразу отдаем кэш, если есть
    const cachedMarket = sessionStorage.getItem('market_data');
    if (cachedMarket) {
        // Парсим и сразу рисуем список (пользователь не видит спиннер)
        callback(JSON.parse(cachedMarket));
    }

    // 2. Слушаем реальные изменения
    return onSnapshot(tokensRef, (snapshot) => {
        const tokens = [];
        snapshot.forEach(doc => {
            tokens.push({ id: doc.id, ...doc.data() });
        });

        // Проверяем, изменились ли данные, чтобы зря не перерисовывать (опционально)
        // Но для простоты — обновляем кэш и UI
        sessionStorage.setItem('market_data', JSON.stringify(tokens));
        callback(tokens);
    });
}
