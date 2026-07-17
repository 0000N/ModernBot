class AutoBuild extends ModernUtils {
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
                const $window = $('#' + id);
                const $mainTasks = $window.find('#main_tasks');
                if (!$mainTasks.length) return;
                $mainTasks.hide();
                const $new = $('<div>').append('<p style="padding:10px">AutoBuild active. Set levels in ModernBot tab.</p>');
                $new.css({ position: $mainTasks.css('position'), left: parseInt($mainTasks.css('left')) - 20, top: $mainTasks.css('top') });
                $mainTasks.after($new);
                const $tree = $window.find('#techtree');
                $tree.css({ position: 'relative', left: '40px' });
                $window.css({ overflowY: 'visible' });
                clearInterval(iv);
            }, 10);
            setTimeout(() => clearInterval(iv), 100);
        };
        const oldContent = handler.wnd.setContent2;
        handler.wnd.setContent2 = (...args) => { updateView(); oldContent?.(...args); };
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

        const $info = $('<div>').css({ padding: '5px' }).html(
            `<b>${town.getName()}</b> [${town.getPoints()} pts]<br>` +
            `Click title to ${isActive ? 'remove' : 'add'} this town to auto-build.`
        );
        $container.append($info);

        if (isActive) {
            const $buildings = $('<div>').css({ padding: '5px' });
            const target = this.townsBuildings[townId] || {};
            const bld = GameApi.getBuildings(townId);
            const names = ['main', 'storage', 'farm', 'academy', 'temple', 'barracks', 'docks', 'market', 'hide', 'lumber', 'stoner', 'ironer', 'wall'];
            for (const name of names) {
                const cur = bld[name] || 0;
                const tgt = target[name] || 0;
                const diff = tgt - cur;
                const color = diff > 0 ? '#ff8' : diff < 0 ? '#f88' : '#8f8';

                const $row = $('<div>').css({ display: 'flex', alignItems: 'center', margin: '1px 0', fontSize: '11px' });

                $row.append($('<span>').css({ width: '80px' }).text(name));
                $row.append($('<span>').css({ width: '30px', textAlign: 'center', cursor: 'pointer' }).text('−').click(e => { e.stopPropagation(); this._editLevel(town.id, name, -1, e.shiftKey); }));
                $row.append($('<span>').css({ width: '40px', textAlign: 'center', color }).text(`${cur}→${tgt}`));
                $row.append($('<span>').css({ width: '30px', textAlign: 'center', cursor: 'pointer' }).text('+').click(e => { e.stopPropagation(); this._editLevel(town.id, name, 1, e.shiftKey); }));
                $row.append($('<span>').css({ width: '30px', textAlign: 'center', cursor: 'pointer' }).text('⚡').click(e => { e.stopPropagation(); this._editLevel(town.id, name, 0, false); }));

                $buildings.append($row);
            }
            $container.append($buildings);
        }
        return $container;
    }

    _editLevel(townId, name, d, shift) {
        const townIdStr = String(townId);
        if (!(townIdStr in this.townsBuildings)) return;
        const town = GameApi.getTown(townId);
        if (!town) return;
        const data = GameApi.getBuildingData(name);
        if (!data?.max_level) return;
        const bld = GameApi.getBuildings(townId);
        const cur = bld[name] || 0;
        let target = this.townsBuildings[townIdStr];

        if (d) {
            d = shift ? d * 10 : d;
            target[name] = Math.min(Math.max(cur + d, data.min_level || 0), data.max_level);
        } else {
            if (target[name] === cur) target[name] = Math.min(Math.max(50, data.min_level || 0), data.max_level);
            else target[name] = cur;
        }
        this.townsBuildings[townIdStr] = target;
        this.saveSettings('buildings', this.townsBuildings);
    }

    toggle() {
        const town = GameApi.getCurrentTown();
        if (!town) return;
        const townId = String(town.id);
        if (townId in this.townsBuildings) {
            delete this.townsBuildings[townId];
        } else {
            this.townsBuildings[townId] = {};
            const bld = GameApi.getBuildings(town.id);
            const names = ['main', 'storage', 'farm', 'academy', 'temple', 'barracks', 'docks', 'market', 'hide', 'lumber', 'stoner', 'ironer', 'wall'];
            for (const n of names) {
                this.townsBuildings[townId][n] = bld[n] || 0;
            }
        }
        this.saveSettings('buildings', this.townsBuildings);
        this.active = Object.keys(this.townsBuildings).length > 0;
        this.$title.toggleClass('active', this.active);
    }

    async execute() {
        if (!this.active) return false;
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
        const max = GameApi.isAdvisorActive('curator') ? 7 : 2;
        return len >= max;
    }

    _isDone(town) {
        const townId = String(town.id);
        const bld = GameApi.getBuildings(town.id);
        const target = this.townsBuildings[townId] || {};
        for (const build of Object.keys(target)) {
            if (target[build] !== bld[build]) return false;
        }
        return true;
    }

    async _postBuild(type, townId) {
        const town = GameApi.getTown(townId);
        if (!town) return;
        const res = GameApi.getResources(townId);
        if (!res) return;
        const bdd = GameApi.getBuildingBuildData(townId);
        if (!bdd?.[type]) return;
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
        const orders = town.buildingOrders?.()?.models || [];
        for (const o of orders) {
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

        // EXACT V1 SEQUENCE — DO NOT MODIFY
        if ((bld['docks'] || 0) < 1) {
            if (await check('lumber', 3)) return;
            if (await check('stoner', 3)) return;
            if (await check('farm', 4)) return;
            if (await check('ironer', 3)) return;
            if (await check('storage', 4)) return;
            if (await check('temple', 3)) return;
            if (await check('main', 5)) return;
            if (await check('barracks', 5)) return;
            if (await check('storage', 5)) return;
            if (await check('stoner', 6)) return;
            if (await check('lumber', 6)) return;
            if (await check('ironer', 6)) return;
            if (await check('main', 8)) return;
            if (await check('farm', 8)) return;
            if (await check('market', 6)) return;
            if (await check('storage', 8)) return;
            if (await check('academy', 7)) return;
            if (await check('temple', 5)) return;
            if (await check('farm', 12)) return;
            if (await check('main', 15)) return;
            if (await check('storage', 12)) return;
            if (await check('main', 25)) return;
            if (await check('hide', 10)) return;
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
