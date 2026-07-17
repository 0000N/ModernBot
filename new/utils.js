class ModernUtils {

    saveSettings(id, settings) {
        localStorage.setItem(`modern_settings_${id}`, JSON.stringify(settings));
    }

    loadSettings(id, defaultSettings) {
        const settings = localStorage.getItem(`modern_settings_${id}`);
        if (!settings) return defaultSettings;
        return JSON.parse(settings);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getTitleElement(text, desc = '(click to toggle)') {
        const $container = $('<div>');
        const $title = $('<div>').addClass('module-title').text(text);
        $container.append($title);
        return { $container, $title };
    }

    getButtonElement(text) {
        const $button = $('<div>', { 'class': 'modern-btn', text: text });
        return $button;
    }

    jitter(base) {
        return base + Math.floor(Math.random() * base * 0.5);
    }

    shouldSkip() {
        // Randomly skip ~10% of cycles for anti-pattern disguise
        return Math.random() < 0.1;
    }

}

