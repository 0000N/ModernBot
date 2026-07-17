class AutoFarm extends ModernUtils {
    constructor() {
        super();
        this.active = this.loadSettings('farm_active', false);
        this.duration = this.loadSettings('farm_duration', 1);
        this.nextCollection = 0;
        this.timerInterval = null;
    }

    render() {
        const { $container, $title } = this.getTitleElement('Auto Farm');
        this.$container = $container;
        this.$title = $title;

        this.$title.click(() => this.toggle());
        if (this.active) this.$title.addClass('active');

        // Options
        const OPTIONS = [
            { label: '5 min',  dur: 1, base: 300,  boost: 600 },
            { label: '10 min', dur: 2, base: 600,  boost: 1200 },
            { label: '15 min', dur: 3, base: 900,  boost: 1800 },
            { label: '20 min', dur: 4, base: 1200, boost: 2400 },
            { label: '30 min', dur: 5, base: 1800, boost: 3600 },
            { label: '45 min', dur: 6, base: 2700, boost: 5400 },
        ];

        this.durationBtns = {};
        const $btnBox = $('<div>').css({ padding: '5px', display: 'flex', flexWrap: 'wrap', gap: '3px' });
        OPTIONS.forEach(o => {
            const $b = this.getButtonElement(o.label);
            $b.click(() => this.setDuration(o.dur, o.base, o.boost));
            this.durationBtns[o.dur] = $b;
            $btnBox.append($b);
        });
        this.$container.append($btnBox);

        this._refreshButtons();

        // Timer display
        this.$timer = $('<div>').css({ padding: '6px', fontSize: '14px', fontWeight: 'bold' });
        this.$container.append(this.$timer);
        this._updateTimer();

        if (this.active) this._startTimer();
        return this.$container;
    }

    _refreshButtons() {
        Object.entries(this.durationBtns).forEach(([d, $b]) => {
            $b.toggleClass('disabled', parseInt(d) === this.duration);
        });
    }

    setDuration(dur, base, boost) {
        this.duration = dur;
        this._base = base;
        this._boost = boost;
        this.saveSettings('farm_duration', dur);
        this._refreshButtons();
    }

    toggle() {
        this.active = !this.active;
        this.saveSettings('farm_active', this.active);
        if (this.$title) this.$title.toggleClass('active');
        if (this.active) this._startTimer();
        else this._stopTimer();
    }

    _startTimer() {
        this._stopTimer();
        this._updateTimer();
        this.timerInterval = setInterval(() => this._updateTimer(), 1000);
    }

    _stopTimer() {
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    }

    _updateTimer() {
        const sec = Math.max(0, Math.floor(this.nextCollection / 1000));
        if (this.$timer) {
            if (this.active && this.nextCollection > 0) {
                const m = Math.floor(sec / 60), s = sec % 60;
                this.$timer.text(`⏳ Next: ${m}m ${s}s`);
                this.$timer.css('color', '#ffcc00');
            } else if (this.active) {
                this.$timer.text(`✅ Collecting...`);
                this.$timer.css('color', '#4fc3f7');
            } else {
                this.$timer.text(`⏸ Stopped`);
                this.$timer.css('color', '#666');
            }
        }
    }

    async execute() {
        if (!this.active) return false;
        if (GameApi.isCaptchaActive()) return false;

        this.nextCollection = this.getNextCollection();
        if (this.nextCollection > 0) return false;

        this.polis_list = this.generateList();
        await this.claim();
        this.nextCollection = this.getNextCollection();
        return true;
    }

    generateList = () => {
        const islands = {};
        const { models: towns } = uw.MM.getOnlyCollectionByName('Town');
        for (const town of towns) {
            const { on_small_island, island_id, id } = town.attributes;
            if (on_small_island) continue;
            const { wood, stone, iron, storage } = uw.ITowns.getTown(id).resources();
            const minPercent = Math.min(wood, stone, iron) / storage;
            if (!islands[island_id] || minPercent < islands[island_id].minPercent) {
                islands[island_id] = { townId: id, minPercent };
            }
        }
        return Object.values(islands).map(i => i.townId);
    };

    getNextCollection = () => {
        const { models } = uw.MM.getCollections().FarmTownPlayerRelation[0];
        const lootCounts = {};
        for (const model of models) {
            const { lootable_at } = model.attributes;
            if (!lootable_at) continue;
            lootCounts[lootable_at] = (lootCounts[lootable_at] || 0) + 1;
        }
        let maxTime = 0, maxVal = 0;
        for (const t in lootCounts) {
            if (lootCounts[t] < maxVal) continue;
            maxTime = t; maxVal = lootCounts[t];
        }
        const sec = maxTime - Math.floor(Date.now() / 1000);
        return sec > 0 ? sec * 1000 : 0;
    };

    async claim() {
        const isCaptain = uw.GameDataPremium.isAdvisorActivated('captain');
        if (isCaptain) {
            await this.fakeOpening();
            await this.sleep(Math.random() * 2000 + 1000);
            await this.fakeSelectAll();
            await this.sleep(Math.random() * 2000 + 1000);

            const base = this._base || 300;
            const boost = this._boost || 600;
            await this.claimMultiple(base, boost);
            await this.fakeUpdate();
            setTimeout(() => uw.WMap.removeFarmTownLootCooldownIconAndRefreshLootTimers(), 2000);
        }
    }

    claimMultiple = (base, boost) =>
        new Promise(resolve => {
            uw.gpAjax.ajaxPost('farm_town_overviews', 'claim_loads_multiple', {
                towns: this.generateList(),
                time_option_base: base,
                time_option_booty: boost,
                claim_factor: 'normal',
            }, false, () => resolve());
        });

    fakeOpening = () =>
        new Promise(resolve => {
            uw.gpAjax.ajaxGet('farm_town_overviews', 'index', {}, false, async () => {
                await this.sleep(10);
                await this.fakeUpdate();
                resolve();
            });
        });

    fakeSelectAll = () =>
        new Promise(resolve => {
            uw.gpAjax.ajaxGet('farm_town_overviews', 'get_farm_towns_from_multiple_towns', { town_ids: this.polis_list }, false, () => resolve());
        });

    fakeUpdate = () =>
        new Promise(resolve => {
            const town = uw.ITowns.getCurrentTown();
            const booty = town.getResearches?.().attributes?.booty ? 1 : 0;
            const trade = town.getBuildings?.().attributes?.trade_office ? 1 : 0;
            uw.gpAjax.ajaxGet('farm_town_overviews', 'get_farm_towns_for_town', {
                island_x: town.getIslandCoordinateX(),
                island_y: town.getIslandCoordinateY(),
                current_town_id: town.id,
                booty_researched: booty,
                diplomacy_researched: '',
                trade_office: trade,
            }, false, () => resolve());
        });
}
