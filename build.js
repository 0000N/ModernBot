const fs = require('fs');
const path = require('path');

// Define paths
const distPath = path.join(__dirname, 'dist/modernbot.user.js');
const modulesPath = path.join(__dirname, 'new/modules');
const menuPath = path.join(__dirname, 'new/menu.js');
const gameApiPath = path.join(__dirname, 'new/gameApi.js');
const indexPath = path.join(__dirname, 'new/index.js');
const utilsPath = path.join(__dirname, 'new/utils.js');
const stylePath = path.join(__dirname, 'new/style.css');

// Function to get the new version number
function getNextVersion() {
    // Read version from version.txt if available
    const verFile = path.join(__dirname, 'version.txt');
    if (fs.existsSync(verFile)) {
        const current = fs.readFileSync(verFile, 'utf-8').trim();
        const [major, minor, patch] = current.split('.').map(Number);
        return `${major}.${minor}.${patch + 1}`;
    }
    // Fallback: read from dist
    if (fs.existsSync(distPath)) {
        const content = fs.readFileSync(distPath, 'utf-8');
        const m = content.match(/@version\s+(\d+\.\d+\.\d+)/);
        if (m) {
            const [major, minor, patch] = m[1].split('.').map(Number);
            return `${major}.${minor}.${patch + 1}`;
        }
    }
    return '1.0.0';
}

// Determine if the version should be updated based on the command-line argument
const shouldUpdateVersion = process.argv.includes('--version');
const version = shouldUpdateVersion ? getNextVersion() : '1.0.0'; // Default version if not updating

// Header template with conditional version
const header = `// ==UserScript==
// @name         ModernBot V2
// @version      ${version}
// @description  ModernBot V2 — Grepolis automation bot (OpenCode AI managed)
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// @updateURL    https://raw.githubusercontent.com/0000N/ModernBot/main/dist/modernbot.user.js
// @downloadURL  https://raw.githubusercontent.com/0000N/ModernBot/main/dist/modernbot.user.js
// @icon         https://raw.githubusercontent.com/0000N/ModernBot/main/img/gear.png
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
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
    style.innerHTML = \`${fs.readFileSync(stylePath, 'utf-8').replace(/`/g, '\\`')}\`;
    document.head.appendChild(style);
`;

// Ensure dist folder exists
if (!fs.existsSync(path.dirname(distPath))) {
    fs.mkdirSync(path.dirname(distPath), { recursive: true });
}

// Write header and style to the output file
fs.writeFileSync(distPath, header);

// Append gameApi.js and utils.js first
[gameApiPath, utilsPath].forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    fs.appendFileSync(distPath, `\n\n// File: ${fileName}\n${content}`);
});

// Read and append each module file
fs.readdirSync(modulesPath).forEach(file => {
    const filePath = path.join(modulesPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    fs.appendFileSync(distPath, `\n\n// Module: ${file}\n${content}`);
});

// Append menu.js and index.js
[menuPath, indexPath].forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    fs.appendFileSync(distPath, `\n\n// File: ${fileName}\n${content}`);
});

fs.appendFileSync(distPath, `\n})();`);
if (shouldUpdateVersion) {
    console.log(`modernbot.user.js created successfully in /dist with version ${version}.`);
}

