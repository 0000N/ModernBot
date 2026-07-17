class AutoGratis extends ModernUtils {
    constructor() {
        super();
        this.enabled = this.loadSettings('autogratis_enabled', false);
        this.onlyActiveTown = this.loadSettings('autogratis_only_active_town', false);
        this.$container = null;
        this.$title = null;
    }

    render() {
        if (!this.$container) {
            const title = this.getTitleElement('Auto Gratis');
            this.$container = title.$container;
            this.$title = title.$title;
            this.$title.click(() => this.toggle());
        }
        this.$title.css('filter', this.enabled ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '');

        const $body = $('<div>').css({ padding: '5px', fontWeight: 600 });

        const $dummy = $('<div>').addClass('btn_time_reduction button_new').css({ display: 'inline-block', marginBottom: '8px' });
        $dummy.append($('<div>').addClass('left'));
        $dummy.append($('<div>').addClass('right'));
        $dummy.append($('<div>').addClass('caption js-caption').html('Gratis <div class="effect js-effect"></div>'));
        $body.append($dummy);

        $body.append($('<div>').css({ fontSize: '11px', fontWeight: 500 }).append(
            $('<label>').css({ cursor: 'pointer' }).append(
                $('<input>', { type: 'checkbox', checked: this.onlyActiveTown }).on('change', (e) => {
                    this.onlyActiveTown = e.target.checked;
                    this.saveSettings('autogratis_only_active_town', this.onlyActiveTown);
                })
            ).append(' Only fire on the actively-viewed town')
        ));

        this.$container.find('.game_border').nextAll().remove();
        this.$container.append($body);
        return this.$container;
    }

    toggle() {
        this.enabled = !this.enabled;
        this.saveSettings('autogratis_enabled', this.enabled);
        if (this.$title) {
            this.$title.css('filter', this.enabled ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '');
        }
    }

    async execute() {
        if (!this.enabled) return false;
        if (GameApi.isCaptchaActive()) return false;

        const now = Math.floor(Date.now() / 1000);

        if (this.onlyActiveTown) {
            const town = GameApi.getCurrentTown();
            return this.tryTown(town, now);
        }

        const towns = Object.entries(uw.ITowns.towns || {});
        for (const [, town] of towns) {
            if (this.tryTown(town, now)) return true;
        }
        return false;
    }

    tryTown(town, now) {
        if (!town || typeof town.buildingOrders !== 'function') return false;
        const orders = town.buildingOrders();
        if (!orders?.models?.length) return false;
        const order = orders.models[0];
        const completedAt = order.attributes?.to_be_completed_at;
        if (!completedAt) return false;
        const remaining = completedAt - now;
        if (remaining > 0 && remaining < 300) {
            this.callGratis(town.id, order.id);
            return true;
        }
        return false;
    }

    callGratis(townId, orderId) {
        GameApi.ajaxPost('frontend_bridge', 'execute', {
            model_url: `BuildingOrder/${orderId}`,
            action_name: 'buyInstant',
            arguments: { order_id: orderId },
            town_id: townId
        }, () => {});
        console.log(`[ModernBot] gratis: ${uw.ITowns.towns[townId]?.getName() || townId} order ${orderId}`);
    }
}
