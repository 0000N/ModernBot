/* Facade over Grepolis internals. Single source of truth for game access.
   Every accessor is defensive: on failure it logs once and returns a safe default,
   so a game update can never throw an uncaught error inside the bot loop. */
class GameApi {
    static _warned = new Set();

    static _safe(label, fn, fallback) {
        try {
            return fn();
        } catch (e) {
            if (!GameApi._warned.has(label)) {
                GameApi._warned.add(label);
                console.warn(`[ModernBot][GameApi] "${label}" failed — game internals may have changed:`, e);
            }
            return fallback;
        }
    }

    /* --- Identity / world --- */
    static worldId() {
        return GameApi._safe('worldId', () => uw.Game.world_id, 'unknown');
    }

    /* --- Towns --- */
    static getTowns() {
        return GameApi._safe('getTowns',
            () => uw.MM.getOnlyCollectionByName('Town').models, []);
    }
    static getCurrentTown() {
        return GameApi._safe('getCurrentTown', () => uw.ITowns.getCurrentTown(), null);
    }
    static getTown(townId) {
        return GameApi._safe('getTown',
            () => uw.ITowns.getTown(townId) || uw.ITowns.towns[townId], null);
    }
    static getResources(townId) {
        return GameApi._safe('getResources', () => {
            const t = GameApi.getTown(townId);
            return t ? t.resources() : null;
        }, null);
    }

    /* --- Game data --- */
    static getUnitData(unit) {
        return GameApi._safe('getUnitData', () => uw.GameData?.units?.[unit] || null, null);
    }
    static isAdvisorActive(name) {
        return GameApi._safe('isAdvisorActive',
            () => uw.GameDataPremium.isAdvisorActivated(name), false);
    }

    /* --- Networking --- */
    static ajaxPost(controller, action, data, onSuccess) {
        return GameApi._safe('ajaxPost',
            () => uw.gpAjax.ajaxPost(controller, action, data, false, onSuccess), null);
    }
    static ajaxGet(controller, action, data, onSuccess) {
        return GameApi._safe('ajaxGet',
            () => uw.gpAjax.ajaxGet(controller, action, data, false, onSuccess), null);
    }

    /* --- UI feedback --- */
    static notifySuccess(msg) {
        GameApi._safe('notifySuccess', () => uw.HumanMessage?.success?.(msg));
    }
    static notifyError(msg) {
        GameApi._safe('notifyError', () => uw.HumanMessage?.error?.(msg));
    }

    /* --- Buildings / Trade capacity --- */
    static getBuildings(townId) {
        return GameApi._safe('getBuildings', () => {
            const t = GameApi.getTown(townId);
            return t ? t.buildings().attributes : {};
        }, {});
    }
    static availableTradeCapacity(townId) {
        return GameApi._safe('tradeCapacity', () => {
            const t = GameApi.getTown(townId);
            return t ? t.getAvailableTradeCapacity() : 0;
        }, 0);
    }

    /* --- Farm towns --- */
    static getFarmTowns() {
        return GameApi._safe('getFarmTowns',
            () => uw.MM.getOnlyCollectionByName('FarmTown')?.models || [], []);
    }
    static getFarmPlayerRelations() {
        return GameApi._safe('getFarmRelations',
            () => uw.MM.getOnlyCollectionByName('FarmTownPlayerRelation')?.models || [], []);
    }

    /* --- Trade overview --- */
    static getAllTrades() {
        return new Promise(resolve => {
            GameApi.ajaxGet('town_overviews', 'trade_overview', {}, data => {
                resolve(GameApi._safe('parseTrades', () => data?.movements || [], []));
            });
            setTimeout(() => resolve([]), 5000);
        });
    }

    /* --- Units / mods --- */
    static getUnitBuildMod(townId, unitData) {
        return GameApi._safe('unitBuildMod',
            () => uw.GeneralModifications?.getUnitBuildResourcesModification?.(townId, unitData) || 1, 1);
    }
    static getAvailablePop(townId) {
        return GameApi._safe('availablePop', () => {
            const t = GameApi.getTown(townId);
            return t ? t.getAvailablePopulation() : 0;
        }, 0);
    }

    /* --- Observables --- */
    static onWindowOpen(cb) {
        try { uw.$.Observer(uw.GameEvents.window.open).subscribe(cb); } catch(e) {}
    }
    static onTownSwitch(cb) {
        try { uw.$.Observer(uw.GameEvents.town.town_switch).subscribe('modernBotTown', cb); } catch(e) {}
    }

    /* --- Player / Models --- */
    static playerId() {
        return GameApi._safe('playerId', () => uw.Game.player_id, null);
    }
    static getModels() {
        return GameApi._safe('getModels', () => uw.MM.getModels(), {});
    }
    static getModelByNameAndPlayerId(name) {
        return GameApi._safe('model_' + name,
            () => uw.MM.getModelByNameAndPlayerId(name), null);
    }

    /* --- Buildings data --- */
    static getBuildingData(name) {
        return GameApi._safe('getBuildingData', () => uw.GameData?.buildings?.[name], null);
    }
    static getBuildingBuildData(townId) {
        return GameApi._safe('getBuildingBuildData',
            () => uw.MM?.getModels?.()?.BuildingBuildData?.[townId]?.attributes?.building_data, null);
    }
    static getCastedPowers() {
        return GameApi._safe('getCastedPowers',
            () => uw.MM?.getFirstTownAgnosticCollectionByName?.('CastedPowers')?.fragments, {});
    }
    static unitDiscount(townId, unitData) {
        return GameApi._safe('unitDiscount',
            () => uw.GeneralModifications?.getUnitBuildResourcesModification?.(townId, unitData) || 1, 1);
    }

    /* --- Ajax with error handler --- */
    static ajaxPostWithHandlers(controller, action, data, onSuccess, onError) {
        return GameApi._safe('ajaxPostHandlers',
            () => uw.gpAjax.ajaxPost(controller, action, data, false, onSuccess, onError), null);
    }
    /* --- Monkey-patch for attack command ID --- */
    static hookWindowCreateForCommandId(setId) {
        const mgr = uw.GPWindowMgr;
        if (mgr._modernOrigCreate) return;
        mgr._modernOrigCreate = mgr.Create;
        mgr.Create = function (type, title, params, id) {
            if (type === mgr.TYPE_ATK_COMMAND && id) setId(id);
            return mgr._modernOrigCreate.apply(this, arguments);
        };
    }

    /* --- Collections --- */
    static getCollection(name) {
        return GameApi._safe('collection_' + name,
            () => uw.MM.getOnlyCollectionByName(name)?.models || [], []);
    }

    /* --- Town coordinates --- */
    static getIslandX(townId) {
        return GameApi._safe('islandX', () => {
            const t = GameApi.getTown(townId);
            return t ? t.getIslandCoordinateX() : 0;
        }, 0);
    }
    static getIslandY(townId) {
        return GameApi._safe('islandY', () => {
            const t = GameApi.getTown(townId);
            return t ? t.getIslandCoordinateY() : 0;
        }, 0);
    }

    /* --- Bot-blocking detection --- */
    static isCaptchaActive() {
        // Any of these selectors present => a human check is on screen.
        return $('.botcheck').length > 0
            || $('#recaptcha_window').length > 0
            || $('.g-recaptcha').length > 0
            || $('#captcha_curtain').length > 0;
    }
}
