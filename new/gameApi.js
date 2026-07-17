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

    /* --- Bot-blocking detection --- */
    static isCaptchaActive() {
        // Any of these selectors present => a human check is on screen.
        return $('.botcheck').length > 0
            || $('#recaptcha_window').length > 0
            || $('.g-recaptcha').length > 0
            || $('#captcha_curtain').length > 0;
    }
}
