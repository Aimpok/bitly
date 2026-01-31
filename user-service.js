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
        // Если пользователь обновил страницу пальцем вниз — чистим кэш сессии
        console.log("Page Reloaded: Clearing Session Cache");
        sessionStorage.clear();
    }
} catch (e) {
    console.log("Nav API not supported");
}

// ==========================================
// 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

export function getTgUser() {
    if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
        // Данные для тестов в обычном браузере
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

/**
 * Сохраняет статус принятия правил в Firebase
 */
export async function acceptPrivacyInDB() {
    const user = getTgUser();
    const userRef = getUserRef();
    
    try {
        // Обновляем в базе данных
        await updateDoc(userRef, { privacyAccepted: true });
        
        // Обновляем в локальном кэше сессии
        const cached = sessionStorage.getItem(`user_${user.id}`);
        if (cached) {
            const data = JSON.parse(cached);
            data.privacyAccepted = true;
            sessionStorage.setItem(`user_${user.id}`, JSON.stringify(data));
        }
        console.log("Privacy status updated in DB");
    } catch (e) {
        console.error("Error updating privacy status:", e);
        throw e;
    }
}

// ==========================================
// 3. ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ
// ==========================================

export async function initUser() {
    const user = getTgUser();
    const userRef = getUserRef();

    // 1. Проверяем кэш для мгновенного отклика UI
    const cachedUser = sessionStorage.getItem(`user_${user.id}`);
    
    const safeUsername = user.username || 'Anon';
    const freshTgData = {
        username: safeUsername,
        username_lower: safeUsername.toLowerCase(),
        first_name: user.first_name || '',
        photoUrl: user.photo_url || '' 
    };

    // Функция загрузки/создания данных
    const fetchAndCache = async () => {
        const snap = await getDoc(userRef);
        let finalData;

        if (!snap.exists()) {
            // Регистрация нового пользователя
            finalData = {
                id: user.id,
                ...freshTgData,
                balance: 0,
                starsBalance: 0,
                tradesCount: 0,
                tradeRating: 100,
                createdAt: new Date().toISOString(),
                portfolio: {},
                transactions: [],
                privacyAccepted: false // По умолчанию не принято
            };
            await setDoc(userRef, finalData);
        } else {
            // Обновляем только данные из телеграма (аватар, ник), не трогая баланс и privacyAccepted
            await updateDoc(userRef, freshTgData);
            finalData = { ...snap.data(), ...freshTgData };
        }
        
        sessionStorage.setItem(`user_${user.id}`, JSON.stringify(finalData));
        return finalData;
    };

    if (cachedUser) {
        // Если есть кэш — возвращаем его сразу, а базу обновляем в фоне
        fetchAndCache().catch(console.error); 
        return JSON.parse(cachedUser);
    } else {
        // Если кэша нет — ждем завершения запроса
        return await fetchAndCache();
    }
}

/**
 * Подписка на изменения данных пользователя в реальном времени
 */
export function subscribeToUser(callback) {
    const user = getTgUser();
    const userRef = getUserRef();
    
    // Сначала отдаем кэш
    const cachedUser = sessionStorage.getItem(`user_${user.id}`);
    if (cachedUser) callback(JSON.parse(cachedUser));

    // Слушаем изменения в Firestore
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            sessionStorage.setItem(`user_${user.id}`, JSON.stringify(data));
            callback(data);
        }
    });
}

// ==========================================
// 4. РАБОТА С РЫНКОМ (ТОКЕНЫ)
// ==========================================

export async function initMarketDataIfNeeded() {
    // Резервная функция для предзагрузки общих данных (если нужно)
    return true;
}

/**
 * Подписка на список всех токенов
 */
export function subscribeToMarket(callback) {
    const tokensRef = collection(db, "tokens");

    // Мгновенный возврат из кэша
    const cachedMarket = sessionStorage.getItem('market_data');
    if (cachedMarket) {
        callback(JSON.parse(cachedMarket));
    }

    // Живое обновление списка
    return onSnapshot(tokensRef, (snapshot) => {
        const tokens = [];
        snapshot.forEach(doc => {
            tokens.push({ id: doc.id, ...doc.data() });
        });

        sessionStorage.setItem('market_data', JSON.stringify(tokens));
        callback(tokens);
    });
}
