class AutoUnitBuilder extends ModernUtil {
    NAVAL_ORDER = ['small_transporter', 'bireme', 'trireme', 'attack_ship', 'big_transporter', 'demolition_ship', 'colonize_ship'];
    MAX_ORDERS = 6;
    MAX_BATCH = 50;

    TEMPLATES = {
        bireme_city:      { label: 'Bireme City',      icon: '⚓', units: { bireme: 250 }, academy: ['bireme'], buildings: { docks: 1 } },
        fire_ship_city:   { label: 'Fire Ship City',   icon: '🔥', units: { demolition_ship: 200 }, academy: ['demolition_ship'], buildings: { docks: 1 } },
        slinger_city:     { label: 'Slinger City',     icon: '🎯', units: { slinger: 3000, small_transporter: 32 }, academy: ['slinger'], buildings: { barracks: 1, docks: 1 } },
        light_ship_city:  { label: 'Light Ship City',  icon: '🚀', units: { attack_ship: 250 }, academy: ['attack_ship'], buildings: { docks: 1 } },
        defense_city:     { label: 'Defense City',     icon: '🛡️', units: { sword: 600, archer: 600, hoplite: 600, bireme: 100 }, academy: ['archer', 'bireme'], buildings: { barracks: 1, docks: 1 } },
        conquest_support: { label: 'Conquest / Support', icon: '⚔️', units: { colonize_ship: 1, big_transporter: 20, bireme: 100 }, academy: ['colonize_ship', 'big_transporter', 'bireme'], buildings: { docks: 10, barracks: 1 } },
        farming_city:     { label: 'Farming / Resource', icon: '🌾', units: { sword: 250, archer: 250 }, academy: ['archer'], buildings: { barracks: 1 } },
    };

    constructor(c, s) {
        super(c, s);
        this.townTemplates = this.storage.load('ub_templates', {});
        this.active = this.storage.load('ub_active', false);
        this.captchaActive = false;
        this.currentAction = '';
        if (this.active) this.interval = setInterval(this.main.bind(this), 5000);

        setInterval(() => {
            if ($('.botcheck').length || $('#recaptcha_window').length) {
                if (!this.captchaActive) { clearInterval(this.interval); this.interval = null; this.captchaActive = true; this.currentAction = '⚠️ CAPTCHA - PAUSED'; }
            } else {
                if (this.captchaActive) { this.captchaActive = false; this.currentAction = ''; if (this.active && !this.interval) this.interval = setInterval(this.main.bind(this), 5000); }
            }
        }, 500);
    }

    settings = () => {
        const town = uw.ITowns.getCurrentTown();
        const townId = town.id;
        const templateId = this.townTemplates[townId] || '';
        const tpl = this.TEMPLATES[templateId];
        const buildings = town.getBuildings?.().attributes || {};
        const researches = town.getResearches?.().attributes || {};

        const ac = this.active ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '';
        const statusLabel = this.currentAction || (this.active ? '🔄 ACTIVE' : '⏸️ STOPPED');
        const statusColor = this.active ? '#1aff1a' : '#aaa';

        return `
<div class="game_border" style="margin-bottom:20px">
    <div class="game_border_top"></div><div class="game_border_bottom"></div>
    <div class="game_border_left"></div><div class="game_border_right"></div>
    <div class="game_border_corner corner1"></div><div class="game_border_corner corner2"></div>
    <div class="game_border_corner corner3"></div><div class="game_border_corner corner4"></div>

    <div style="cursor:pointer; filter:${ac}" class="game_header bold" onclick="window.modernBot.autoUnitBuilder.toggle()">
        Templates & Units <span class="command_count"></span>
        <span style="float:right;margin-right:8px;font-size:11px;color:${statusColor}">${statusLabel}</span>
    </div>

    <div style="padding:8px">
        <div style="background:#1a1a2e; padding:8px; border-radius:4px; margin-bottom:8px; border:1px solid #333;">
            <span style="color:#e0e0e0;font-weight:bold;">🏙️ ${town.getName()}</span>
            <span style="color:#888;margin-left:8px;">${town.getPoints()} pts</span>
            ${tpl ? `<span style="float:right;color:#4fc3f7;font-weight:bold;">${tpl.icon} ${tpl.label}</span>` : `<span style="float:right;color:#666;">no template</span>`}
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">
            ${this.renderButtons(townId, templateId)}
        </div>

        ${tpl ? this.renderProgress(town, tpl, townId, buildings, researches) : '<div style="text-align:center;color:#666;padding:20px">Select a template above</div>'}
    </div>
</div>`;
    };

