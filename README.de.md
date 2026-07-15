# ModernBot — Grepolis-Bot

![screenshot](./img/screen.png)

<p align="center">
  <a href="README.md">🇬🇧 English</a> •
  <a href="README.fr.md">🇫🇷 Français</a> •
  <a href="README.de.md">🇩🇪 Deutsch</a> •
  <a href="README.es.md">🇪🇸 Español</a> •
  <a href="README.it.md">🇮🇹 Italiano</a> •
  <a href="README.pt.md">🇧🇷 Português</a> •
  <a href="README.zh.md">🇨🇳 中文</a> •
  <a href="README.ru.md">🇷🇺 Русский</a> •
  <a href="README.ar.md">🇸🇦 العربية</a>
</p>

---

Ein Fork von [Sau1707/ModernBot](https://github.com/Sau1707/ModernBot), gepflegt von [0000N](https://github.com/0000N).  
**Der Code wird via [OpenCode](https://opencode.ai) verwaltet — einer KI zur Bot-Entwicklung und Fehlerbehebung.**

## Installation

### 1. Tampermonkey installieren
Falls nicht vorhanden: [Tampermonkey installieren](https://www.tampermonkey.net/)

### 2. Hier klicken um ModernBot zu installieren

<p align="center">
  <a href="https://raw.githubusercontent.com/0000N/ModernBot/main/dist/merged.user.js">
    <img src="https://img.shields.io/badge/Install%20ModernBot-v1.22-brightgreen?style=for-the-badge&logo=tampermonkey" alt="Install ModernBot">
  </a>
</p>

**Oder diese URL in den Browser kopieren:**
```
https://raw.githubusercontent.com/0000N/ModernBot/main/dist/merged.user.js
```

Tampermonkey erkennt das Script automatisch.

### 3. Fertig ! ✅
Bei Grepolis anmelden, das ModernBot-Symbol erscheint neben dem Götterbereich.

---

Version 2.0 in Arbeit — [Fortschritt verfolgen](https://github.com/0000N/ModernBot/issues)

<br />

## Problem melden

**Issues sind in diesem Fork geöffnet** — [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

Wenn du ein Issue erstellst, antwortet ein Bot automatisch. Der Code wird korrigiert und zur Validierung vorgeschlagen.

<br />

## Skript

Das Skript ist in Module unterteilt (`src/`).

Im Hauptordner ausführen:

```
npm install
npm run dev
```

Erstellt einen nodemon-Server, der Code-Änderungen überwacht und Module in `dist/modernbot.user.js` zusammenführt.

In Tampermonkey einfügen:

```
// ==UserScript==
// @name         GrepoTest
// @author       Sau1707
// @version      1.0.0
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// @require      file://C:\[path]\ModernBot\dist\modernbot.user.js
// ==/UserScript==
```

Bei Fehler `@require: couldn't load`:

```
chrome://extensions/
```

Tampermonkey auswählen und `Allow access to file URLs` aktivieren.

<br />

## Haftungsausschluss

Dieser Open-Source-Bot ist für Grepolis (InnoGames) konzipiert. InnoGames unterstützt oder genehmigt diesen Bot nicht. Nutzung auf eigene Gefahr.

- Icons von [flaticon](https://www.flaticon.com/)
