import { translations, getUserLanguage } from "./localization.js";

// ========== НАСТРОЙКИ ТЕМЫ ==========
// lightStart  – час начала светлой темы (утро)
// darkStart   – час начала тёмной темы (вечер)
// transition  – длительность перехода в часах (0 – мгновенное переключение)
const THEME_CONFIG = {
    lightStart: 6,      // 6:00
    darkStart: 18,      // 18:00
    transition: 1.5,    // 1 час 30 минут
};

// ========== ЦВЕТОВЫЕ ПЕРЕМЕННЫЕ ==========
const lightVars = {
    '--bg-color': '#f4f4f4',
    '--card-bg': 'white',
    '--text-color': '#333',
    '--ascii-color': '#2d2d2d',
    '--cat-color': 'black',
    '--eye-color': 'limegreen',
    '--border-color': 'rgba(0,0,0,0.09)',
    '--muted-color': '#777',
    '--accent-color': 'limegreen',
};

const darkVars = {
    '--bg-color': '#1a1a1a',
    '--card-bg': '#2c2c2c',
    '--text-color': '#f4f4f4',
    '--ascii-color': '#c0c0c0',
    '--cat-color': 'white',
    '--eye-color': '#66ff66',
    '--border-color': 'rgba(255,255,255,0.09)',
    '--muted-color': '#999',
    '--accent-color': '#66ff66',
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function parseColor(str) {
    str = str.trim().toLowerCase();
    if (str.startsWith('#')) {
        let hex = str.slice(1);
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0,2), 16),
                g: parseInt(hex.slice(2,4), 16),
                b: parseInt(hex.slice(4,6), 16)
            };
        }
        return null;
    }
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
            a: match[4] ? parseFloat(match[4]) : 1
        };
    }
    return null;
}

function interpolateValue(val1, val2, t) {
    if (val1 === val2) return val1;
    const num1 = parseFloat(val1);
    const num2 = parseFloat(val2);
    if (!isNaN(num1) && !isNaN(num2) && val1.includes('px') && val2.includes('px')) {
        return Math.round(num1 + (num2 - num1) * t) + 'px';
    }
    const c1 = parseColor(val1);
    const c2 = parseColor(val2);
    if (c1 && c2) {
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        const a1 = c1.a ?? 1;
        const a2 = c2.a ?? 1;
        const a = a1 + (a2 - a1) * t;
        return a < 1 ? `rgba(${r},${g},${b},${a.toFixed(2)})` : `rgb(${r},${g},${b})`;
    }
    return val1;
}

// Приводит часы к диапазону [0, 24)
function normalizeHour(h) {
    while (h < 0) h += 24;
    while (h >= 24) h -= 24;
    return h;
}

// Вычисляет коэффициент t (0 – светлая, 1 – тёмная) для текущего времени
function getThemeFactor(currentHour, cfg) {
    const { lightStart, darkStart, transition } = cfg;
    const L = normalizeHour(lightStart);
    const D = normalizeHour(darkStart);
    const h = normalizeHour(currentHour);

    // Расстояние по часовой стрелке от a до b (в часах)
    const distClockwise = (a, b) => {
        let d = b - a;
        if (d < 0) d += 24;
        return d;
    };

    // Проверяем, находится ли h в светлой зоне (между L+tr и D-tr)
    const lightStartAdjusted = normalizeHour(L + transition);
    const lightEndAdjusted = normalizeHour(D - transition);
    let inLightZone;
    if (lightStartAdjusted < lightEndAdjusted) {
        inLightZone = h >= lightStartAdjusted && h < lightEndAdjusted;
    } else {
        inLightZone = h >= lightStartAdjusted || h < lightEndAdjusted;
    }
    if (inLightZone) return 0;

    // Проверяем, находится ли h в тёмной зоне (между D+tr и L+24-tr)
    const darkStartAdjusted = normalizeHour(D + transition);
    const darkEndAdjusted = normalizeHour(L + 24 - transition);
    let inDarkZone;
    if (darkStartAdjusted < darkEndAdjusted) {
        inDarkZone = h >= darkStartAdjusted && h < darkEndAdjusted;
    } else {
        inDarkZone = h >= darkStartAdjusted || h < darkEndAdjusted;
    }
    if (inDarkZone) return 1;

    // Иначе мы в одном из переходных интервалов
    const distFromLight = distClockwise(L, h);
    const distFromDark = distClockwise(D, h);

    // Утренний переход (от тёмной к светлой): t убывает от 1 до 0
    if (distFromLight < transition) {
        const progress = distFromLight / transition;
        return 1 - progress;
    }

    // Вечерний переход (от светлой к тёмной): t возрастает от 0 до 1
    if (distFromDark < transition) {
        const progress = distFromDark / transition;
        return progress;
    }

    // Защита
    return 0;
}

// Определяет часть суток для приветствия (на основе часов)
function getGreetingPeriod(hours) {
    if (hours >= 6 && hours < 12) return 'Black';
    if (hours >= 12 && hours < 18) return 'Black';
    if (hours >= 18 && hours < 23) return 'White';
    return 'White';
}

// ========== ОСНОВНАЯ ФУНКЦИЯ ==========
export function updateTheme() {
    // Удаляем класс (если используется) – теперь всё через CSS-переменные
    document.body.classList.remove('dark-theme');

    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;

    // Получаем коэффициент темы на основе настроек
    const t = getThemeFactor(hours, THEME_CONFIG);

    // Применяем интерполяцию ко всем переменным
    const root = document.documentElement;
    for (const key in lightVars) {
        const val = interpolateValue(lightVars[key], darkVars[key], t);
        root.style.setProperty(key, val);
    }

    // Обновление приветствия (используем время суток, а не t)
    const lang = getUserLanguage();
    const translation = translations[lang];
    const greetingEl = document.getElementById('greeting');
    if (greetingEl && translation) {
        const period = getGreetingPeriod(hours);
        // Ожидаем ключи: greetingMorning, greetingAfternoon, greetingEvening, greetingNight
        // Если их нет – используем запасные варианты
        const key = `greeting${period}`;
        greetingEl.textContent = translation[key] || translation.greetingBlack || 'Hello!';
    }
}