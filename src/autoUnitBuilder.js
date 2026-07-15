class AutoUnitBuilder extends ModernUtil {
    NAVAL_ORDER = ['small_transporter', 'bireme', 'trireme', 'attack_ship', 'big_transporter', 'demolition_ship', 'colonize_ship'];
    MAX_ORDERS = 6;
    MAX_BATCH = 50;

    TEMPLATES = {
        bireme_city: {
            label: 'Bireme City', icon: '⚓',
            buildings: { main:30, storage:30, farm:40, docks:30, wall:20 },
            academy: ['bireme'],
            units: { bireme: 250 },
        },
        fire_ship_city: {
            label: 'Fire Ship City', icon: '🔥',
            buildings: { main:30, storage:30, farm:40, docks:30, wall:20 },
            academy: ['demolition_ship'],
            units: { demolition_ship: 200 },
        },
        slinger_city: {
            label: 'Slinger City', icon: '🎯',
            buildings: { main:30, storage:30, farm:40, barracks:30, wall:20 },
            academy: ['slinger'],
            units: { slinger: 3000, small_transporter: 32 },
        },
        light_ship_city: {
            label: 'Light Ship City', icon: '🚀',
            buildings: { main:30, storage:30, farm:40, docks:30, wall:20 },
            academy: ['attack_ship'],
            units: { attack_ship: 250 },
        },
        defense_city: {
            label: 'Defense City', icon: '🛡️',
            buildings: { main:30, storage:30, farm:40, barracks:30, wall:25, docks:10 },
            academy: ['archer', 'bireme', 'hoplite'],
            units: { sword: 600, archer: 600, hoplite: 600, bireme: 100 },
        },
        conquest_support: {
            label: 'Conquest / Support', icon: '⚔️',
            buildings: { main:30, storage:30, farm:40, temple:20, docks:20, wall:25 },
            academy: ['colonize_ship', 'big_transporter', 'bireme', 'demolition_ship'],
            units: { colonize_ship: 1, big_transporter: 20, bireme: 100, demolition_ship: 50 },
        },
        farming_city: {
            label: 'Farming / Resource', icon: '🌾',
            buildings: { main:20, storage:20, farm:30, barracks:10 },
            academy: ['archer'],
            units: { sword: 250, archer: 250 },
        },
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
                if (!this.captchaActive) { clearInterval(this.interval); this.interval = null; this.captchaActive = true; this.currentAction = 'CAPTCHA - PAUSED'; this.refreshUI(); }
            } else {
                if (this.captchaActive) { this.captchaActive = false; this.currentAction = ''; this.refreshUI(); if (this.active && !this.interval) this.interval = setInterval(this.main.bind(this), 5000); }
            }
        }, 500);
    }

    settings = () => {
        const town = uw.ITowns.getCurrentTown();
        if (!town) return '<p>Loading...</p>';
        this.lastTownId = town.id;

        const townId = town.id;
        const tplId = this.townTemplates[townId] || '';
        const tpl = this.TEMPLATES[tplId];
        const bld = town.getBuildings?.().attributes || {};
        const res = town.getResearches?.().attributes || {};
        const statusColor = this.active ? '#1aff1a' : '#aaa';

        return `
        <div class="game_border" style="margin-bottom:20px">
            <div class="game_border_top"></div><div class="game_border_bottom"></div>
            <div class="game_border_left"></div><div class="game_border_right"></div>
            <div class="game_border_corner corner1"></div><div class="game_border_corner corner2"></div>
            <div class="game_border_corner corner3"></div><div class="game_border_corner corner4"></div>
            <div style="cursor:pointer; filter:${this.active ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : ''}"
                 class="game_header bold" onclick="window.modernBot.autoUnitBuilder.toggle()">
                City Builder <span class="command_count"></span>
                <span id="ub_status" style="float:right;margin-right:8px;font-size:11px;color:${statusColor}">${this.active ? 'ACTIVE' : 'STOPPED'}</span>
            </div>
            <div id="ub_content" style="padding:5px">
                <div id="ub_town_info" style="font-weight:bold;margin-bottom:5px">
                    ${town.getName()} [${town.getPoints()} pts]
                    ${tpl ? '<span style="margin-left:8px">' + tpl.icon + ' ' + tpl.label + '</span>' : '<span style="margin-left:8px;opacity:.5">no template</span>'}
                </div>
                <div id="ub_buttons" style="margin-bottom:5px">${this.renderButtons(townId, tplId)}</div>
                <div id="ub_progress">${tpl ? this.renderProgress(town, tpl, bld, res) : '<div style="text-align:center;opacity:.5;padding:10px">Select a template</div>'}</div>
            </div>
        </div>`;
    };

    refreshUI = () => {
        const town = uw.ITowns.getCurrentTown();
        const townId = (town && town.id) || this.lastTownId;
        if (!townId) return;
        const tplId = this.townTemplates[townId] || '';
        const tpl = this.TEMPLATES[tplId];
        if (!town) return;
        const bld = town.getBuildings?.().attributes || {};
        const res = town.getResearches?.().attributes || {};
        const statusColor = this.active ? '#1aff1a' : '#aaa';

        $('#ub_status').css('color', statusColor).text(this.currentAction || (this.active ? 'ACTIVE' : 'STOPPED'));
        if (tpl) {
            $('#ub_town_info').html(`${town.getName()} [${town.getPoints()} pts] <span style="margin-left:8px">${tpl.icon} ${tpl.label}</span>`);
        } else {
            $('#ub_town_info').html(`${town.getName()} [${town.getPoints()} pts] <span style="margin-left:8px;opacity:.5">no template</span>`);
        }
        $('#ub_buttons').html(this.renderButtons(townId, tplId));
        $('#ub_progress').html(tpl ? this.renderProgress(town, tpl, bld, res) : '<div style="text-align:center;opacity:.5;padding:10px">Select a template</div>');
    };

    renderButtons = (townId, current) => {
        let h = '';
        Object.entries(this.TEMPLATES).forEach(([id, tpl]) => {
            const sel = id === current;
            h += `<div style="cursor:pointer;display:inline-block;padding:3px 6px;border-radius:3px;font-size:11px;margin:2px;
                ${sel ? 'background:#ffbb33;color:#000;font-weight:bold;' : 'background:rgba(255,255,255,.1);color:#ccc;'}"
                onclick="event.stopPropagation();window.modernBot.autoUnitBuilder.selectTemplate(${townId},'${id}')">
                ${tpl.icon} ${tpl.label}</div>`;
        });
        h += `<div style="cursor:pointer;display:inline-block;padding:3px 8px;border-radius:3px;font-size:11px;margin:2px;background:rgba(220,80,80,.3);color:#e88;"
            onclick="event.stopPropagation();window.modernBot.autoUnitBuilder.clearTemplate(${townId})">✕ Clear</div>`;
        return h;
    };

    renderProgress = (town, tpl, bld, res) => {
        let h = '';
        if (tpl.buildings) {
            h += '<div style="font-weight:bold;margin:6px 0 3px;font-size:11px">Buildings</div>';
            Object.entries(tpl.buildings).forEach(([b, lvl]) => {
                const cur = bld[b] || 0;
                const pct = Math.min(100, Math.round(cur / lvl * 100));
                const done = cur >= lvl;
                const color = done ? '#4caf50' : '#ff9800';
                h += `<div style="margin-bottom:2px;font-size:10px"><span style="display:inline-block;width:70px;color:#bbb">${b}</span>
                    <span style="display:inline-block;width:100px;height:6px;background:#333;border-radius:3px;vertical-align:middle">
                        <span style="display:block;width:${pct}%;height:100%;background:${color};border-radius:3px"></span>
                    </span>
                    <span style="color:${color};margin-left:4px">${cur}/${lvl} ${done ? '✓' : ''}</span></div>`;
            });
        }
        if (tpl.academy) {
            h += '<div style="font-weight:bold;margin:6px 0 3px;font-size:11px">Academy</div>';
            tpl.academy.forEach(tech => {
                const done = res[tech];
                h += `<div style="font-size:10px;color:${done ? '#4caf50' : '#ff9800'};margin-bottom:1px">${done ? '✓' : '⏳'} ${tech}</div>`;
            });
        }
        h += '<div style="font-weight:bold;margin:6px 0 3px;font-size:11px">Units</div>';
        Object.entries(tpl.units).forEach(([unit, target]) => {
            const owned = this.getOwnedCount(town, unit);
            const pct = Math.min(100, Math.round(owned / target * 100));
            const done = owned >= target;
            const color = done ? '#4caf50' : '#4fc3f7';
            h += `<div style="margin-bottom:2px;font-size:10px"><span style="display:inline-block;width:100px;color:#bbb">${unit}</span>
                <span style="display:inline-block;width:100px;height:6px;background:#333;border-radius:3px;vertical-align:middle">
                    <span style="display:block;width:${pct}%;height:100%;background:${color};border-radius:3px"></span>
                </span>
                <span style="color:${color};margin-left:4px">${owned}/${target} ${done ? '✓' : ''}</span></div>`;
        });
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
        }
        if (this.active && !this.interval) { this.interval = setInterval(this.main.bind(this), 5000); this.currentAction = ''; }
        else if (!this.active) { clearInterval(this.interval); this.interval = null; this.currentAction = ''; }
        this.refreshUI();
    };

    selectTemplate = (townId, templateId) => {
        this.townTemplates[townId] = templateId;
        this.storage.save('ub_templates', this.townTemplates);
        this.refreshUI();
    };

    clearTemplate = townId => {
        delete this.townTemplates[townId];
        this.storage.save('ub_templates', this.townTemplates);
        this.refreshUI();
    };

    main = async () => {
        if (!this.active || this.captchaActive) return;
        for (const [cid, tid] of Object.entries(this.townTemplates)) {
            const t = uw.ITowns.towns[cid]; if (!t) { delete this.townTemplates[cid]; this.storage.save('ub_templates', this.townTemplates); continue; }
            const tpl = this.TEMPLATES[tid]; if (!tpl) continue;
            const bld = t.getBuildings?.().attributes || {};
            const res = t.getResearches?.().attributes || {};
            const q = t.buildingOrders?.()?.length || 0;
            const mq = uw.GameDataPremium?.isAdvisorActivated('curator') ? 7 : 2;

            // 1. Buildings
            if (tpl.buildings && q < mq) {
                for (const [b, lv] of Object.entries(tpl.buildings)) {
                    if ((bld[b] || 0) >= lv) continue;
                    const r = t.resources();
                    const bd = uw.MM?.getModels?.()?.BuildingBuildData?.[cid]?.attributes?.building_data?.[b]?.resources_for;
                    if (bd && (r.wood < bd.wood + 20 || r.stone < bd.stone + 20 || r.iron < bd.iron + 20)) continue;
                    uw.gpAjax.ajaxPost('frontend_bridge', 'execute', { model_url: 'BuildingOrder', action_name: 'buildUp', arguments: { building_id: b }, town_id: cid });
                    this.currentAction = `Building: ${b}`; this.refreshUI();
                    await this.sleep(1500); return;
                }
            }

            // 2. Research
            if (tpl.academy) {
                for (const tech of tpl.academy) {
                    if (res[tech]) continue;
                    uw.gpAjax.ajaxPost('frontend_bridge', 'execute', { model_url: 'BuildingAcademy', action_name: 'research', arguments: { research_id: tech }, town_id: cid });
                    this.currentAction = `Research: ${tech}`; this.refreshUI();
                    await this.sleep(1000); return;
                }
            }

            // 3. Units
            for (const [unit, target] of Object.entries(tpl.units)) {
                const ud = uw.GameData?.units?.[unit]; if (!ud) continue;
                const kind = this.NAVAL_ORDER.includes(unit) ? 'naval' : 'ground';
                if ((t.getUnitOrdersCollection?.()?.where?.({ kind })?.length || 0) >= this.MAX_ORDERS) continue;
                const owned = this.getOwnedCount(t, unit);
                const rem = target - owned; if (rem <= 0) continue;
                const rs = t.resources(); const d = uw.GeneralModifications?.getUnitBuildResourcesModification?.(cid, ud) || 1;
                const c = ud.resources || {};
                const byW = Math.floor((rs.wood || 0) / Math.max(1, Math.round((c.wood || 0) * d)));
                const byS = Math.floor((rs.stone || 0) / Math.max(1, Math.round((c.stone || 0) * d)));
                const byI = Math.floor((rs.iron || 0) / Math.max(1, Math.round((c.iron || 0) * d)));
                const byP = Math.floor((rs.population || 0) / ud.population);
                const amt = Math.min(rem, Math.max(0, Math.min(byW, byS, byI, byP)), this.MAX_BATCH);
                if (amt <= 0) continue;
                uw.gpAjax.ajaxPost('building_barracks', 'build', { unit_id: unit, amount: amt, town_id: cid });
                this.currentAction = `Training: ${amt} ${unit}`; this.refreshUI();
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
