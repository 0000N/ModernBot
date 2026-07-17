class AutoHide extends ModernUtils {
    constructor() {
        super();
        this.activeTown = this.loadSettings('autohide_active', 0);
        this.interval = null;

        const addButton = () => {
            const box = $('.order_count');
            if (box.length) {
                const btn = $('<div/>', {
                    class: 'button_new',
                    id: 'autoCaveButton',
                    style: 'float: right; margin: 0px; left: 169px; position: absolute; top: 56px; width: 66px',
                });
                btn.append($('<div>').click(() => this.toggle()));
                btn.append($('<div>').addClass('left'));
                btn.append($('<div>').addClass('right'));
                btn.append($('<div>').addClass('caption js-caption').html('Auto <div class="effect js-effect"></div>'));
                box.prepend(btn);
                this.updateStyle(GameApi.getCurrentTown()?.id);
            } else {
                setTimeout(addButton, 100);
            }
        };

        /* Wire to game internals — these can't go through GameApi */
        try {
            uw.$.Observer(uw.GameEvents.window.open).subscribe((e, i) => {
                if (i?.attributes?.window_type === 'hide') setTimeout(addButton, 100);
            });
            uw.$.Observer(uw.GameEvents.town.town_switch).subscribe(() => {
                const town = GameApi.getCurrentTown();
                if (town) this.updateStyle(town.id);
                setTimeout(addButton, 1);
            });
        } catch (e) { /* game observables may not be available */ }

        this.interval = setInterval(() => this.main(), 5000);
    }

    render() {
        const title = this.getTitleElement('Auto Hide');
        title.$title.css('filter', this.activeTown ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '');
        title.$title.click(() => this.toggle());
        const $body = $('<div>').css({ padding: '5px', fontWeight: 600 });
        $body.text('Check every 5 sec — if iron > 15k, store in hide (lvl 10 required)');
        title.$container.append($body);
        return title.$container;
    }

    toggle() {
        const town = GameApi.getCurrentTown();
        if (!town) return;
        const hide = town.buildings().attributes.hide;
        if (this.activeTown === town.id) {
            this.activeTown = 0;
        } else {
            if (hide === 10) this.activeTown = town.id;
            else GameApi.notifyError('Hide must be at level 10');
        }
        this.saveSettings('autohide_active', this.activeTown);
        this.updateStyle(town.id);
    }

    updateStyle(townId) {
        const active = townId === this.activeTown;
        const filter = active ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '';
        $('#auto_cave_title, #autoCaveButton').css('filter', filter);
    }

    main() {
        if (!this.activeTown) return;
        const res = GameApi.getResources(this.activeTown);
        if (!res) return;
        if ((res.iron || 0) > 15000) {
            GameApi.ajaxPost('frontend_bridge', 'execute', {
                model_url: 'BuildingHide',
                action_name: 'storeIron',
                arguments: { iron_to_store: res.iron },
                town_id: this.activeTown,
            }, () => {});
        }
    }
}
