class AutoResource extends ModernUtil {
    constructor(c, s) {
        super(c, s);
        this.targetTown = this.storage.load('ar_target', null);
        this.enabled = this.storage.load('ar_active', false);
        this.fillPercent = this.storage.load('ar_fill', 90);
        this.resendPercent = this.storage.load('ar_resend', 50);
        this.reserve = this.storage.load('ar_reserve', { wood: 10000, stone: 10000, iron: 10000 });
        this.interval = null;

        // Refresh UI when switching towns
        try { uw.$.Observer('GameEvents.town.town_switch').subscribe('autoResource', () => this.refreshAll()); } catch(e) {}

        if (this.enabled) this.start();
    }

    start = () => {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(this.main.bind(this), 30000);
    };

    stop = () => {
        clearInterval(this.interval);
        this.interval = null;
    };

    settings = () => {
        const town = uw.ITowns.getCurrentTown();
        const currentTarget = this.targetTown ? uw.ITowns.towns[this.targetTown] : null;
        const targetLabel = currentTarget ? currentTarget.getName() : 'none';
        const filter = this.enabled ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '';
        const towns = Object.entries(uw.ITowns.towns || {});

        return `
        <div class="game_border" style="margin-bottom:20px">
            <div class="game_border_top"></div><div class="game_border_bottom"></div>
            <div class="game_border_left"></div><div class="game_border_right"></div>
            <div class="game_border_corner corner1"></div><div class="game_border_corner corner2"></div>
            <div class="game_border_corner corner3"></div><div class="game_border_corner corner4"></div>
            <div style="cursor:pointer;filter:${filter}" class="game_header bold" onclick="window.modernBot.autoResource.toggle()">
                Auto Resource <span class="command_count"></span>
                <div style="float:right;margin-right:8px;font-size:10px;">(click to toggle)</div>
            </div>
            <div style="padding:5px;font-weight:600">
                <div style="margin-bottom:4px">
                    Target: <span id="ar_target_label"><b>${targetLabel}</b> (${currentTarget ? currentTarget.getPoints() + ' pts' : 'not set'})</span>
                </div>

                <div style="margin-bottom:4px;font-size:11px;font-weight:normal">
                    <span style="cursor:pointer;margin-right:6px" onclick="event.stopPropagation();window.modernBot.autoResource.editFill(-5)">◀</span>
                    Fill stop: <b id="ar_fill">${this.fillPercent}%</b>
                    <span style="cursor:pointer;margin-left:6px" onclick="event.stopPropagation();window.modernBot.autoResource.editFill(5)">▶</span>
                    &nbsp;|&nbsp;
                    <span style="cursor:pointer;margin-right:6px" onclick="event.stopPropagation();window.modernBot.autoResource.editResend(-5)">◀</span>
                    Resend: <b id="ar_resend">${this.resendPercent}%</b>
                    <span style="cursor:pointer;margin-left:6px" onclick="event.stopPropagation();window.modernBot.autoResource.editResend(5)">▶</span>
                </div>

                <div style="margin-bottom:4px;font-size:11px;font-weight:normal">
                    Reserve per city:
                    <span style="margin-left:4px">Wood:
                        <span style="cursor:pointer;font-size:10px" onclick="event.stopPropagation();window.modernBot.autoResource.editReserve('wood',-5000)">◀</span>
                        <b id="ar_wood_res">${this.reserve.wood}</b>
                        <span style="cursor:pointer;font-size:10px" onclick="event.stopPropagation();window.modernBot.autoResource.editReserve('wood',5000)">▶</span>
                    </span>
                    <span style="margin-left:4px">Stone:
                        <span style="cursor:pointer;font-size:10px" onclick="event.stopPropagation();window.modernBot.autoResource.editReserve('stone',-5000)">◀</span>
                        <b id="ar_stone_res">${this.reserve.stone}</b>
                        <span style="cursor:pointer;font-size:10px" onclick="event.stopPropagation();window.modernBot.autoResource.editReserve('stone',5000)">▶</span>
                    </span>
                    <span style="margin-left:4px">Iron:
                        <span style="cursor:pointer;font-size:10px" onclick="event.stopPropagation();window.modernBot.autoResource.editReserve('iron',-5000)">◀</span>
                        <b id="ar_iron_res">${this.reserve.iron}</b>
                        <span style="cursor:pointer;font-size:10px" onclick="event.stopPropagation();window.modernBot.autoResource.editReserve('iron',5000)">▶</span>
                    </span>
                </div>

                <div id="ar_towns" style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">
                    ${towns.map(([id, t]) => {
                        const isTarget = id == this.targetTown;
                        const isCurrent = id == town.id;
                        const label = `${isCurrent ? '📍 ' : ''}${t.getName()}`;
                        const bg = isTarget ? 'background:#ffbb33;color:#000' : '';
                        const cls = `button_new${isTarget?' disabled':''}`;
                        return `<div style="cursor:pointer;margin:1px;${bg}" class="${cls}"
                            onclick="event.stopPropagation();window.modernBot.autoResource.setTarget(${id})">
                            <div class="left"></div><div class="right"></div>
                            <div class="caption js-caption"> ${label} ${isTarget ? '⭐' : ''}<div class="effect js-effect"></div></div>
                        </div>`;
                    }).join('')}
                </div>
                <div id="ar_info" style="margin-top:4px;font-size:10px;font-weight:normal"></div>
            </div>
        </div>`;
    };

