class AutoUnitBuilder extends ModernUtils {
    GROUND_ORDER = ['catapult', 'sword', 'archer', 'hoplite', 'slinger', 'rider', 'chariot'];

    NAVAL_ORDER = [
        'small_transporter',
        'bireme',
        'trireme',
        'attack_ship',
        'big_transporter',
        'demolition_ship',
        'colonize_ship',
    ];

    UNIT_ALIASES = {
        fire_ship: 'demolition_ship',
        fire_ships: 'demolition_ship',
        fireship: 'demolition_ship',
        fireships: 'demolition_ship',
        demo_ship: 'demolition_ship',
        demolition_ship: 'demolition_ship',
    };

    REQUIREMENTS = {
        slinger: { research: 'slinger' },
        archer: { research: 'archer' },
        rider: { research: 'rider' },
        chariot: { research: 'chariot' },
        catapult: { research: 'catapult' },

        bireme: { research: 'bireme' },
        trireme: { research: 'trireme' },
        attack_ship: { research: 'attack_ship' },
        big_transporter: { research: 'big_transporter' },
        demolition_ship: { research: 'demolition_ship' },
        colonize_ship: { research: 'colonize_ship' },
    };

    TEMPLATES = {
        bireme_city: {
            label: 'Bireme City',
            units: { bireme: 250 },
            academy: ['bireme'],
        },
        fire_ship_city: {
            label: 'Fire Ship City',
            units: { demolition_ship: 200 },
            academy: ['demolition_ship'],
        },
        slinger_city: {
            label: 'Slinger City',
            units: { slinger: 3000, small_transporter: 32 },
            academy: ['slinger'],
        },
        light_ship_city: {
            label: 'Light Ship City',
            units: { attack_ship: 250 },
            academy: ['attack_ship'],
        },
        defense_city: {
            label: 'Defense City',
            units: { sword: 600, archer: 600, hoplite: 600, bireme: 100 },
            academy: ['archer', 'bireme'],
        },
        conquest_support: {
            label: 'Conquest / Support',
            units: { colonize_ship: 1, big_transporter: 20, bireme: 100 },
            academy: ['colonize_ship', 'big_transporter', 'bireme'],
        },
        farming_city: {
            label: 'Farming / Resource City',
            units: { sword: 250, archer: 250 },
            academy: ['archer'],
        },
    };

    constructor() {
        super();
        this.active = this.loadSettings('unit_builder_active', false);
        this.townTemplates = this.loadSettings('unit_builder_templates', {});
        this.maxOrdersPerKind = this.loadSettings('unit_builder_max_orders', 6);
        this.maxBatchSize = this.loadSettings('unit_builder_max_batch', 50);
    }

