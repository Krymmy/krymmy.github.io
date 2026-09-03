export const translations = {
    ru: {
        greetingBlack: "Привет от черного кота",
        greetingWhite: "Привет от белого кота",

        developerProfile: "Профиль разработчика",
        description:
            "Разработчик, программист и человек, который любит разбираться в том, как всё работает.",
        about: "О себе",
        aboutText: "Заполню позже, как захочу",
        stack: "Технологии",
        badges: "Бейджи",
        repositories: "Репозитории",
        links: "Ссылки",

        public: "ПУБЛИЧНЫЙ",
        github: "GitHub",
        codewars: "Codewars",
        telegram: "Telegram",
        website: "Сайт",
        builtWith: "Сделано с HTML · CSS · JS · И немного нейронки",

        krymmyGitHubIO_Description: "Все, что вы тут видите, это и есть этот проект",
    },

    en: {
        greetingBlack: "Hello from the black cat",
        greetingWhite: "Hello from the white cat",

        developerProfile: "Developer profile",
        description:
            "Developer, programmer and a person who loves figuring out how things work.",
        about: "About",
        aboutText: "Fill later, if I want",
        stack: "Tech Stack",
        badges: "Badges",
        repositories: "Repositories",
        links: "Links",

        public: "PUBLIC",
        github: "GitHub",
        codewars: "Codewars",
        telegram: "Telegram",
        website: "Website",
        builtWith: "Make on HTML · CSS · JS · And little AI",

        krymmyGitHubIO_Description: "All what you can see here, its this project",
    }
};


export function getUserLanguage() {
    const language = navigator.language.toLowerCase();

    if (language.startsWith("ru")) {
        return "ru";
    }

    return "en";
}

export function applyLocalization() {
    const language = getUserLanguage();
    const translation = translations[language];

    document.documentElement.lang = language;

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;

        if (translation[key]) {
            element.textContent = translation[key];
        }
    });
}