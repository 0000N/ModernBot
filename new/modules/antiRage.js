class AntiRage extends ModernUtils {
    GOODS_ICONS = {
        athena: 'js-power-icon.animated_power_icon.animated_power_icon_45x45.power_icon45x45.power.strength_of_heroes',
        zeus: 'js-power-icon.animated_power_icon.animated_power_icon_45x45.power_icon45x45.power.fair_wind',
        artemis: 'js-power-icon.animated_power_icon.animated_power_icon_45x45.power_icon45x45.power.effort_of_the_huntress',
    };

    constructor() {
        super();
        this.loopFunct = null;
        this.activeGodEl = null;
        this.commandId = null;

        GameApi.hookWindowCreateForCommandId(id => { this.commandId = id; });

        GameApi.onWindowOpen((e, data) => {
            if (data.context !== 'atk_command') return;
            let max = 10;
            const addSpell = () => {
                const spellMenu = $('#command_info-god')[0];
                if (!spellMenu) { if (max > 0) { max--; setTimeout(addSpell, 50); } return; }
                $(spellMenu).on('click', () => this.trigger());
                this.commandId = this.commandId;
            };
            setTimeout(addSpell, 50);
        });
    }

    render() {
        const title = this.getTitleElement('Anti Rage');
        const $body = $('<div>').css({ padding: '8px' });
        $body.html('<p>Detects attack command window, highlights gods, auto-casts anti-rage spells.</p>'
            + '<p>Select a god in the attack window to activate auto-casting.</p>');
        title.$container.append($body);
        return title.$container;
    }

    trigger() {
        setTimeout(() => {
            this.handleGod('athena');
            this.handleGod('zeus');
            this.handleGod('artemis');
        }, 100);
    }

    handleGod(god) {
        const godEl = $(`.god_mini.${god}.${god}`).eq(0);
        if (!godEl.length) return;
        const powerClass = this.GOODS_ICONS[god];
        godEl.css({ zIndex: 10, cursor: 'pointer', borderRadius: '100%', outline: 'none',
                    boxShadow: '0px 0px 10px 5px rgba(255, 215, 0, 0.5)' });
        const powerEl = $(`.${powerClass}`).eq(0);
        if (!powerEl.length) return;
        godEl.click(() => {
            if (this.activeGodEl && this.activeGodEl.get(0) === godEl.get(0)) {
                clearInterval(this.loopFunct); this.loopFunct = null;
                this.setColor(this.activeGodEl.get(0), false); this.activeGodEl = null; return;
            }
            if (this.activeGodEl && this.activeGodEl.get(0) !== godEl.get(0)) {
                clearInterval(this.loopFunct); this.setColor(this.activeGodEl.get(0), false);
            }
            this.loopFunct = setInterval(() => this.clicker(powerEl), 1000);
            this.activeGodEl = godEl; this.setColor(godEl.get(0), true);
        });
    }

    setColor(elm, apply) {
        if (!elm) return;
        elm.style.filter = apply ? 'brightness(100%) sepia(100%) hue-rotate(90deg) saturate(1500%) contrast(0.8)' : '';
    }

    clicker(el) {
        const check = $('.js-power-icon.animated_power_icon.animated_power_icon_45x45.power_icon45x45.power').eq(0);
        if (!check.length) { clearInterval(this.loopFunct); this.loopFunct = null; this.activeGodEl = null; return; }
        el.click();
        const delta = 500;
        const rand = 500 + Math.floor(Math.random() * delta);
        clearInterval(this.loopFunct);
        this.loopFunct = setInterval(() => this.clicker(el), rand);
    }

    cast(id, type) {
        GameApi.ajaxPost('frontend_bridge', 'execute', {
            model_url: 'Commands',
            action_name: 'cast',
            arguments: { id, power_id: type },
        }, () => {});
    }
}
