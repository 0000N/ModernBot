class AutoParty extends ModernUtils {
    constructor() {
        super();
        this.activeTypes = this.loadSettings('ap_types', { festival: false, procession: false, theater: false });
        this.single = this.loadSettings('ap_single', true);
        this.active = this.loadSettings('ap_enable', false);
    }

    render() {
        const { $container, $title } = this.getTitleElement('Auto Party');
        this.$container = $container;
        this.$title = $title;

        this.$title.click(() => this.toggle());
        if (this.active) this.$title.addClass('active');

        const $types = $('<div>').css({ padding: '5px' });
        ['festival', 'procession', 'theater'].forEach(type => {
            const $b = this.getButtonElement(type.charAt(0).toUpperCase() + type.slice(1));
            $b.click(() => this.triggerType(type));
            if (!this.activeTypes[type]) $b.addClass('disabled');
            $types.append($b);
        });

        const $mode = $('<div>').css({ padding: '5px' });
        const $single = this.getButtonElement('Single');
        const $multi = this.getButtonElement('All');
        $single.click(() => this.triggerMode(0));
        $multi.click(() => this.triggerMode(1));
        if (!this.single) $single.addClass('disabled');
        else $multi.addClass('disabled');
        $mode.append($single, $multi);

        $container.append($types, $mode);
        return $container;
    }

    triggerType(type) {
        this.activeTypes[type] = !this.activeTypes[type];
        this.saveSettings('ap_types', this.activeTypes);
    }

    triggerMode(val) {
        this.single = !val;
        this.saveSettings('ap_single', this.single);
    }

    toggle() {
        this.active = !this.active;
        this.saveSettings('ap_enable', this.active);
        this.$title.toggleClass('active');
    }

    async execute() {
        if (!this.active) return false;
        let triggered = false;
        if (this.activeTypes['procession']) triggered = await this.checkTriumph() || triggered;
        if (this.activeTypes['festival']) triggered = await this.checkParty() || triggered;
        if (this.activeTypes['theater']) triggered = await this.checkTheater() || triggered;
        return triggered;
    }

    getCelebrationsList(type) {
        const models = uw.MM?.getModels()?.Celebration;
        if (!models) return [];
        return Object.values(models)
            .filter(c => c.attributes.celebration_type === type)
            .map(c => c.attributes.town_id);
    }

    async checkParty() {
        let max = 10;
        const party = this.getCelebrationsList('party');
        if (this.single) {
            const towns = Object.keys(uw.ITowns.towns || {});
            for (const townId of towns) {
                if (party.includes(parseInt(townId))) continue;
                const town = GameApi.getTown(townId);
                if (!town) continue;
                const bld = GameApi.getBuildings(townId);
                if (bld.academy < 30) continue;
                const res = GameApi.getResources(townId);
                if (!res || res.wood < 15000 || res.stone < 18000 || res.iron < 15000) continue;
                this.makeCelebration('party', townId);
                await this.sleep(750);
                max--;
                if (max <= 0) break;
            }
        } else {
            if (party.length > 1) return false;
            this.makeCelebration('party');
        }
        return max < 10;
    }

    async checkTriumph() {
        let max = 10;
        const killModel = GameApi.getModelByNameAndPlayerId('PlayerKillpoints');
        const kp = killModel?.attributes || { att: 0, def: 0, used: 0 };
        let available = kp.att + kp.def - kp.used;
        if (available < 300) return false;
        const triumph = this.getCelebrationsList('triumph');
        // single/multiple swapped (intentionnel v1)
        if (!this.single) {
            const towns = Object.keys(uw.ITowns.towns || {});
            for (const townId of towns) {
                if (triumph.includes(parseInt(townId))) continue;
                this.makeCelebration('triumph', townId);
                await this.sleep(500);
                available -= 300;
                if (available < 300) break;
                max--;
                if (max <= 0) break;
            }
        } else {
            if (triumph.length > 1) return false;
            this.makeCelebration('triumph');
        }
        return max < 10;
    }

    async checkTheater() {
        let max = 10;
        const theater = this.getCelebrationsList('theater');
        if (this.single) {
            const towns = Object.keys(uw.ITowns.towns || {});
            for (const townId of towns) {
                if (theater.includes(parseInt(townId))) continue;
                const bld = GameApi.getBuildings(townId);
                if (bld.theater !== 1) continue;
                const res = GameApi.getResources(townId);
                if (!res || res.wood < 10000 || res.stone < 12000 || res.iron < 10000) continue;
                this.makeCelebration('theater', townId);
                await this.sleep(500);
                max--;
                if (max <= 0) break;
            }
        } else {
            if (theater.length > 1) return false;
            this.makeCelebration('theater');
        }
        return max < 10;
    }

    makeCelebration(type, townId) {
        if (typeof townId === 'undefined') {
            GameApi.ajaxPost('town_overviews', 'start_all_celebrations', { celebration_type: type }, () => {});
        } else {
            GameApi.ajaxPost('building_place', 'start_celebration', { celebration_type: type, town_id: townId }, () => {});
        }
    }
}
