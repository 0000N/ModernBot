class AutoBootcamp extends ModernUtils {
    constructor() {
        super();
        this.active = this.loadSettings('ab_active', false);
        this.useDef = this.loadSettings('bootcamp_use_def', false);

        this.$title = this.getTitleElement('Auto Bootcamp').$title;
        this.$title.click(() => this.toggle());

        this.$btnOff = this.getButtonElement('Only off');
        this.$btnDef = this.getButtonElement('Off & Def');
        this.$btnOff.click(() => this.triggerUseDef());
        this.$btnDef.click(() => this.triggerUseDef());
        this._updateBtnStyle();

        const $div = $('<div>').css({ display: 'flex', justifyContent: 'center', padding: '10px' });
        $div.append(this.$btnOff, this.$btnDef);

        this.$settings = $('<div>');
        this.$settings.addClass('game_border').css({ margin: '20px' });
        this.$settings.css({
            'border-image-source': '',
            'border-image-slice': '',
            'border-image-width': '',
        });
        const $inner = $('<div>').css({ padding: '5px' });
        $inner.append(this.$title);
        $inner.append($div);
        this.$settings.append($inner);

        GameApi.onWindowOpen((e, handler) => {
            if (!handler?.attributes || handler.attributes.window_type !== 'attack_spot') return;
            const cid = handler.cid;
            const $window = $(`#window_${cid}`);
            $window.css('height', '660px');
            const iv = setInterval(() => {
                const $content = $window.find('.window_content');
                if ($content.length === 0) return;
                clearInterval(iv);
                $content.append(this.$settings.clone(true));
            }, 100);
        });
    }

    render() {
        const $box = $('<div>').css({ marginBottom: '20px' });
        $box.append(this.$title.clone(true).click(() => this.toggle()));
        const $div = $('<div>').css({ display: 'flex', justifyContent: 'center', padding: '10px' });
        $div.append(this.$btnOff.clone(true).click(() => this.triggerUseDef()));
        $div.append(this.$btnDef.clone(true).click(() => this.triggerUseDef()));
        $box.append($div);
        this._updateBtnStyle();
        return $box;
    }

    _updateBtnStyle() {
        if (this.useDef) {
            this.$btnOff.addClass('disabled');
            this.$btnDef.removeClass('disabled');
        } else {
            this.$btnDef.addClass('disabled');
            this.$btnOff.removeClass('disabled');
        }
        this.$title.toggleClass('active', this.active);
    }

    triggerUseDef() {
        this.useDef = !this.useDef;
        this.saveSettings('bootcamp_use_def', this.useDef);
        this._updateBtnStyle();
    }

    toggle() {
        this.active = !this.active;
        this.saveSettings('ab_active', this.active);
        this._updateBtnStyle();
    }

    async execute() {
        if (!this.active) return false;
        if (this._rewardBootcamp()) return true;
        if (this._attackBootcamp()) return true;
        return false;
    }

    _rewardBootcamp() {
        const model = GameApi.getModelByNameAndPlayerId('PlayerAttackSpot');
        if (!model || typeof model.getLevel === 'undefined') {
            this.active = false;
            this.saveSettings('ab_active', false);
            return true;
        }
        if (!model.hasReward()) return false;
        const reward = model.getReward();
        if (reward.power_id.includes('instant') && !reward.power_id.includes('favor')) {
            this._useReward();
            return true;
        }
        if (reward.stashable) this._stashReward();
        else this._useReward();
        return true;
    }

    _attackBootcamp() {
        const model = GameApi.getModelByNameAndPlayerId('PlayerAttackSpot');
        if (!model || model.getCooldownDuration() > 0) return false;

        const MovementsUnits = GameApi.getModels()?.MovementsUnits;
        if (MovementsUnits) {
            for (const mu of Object.values(MovementsUnits)) {
                if (mu.attributes.destination_is_attack_spot || mu.attributes.origin_is_attack_spot) return false;
            }
        }

        const town = GameApi.getCurrentTown();
        if (!town) return false;
        const units = { ...town.units() };
        delete units.militia;
        for (const unit in units) {
            if (GameApi.getUnitData(unit)?.is_naval) delete units[unit];
        }
        if (!this.useDef) {
            delete units.sword;
            delete units.archer;
        }
        if (Object.keys(units).length === 0) return false;

        const playerId = GameApi.playerId() || uw.Game?.player_id;
        GameApi.ajaxPost('frontend_bridge', 'execute', {
            model_url: `PlayerAttackSpot/${playerId}`,
            action_name: 'attack',
            arguments: units,
        }, () => {});
        return true;
    }

    _useReward() {
        const playerId = GameApi.playerId() || uw.Game?.player_id;
        GameApi.ajaxPost('frontend_bridge', 'execute', {
            model_url: `PlayerAttackSpot/${playerId}`,
            action_name: 'useReward',
            arguments: {},
        }, () => {});
    }

    _stashReward() {
        const playerId = GameApi.playerId() || uw.Game?.player_id;
        GameApi.ajaxPost('frontend_bridge', 'execute', {
            model_url: `PlayerAttackSpot/${playerId}`,
            action_name: 'stashReward',
            arguments: {},
        }, () => {}, () => this._useReward());
    }
}
