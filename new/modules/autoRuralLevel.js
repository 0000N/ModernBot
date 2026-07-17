class AutoRuralLevel extends ModernUtils {
    constructor() {
        super();
        this.ruralLevel = this.loadSettings('enable_autorural_level', 1);
        this.active = this.loadSettings('enable_autorural_level_active', false);
    }

    render() {
        const { $container, $title } = this.getTitleElement('Auto Rural Level');
        this.$container = $container;
        this.$title = $title;

        this.$title.click(() => this.toggle());
        if (this.active) this.$title.addClass('active');

        const $body = $('<div>').css({ padding: '5px' });
        for (let n = 1; n <= 6; n++) {
            const $b = this.getButtonElement(`lvl ${n}`);
            $b.click(() => this.setRuralLevel(n));
            if (this.ruralLevel === n) $b.addClass('disabled');
            $body.append($b);
        }
        this.$container.append($body);
        return this.$container;
    }

    setRuralLevel(n) {
        this.ruralLevel = n;
        this.saveSettings('enable_autorural_level', n);
    }

    toggle() {
        this.active = !this.active;
        this.saveSettings('enable_autorural_level_active', this.active);
        this.$title.toggleClass('active');
    }

    async execute() {
        if (!this.active) return false;

        const farmTowns = GameApi.getCollection('FarmTown');
        const relations = GameApi.getCollection('FarmTownPlayerRelation');
        const killModel = GameApi.getModelByNameAndPlayerId('PlayerKillpoints');
        const kp = killModel?.attributes || { att: 0, def: 0, used: 0 };
        const available = kp.att + kp.def - kp.used;

        const locked = relations.filter(r => r.attributes.relation_status === 0);
        const unlocked = relations.length - locked.length;

        if (locked.length > 0) {
            const discounts = [2, 8, 10, 30, 50, 100];
            if (unlocked < discounts.length && available < discounts[unlocked]) return false;
            if (available < 100) return false;

            const towns = this.generateList();
            for (const townId of towns) {
                const town = GameApi.getTown(townId);
                if (!town) continue;
                const x = GameApi.getIslandX(townId);
                const y = GameApi.getIslandY(townId);
                for (const ft of farmTowns) {
                    if (ft.attributes.island_x !== x || ft.attributes.island_y !== y) continue;
                    for (const rel of locked) {
                        if (ft.attributes.id !== rel.attributes.farm_town_id) continue;
                        GameApi.ajaxPost('frontend_bridge', 'execute', {
                            model_url: `FarmTownPlayerRelation/${rel.id}`,
                            action_name: 'unlock',
                            arguments: { farm_town_id: ft.attributes.id },
                            town_id: townId,
                        }, () => {});
                        console.log(`[ModernBot] unlocked ${ft.attributes.name}`);
                        return true;
                    }
                }
            }
        } else {
            const towns = this.generateList();
            const levelCosts = [1, 5, 25, 50, 100];
            for (let level = 1; level < this.ruralLevel; level++) {
                if (available < levelCosts[level - 1]) return false;
                for (const townId of towns) {
                    const town = GameApi.getTown(townId);
                    if (!town) continue;
                    const x = GameApi.getIslandX(townId);
                    const y = GameApi.getIslandY(townId);
                    for (const ft of farmTowns) {
                        if (ft.attributes.island_x !== x || ft.attributes.island_y !== y) continue;
                        for (const rel of relations) {
                            if (ft.attributes.id !== rel.attributes.farm_town_id) continue;
                            if (rel.attributes.expansion_at) continue;
                            if (rel.attributes.expansion_stage > level) continue;
                            GameApi.ajaxPost('frontend_bridge', 'execute', {
                                model_url: `FarmTownPlayerRelation/${rel.id}`,
                                action_name: 'upgrade',
                                arguments: { farm_town_id: ft.attributes.id },
                                town_id: townId,
                            }, () => {});
                            console.log(`[ModernBot] upgraded ${ft.attributes.name}`);
                            return true;
                        }
                    }
                }
            }
            this.active = false;
            this.saveSettings('enable_autorural_level_active', false);
        }
        return false;
    }

    generateList() {
        const towns = GameApi.getTowns();
        const seen = new Set();
        const list = [];
        for (const t of towns) {
            const { on_small_island, island_id, id } = t.attributes;
            if (on_small_island || seen.has(island_id)) continue;
            seen.add(island_id);
            list.push(id);
        }
        return list;
    }
}
