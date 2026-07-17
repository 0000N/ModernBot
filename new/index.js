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
