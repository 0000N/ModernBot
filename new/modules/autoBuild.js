class AutoBuild extends ModernUtils {
    SPRITES = {
        main:     '-450px 0px',
        storage:  '-250px -50px',
        farm:     '-150px 0px',
        academy:  '0px 0px',
        temple:   '-300px -50px',
        barracks: '-50px 0px',
        docks:    '-100px 0px',
        market:   '0px -50px',
        hide:     '-200px 0px',
        lumber:   '-400px 0px',
        stoner:   '-200px -50px',
        ironer:   '-250px 0px',
        wall:     '-50px -100px',
    };

    BUILDINGS = ['main', 'storage', 'farm', 'academy', 'temple', 'barracks', 'docks', 'market', 'hide', 'lumber', 'stoner', 'ironer', 'wall'];

    constructor() {
        super();
        this.townsBuildings = this.loadSettings('buildings', {});
        this.active = this.loadSettings('ab_active', false);
        GameApi.onWindowOpen((e, handler) => {
            if (handler?.context !== 'building_senate') return;
            this._updateSenate(handler);
        });
    }

    _updateSenate(handler) {
        handler.wnd.setWidth?.(850);
        const id = `gpwnd_${handler.wnd.getID?.()}`;
        const updateView = () => {
            const iv = setInterval(() => {
                const $w = $('#' + id);
                const $tasks = $w.find('#main_tasks');
                if (!$tasks.length) return;
                $tasks.hide();
                const $new = $('<div>').append('<p style="padding:10px">AutoBuild active. Set levels in ModernBot tab.</p>');
                $new.css({ position: $tasks.css('position'), left: parseInt($tasks.css('left')) - 20, top: $tasks.css('top') });
                $tasks.after($new);
                $w.find('#techtree').css({ position: 'relative', left: '40px' });
                $w.css({ overflowY: 'visible' });
                clearInterval(iv);
            }, 10);
            setTimeout(() => clearInterval(iv), 100);
        };
        const old = handler.wnd.setContent2;
        handler.wnd.setContent2 = (...a) => { updateView(); old?.(...a); };
    }

    render() {
        const { $container, $title } = this.getTitleElement('Auto Build');
        this.$container = $container;
        this.$title = $title;
        this.$title.click(() => this.toggle());
        if (this.active) this.$title.addClass('active');

        const town = GameApi.getCurrentTown();
        if (!town) return $container;
        const townId = String(town.id);
        const isActive = townId in this.townsBuildings;

        const $info = $('<div>').css({ padding: '6px' });
        $info.html(`<b>${town.getName()}</b> [${town.getPoints()} pts]`);
        $container.append($info);

        if (isActive) {
            const target = this.townsBuildings[townId] || {};
            const bld = GameApi.getBuildings(town.id);
            const $grid = $('<div>').css({ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px' });

            for (const name of this.BUILDINGS) {
                const cur = bld[name] || 0;
                const tgt = target[name] || 0;
                const sprite = this.SPRITES[name] || '0 0';

                const $box = $('<div>').addClass('auto_build_box').css({ margin: '2px' });
                const $bld = $('<div>').addClass('auto_build_building').css({ backgroundPosition: sprite });
                $box.append($bld);

                const $lvl = $('<div>').addClass('auto_build_lvl').text(`${cur}→${tgt}`);
                $box.append($lvl);

                const $up = $('<div>').addClass('auto_build_up_arrow').click(e => { e.stopPropagation(); this._editLevel(town.id, name, 1, e.shiftKey); });
                const $down = $('<div>').addClass('auto_build_down_arrow').click(e => { e.stopPropagation(); this._editLevel(town.id, name, -1, e.shiftKey); });
                $box.append($up, $down);

                $grid.append($box);
            }
            $container.append($grid);
        }
        return $container;
    }

    _editLevel(townId, name, d, shift) {
        const tid = String(townId);
        if (!(tid in this.townsBuildings)) return;
        const bld = GameApi.getBuildings(townId);
        if (!bld) return;
        const data = GameApi.getBuildingData(name);
        if (!data?.max_level) return;
        const cur = bld[name] || 0;
        const target = this.townsBuildings[tid];
        d = shift ? d * 10 : d;
        target[name] = Math.min(Math.max(cur + d, data.min_level || 0), data.max_level);
        this.townsBuildings[tid] = target;
        this.saveSettings('buildings', this.townsBuildings);
    }

    toggle() {
        const town = GameApi.getCurrentTown();
        if (!town) return;
        const tid = String(town.id);
        if (tid in this.townsBuildings) {
            delete this.townsBuildings[tid];
        } else {
            this.townsBuildings[tid] = {};
            const bld = GameApi.getBuildings(town.id);
            for (const n of this.BUILDINGS) this.townsBuildings[tid][n] = bld[n] || 0;
        }
        this.saveSettings('buildings', this.townsBuildings);
        this.active = Object.keys(this.townsBuildings).length > 0;
        this.$title.toggleClass('active', this.active);
    }

    async execute() {
        for (const townId of Object.keys(this.townsBuildings)) {
            const town = GameApi.getTown(townId);
            if (!town) { delete this.townsBuildings[townId]; this.saveSettings('buildings', this.townsBuildings); continue; }
            if (this._isFullQueue(town)) continue;
            if (this._isDone(town)) { delete this.townsBuildings[townId]; this.saveSettings('buildings', this.townsBuildings); continue; }
            await this._getNextBuild(townId);
            return true;
        }
        return false;
    }

    _isFullQueue(town) {
        const len = town.buildingOrders?.()?.length || 0;
        return len >= (GameApi.isAdvisorActive('curator') ? 7 : 2);
    }

    _isDone(town) {
        const tid = String(town.id);
        const bld = GameApi.getBuildings(town.id);
        const target = this.townsBuildings[tid] || {};
        for (const b of Object.keys(target)) { if (target[b] !== bld[b]) return false; }
        return true;
    }

    async _postBuild(type, townId) {
        const town = GameApi.getTown(townId);
        if (!town) return;
        const res = GameApi.getResources(townId);
        const bdd = GameApi.getBuildingBuildData(townId);
        if (!bdd?.[type] || !res) return;
        const { resources_for, population_for } = bdd[type];
        if ((town.getAvailablePopulation?.() || 0) < population_for) return;
        const m = 20;
        if (res.wood < (resources_for.wood || 0) + m || res.stone < (resources_for.stone || 0) + m || res.iron < (resources_for.iron || 0) + m) return;
        GameApi.ajaxPost('frontend_bridge', 'execute', { model_url: 'BuildingOrder', action_name: 'buildUp', arguments: { building_id: type }, town_id: townId }, () => {});
        await this.sleep(1234);
    }

    async _postTearDown(type, townId) {
        GameApi.ajaxPost('frontend_bridge', 'execute', { model_url: 'BuildingOrder', action_name: 'tearDown', arguments: { building_id: type }, town_id: townId }, () => {});
        await this.sleep(1234);
    }

    async _getNextBuild(townId) {
        const town = GameApi.getTown(townId);
        if (!town) return;
        const bld = { ...(GameApi.getBuildings(townId) || {}) };
        for (const o of (town.buildingOrders?.()?.models || [])) {
            if (o.attributes.tear_down) bld[o.attributes.building_type] = (bld[o.attributes.building_type] || 0) - 1;
            else bld[o.attributes.building_type] = (bld[o.attributes.building_type] || 0) + 1;
        }
        const target = this.townsBuildings[String(townId)] || {};

        const check = async (build, level) => {
            if (Array.isArray(build)) { build.sort(() => Math.random() - 0.5); for (const el of build) { if (await check(el, level)) return true; } return false; }
            if ((target[build] || 0) <= (bld[build] || 0)) return false;
            if ((bld[build] || 0) < level) { await this._postBuild(build, townId); return true; }
            return false;
        };
        const tearCheck = async build => {
            if (Array.isArray(build)) { build.sort(() => Math.random() - 0.5); for (const el of build) { if (await tearCheck(el)) return true; } return false; }
            if ((target[build] || 0) < (bld[build] || 0)) { await this._postTearDown(build, townId); return true; }
            return false;
        };

        if ((bld['docks'] || 0) < 1) {
            if (await check('lumber', 3)) return; if (await check('stoner', 3)) return; if (await check('farm', 4)) return;
            if (await check('ironer', 3)) return; if (await check('storage', 4)) return; if (await check('temple', 3)) return;
            if (await check('main', 5)) return; if (await check('barracks', 5)) return; if (await check('storage', 5)) return;
            if (await check('stoner', 6)) return; if (await check('lumber', 6)) return; if (await check('ironer', 6)) return;
            if (await check('main', 8)) return; if (await check('farm', 8)) return; if (await check('market', 6)) return;
            if (await check('storage', 8)) return; if (await check('academy', 7)) return; if (await check('temple', 5)) return;
            if (await check('farm', 12)) return; if (await check('main', 15)) return; if (await check('storage', 12)) return;
            if (await check('main', 25)) return; if (await check('hide', 10)) return;
        }
        if (await check('farm', 15)) return;
        if (await check(['storage', 'main'], 25)) return;
        if (await check('market', 4)) return;
        if (await check('hide', 10)) return;
        if (await check(['lumber', 'stoner', 'ironer'], 15)) return;
        if (await check(['academy', 'farm'], 36)) return;
        if (await check(['docks', 'barracks'], 10)) return;
        if (await check('wall', 25)) return;
        if (await check(['docks', 'barracks', 'market'], 20)) return;
        if (await check('farm', 45)) return;
        if (await check(['docks', 'barracks', 'market'], 30)) return;
        if (await check(['lumber', 'stoner', 'ironer'], 40)) return;
        if (await check('temple', 30)) return;
        if (await check('storage', 35)) return;
        const lista = ['lumber', 'stoner', 'ironer', 'docks', 'barracks', 'market', 'temple', 'academy', 'farm', 'hide', 'storage', 'wall'];
        if (await tearCheck(lista)) return;
        if (await tearCheck('main')) return;
    }
}
