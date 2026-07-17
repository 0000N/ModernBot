class AutoHide extends ModernUtils {
    constructor() {
        super();
        this.activeTown = this.loadSettings('autohide_active', 0);

        setInterval(() => this.main(), 5000);

        const addButton = () => {
            const box = $('.order_count');
            if (box.length) {
                const butt = $('<div/>', {
                    class: 'button_new',
                    id: 'autoCaveButton',
                    style: 'float: right; margin: 0px; left: 169px; position: absolute; top: 56px; width: 66px',
                });
                butt.append($('<div>').click(() => this.toggle()));
                butt.append($('<div>').addClass('left'));
                butt.append($('<div>').addClass('right'));
                butt.append($('<div>').addClass('caption js-caption').html('Auto <div class="effect js-effect"></div>'));
                box.prepend(butt);
                this.updateStyle(GameApi.getCurrentTown()?.id);
            } else {
                setTimeout(addButton, 100);
            }
        };

        GameApi.onWindowOpen((e, data) => {
            if (!data?.attributes) return;
            if (data.attributes.window_type !== 'hide') return;
            setTimeout(addButton, 100);
        });

        GameApi.onTownSwitch(() => {
            const town = GameApi.getCurrentTown();
            if (town) this.updateStyle(town.id);
            const cave = document.getElementsByClassName('js-window-main-container classic_window hide')[0];
            if (!cave) return;
            setTimeout(addButton, 1);
        });
    }

    render() {
        const title = this.getTitleElement('Auto Hide');
        title.$title.css('filter', this.activeTown ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '');
        title.$title.click(() => this.toggle());
        this.$title = title.$title;

        const $body = $('<div>').css({ padding: '5px', fontWeight: 600 });
        $body.text('Check every 5s — stores iron > 15k in hide (lvl 10 required)');
        title.$container.append($body);
        return title.$container;
    }

    toggle(townId) {
        const town = townId ? GameApi.getTown(townId) : GameApi.getCurrentTown();
        if (!town) return;
        const hide = GameApi.getBuildings(town.id).hide || 0;
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