    renderButtons = (townId, current) => {
        let h = '';
        Object.entries(this.TEMPLATES).forEach(([id, tpl]) => {
            const sel = id === current ? 'background:#4fc3f7;color:#000;font-weight:bold;' : 'background:#2a2a4a;color:#ccc;';
            h += `<div style="cursor:pointer;padding:4px 8px;border-radius:3px;font-size:11px;${sel}" onclick="event.stopPropagation();window.modernBot.autoUnitBuilder.selectTemplate(${townId},'${id}')">${tpl.icon} ${tpl.label}</div>`;
        });
        h += `<div style="cursor:pointer;padding:4px 8px;border-radius:3px;font-size:11px;background:#3a1111;color:#e88;" onclick="event.stopPropagation();window.modernBot.autoUnitBuilder.clearTemplate(${townId})">✕ Clear</div>`;
        return h;
    };

    renderProgress = (town, tpl, townId, bld, res) => {
        let h = '<div style="margin-top:4px">';

        if (tpl.buildings) {
            h += '<div style="font-weight:bold;color:#bbb;margin-bottom:4px;font-size:11px;">🏗️ Bâtiments</div>';
            Object.entries(tpl.buildings).forEach(([b, lvl]) => {
                const cur = bld[b] || 0;
                const pct = Math.min(100, Math.round(cur / lvl * 100));
                const color = cur >= lvl ? '#4caf50' : '#ff9800';
                h += `<div style="margin-bottom:3px"><span style="font-size:10px;color:#aaa">${b}</span>
                    <div style="display:inline-block;width:120px;height:8px;background:#222;border-radius:4px;margin-left:4px;vertical-align:middle">
                        <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;"></div>
                    </div>
                    <span style="font-size:10px;color:${color};margin-left:4px">${cur}/${lvl}</span></div>`;
            });
        }

        if (tpl.academy) {
            h += '<div style="font-weight:bold;color:#bbb;margin:8px 0 4px;font-size:11px;">📚 Académie</div>';
            tpl.academy.forEach(tech => {
                const ok = res[tech];
                const color = ok ? '#4caf50' : '#ff9800';
                h += `<div style="margin-bottom:2px"><span style="font-size:10px;color:${color}">${ok ? '✅' : '⏳'} ${tech}</span></div>`;
            });
        }

        h += '<div style="font-weight:bold;color:#bbb;margin:8px 0 4px;font-size:11px;">⚔️ Unités</div>';
        Object.entries(tpl.units).forEach(([unit, target]) => {
            const owned = this.getOwnedCount(town, unit);
            const pct = Math.min(100, Math.round(owned / target * 100));
            const color = owned >= target ? '#4caf50' : '#4fc3f7';
            h += `<div style="margin-bottom:3px"><span style="font-size:10px;color:#ccc;display:inline-block;width:100px">${unit}</span>
                <div style="display:inline-block;width:120px;height:10px;background:#222;border-radius:5px;vertical-align:middle">
                    <div style="width:${pct}%;height:100%;background:${color};border-radius:5px;transition:width 0.3s"></div>
                </div>
                <span style="font-size:10px;color:${color};margin-left:4px">${owned}/${target}</span></div>`;
        });

        h += '</div>';
        return h;
    };

    toggle = () => {
        this.active = !this.active;
        this.storage.save('ub_active', this.active);
        if (this.active && uw.modernBot?.autoTrain) {
            uw.modernBot.autoTrain.city_troops = {};
            uw.modernBot.autoTrain.storage.save('troops', {});
            clearInterval(uw.modernBot.autoTrain.interval);
            uw.modernBot.autoTrain.interval = null;
            this.currentAction = 'AutoTrain DÉSACTIVÉ';
        }
        if (this.active && !this.interval) { this.interval = setInterval(this.main.bind(this), 5000); this.currentAction = '🔄 STARTED'; }
        else if (!this.active) { clearInterval(this.interval); this.interval = null; this.currentAction = ''; }
    };

