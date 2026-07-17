class AutoFarm extends ModernUtils {
    constructor() {
        super();
        this.active = this.loadSettings('farm_active', false);
        this.mode = this.loadSettings('farm_mode', 300);
        this.nextSec = 0;
        this.timer = null;
        this.MODES = [
            { label: '5 min',  base: 300,  boost: 600 },
            { label: '10 min', base: 600,  boost: 1200 },
            { label: '15 min', base: 900,  boost: 1800 },
            { label: '20 min', base: 1200, boost: 2400 },
            { label: '30 min', base: 1800, boost: 3600 },
            { label: '45 min', base: 2700, boost: 5400 },
        ];
    }

    render() {
        const { $container, $title } = this.getTitleElement('Auto Farm');

        $title.click(() => this.toggle());
        if (this.active) $title.addClass('active');

        const $btns = $('<div>').css({ padding: '5px', display: 'flex', flexWrap: 'wrap', gap: '4px' });
        this.MODES.forEach(m => {
            const $b = this.getButtonElement(m.label);
            $b.click(() => this.setMode(m.base, m.boost));
            if (this.mode === m.base) $b.addClass('disabled');
            $btns.append($b);
        });
        $container.append($btns);

        this.$timer = $('<div>').css({ padding: '6px', fontSize: '13px' });
        this._refreshTimer();
        $container.append(this.$timer);

        if (this.active) this._startTimer();
        return $container;
    }

    setMode(base, boost) {
        this.mode = base;
        this.saveSettings('farm_mode', base);
    }

    toggle() {
        this.active = !this.active;
        this.saveSettings('farm_active', this.active);
        if (this.active) this._startTimer();
        else { clearInterval(this.timer); this.timer = null; }
    }

    _startTimer() {
        clearInterval(this.timer);
        this._refreshTimer();
        this.timer = setInterval(() => this._refreshTimer(), 1000);
    }

    _refreshTimer() {
        if (!this.$timer) return;
        if (!this.active) {
            this.$timer.text('⏸ Arrêté').css('color', '#888');
            return;
        }
        if (this.nextSec <= 0) {
            this.$timer.text('✅ Collecte en cours...').css('color', '#4fc3f7');
            return;
        }
        const m = Math.floor(this.nextSec / 60), s = this.nextSec % 60;
        this.$timer.text(`⏳ Prochaine collecte : ${m}m ${s}s`).css('color', '#ffcc00');
    }

    async execute() {
        if (!this.active) return false;
        if (GameApi.isCaptchaActive()) return false;

        this.nextSec = this._getNextSec();
        if (this.nextSec > 0) return false;

        const polis = this._generateList();
        if (!polis.length) return false;

        await this._fakeOpen();
        await this.sleep(1000);
        await this._fakeSelect(polis);
        await this.sleep(1500);

        await this._claim(polis);
        await this._fakeUpdate();
        setTimeout(() => { try { uw.WMap?.removeFarmTownLootCooldownIconAndRefreshLootTimers(); } catch(e){} }, 2000);

        this.nextSec = this._getNextSec();
        return true;
    }

    _generateList() {
        const islands = {};
        const towns = uw.MM?.getOnlyCollectionByName?.('Town')?.models || [];
        for (const t of towns) {
            const { on_small_island, island_id, id } = t.attributes;
            if (on_small_island) continue;
            const r = uw.ITowns?.getTown?.(id)?.resources?.() || {};
            const pct = Math.min(r.wood || 0, r.stone || 0, r.iron || 0) / (r.storage || 1);
            if (!islands[island_id] || pct < islands[island_id].pct) {
                islands[island_id] = { id, pct };
            }
        }
        return Object.values(islands).map(i => i.id);
    }

    _getNextSec() {
        const models = uw.MM?.getCollections?.()?.FarmTownPlayerRelation?.[0]?.models || [];
        const counts = {};
        for (const m of models) {
            const lt = m.attributes?.lootable_at;
            if (!lt) continue;
            counts[lt] = (counts[lt] || 0) + 1;
        }
        let best = 0, bestVal = 0;
        for (const t in counts) {
            if (counts[t] < bestVal) continue;
            best = t; bestVal = counts[t];
        }
        const s = best - Math.floor(Date.now() / 1000);
        return s > 0 ? s : 0;
    }

    async _fakeOpen() {
        return new Promise(r => uw.gpAjax?.ajaxGet?.('farm_town_overviews', 'index', {}, false, () => r()));
    }

    async _fakeSelect(polis) {
        return new Promise(r => uw.gpAjax?.ajaxGet?.('farm_town_overviews', 'get_farm_towns_from_multiple_towns', { town_ids: polis }, false, () => r()));
    }

    async _claim(polis) {
        const mode = this.MODES.find(m => m.base === this.mode) || this.MODES[0];
        return new Promise(r => uw.gpAjax?.ajaxPost?.('farm_town_overviews', 'claim_loads_multiple', {
            towns: polis,
            time_option_base: mode.base,
            time_option_booty: mode.boost,
            claim_factor: 'normal',
        }, false, () => r()));
    }

    async _fakeUpdate() {
        return new Promise(r => {
            const t = uw.ITowns?.getCurrentTown?.();
            if (!t) { r(); return; }
            const booty = t.getResearches?.()?.attributes?.booty ? 1 : 0;
            uw.gpAjax?.ajaxGet?.('farm_town_overviews', 'get_farm_towns_for_town', {
                island_x: t.getIslandCoordinateX?.() || 0,
                island_y: t.getIslandCoordinateY?.() || 0,
                current_town_id: t.id,
                booty_researched: booty,
                diplomacy_researched: '',
                trade_office: t.getBuildings?.()?.attributes?.trade_office ? 1 : 0,
            }, false, () => r());
        });
    }
}
