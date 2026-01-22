/* stocks.js */

const SLIDE_DURATION = 5000; 

const stocksData = [
    {
        title: "Join our Telegram & get 5 Blyx!",
        btnText: "Join",
        // ВАРИАНТ 1: Ссылка на Телеграм канал (внешняя)
        btnLink: "https://t.me/BitlyNews", 
        bgImage: "Sprites/WaveBg.png",
        iconImage: "Sprites/news1.png"
    },
    {
        title: "Find the Next Gem! Trade Tokens",
        btnText: "Trade",
        // ВАРИАНТ 2: Ссылка на страницу внутри приложения (внутренняя)
        btnLink: "markets.html", 
        bgImage: "Sprites/WaveBg.png",
        iconImage: "Sprites/news2.png"
    },
    {
        title: "Invite Friends & Earn Together",
        btnText: "Invite",
        // ВАРИАНТ 3: Ссылка на другую внутреннюю страницу
        btnLink: "crypto_info.html",
        bgImage: "Sprites/WaveBg.png",
        iconImage: "Sprites/news3.png"
    }
];