import { db } from './firebase-config.js';
import { 
    doc, getDoc, setDoc, onSnapshot, collection 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const tg = window.Telegram.WebApp;

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
    
    // Пытаемся получить, если нет - создаем, но не ждем блокирующе лишний раз
    // Оптимизация: используем setDoc с merge, чтобы не делать лишний read
    const baseData = {
        id: user.id,
        username: user.username || 'Anon',
        firstName: user.first_name || '',
        lastLogin: new Date().toISOString()
    };

    // Если юзера нет, эти поля запишутся. Если есть - не перезатрутся (благодаря merge: true и логике ниже, 
    // но для скорости просто читаем один раз).
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        const newUser = {
            ...baseData,
            balance: 0,
            starsBalance: 0,
            createdAt: new Date().toISOString(),
            portfolio: {},
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

// Слушать рынок (только реальные токены)
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

// Пустая функция (заглушка), чтобы не ломать старые импорты в HTML
export async function initMarketDataIfNeeded() {
    return;
}
