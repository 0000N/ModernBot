# ModernBot — Grepolis Bot

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

A fork of [Sau1707/ModernBot](https://github.com/Sau1707/ModernBot), maintained by [0000N](https://github.com/0000N).  
**Code managed via [OpenCode](https://opencode.ai) — an AI agent dedicated to bot development and bug fixes.**

## Installation

### <div align="center"> [Version 1.0 (src)](https://github.com/0000N/ModernBot/raw/main/dist/merged.user.js) </div>

Version 2.0 Work in progress — [Track progress](https://github.com/0000N/ModernBot/issues)

<br />

## Report an Issue

**Issues are open on this fork** — [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

When you create an issue:
- An automatic reply confirms reception
- The code will be fixed and proposed for validation
- You'll be notified when the fix is ready

<br />

## Script

The script is divided in modules under the `src` directory.

Run in the main folder:

```
npm install
npm run dev
```

This creates a nodemon server that listens for code changes. Each time a file is saved, all modules are merged into one under the `dist` folder.

Place this in a Tampermonkey script:

```
// ==UserScript==
// @name         GrepoTest
// @author       Sau1707
// @description
// @version      1.0.0
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// @require      file://C:\[path]\ModernBot\dist\modernbot.user.js
// ==/UserScript==
```

If you get `@require: couldn't load` error, go to:

```
chrome://extensions/
```

Then select Tampermonkey and add `Allow access to file URLs`.

<br />

## Disclaimer

This open-source bot is designed for use with Grepolis, a video game developed by InnoGames. This bot is not endorsed or approved by InnoGames. Use at your own risk — InnoGames may take action against accounts violating their terms of service.

This bot is provided as open-source software with no technical support or assistance.

- Icons from [flaticon](https://www.flaticon.com/)