    toggle = () => {
        this.enabled = !this.enabled;
        this.storage.save('ar_active', this.enabled);
        if (this.enabled) this.start();
        else this.stop();
    };

    setTarget = townId => {
        this.targetTown = townId;
        this.storage.save('ar_target', townId);
        this.refreshAll();
    };

    refreshAll = () => {
        const town = uw.ITowns.getCurrentTown();
        const currentTarget = this.targetTown ? uw.ITowns.towns[this.targetTown] : null;
        const targetLabel = currentTarget ? currentTarget.getName() : 'none';

        // Update target label
        const el = document.getElementById('ar_target_label');
        if (el) el.innerHTML = `<b>${targetLabel}</b> (${currentTarget ? currentTarget.getPoints() + ' pts' : 'not set'})`;

        // Update fill/resend display
        const fEl = document.getElementById('ar_fill');
        if (fEl) fEl.textContent = this.fillPercent + '%';
        const rEl = document.getElementById('ar_resend');
        if (rEl) rEl.textContent = this.resendPercent + '%';

        // Update town buttons
        const btnEl = document.getElementById('ar_towns');
        if (btnEl) {
            const towns = Object.entries(uw.ITowns.towns || {});
            btnEl.innerHTML = towns.map(([id, t]) => {
                const isTarget = id == this.targetTown;
                const isCurrent = id == town.id;
                const label = `${isCurrent ? '📍 ' : ''}${t.getName()}`;
                const bg = isTarget ? 'background:#ffbb33;color:#000' : '';
                const cls = `button_new${isTarget?' disabled':''}`;
                return `<div style="cursor:pointer;margin:1px;${bg}" class="${cls}"
                    onclick="event.stopPropagation();window.modernBot.autoResource.setTarget(${id})">
                    <div class="left"></div><div class="right"></div>
                    <div class="caption js-caption"> ${label} ${isTarget ? '⭐' : ''}<div class="effect js-effect"></div></div>
                </div>`;
            }).join('');
        }
    };

    editFill = delta => {
        this.fillPercent = Math.max(10, Math.min(100, this.fillPercent + delta));
        this.storage.save('ar_fill', this.fillPercent);
        const el = document.getElementById('ar_fill');
        if (el) el.textContent = this.fillPercent + '%';
    };

    editResend = delta => {
        this.resendPercent = Math.max(5, Math.min(95, this.resendPercent + delta));
        this.storage.save('ar_resend', this.resendPercent);
        const el = document.getElementById('ar_resend');
        if (el) el.textContent = this.resendPercent + '%';
    };

    editReserve = (type, delta) => {
        this.reserve[type] = Math.max(0, this.reserve[type] + delta);
        this.storage.save('ar_reserve', this.reserve);
        const el = document.getElementById(`ar_${type}_res`);
        if (el) el.textContent = this.reserve[type];
    };

    main = async () => {
        if (!this.enabled || !this.targetTown) return;
        if ($('.botcheck').length || $('#recaptcha_window').length) return;

        const target = uw.ITowns.towns[this.targetTown];
        if (!target) return;

        const targetRes = target.resources();
        const targetStorage = targetRes.storage;
        const fillCap = Math.floor(targetStorage * this.fillPercent / 100);
        const resendCap = Math.floor(targetStorage * this.resendPercent / 100);

        const targetWood = targetRes.wood || 0;
        const targetStone = targetRes.stone || 0;
        const targetIron = targetRes.iron || 0;

        if (targetWood >= resendCap && targetStone >= resendCap && targetIron >= resendCap) {
            this.updateInfo(`Target OK (${targetWood}/${fillCap}w)`);
            return;
        }

        const needWood = Math.max(0, fillCap - targetWood);
        const needStone = Math.max(0, fillCap - targetStone);
        const needIron = Math.max(0, fillCap - targetIron);

        if (needWood <= 0 && needStone <= 0 && needIron <= 0) {
            this.updateInfo('Storage full');
            return;
        }

        let sent = false;
        for (const [cityId, city] of Object.entries(uw.ITowns.towns || {})) {
            if (cityId == this.targetTown) continue;
            if (city.getAvailableTradeCapacity() < 500) continue;

            const res = city.resources();
            const spareWood = Math.max(0, (res.wood || 0) - this.reserve.wood);
            const spareStone = Math.max(0, (res.stone || 0) - this.reserve.stone);
            const spareIron = Math.max(0, (res.iron || 0) - this.reserve.iron);

            if (spareWood <= 0 && spareStone <= 0 && spareIron <= 0) continue;

            const sendWood = Math.min(spareWood, needWood);
            const sendStone = Math.min(spareStone, needStone);
            const sendIron = Math.min(spareIron, needIron);

            if (sendWood <= 0 && sendStone <= 0 && sendIron <= 0) continue;

            const data = {
                id: this.targetTown,
                wood: sendWood,
                stone: sendStone,
                iron: sendIron,
                town_id: cityId,
                nl_init: true,
            };

            uw.gpAjax.ajaxPost('town_info', 'trade', data, false, () => {});
            this.console.log(`Sent ${sendWood}w/${sendStone}s/${sendIron}i from ${city.getName()} to ${target.getName()}`);
            sent = true;
            await this.sleep(500);
            break;
        }

        this.updateInfo(sent ? 'Sent resources' : 'No city has spare resources');
    };

    updateInfo = msg => {
        const el = document.getElementById('ar_info');
        if (el) el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    };

    sleep = ms => new Promise(r => setTimeout(r, ms));
}
