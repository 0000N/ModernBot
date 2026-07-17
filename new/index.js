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
        this.autoHide = new AutoHide();
        this.autoRuralTrade = new AutoRuralTrade();
        this.autoTrade = new AutoTrade();
        this.autoBootcamp = new AutoBootcamp();
        this.autoRuralLevel = new AutoRuralLevel();
        this.autoParty = new AutoParty();
        this.autoTrain = new AutoTrain();
        this.autoBuild = new AutoBuild();
        this.antiRage = new AntiRage();

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
            {
                title: 'Rural Trade',
                id: 'rural_trade',
                render: () => this.autoRuralTrade.render(),
            },
            {
                title: 'Trade',
                id: 'trade',
                render: () => this.autoTrade.render(),
            },
            {
                title: 'Bootcamp',
                id: 'bootcamp',
                render: () => this.autoBootcamp.render(),
            },
            {
                title: 'Hide',
                id: 'hide',
                render: () => this.autoHide.render(),
            },
            {
                title: 'Rural Lvl',
                id: 'rural_level',
                render: () => this.autoRuralLevel.render(),
            },
            {
                title: 'Party',
                id: 'party',
                render: () => this.autoParty.render(),
            },
            {
                title: 'Build',
                id: 'build',
                render: () => this.autoBuild.render(),
            },
            {
                title: 'Train',
                id: 'train',
                render: () => this.autoTrain.render(),
            },
            {
                title: 'Anti Rage',
                id: 'anti_rage',
                render: () => this.antiRage.render(),
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

    _scheduleNext() {
        this.lastAction = Date.now();
        this.currentDelay = this.utils.jitter(1000 * 8);
        this.loopActive = false;
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
        if (hasFarm) { this._scheduleNext(); return; }

        const hasUnitBuild = await this.autoUnitBuilder.execute();
        if (hasUnitBuild) { this._scheduleNext(); return; }

        const hasGratis = await this.autoGratis.execute();
        if (hasGratis) { this._scheduleNext(); return; }

        if (await this.autoBootcamp.execute()) { this._scheduleNext(); return; }
        if (await this.autoRuralLevel.execute()) { this._scheduleNext(); return; }
        if (await this.autoParty.execute()) { this._scheduleNext(); return; }
        if (await this.autoBuild.execute()) { this._scheduleNext(); return; }
        if (await this.autoTrain.execute()) { this._scheduleNext(); return; }

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
    }, 2000);

}, 100);
