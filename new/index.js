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
            console.log("[ModernBot] unit builder executed");
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