    render() {
        const { $container, $title } = this.getTitleElement('Unit Builder', '(click to toggle)');
        this.$container = $container;
        this.$title = $title;
        if (this.active) this.$title.addClass('active');
        this.$title.click(() => this.toggle());

        const town = this.getCurrentTown();
        const townId = this.getTownId(town);
        const currentTemplateId = this.townTemplates[townId] || '';
        const currentTemplate = this.TEMPLATES[currentTemplateId];

        const $body = $('<div>').css({ padding: '8px' });
        const $townInfo = $('<div>').css({ marginBottom: '8px' });
        $townInfo.append($('<div>').html(`<b>${town.getName()}</b> <span style="opacity:.7">[${town.getPoints()} pts]</span>`));
        $townInfo.append($('<div>').text(currentTemplate ? `template: ${currentTemplate.label}` : 'template: none selected'));

        const missing = currentTemplate ? this.getMissingRequirements(town, currentTemplate) : [];
        if (missing.length) {
            $townInfo.append($('<div>').css({ color: '#d88', marginTop: '4px' }).text(`missing: ${missing.join(', ')}`));
        }
        $body.append($townInfo);

        const $buttons = $('<div>').css({ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' });
        Object.entries(this.TEMPLATES).forEach(([templateId, template]) => {
            const $button = this.getButtonElement(template.label);
            if (templateId === currentTemplateId) $button.addClass('disabled');
            $button.click(() => {
                this.setTemplate(townId, templateId);
                if (uw.HumanMessage?.success) uw.HumanMessage.success(`template: ${template.label}`);
                else console.log(`[ModernBot] template: ${template.label}`);
            });
            $buttons.append($button);
        });

        const $clear = this.getButtonElement('Clear Template');
        $clear.click(() => {
            delete this.townTemplates[townId];
            this.saveSettings('unit_builder_templates', this.townTemplates);
            if (uw.HumanMessage?.success) uw.HumanMessage.success('template cleared');
            else console.log('[ModernBot] template cleared');
        });
        $buttons.append($clear);
        $body.append($buttons);

        if (currentTemplate) $body.append(this.renderTemplatePreview(town, currentTemplate));
        $container.append($body);
        return $container;
    }

    renderTemplatePreview(town, template) {
        const $table = $('<table>').css({ width: '100%', fontSize: '12px' });
        $table.append('<tr><th style="text-align:left">unit</th><th style="text-align:left">target</th><th style="text-align:left">owned + queued</th><th style="text-align:left">remaining</th><th style="text-align:left">status</th></tr>');
        Object.entries(template.units).forEach(([rawUnit, target]) => {
            const unit = this.normalizeUnit(rawUnit);
            const current = this.getOwnedAndQueuedCount(town, unit);
            const remaining = Math.max(0, target - current);
            const canBuild = this.canBuildUnit(town, unit);
            const status = canBuild.ok ? 'ready' : `missing: ${canBuild.missing.join(', ')}`;
            $table.append(`<tr><td>${unit}</td><td>${target}</td><td>${current}</td><td>${remaining}</td><td>${status}</td></tr>`);
        });
        return $table;
    }

    toggle() {
        this.active = !this.active;
        this.saveSettings('unit_builder_active', this.active);
        if (this.$title) this.$title.toggleClass('active');
    }

    setTemplate(townId, templateId) {
        this.townTemplates[townId] = templateId;
        this.saveSettings('unit_builder_templates', this.townTemplates);
    }

    execute = async () => {
        if (!this.active) return false;
        if ($('.botcheck').length || $('#recaptcha_window').length || $('.g-recaptcha').length) return false;

        for (const [townId, templateId] of Object.entries(this.townTemplates)) {
            const town = this.getTown(townId);
            if (!town) {
                delete this.townTemplates[townId];
                this.saveSettings('unit_builder_templates', this.townTemplates);
                continue;
            }
            const template = this.TEMPLATES[templateId];
            if (!template) continue;
            if (await this.buildForTown(town, template)) return true;
        }
        return false;
    };

    buildForTown = async (town, template) => {
        const townId = this.getTownId(town);
        for (const [rawUnit, target] of Object.entries(template.units)) {
            const unit = this.normalizeUnit(rawUnit);
            const unitData = this.getUnitData(unit);
            if (!unitData) continue;

            const canBuild = this.canBuildUnit(town, unit);
            if (!canBuild.ok) {
                console.log(`[ModernBot] ${town.getName()}: cannot build ${unit}; missing ${canBuild.missing.join(', ')}`);
                continue;
            }

            const kind = this.getUnitKind(unit);
            if (this.getUnitOrdersCount(town, kind) >= this.maxOrdersPerKind) continue;

            const current = this.getOwnedAndQueuedCount(town, unit);
            const remaining = Math.max(0, target - current);
            if (remaining <= 0) continue;

            const affordable = this.getAffordableCount(town, unit);
            const amount = Math.min(remaining, affordable, this.maxBatchSize);
            if (amount <= 0) continue;

            this.buildPost(townId, unit, amount);
            await this.sleep(300);
            return true;
        }
        return false;
    };

    buildPost(townId, unit, amount) {
        const data = { unit_id: unit, amount: amount, town_id: townId };
        console.log(`[ModernBot] ${uw.ITowns.getTown(townId).getName()}: training ${amount} ${unit}`);
        uw.gpAjax.ajaxPost('building_barracks', 'build', data);
    }

    getCurrentTown() { return uw.ITowns.getCurrentTown(); }
    getTown(townId) { return uw.ITowns.getTown(townId) || uw.ITowns.towns[townId]; }
    getTownId(town) { return String(town.getId ? town.getId() : town.id); }
    normalizeUnit(unit) { return this.UNIT_ALIASES[unit] || unit; }
    getUnitData(unit) { return uw.GameData?.units?.[unit] || null; }
    getUnitKind(unit) { return this.NAVAL_ORDER.includes(unit) ? 'naval' : 'ground'; }
    getTownResearches(town) { return town.researches?.().attributes || {}; }
    getTownBuildings(town) { return town.buildings?.().attributes || {}; }
    getRequirementForUnit(unit) {
        const unitData = this.getUnitData(unit);
        if (unitData?.requirements) return unitData.requirements;
        return this.REQUIREMENTS[unit] || {};
    }

    canBuildUnit(town, unit) {
        const missing = [];
        const requirements = this.getRequirementForUnit(unit);
        const researches = this.getTownResearches(town);
        const buildings = this.getTownBuildings(town);
        if (requirements.research && !researches[requirements.research]) missing.push(requirements.research);
        if (requirements.building) {
            const currentLevel = buildings[requirements.building] || 0;
            if (currentLevel < (requirements.level || 1)) missing.push(`${requirements.building} ${requirements.level}`);
        }
        return { ok: missing.length === 0, missing };
    }

    getMissingRequirements(town, template) {
        const missing = new Set();
        Object.keys(template.units).forEach(rawUnit => {
            const result = this.canBuildUnit(town, this.normalizeUnit(rawUnit));
            result.missing.forEach(item => missing.add(item));
        });
        if (template.academy) {
            const researches = this.getTownResearches(town);
            template.academy.forEach(research => { if (!researches[research]) missing.add(research); });
        }
        return [...missing];
    }

    getUnitOrdersCount(town, kind) {
        const collection = town.getUnitOrdersCollection?.();
        if (!collection) return 0;
        return collection.where({ kind }).length;
    }

    getOwnedAndQueuedCount(town, unit) {
        let count = 0;
        const townUnits = town.units?.() || {};
        const outerUnits = town.unitsOuter?.() || {};
        count += townUnits[unit] || 0;
        count += outerUnits[unit] || 0;
        const collection = town.getUnitOrdersCollection?.();
        if (collection?.models) {
            for (const order of collection.models) {
                if (order.attributes?.unit_type === unit) count += order.attributes.count || 0;
            }
        }
        return count;
    }

    getAffordableCount(town, unit) {
        const unitData = this.getUnitData(unit);
        if (!unitData) return 0;
        const resources = town.resources();
        const townId = this.getTownId(town);
        let discount = 1;
        try { discount = uw.GeneralModifications.getUnitBuildResourcesModification(townId, unitData); } catch (e) { discount = 1; }
        const cost = unitData.resources || {};
        const byWood = Math.floor(resources.wood || 0) / Math.max(1, Math.round((cost.wood || 0) * discount));
        const byStone = Math.floor(resources.stone || 0) / Math.max(1, Math.round((cost.stone || 0) * discount));
        const byIron = Math.floor(resources.iron || 0) / Math.max(1, Math.round((cost.iron || 0) * discount));
        const byPop = Math.floor((resources.population || 0) / unitData.population);
        return Math.max(0, Math.min(byWood, byStone, byIron, byPop));
    }
}
