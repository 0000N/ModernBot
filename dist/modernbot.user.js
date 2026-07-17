// ==UserScript==
// @name         ModernBot
// @version      1.0.0
// @description  A modern grepolis bot
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// @updateURL    https://github.com/0000N/ModernBot/blob/main/dist/merged.user.js
// @downloadURL  https://github.com/0000N/ModernBot/blob/main/dist/merged.user.js
// @icon         https://raw.githubusercontent.com/0000N/ModernBot/main/img/gear.png
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// ==/UserScript==

(function () {
    'use strict';
    var uw;
    if (typeof unsafeWindow == 'undefined') {
        uw = window;
    } else {
        uw = unsafeWindow;
    }

    // Dynamically add CSS
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = `.modern_bot_settings {
    z-index: 10;
    position: absolute;
    top: 52px !important;
    right: 116px !important;
}

.modern_active {
    position: relative;
    background-blend-mode: multiply;
    /* Or another blend mode that achieves your effect */
    background-color: rgba(0, 0, 0, 0.5);
    /* Adjust color for blending */
}


.modern_title_description {
    position: absolute;
    right: 10px;
    top: 4px;
    font-size: 10px
}

.game_border .game_header.active {
    filter: brightness(100%) saturate(186%) hue-rotate(241deg);
}

@keyframes rotateForever {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.rotate-forever {
    animation: rotateForever 5s linear infinite;
    transform-origin: 16px 15px;
    filter: hue-rotate(72deg) saturate(2.5);
}`;
    document.head.appendChild(style);


// File: gameApi.js
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


// File: utils.js
class ModernUtils {

    saveSettings(id, settings) {
        localStorage.setItem(`modern_settings_${id}`, JSON.stringify(settings));
    }

    loadSettings(id, defaultSettings) {
        const settings = localStorage.getItem(`modern_settings_${id}`);
        if (!settings) return defaultSettings;
        return JSON.parse(settings);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getTitleElement(text, desc = '(click to toggle)') {
        const $container = $('<div>').addClass('game_border').css({ cursor: 'pointer' })

        // Append each border element
        $container.append($('<div>').addClass('game_border_top'));
        $container.append($('<div>').addClass('game_border_bottom'));
        $container.append($('<div>').addClass('game_border_left'));
        $container.append($('<div>').addClass('game_border_right'));
        $container.append($('<div>').addClass('game_border_corner corner1'));
        $container.append($('<div>').addClass('game_border_corner corner2'));
        $container.append($('<div>').addClass('game_border_corner corner3'));
        $container.append($('<div>').addClass('game_border_corner corner4'));

        const $text = $('<div>').addClass('game_header bold').text(text);
        $container.append($text);

        const $desc = $('<div>').addClass("modern_title_description").text(desc);
        $text.append($desc);

        // Return the container jQuery element
        return { $container: $container, $title: $text };
    }

    getButtonElement(text) {
        const $button = $('<div>', {
            'class': 'button_new',
        });

        // Add the left and right divs to the button
        $button.append($('<div>', { 'class': 'left' }));
        $button.append($('<div>', { 'class': 'right' }));
        $button.append($('<div>', {
            'class': 'caption js-caption',
            'html': `${text} <div class="effect js-effect"></div>`
        }));

        return $button;
    }

    jitter(base) {
        return base + Math.floor(Math.random() * base * 0.5);
    }

    shouldSkip() {
        // Randomly skip ~10% of cycles for anti-pattern disguise
        return Math.random() < 0.1;
    }

}



// File: window.js
class createGrepoWindow {
    constructor({ id, title, size, tabs, start_tab, minimizable = true }) {
        this.minimizable = minimizable;
        this.width = size[0];
        this.height = size[1];
        this.title = title;
        this.id = id;
        this.tabs = tabs;
        this.start_tab = start_tab;

        /* Private methods */
        const createWindowType = (name, title, width, height, minimizable) => {
            function WndHandler(wndhandle) {
                this.wnd = wndhandle;
            }
            Function.prototype.inherits.call(WndHandler, uw.WndHandlerDefault);
            WndHandler.prototype.getDefaultWindowOptions = function () {
                return {
                    position: ['center', 'center', 100, 100],
                    width: width,
                    height: height,
                    minimizable: minimizable,
                    title: title,
                };
            };
            uw.GPWindowMgr.addWndType(name, `${name}_75624`, WndHandler, 1);
        };

        const getTabById = (id) => {
            return this.tabs.filter((tab) => tab.id === id)[0];
        };

        this.activate = function () {
            createWindowType(this.id, this.title, this.width, this.height, this.minimizable); //
            uw.$(
                `<style id="${this.id}_custom_window_style">
                 #${this.id} .tab_icon { left: 23px;}
                 #${this.id} {top: -36px; right: 95px;}
                 #${this.id} .submenu_link {color: #000;}
                 #${this.id} .submenu_link:hover {text-decoration: none;}
                 #${this.id} li { float:left; min-width: 60px; }
                 </style>
                `,
            ).appendTo('head');
        };

        this.deactivate = function () {
            if (uw.Layout.wnd.getOpenFirst(uw.GPWindowMgr[`TYPE_${this.id}`])) {
                uw.Layout.wnd.getOpenFirst(uw.GPWindowMgr[`TYPE_${this.id}`]).close();
            }
            uw.$(`#${this.id}_custom_window_style`).remove();
        };

        /* open the window */
        this.openWindow = function () {
            let wn = uw.Layout.wnd.getOpenFirst(uw.GPWindowMgr[`TYPE_${this.id}`]);

            /* if open is called but window it's alreay open minimized, maximize that */
            if (wn) {
                if (wn.isMinimized()) {
                    wn.maximizeWindow();
                }
                return;
            }

            let content = `<ul id="${this.id}" class="menu_inner"></ul><div id="${this.id}_content"> </div>`;
            uw.Layout.wnd.Create(uw.GPWindowMgr[`TYPE_${this.id}`]).setContent(content);
            /* Add and reder tabs */
            console.log(this.tabs);
            this.tabs.forEach((e) => {
                let html = `
                    <li><a id="${e.id}" class="submenu_link" href="#"><span class="left"><span class="right"><span class="middle">
                    <span class="tab_label"> ${e.title} </span>
                    </span></span></span></a></li>
                `;
                uw.$(html).appendTo(`#${this.id}`);
            });

            /* Add events to tabs */
            let tabs = '';
            this.tabs.forEach((e) => {
                tabs += `#${this.id} #${e.id}, `;
            });
            tabs = tabs.slice(0, -2);
            let self = this;
            uw.$(tabs).click(function () {
                self.renderTab(this.id);
            });
            /* render default tab*/
            this.renderTab(this.tabs[this.start_tab].id);
        };

        this.closeWindow = function () {
            uw.Layout.wnd.getOpenFirst(uw.GPWindowMgr[`TYPE_${this.id}`]).close();
        };

        /* Handle active tab */
        this.renderTab = function (id) {
            let tab = getTabById(id);
            uw.$(`#${this.id}_content`).html(getTabById(id).render());
            uw.$(`#${this.id} .active`).removeClass('active');
            uw.$(`#${id}`).addClass('active');
            getTabById(id).afterRender ? getTabById(id).afterRender() : '';
        };
    }
}


// Module: antiRage.js
class AntiRage extends ModernUtils {
    constructor() { super(); }
    render() { return this.getTitleElement('Anti Rage').$container; }
}


// Module: autoBootcamp.js
class AutoBootcamp extends ModernUtils {
    constructor() { super(); }
    render() { return this.getTitleElement('Auto Bootcamp').$container; }
    async execute() { return false; }
}


// Module: autoFarm.js
class AutoFarm extends ModernUtils {
    constructor() {
        super();

        this.active = this.loadSettings('farm_active', false);
        this.duration = this.loadSettings('farm_duration', 5);
    }

    render() {
        const { $container, $title } = this.getTitleElement('Auto Farm');
        this.$container = $container;
        this.$title = $title;

        this.$title.click(() => this.toggle());
        if (this.active) this.$title.addClass('active');

        this.$buttonBox = $('<div>').css({ "padding": "5px" })
        this.$container.append(this.$buttonBox);

        this.$button1 = this.getButtonElement("5 / 10 min")
        this.$button1.click(() => this.setDuration(1));
        this.$button2 = this.getButtonElement("20 / 40 min")
        this.$button2.click(() => this.setDuration(2));

        this.setDuration(this.duration);
        this.$buttonBox.append(this.$button1, this.$button2)

        return this.$container;
    }

    toggle() {
        this.active = !this.active;
        this.saveSettings('farm_active', this.active);
        this.$title.toggleClass('active');
    }

    setDuration(duration) {
        this.duration = duration;
        this.saveSettings('farm_duration', duration);

        this.$button1.removeClass('disabled');
        this.$button2.removeClass('disabled');

        if (duration === 1) this.$button1.addClass('disabled');
        if (duration === 2) this.$button2.addClass('disabled');
    }

    async execute() {
        if (!this.active) return false;

        const next_collection = this.getNextCollection();
        console.log('Next collection in', next_collection);
        if (next_collection > 0) return false;

        this.polis_list = this.generateList();
        await this.claim();

        return true;
    }

    // TODO: Ensure that this list has the right sorting
    generateList = () => {
        const islands_list = new Set();
        const polis_list = [];
        let minResource = 0;
        let min_percent = 0;

        const { models: towns } = uw.MM.getOnlyCollectionByName('Town');

        for (const town of towns) {
            const { on_small_island, island_id, id } = town.attributes;
            if (on_small_island || islands_list.has(island_id)) continue;

            // Check the min percent for each town
            const { wood, stone, iron, storage } = uw.ITowns.getTown(id).resources();
            minResource = Math.min(wood, stone, iron);
            min_percent = minResource / storage;

            islands_list.add(island_id);
            polis_list.push(town.id);
        }

        return polis_list;
    };


    getNextCollection = () => {
        const { models } = uw.MM.getCollections().FarmTownPlayerRelation[0];

        const lootCounts = {};
        for (const model of models) {
            const { lootable_at } = model.attributes;
            if (!lootable_at) continue;
            lootCounts[lootable_at] = (lootCounts[lootable_at] || 0) + 1;
        }

        let maxLootableTime = 0;
        let maxValue = 0;
        for (const lootableTime in lootCounts) {
            const value = lootCounts[lootableTime];
            if (value < maxValue) continue;
            maxLootableTime = lootableTime;
            maxValue = value;
        }

        const seconds = maxLootableTime - Math.floor(Date.now() / 1000);
        return seconds > 0 ? seconds * 1000 : 0;
    };


    async claim() {
        const isCaptainActive = uw.GameDataPremium.isAdvisorActivated('captain');

        // If the captain is active, claim all the resources at once and fake the opening
        if (isCaptainActive) {
            console.log('Claiming resources all at once');

            await this.fakeOpening();
            await this.sleep(Math.random() * 2000 + 1000);
            await this.fakeSelectAll();
            await this.sleep(Math.random() * 2000 + 1000);

            if (this.duration == 1) await this.claimMultiple(300, 600);
            if (this.duration == 2) await this.claimMultiple(1200, 2400);
            await this.fakeUpdate();

            setTimeout(() => uw.WMap.removeFarmTownLootCooldownIconAndRefreshLootTimers(), 2000);
            return;
        }

        console.log('Claiming resources one by one');

        // If the captain is not active, claim the resources one by one, but limit the number of claims
        // let max = 60;
        // const { models: player_relation_models } = uw.MM.getOnlyCollectionByName('FarmTownPlayerRelation');
        // const { models: farm_town_models } = uw.MM.getOnlyCollectionByName('FarmTown');
        // const now = Math.floor(Date.now() / 1000);
        // for (let town_id of polis_list) {
        //     let town = uw.ITowns.towns[town_id];
        //     let x = town.getIslandCoordinateX();
        //     let y = town.getIslandCoordinateY();
        //     for (let farm_town of farm_town_models) {
        //         if (farm_town.attributes.island_x != x) continue;
        //         if (farm_town.attributes.island_y != y) continue;
        //         for (let relation of player_relation_models) {
        //             if (farm_town.attributes.id != relation.attributes.farm_town_id) continue;
        //             if (relation.attributes.relation_status !== 1) continue;
        //             if (relation.attributes.lootable_at !== null && now < relation.attributes.lootable_at) continue;
        //             this.claimSingle(town_id, relation.attributes.farm_town_id, relation.id, Math.ceil(this.timing / 600_000));
        //             await this.sleep(500);
        //             if (!max) return;
        //             else max -= 1;
        //         }
        //     }
        // }

    }

    /* Claim resources from a single polis */
    claimSingle = (town_id, farm_town_id, relation_id, option = 1) => {
        const data = {
            model_url: `FarmTownPlayerRelation/${relation_id}`,
            action_name: 'claim',
            arguments: {
                farm_town_id: farm_town_id,
                type: 'resources',
                option: option,
            },
            town_id: town_id,
        };
        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', data);
    };

    /* Claim resources from multiple polis */
    claimMultiple = (base = 300, boost = 600) =>
        new Promise((myResolve, myReject) => {
            const polis_list = this.generateList();
            let data = {
                towns: polis_list,
                time_option_base: base,
                time_option_booty: boost,
                claim_factor: 'normal',
            };
            uw.gpAjax.ajaxPost('farm_town_overviews', 'claim_loads_multiple', data, false, () => myResolve());
        });

    /* Pretend that the window it's opening */
    fakeOpening = () =>
        new Promise((myResolve, myReject) => {
            uw.gpAjax.ajaxGet('farm_town_overviews', 'index', {}, false, async () => {
                await this.sleep(10);
                await this.fakeUpdate();
                myResolve();
            });
        });

    /* Fake the user selecting the list */
    fakeSelectAll = () =>
        new Promise((myResolve, myReject) => {
            const data = {
                town_ids: this.polislist,
            };
            uw.gpAjax.ajaxGet('farm_town_overviews', 'get_farm_towns_from_multiple_towns', data, false, () => myResolve());
        });

    /* Fake the window update*/
    fakeUpdate = () =>
        new Promise((myResolve, myReject) => {
            const town = uw.ITowns.getCurrentTown();
            const { attributes: booty } = town.getResearches();
            const { attributes: trade_office } = town.getBuildings();
            const data = {
                island_x: town.getIslandCoordinateX(),
                island_y: town.getIslandCoordinateY(),
                current_town_id: town.id,
                booty_researched: booty ? 1 : 0,
                diplomacy_researched: '',
                trade_office: trade_office ? 1 : 0,
            };
            uw.gpAjax.ajaxGet('farm_town_overviews', 'get_farm_towns_for_town', data, false, () => myResolve());
        });

}   

// Module: autoGratis.js
class AutoGratis extends ModernUtils {
    constructor() {
        super();
        this.enabled = this.loadSettings('autogratis_enabled', false);
        this.onlyActiveTown = this.loadSettings('autogratis_only_active_town', false);
        this.$container = null;
        this.$title = null;
    }

    render() {
        if (!this.$container) {
            const title = this.getTitleElement('Auto Gratis');
            this.$container = title.$container;
            this.$title = title.$title;
            this.$title.click(() => this.toggle());
        }
        this.$title.css('filter', this.enabled ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '');

        const $body = $('<div>').css({ padding: '5px', fontWeight: 600 });

        const $dummy = $('<div>').addClass('btn_time_reduction button_new').css({ display: 'inline-block', marginBottom: '8px' });
        $dummy.append($('<div>').addClass('left'));
        $dummy.append($('<div>').addClass('right'));
        $dummy.append($('<div>').addClass('caption js-caption').html('Gratis <div class="effect js-effect"></div>'));
        $body.append($dummy);

        $body.append($('<div>').css({ fontSize: '11px', fontWeight: 500 }).append(
            $('<label>').css({ cursor: 'pointer' }).append(
                $('<input>', { type: 'checkbox', checked: this.onlyActiveTown }).on('change', (e) => {
                    this.onlyActiveTown = e.target.checked;
                    this.saveSettings('autogratis_only_active_town', this.onlyActiveTown);
                })
            ).append(' Only fire on the actively-viewed town')
        ));

        this.$container.find('.game_border').nextAll().remove();
        this.$container.append($body);
        return this.$container;
    }

    toggle() {
        this.enabled = !this.enabled;
        this.saveSettings('autogratis_enabled', this.enabled);
        if (this.$title) {
            this.$title.css('filter', this.enabled ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '');
        }
    }

    async execute() {
        if (!this.enabled) return false;
        if (GameApi.isCaptchaActive()) return false;

        const now = Math.floor(Date.now() / 1000);

        if (this.onlyActiveTown) {
            const town = GameApi.getCurrentTown();
            return this.tryTown(town, now);
        }

        const towns = Object.entries(uw.ITowns.towns || {});
        for (const [, town] of towns) {
            if (this.tryTown(town, now)) return true;
        }
        return false;
    }

    tryTown(town, now) {
        if (!town || typeof town.buildingOrders !== 'function') return false;
        const orders = town.buildingOrders();
        if (!orders?.models?.length) return false;
        const order = orders.models[0];
        const completedAt = order.attributes?.to_be_completed_at;
        if (!completedAt) return false;
        const remaining = completedAt - now;
        if (remaining > 0 && remaining < 300) {
            this.callGratis(town.id, order.id);
            return true;
        }
        return false;
    }

    callGratis(townId, orderId) {
        GameApi.ajaxPost('frontend_bridge', 'execute', {
            model_url: `BuildingOrder/${orderId}`,
            action_name: 'buyInstant',
            arguments: { order_id: orderId },
            town_id: townId
        }, () => {});
        console.log(`[ModernBot] gratis: ${uw.ITowns.towns[townId]?.getName() || townId} order ${orderId}`);
    }
}


// Module: autoHide.js
class AutoHide extends ModernUtils {
    constructor() {
        super();
        this.activeTown = this.loadSettings('autohide_active', 0);
        this.interval = null;

        const addButton = () => {
            const box = $('.order_count');
            if (box.length) {
                const btn = $('<div/>', {
                    class: 'button_new',
                    id: 'autoCaveButton',
                    style: 'float: right; margin: 0px; left: 169px; position: absolute; top: 56px; width: 66px',
                });
                btn.append($('<div>').click(() => this.toggle()));
                btn.append($('<div>').addClass('left'));
                btn.append($('<div>').addClass('right'));
                btn.append($('<div>').addClass('caption js-caption').html('Auto <div class="effect js-effect"></div>'));
                box.prepend(btn);
                this.updateStyle(GameApi.getCurrentTown()?.id);
            } else {
                setTimeout(addButton, 100);
            }
        };

        /* Wire to game internals — these can't go through GameApi */
        try {
            uw.$.Observer(uw.GameEvents.window.open).subscribe((e, i) => {
                if (i?.attributes?.window_type === 'hide') setTimeout(addButton, 100);
            });
            uw.$.Observer(uw.GameEvents.town.town_switch).subscribe(() => {
                const town = GameApi.getCurrentTown();
                if (town) this.updateStyle(town.id);
                setTimeout(addButton, 1);
            });
        } catch (e) { /* game observables may not be available */ }

        this.interval = setInterval(() => this.main(), 5000);
    }

    render() {
        const title = this.getTitleElement('Auto Hide');
        title.$title.css('filter', this.activeTown ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '');
        title.$title.click(() => this.toggle());
        const $body = $('<div>').css({ padding: '5px', fontWeight: 600 });
        $body.text('Check every 5 sec — if iron > 15k, store in hide (lvl 10 required)');
        title.$container.append($body);
        return title.$container;
    }

    toggle() {
        const town = GameApi.getCurrentTown();
        if (!town) return;
        const hide = town.buildings().attributes.hide;
        if (this.activeTown === town.id) {
            this.activeTown = 0;
        } else {
            if (hide === 10) this.activeTown = town.id;
            else GameApi.notifyError('Hide must be at level 10');
        }
        this.saveSettings('autohide_active', this.activeTown);
        this.updateStyle(town.id);
    }

    updateStyle(townId) {
        const active = townId === this.activeTown;
        const filter = active ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '';
        $('#auto_cave_title, #autoCaveButton').css('filter', filter);
    }

    main() {
        if (!this.activeTown) return;
        const res = GameApi.getResources(this.activeTown);
        if (!res) return;
        if ((res.iron || 0) > 15000) {
            GameApi.ajaxPost('frontend_bridge', 'execute', {
                model_url: 'BuildingHide',
                action_name: 'storeIron',
                arguments: { iron_to_store: res.iron },
                town_id: this.activeTown,
            }, () => {});
        }
    }
}


// Module: autoTrade.js
class AutoTrade extends ModernUtils {
    constructor() { super(); }
    render() { return this.getTitleElement('Auto Trade').$container; }
    async execute() { return false; }
}


// Module: autoUnitBuilder.js
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


// Module: modernConsole.js
class ModernConsole {
    constructor(maxLines = 200) {
        this.maxLines = maxLines;
        this.$el = null;
    }

    attach($container) {
        this.$el = $('<div>', { class: 'console_modernbot', id: 'modern_console' });
        $container.append(this.$el);
        return this.$el;
    }

    log(message) {
        const time = new Date().toLocaleTimeString();
        console.log(`[ModernBot ${time}] ${message}`);
        if (!this.$el) return;
        this.$el.prepend($('<p>').text(`[${time}] ${message}`));
        const $lines = this.$el.children('p');
        if ($lines.length > this.maxLines) $lines.slice(this.maxLines).remove();
    }
}


// File: menu.js
// Handle the creation of the menu

// Title + toggle
// Button plus text
// Image plus action

class ModernMenu {
    constructor(tabs) {
        this.settingsFactory = new createGrepoWindow({
            id: 'MODERN_BOT',
            title: 'ModernBot',
            size: [845, 300],
            tabs: tabs,
            start_tab: 0,
        });
        this.settingsFactory.activate();

        this.addIcon();
    }

    addIcon() {
        // this.settingsFactory.activate();
        const $gods_area_buttons = $('.gods_area_buttons')

        const $circle_button = $('<div class="circle_button modern_bot_settings"></div>');
        $circle_button.click(() => { this.settingsFactory.openWindow() });
        const $icon = $('<div style="width: 27px; height: 27px; background: url(https://raw.githubusercontent.com/Sau1707/ModernBot/main/img/gear.png) no-repeat 6px 5px" class="icon js-caption"></div>');
        $icon.attr("id", "modern_settings");

        $circle_button.append($icon);
        $gods_area_buttons.append($circle_button);
    }
}

// File: index.js
/*



*/


class ModernBot {
    STOP_TIME = 1000 * 5;
    ACTION_DELAY = 1000 * 0;

    constructor() {
        this.lastInteraction = Date.now();
        this.lastAction = Date.now();
        this.loopActive = false;
        this.utils = new ModernUtils();
        this.currentDelay = this.utils.jitter(1000 * 8);

        this.autoFarm = new AutoFarm();
        this.autoUnitBuilder = new AutoUnitBuilder();
        this.autoGratis = new AutoGratis();

        new ModernMenu([
            {
                title: 'Farm',
                id: 'farm',
                render: () => this.autoFarm.render(),
            },
            {
                title: 'Units',
                id: 'unit_builder',
                render: () => this.autoUnitBuilder.render(),
            },
            {
                title: 'Gratis',
                id: 'gratis',
                render: () => this.autoGratis.render(),
            },
        ]);


    }

    enableListeners() {
        $(document).on('mousemove', () => {
            this.lastInteraction = Date.now();
            $("#modern_settings").removeClass("rotate-forever")
        });

        $(document).on('keydown', (e) => {
            this.lastInteraction = Date.now();
            $("#modern_settings").removeClass("rotate-forever")
        });
    }

    async loop() {
        if (Date.now() - this.lastInteraction < this.STOP_TIME) return;
        if (GameApi.isCaptchaActive()) return;
        if (Date.now() - this.lastAction < this.currentDelay) return;
        if (this.loopActive) return;
        if (this.utils.shouldSkip()) {
            this.lastAction = Date.now();
            this.currentDelay = this.utils.jitter(1000 * 8);
            return;
        }
        this.loopActive = true;

        $("#modern_settings").addClass("rotate-forever")

        const hasFarm = await this.autoFarm.execute();
        if (hasFarm) {
            console.log("Farm was executed");
            this.lastAction = Date.now();
            this.currentDelay = this.utils.jitter(1000 * 8);
            this.loopActive = false;
            return;
        };

        const hasUnitBuild = await this.autoUnitBuilder.execute();
        if (hasUnitBuild) {
            this.lastAction = Date.now();
            this.currentDelay = this.utils.jitter(1000 * 8);
            this.loopActive = false;
            return;
        }

        const hasGratis = await this.autoGratis.execute();
        if (hasGratis) {
            this.lastAction = Date.now();
            this.currentDelay = this.utils.jitter(1000 * 8);
            this.loopActive = false;
            return;
        }

        this.loopActive = false;
    }


}


const loader = setInterval(() => {
    if ($("#loader").length > 0) return;
    clearInterval(loader);

    const modernBot = new ModernBot();
    modernBot.enableListeners();

    setInterval(() => {
        modernBot.loop();
    }, 250);

}, 100);

})();