import { translations, getUserLanguage } from "./localization";

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
    // --ascii-size и --card-radius не меняются, можно не включать
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

export function updateTheme() {
    document.body.classList.remove('dark-theme');
    
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;

    // t = 1 в полночь, t = 0 в полдень (плавный цикл)
    let t = 0.5 + 0.5 * Math.cos((hours - 12) / 12 * Math.PI);
    // Можно скорректировать: при желании добавить смещение, чтобы пик темноты был в 1:00 ночи и т.д.

    const root = document.documentElement;
    for (const key in lightVars) {
        const val = interpolateValue(lightVars[key], darkVars[key], t);
        root.style.setProperty(key, val);
    }

    // Обновление текста приветствия (опционально)
    const lang = getUserLanguage();
    const translation = translations[lang];
    const greetingEl = document.getElementById('greeting');
    // Выбираем фразу в зависимости от t (можно 4 фазы)
    if (t < 0.25) greetingEl.textContent = translation.greetingMorning;
    else if (t < 0.5) greetingEl.textContent = translation.greetingAfternoon;
    else if (t < 0.75) greetingEl.textContent = translation.greetingEvening;
    else greetingEl.textContent = translation.greetingNight;
}