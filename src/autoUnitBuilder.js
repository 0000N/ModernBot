class AutoUnitBuilder extends ModernUtil {
    NAVAL_ORDER = ['small_transporter', 'bireme', 'trireme', 'attack_ship', 'big_transporter', 'demolition_ship', 'colonize_ship'];
    MAX_ORDERS = 6;
    MAX_BATCH = 50;

    TEMPLATES = {
        bireme_city: { label: 'Bireme City', units: { bireme: 250 }, academy: ['bireme'], buildings: { docks: 1 } },
        fire_ship_city: { label: 'Fire Ship City', units: { demolition_ship: 200 }, academy: ['demolition_ship'], buildings: { docks: 1 } },
        slinger_city: { label: 'Slinger City', units: { slinger: 3000, small_transporter: 32 }, academy: ['slinger'], buildings: { barracks: 1, docks: 1 } },
        light_ship_city: { label: 'Light Ship City', units: { attack_ship: 250 }, academy: ['attack_ship'], buildings: { docks: 1 } },
        defense_city: { label: 'Defense City', units: { sword: 600, archer: 600, hoplite: 600, bireme: 100 }, academy: ['archer', 'bireme'], buildings: { barracks: 1, docks: 1 } },
        conquest_support: { label: 'Conquest / Support', units: { colonize_ship: 1, big_transporter: 20, bireme: 100 }, academy: ['colonize_ship', 'big_transporter', 'bireme'], buildings: { docks: 10, barracks: 1 } },
        farming_city: { label: 'Farming / Resource City', units: { sword: 250, archer: 250 }, academy: ['archer'], buildings: { barracks: 1 } },
    };

    constructor(c, s) {
        super(c, s);
        this.townTemplates = this.storage.load('ub_templates', {});
        this.active = this.storage.load('ub_active', false);
        this.captchaActive = false;

        if (this.active) this.interval = setInterval(this.main.bind(this), 5000);

        setInterval(() => {
            if ($('.botcheck').length || $('#recaptcha_window').length) {
                if (!this.captchaActive) {
                    this.console.log('Captcha active, unit builder paused');
                    clearInterval(this.interval);
                    this.interval = null;
                    this.captchaActive = true;
                }
            } else {
                if (this.captchaActive) {
                    this.console.log('Captcha resolved, unit builder resumed');
                    this.captchaActive = false;
                    if (this.active && !this.interval) {
                        this.interval = setInterval(this.main.bind(this), 5000);
                    }
                }
            }
        }, 500);
    }

    settings = () => {
        const town = uw.ITowns.getCurrentTown();
        const townId = town.id;
        const currentTemplateId = this.townTemplates[townId] || '';
        const currentTemplate = this.TEMPLATES[currentTemplateId];

        return `
        <div class="game_border" style="margin-bottom: 20px">
            <div class="game_border_top"></div>
            <div class="game_border_bottom"></div>
            <div class="game_border_left"></div>
            <div class="game_border_right"></div>
            <div class="game_border_corner corner1"></div>
            <div class="game_border_corner corner2"></div>
            <div class="game_border_corner corner3"></div>
            <div class="game_border_corner corner4"></div>
            <div style="cursor: pointer; filter: ${this.active ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : ''}"
                 class="game_header bold" onclick="window.modernBot.autoUnitBuilder.toggle()">
                 Unit Builder <span class="command_count"></span>
                 <div style="position: absolute; right: 10px; top: 4px; font-size: 10px;"> (click to toggle) </div>
            </div>
            <div id="unit_builder_buttons" style="padding: 5px;">
                <p style="font-weight: bold; margin: 0 0 5px 0;">
                    ${town.getName()} [${town.getPoints()} pts]
                    ${currentTemplate ? '→ ' + currentTemplate.label : '→ no template'}
                </p>
                ${this.renderTemplateButtons(townId, currentTemplateId)}
                ${this.renderTemplatePreview(town, currentTemplate, townId)}
            </div>
        </div>`;
    };

    renderTemplateButtons = (townId, currentTemplateId) => {
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">';
        Object.entries(this.TEMPLATES).forEach(([id, tpl]) => {
            const disabled = id === currentTemplateId ? ' disabled' : '';
            html += `<div style="cursor: pointer" class="button_new${disabled}" onclick="event.stopPropagation();window.modernBot.autoUnitBuilder.selectTemplate(${townId}, '${id}')">
                <div class="left"></div>
                <div class="right"></div>
                <div class="caption js-caption"> ${tpl.label} <div class="effect js-effect"></div></div>
            </div>`;
        });
        html += `<div style="cursor: pointer" class="button_new" onclick="event.stopPropagation();window.modernBot.autoUnitBuilder.clearTemplate(${townId})">
            <div class="left"></div>
            <div class="right"></div>
            <div class="caption js-caption"> Clear <div class="effect js-effect"></div></div>
        </div>`;
        html += '</div>';
        return html;
    };

    renderTemplatePreview = (town, currentTemplate, townId) => {
        if (!currentTemplate) return '';
        const buildings = town.getBuildings?.().attributes || {};
        const researches = town.getResearches?.().attributes || {};
        let html = '<div style="margin-top: 8px; font-size: 11px;">';

        Object.entries(currentTemplate.units).forEach(([unit, target]) => {
            const owned = this.getOwnedCount(town, unit);
            const remaining = Math.max(0, target - owned);
            html += `<div>${unit}: ${owned}/${target} (${remaining} restant)</div>`;
        });

        if (currentTemplate.buildings) {
            html += '<div style="margin-top: 4px; font-weight: bold;">Bâtiments requis :</div>';
            Object.entries(currentTemplate.buildings).forEach(([bld, lvl]) => {
                const current = buildings[bld] || 0;
                const ok = current >= lvl;
                html += `<div style="color: ${ok ? '#8f8' : '#f88'}">${bld}: ${current}/${lvl} ${ok ? '✅' : '⛏️'}</div>`;
            });
        }

        if (currentTemplate.academy) {
            html += '<div style="margin-top: 4px; font-weight: bold;">Recherches :</div>';
            currentTemplate.academy.forEach(tech => {
                const ok = researches[tech];
                html += `<div style="color: ${ok ? '#8f8' : '#f88'}">${tech} ${ok ? '✅' : '⏳'}</div>`;
            });
        }

        html += '</div>';
        return html;
    };

    toggle = () => {
        this.active = !this.active;
        this.storage.save('ub_active', this.active);

        if (this.active && uw.modernBot?.autoTrain) {
            uw.modernBot.autoTrain.city_troops = {};
            uw.modernBot.autoTrain.storage.save('troops', {});
            clearInterval(uw.modernBot.autoTrain.interval);
            uw.modernBot.autoTrain.interval = null;
            this.console.log('Unit Builder activé → AutoTrain désactivé');
        }

        if (this.active && !this.interval) {
            this.interval = setInterval(this.main.bind(this), 5000);
        } else if (!this.active && this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    };

    selectTemplate = (townId, templateId) => {
        this.townTemplates[townId] = templateId;
        this.storage.save('ub_templates', this.townTemplates);
        this.console.log(`Unit Builder: ${this.TEMPLATES[templateId].label} set for town ${townId}`);
    };

    clearTemplate = townId => {
        delete this.townTemplates[townId];
        this.storage.save('ub_templates', this.townTemplates);
        this.console.log(`Unit Builder: template cleared for town ${townId}`);
    };

    main = async () => {
        if (!this.active || this.captchaActive) return;

        for (const [townId, templateId] of Object.entries(this.townTemplates)) {
            const town = uw.ITowns.towns[townId];
            if (!town) {
                delete this.townTemplates[townId];
                this.storage.save('ub_templates', this.townTemplates);
                continue;
            }

            const template = this.TEMPLATES[templateId];
            if (!template) continue;

            // 1. Check and upgrade buildings
            if (template.buildings) {
                const buildings = town.getBuildings?.().attributes || {};
                const queueCount = town.buildingOrders?.()?.length || 0;
                const maxQueue = uw.GameDataPremium?.isAdvisorActivated('curator') ? 7 : 2;
                if (queueCount < maxQueue) {
                    for (const [bld, minLvl] of Object.entries(template.buildings)) {
                        const current = buildings[bld] || 0;
                        if (current >= minLvl) continue;

                        const resources = town.resources();
                        const buildData = uw.MM?.getModels?.()?.BuildingBuildData?.[townId];
                        const cost = buildData?.attributes?.building_data?.[bld]?.resources_for;
                        if (cost) {
                            const m = 20;
                            if (resources.wood < cost.wood + m || resources.stone < cost.stone + m || resources.iron < cost.iron + m) {
                                this.console.log(`${town.getName()}: pas assez de ressources pour ${bld} ${current} → ${minLvl}`);
                                continue;
                            }
                        }

                        const data = {
                            model_url: 'BuildingOrder',
                            action_name: 'buildUp',
                            arguments: { building_id: bld },
                            town_id: townId,
                        };
                        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', data);
                        this.console.log(`${town.getName()}: upgrade ${bld} ${current} → ${minLvl}`);
                        await this.sleep(1500);
                        return;
                    }
                }
            }

            // 2. Research required academy technologies
            if (template.academy) {
                const researches = town.getResearches?.().attributes || {};
                for (const tech of template.academy) {
                    if (researches[tech]) continue;
                    this.console.log(`${town.getName()}: researching ${tech}`);
                    const researchData = {
                        model_url: 'BuildingAcademy',
                        action_name: 'research',
                        arguments: { research_id: tech },
                        town_id: townId,
                    };
                    uw.gpAjax.ajaxPost('frontend_bridge', 'execute', researchData);
                    await this.sleep(1000);
                    return;
                }
            }

            // 3. Build units
            for (const [rawUnit, target] of Object.entries(template.units)) {
                const unitData = uw.GameData?.units?.[rawUnit];
                if (!unitData) continue;

                const kind = this.NAVAL_ORDER.includes(rawUnit) ? 'naval' : 'ground';
                const orderCount = town.getUnitOrdersCollection?.()?.where?.({ kind })?.length || 0;
                if (orderCount >= this.MAX_ORDERS) continue;

                const owned = this.getOwnedCount(town, rawUnit);
                const remaining = Math.max(0, target - owned);
                if (remaining <= 0) continue;

                const resources = town.resources();
                const discount = uw.GeneralModifications?.getUnitBuildResourcesModification?.(townId, unitData) || 1;
                const cost = unitData.resources || {};

                const byWood = Math.floor((resources.wood || 0) / Math.max(1, Math.round((cost.wood || 0) * discount)));
                const byStone = Math.floor((resources.stone || 0) / Math.max(1, Math.round((cost.stone || 0) * discount)));
                const byIron = Math.floor((resources.iron || 0) / Math.max(1, Math.round((cost.iron || 0) * discount)));
                const byPop = Math.floor((resources.population || 0) / unitData.population);
                const affordable = Math.max(0, Math.min(byWood, byStone, byIron, byPop));
                const amount = Math.min(remaining, affordable, this.MAX_BATCH);

                if (amount <= 0) continue;

                const data = { unit_id: rawUnit, amount, town_id: townId };
                uw.gpAjax.ajaxPost('building_barracks', 'build', data);
                this.console.log(`${town.getName()}: training ${amount} ${rawUnit}`);
                await this.sleep(500);
                return;
            }
        }
    };

    getOwnedCount(town, unit) {
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
}
