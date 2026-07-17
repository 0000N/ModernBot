class AutoTrain extends ModernUtils {
    POWER_LIST = ['call_of_the_ocean', 'spartan_training', 'fertility_improvement'];
    GROUND_ORDER = ['catapult', 'sword', 'archer', 'hoplite', 'slinger', 'rider', 'chariot'];
    NAVAL_ORDER = ['small_transporter', 'bireme', 'trireme', 'attack_ship', 'big_transporter', 'demolition_ship', 'colonize_ship'];
    MAX_BATCH = 25;
    SHIFT_LEVELS = {
        catapult: [5, 5], sword: [200, 50], archer: [200, 50], hoplite: [200, 50], slinger: [200, 50],
        rider: [100, 25], chariot: [100, 25], small_transporter: [10, 5], bireme: [50, 10], trireme: [50, 10],
        attack_ship: [50, 10], big_transporter: [50, 10], demolition_ship: [50, 10], colonize_ship: [5, 1],
    };
    REQUIREMENTS = {
        slinger: { research: 'slinger' }, archer: { research: 'archer' },
        rider: { research: 'rider' }, chariot: { research: 'chariot' },
        catapult: { research: 'catapult' }, hoplite: { research: 'hoplite' },
        bireme: { research: 'bireme' }, trireme: { research: 'trireme' },
        attack_ship: { research: 'attack_ship' }, big_transporter: { research: 'big_transporter' },
        demolition_ship: { research: 'demolition_ship' }, colonize_ship: { research: 'colonize_ship' },
    };

    constructor() {
        super();
        this.spell = this.loadSettings('at_spell', false);
        this.percentual = this.loadSettings('at_per', 1);
        this.cityTroops = this.loadSettings('troops', {});
        this.active = this.loadSettings('at_active', false);
        this._nextOffset = {};
    }

    render() {
        const { $container, $title } = this.getTitleElement('Auto Train');
        this.$container = $container;
        this.$title = $title;
        this.$title.click(() => this.toggle());
        if (this.active) this.$title.addClass('active');

        const town = GameApi.getCurrentTown();
        if (!town) return $container;

        const townId = town.id;

        const $spell = this.getButtonElement(this.spell ? 'Spell ON' : 'Spell OFF');
        $spell.click(() => { this.spell = !this.spell; this.saveSettings('at_spell', this.spell); });
        $container.append($spell);

        $container.append(this._renderTroopList(town, townId));
        return $container;
    }

    _renderTroopList(town, townId) {
        const $box = $('<div>').css({ padding: '5px' });
        const troops = this.cityTroops[townId] || {};
        const bld = GameApi.getBuildings(townId);
        const res = town.getResearches?.()?.attributes || {};

        const allUnits = [...this.NAVAL_ORDER, ...this.GROUND_ORDER];
        for (const unit of allUnits) {
            const pop = GameApi.getUnitData(unit)?.population || 1;
            const gray = this._isGray(unit, bld, res);
            const current = troops[unit] || 0;

            const $row = $('<div>').css({ display: 'flex', alignItems: 'center', margin: '2px 0' });

            const $name = $('<span>').css({ width: '130px', opacity: gray ? .4 : 1 }).text(unit);
            $row.append($name);

            const $minus = $('<div>').css({ cursor: 'pointer', width: '16px', textAlign: 'center' }).text('◀');
            $minus.click((e) => { e.stopPropagation(); this.editTroopCount(townId, unit, -1, e.shiftKey); });
            $row.append($minus);

            const $val = $('<span>').css({ width: '50px', textAlign: 'center' }).text(current);
            $row.append($val);

            const $plus = $('<div>').css({ cursor: 'pointer', width: '16px', textAlign: 'center' }).text('▶');
            $plus.click((e) => { e.stopPropagation(); this.editTroopCount(townId, unit, 1, e.shiftKey); });
            $row.append($plus);

            $row.append($('<span>').css({ marginLeft: '8px', fontSize: '10px', opacity: .7 }).text(`pop: ${pop}`));
            $box.append($row);
        }
        return $box;
    }

    _isGray(unit, bld, res) {
        const req = this.REQUIREMENTS[unit];
        if (!req) return false;
        if (req.research && !res[req.research]) return true;
        if (req.building && (bld[req.building] || 0) < (req.level || 1)) return true;
        return false;
    }

    getTotalPopulation(townId) {
        const town = GameApi.getTown(townId);
        if (!town) return 0;
        const data = uw.GameData?.units || {};
        const orders = town.getUnitOrdersCollection?.()?.models || [];
        let used = 0;
        for (const o of orders) {
            const ud = data[o.attributes.unit_type];
            if (ud) used += ud.population * (o.attributes.units_left / o.attributes.count) * o.attributes.count;
        }
        const units = town.units?.() || {};
        for (const u of Object.keys(units)) {
            if (data[u]) used += data[u].population * units[u];
        }
        const outer = town.unitsOuter?.() || {};
        for (const u of Object.keys(outer)) {
            if (data[u]) used += data[u].population * outer[u];
        }
        return (town.getAvailablePopulation?.() || 0) + used;
    }

    countPopulation(targets) {
        let p = 0;
        for (const unit of Object.keys(targets || {})) {
            const ud = GameApi.getUnitData(unit);
            if (ud) p += ud.population * targets[unit];
        }
        return p;
    }

    editTroopCount(townId, unit, count, shiftHeld) {
        const cityTroops = this.cityTroops;
        if (!cityTroops[townId]) cityTroops[townId] = {};
        if (count) {
            const index = count > 0 ? 0 : 1;
            count = shiftHeld ? count * this.SHIFT_LEVELS[unit][index] : count;
        } else { count = 10000; }
        const totalPop = this.getTotalPopulation(townId);
        const usedPop = this.countPopulation(cityTroops[townId]);
        const unitData = GameApi.getUnitData(unit);
        if (!unitData) return;
        const unitPop = unitData.population;
        if (totalPop - usedPop < unitPop * count) count = parseInt((totalPop - usedPop) / unitPop);
        if (unit in cityTroops[townId]) cityTroops[townId][unit] += count;
        else cityTroops[townId][unit] = count;
        if (cityTroops[townId][unit] <= 0) delete cityTroops[townId][unit];
        if ($.isEmptyObject(cityTroops[townId])) delete this.cityTroops[townId];
        this.saveSettings('troops', this.cityTroops);
    }

    toggle() {
        this.active = !this.active;
        this.saveSettings('at_active', this.active);
        this.$title.toggleClass('active');
    }

    getUnitOrdersCount(type, townId) {
        const town = GameApi.getTown(townId);
        if (!town) return 0;
        const col = town.getUnitOrdersCollection?.();
        if (!col) return 0;
        return col.where?.({ kind: type })?.length || 0;
    }

    getNextInList(unitType, townId) {
        const troops = this.cityTroops[townId];
        if (!troops) return null;
        const order = unitType === 'naval' ? this.NAVAL_ORDER : this.GROUND_ORDER;
        const key = `${townId}_${unitType}`;
        const start = this._nextOffset?.[key] || 0;
        for (let i = 0; i < order.length; i++) {
            const idx = (start + i) % order.length;
            const unit = order[idx];
            if (troops[unit] && this.getTroopCount(unit, townId) !== 0) {
                if (!this._nextOffset) this._nextOffset = {};
                this._nextOffset[key] = (idx + 1) % order.length;
                return unit;
            }
        }
        return null;
    }

    getTroopCount(troop, townId) {
        const town = GameApi.getTown(townId);
        if (!town || !this.cityTroops[townId] || !this.cityTroops[townId][troop]) return 0;
        let count = this.cityTroops[townId][troop];
        const orders = town.getUnitOrdersCollection?.()?.models || [];
        for (const o of orders) {
            if (o.attributes.unit_type === troop) count -= o.attributes.count;
        }
        const townUnits = town.units?.() || {};
        if (troop in townUnits) count -= townUnits[troop];
        const outer = town.unitsOuter?.() || {};
        if (troop in outer) count -= outer[troop];
        if (count < 0) return 0;
        const res = town.resources?.() || {};
        const unitData = GameApi.getUnitData(troop);
        if (!unitData) return 0;
        const discount = GameApi.unitDiscount(townId, unitData);
        const { wood, stone, iron } = unitData.resources || { wood: 0, stone: 0, iron: 0 };
        const w = (res.wood || 0) / Math.max(1, Math.round(wood * discount));
        const s = (res.stone || 0) / Math.max(1, Math.round(stone * discount));
        const i = (res.iron || 0) / Math.max(1, Math.round(iron * discount));
        const current = parseInt(Math.min(w, s, i));
        const duablePop = parseInt((res.population || 0) / unitData.population);
        const wMax = (res.storage || 1) / Math.max(1, wood * discount);
        const sMax = (res.storage || 1) / Math.max(1, stone * discount);
        const iMax = (res.storage || 1) / Math.max(1, iron * discount);
        let max = parseInt(Math.min(wMax, sMax, iMax) * this.percentual);
        max = max > duablePop ? duablePop : max;
        if (count <= 0) return 0;
        const affordable = Math.min(count, current, max, duablePop);
        if (affordable < this.MAX_BATCH) return -1;
        return Math.min(affordable, this.MAX_BATCH);
    }

    checkPolis(type, townId) {
        if (this.getUnitOrdersCount(type, townId) > 6) return false;
        let count = 1;
        while (count >= 0) {
            const next = this.getNextInList(type, townId);
            if (!next) return false;
            count = this.getTroopCount(next, townId);
            if (count < 0) return false;
            if (count === 0) continue;
            this.buildPost(townId, next, count);
            return true;
        }
        return false;
    }

    getPowerActive() {
        const fragments = GameApi.getCastedPowers();
        const list = [];
        for (const townId in this.cityTroops) {
            const models = fragments[townId]?.models;
            if (!models) continue;
            for (const p of models) {
                if (this.POWER_LIST.includes(p.attributes.power_id)) { list.push(townId); break; }
            }
        }
        return list;
    }

    buildPost(townId, unit, count) {
        GameApi.ajaxPost('building_barracks', 'build', { unit_id: unit, amount: count, town_id: townId }, () => {});
    }

    getActiveList() {
        if (!this.spell) return Object.keys(this.cityTroops);
        return this.getPowerActive();
    }

    async execute() {
        if (!this.active) return false;
        const townList = this.getActiveList();
        for (const townId of townList) {
            if (!(townId in (uw.ITowns.towns || {}))) {
                delete this.cityTroops[townId];
                this.saveSettings('troops', this.cityTroops);
                continue;
            }
            if (this.checkPolis('naval', townId)) return true;
            if (this.checkPolis('ground', townId)) return true;
        }
        return false;
    }
}
