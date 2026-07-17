class ModernConsole {
    constructor(maxLines = 200) {
        this.maxLines = maxLines;
        this.$el = null;
    }

    attach($container) {
        this.$el = $('<div>', { class: 'console_modernbot', id: 'modern_console' });
        $container.append(this.$el);
        return this.$el;
    }

    log(message) {
        const time = new Date().toLocaleTimeString();
        console.log(`[ModernBot ${time}] ${message}`);
        if (!this.$el) return;
        this.$el.prepend($('<p>').text(`[${time}] ${message}`));
        const $lines = this.$el.children('p');
        if ($lines.length > this.maxLines) $lines.slice(this.maxLines).remove();
    }
}