    selectTemplate = (townId, templateId) => {
        this.townTemplates[townId] = templateId;
        this.storage.save('ub_templates', this.townTemplates);
        this.currentAction = `Template: ${this.TEMPLATES[templateId].label}`;
    };

    clearTemplate = townId => {
        delete this.townTemplates[townId];
        this.storage.save('ub_templates', this.townTemplates);
        this.currentAction = '';
    };

    main = async () => {
        if (!this.active || this.captchaActive) return;
        for (const [townId, tplId] of Object.entries(this.townTemplates)) {
            const t = uw.ITowns.towns[townId]; if (!t) { delete this.townTemplates[townId]; this.storage.save('ub_templates', this.townTemplates); continue; }
            const tpl = this.TEMPLATES[tplId]; if (!tpl) continue;
            const bld = t.getBuildings?.().attributes || {};
            const res = t.getResearches?.().attributes || {};
            const q = t.buildingOrders?.()?.length || 0;
            const mq = uw.GameDataPremium?.isAdvisorActivated('curator') ? 7 : 2;

            // Bâtiments
            if (tpl.buildings && q < mq) {
                for (const [b, lv] of Object.entries(tpl.buildings)) {
                    if ((bld[b] || 0) >= lv) continue;
                    const r = t.resources();
                    const bd = uw.MM?.getModels?.()?.BuildingBuildData?.[townId]?.attributes?.building_data?.[b]?.resources_for;
                    if (bd && (r.wood < bd.wood + 20 || r.stone < bd.stone + 20 || r.iron < bd.iron + 20)) continue;
                    uw.gpAjax.ajaxPost('frontend_bridge', 'execute', { model_url: 'BuildingOrder', action_name: 'buildUp', arguments: { building_id: b }, town_id: townId });
                    this.currentAction = `🏗️ Building: ${b}`;
                    await this.sleep(1500); return;
                }
            }

            // Recherches
            if (tpl.academy) {
                for (const tech of tpl.academy) {
                    if (res[tech]) continue;
                    uw.gpAjax.ajaxPost('frontend_bridge', 'execute', { model_url: 'BuildingAcademy', action_name: 'research', arguments: { research_id: tech }, town_id: townId });
                    this.currentAction = `📚 Research: ${tech}`;
                    await this.sleep(1000); return;
                }
            }

            // Unités
            for (const [unit, target] of Object.entries(tpl.units)) {
                const ud = uw.GameData?.units?.[unit]; if (!ud) continue;
                const kind = this.NAVAL_ORDER.includes(unit) ? 'naval' : 'ground';
                if ((t.getUnitOrdersCollection?.()?.where?.({ kind })?.length || 0) >= this.MAX_ORDERS) continue;
                const owned = this.getOwnedCount(t, unit);
                const rem = target - owned; if (rem <= 0) continue;
                const rs = t.resources();
                const d = uw.GeneralModifications?.getUnitBuildResourcesModification?.(townId, ud) || 1;
                const c = ud.resources || {};
                const byW = Math.floor((rs.wood || 0) / Math.max(1, Math.round((c.wood || 0) * d)));
                const byS = Math.floor((rs.stone || 0) / Math.max(1, Math.round((c.stone || 0) * d)));
                const byI = Math.floor((rs.iron || 0) / Math.max(1, Math.round((c.iron || 0) * d)));
                const byP = Math.floor((rs.population || 0) / ud.population);
                const amt = Math.min(rem, Math.max(0, Math.min(byW, byS, byI, byP)), this.MAX_BATCH);
                if (amt <= 0) continue;
                uw.gpAjax.ajaxPost('building_barracks', 'build', { unit_id: unit, amount: amt, town_id: townId });
                this.currentAction = `⚔️ Training: ${amt} ${unit}`;
                await this.sleep(500); return;
            }
        }
    };

    getOwnedCount(town, unit) {
        let c = 0;
        const u = town.units?.() || {}, o = town.unitsOuter?.() || {};
        c += u[unit] || 0; c += o[unit] || 0;
        const col = town.getUnitOrdersCollection?.();
        if (col?.models) for (const od of col.models) { if (od.attributes?.unit_type === unit) c += od.attributes.count || 0; }
        return c;
    }
}
