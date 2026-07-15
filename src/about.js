// About & version check
class About {
    constructor() {
        this.checkVersion();
    }

    settings = () => {
        return `
        <div class="game_border" style="margin-bottom: 20px">
            <div class="game_border_top"></div><div class="game_border_bottom"></div>
            <div class="game_border_left"></div><div class="game_border_right"></div>
            <div class="game_border_corner corner1"></div><div class="game_border_corner corner2"></div>
            <div class="game_border_corner corner3"></div><div class="game_border_corner corner4"></div>
            <div class="game_header bold">ModernBot</div>
            <div style="padding: 8px">
                <p style="margin: 2px 0">Bot Grepolis 2026</p>
                <p style="margin: 2px 0">Version: <span id="about_version">${GM_info?.script?.version || '?'}</span></p>
                <p style="margin: 2px 0">Fork: <a href="https://github.com/0000N/ModernBot" target="_blank">github.com/0000N/ModernBot</a></p>
                <p style="margin: 8px 0 2px 0; font-size: 10px; opacity: .7">Service MASE via OpenCode AI</p>
            </div>
        </div>`;
    };

    checkVersion = async () => {
        if (!GM_info) return;
        const installedVersion = GM_info.script.version;
        try {
            const file = await fetch('https://raw.githubusercontent.com/0000N/ModernBot/main/version.txt');
            const lastVersion = await file.text();
            if (lastVersion.trim() != installedVersion) {
                console.log(`[ModernBot] Update available: ${lastVersion.trim()} (you: ${installedVersion})`);
            }
        } catch (e) {
            // Ignore fetch errors
        }
    };
}
