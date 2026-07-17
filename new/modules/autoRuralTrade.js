class AutoRuralTrade extends ModernUtils {
    constructor() {
        super();
        this.ratio = this.loadSettings('rt_ratio', 5);
        this.active = false;
        this.loopId = null;
        this.tradeResource = null;
        this.totalTrade = 0;
        this.doneTrade = 0;
    }

    render() {
        const title = this.getTitleElement('Auto Trade Resources');
        const $title = title.$title;
        $title.click(() => this.stop());

        this.$progress = $('<div>').addClass('progress_bar_auto').css({ width: '0%', height: '4px', position: 'relative', zIndex: 10 });
        $title.prepend(this.$progress);

        const $body = $('<div>').addClass('split_content');

        const $bts = $('<div>').css({ padding: '5px' });
        ['Iron', 'Stone', 'Wood'].forEach(r => {
            const $b = this.getButtonElement(r);
            $b.click(() => this.start(r.toLowerCase()));
            $bts.append($b);
        });
        $body.append($bts);

        const $ratio = $('<div>').css({ padding: '5px' });
        [0.25, 0.5, 0.75, 1.0, 1.25].forEach((val, i) => {
            const $b = this.getButtonElement(String(val));
            $b.click(() => this.setRatio(i + 1));
            if (this.ratio === i + 1) $b.addClass('disabled');
            $ratio.append($b);
        });
        $body.append($ratio);

        title.$container.append($body);
        return title.$container;
    }

    setRatio(n) {
        this.ratio = n;
        this.saveSettings('rt_ratio', n);
    }

    start(resource) {
        if (this.active) { this.stop(); return; }
        this.active = true;
        this.tradeResource = resource;
        this.totalTrade = Object.keys(uw.ITowns.towns || {}).length;
        this.doneTrade = 0;
        this.loopId = setInterval(() => this.tradeLoop(), 1500);
    }

    stop() {
        this.active = false;
        clearInterval(this.loopId);
        this.loopId = null;
        if (this.$progress) this.$progress.css('width', '0%');
    }

    async tradeLoop() {
        if (GameApi.isCaptchaActive()) return;
        if (this.doneTrade >= this.totalTrade) { this.stop(); return; }
        const towns = Object.keys(uw.ITowns.towns || {});
        await this.tradeWithRural(towns[this.doneTrade]);
        if (this.$progress) this.$progress.css('width', `${(this.doneTrade / this.totalTrade) * 100}%`);
        this.doneTrade++;
    }

    async tradeWithRural(townId) {
        const town = GameApi.getTown(townId);
        if (!town) return;
        if (GameApi.availableTradeCapacity(townId) < 3000) return;

        const farmTowns = GameApi.getFarmTowns();
        const relations = GameApi.getFarmPlayerRelations();
        const res = town.resources();
        const x = GameApi.getIslandX(townId);
        const y = GameApi.getIslandY(townId);

        for (const ft of farmTowns) {
            const a = ft.attributes;
            if (a.island_x !== x || a.island_y !== y) continue;
            if (a.resource_offer !== this.tradeResource) continue;
            if ((res[a.resource_demand] || 0) < 3000) continue;

            for (const rel of relations) {
                const ra = rel.attributes;
                if (a.id !== ra.farm_town_id) continue;
                if (ra.relation_status !== 1) continue;
                if (ra.current_trade_ratio < this.ratio * 0.25) continue;
                if (GameApi.availableTradeCapacity(townId) < 3000) continue;

                const cap = town.getAvailableTradeCapacity() || 0;
                if (cap < 100) return;
                const amount = cap > 3000 ? 3000 : cap;
                GameApi.ajaxPost('frontend_bridge', 'execute', {
                    model_url: `FarmTownPlayerRelation/${ra.id}`,
                    action_name: 'trade',
                    arguments: { farm_town_id: ra.farm_town_id, amount },
                    town_id: townId,
                }, () => {});
                await this.sleep(750);
            }
        }
    }
}
