# ModernBot — Grepolis 游戏机器人

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

[Sau1707/ModernBot](https://github.com/Sau1707/ModernBot) 的分支，由 [0000N](https://github.com/0000N) 维护。  
**代码通过 [OpenCode](https://opencode.ai) 管理 — 一个专门用于机器人开发和错误修复的 AI 代理。**

## 安装

### <div align="center"> [版本 1.0 (src)](https://github.com/0000N/ModernBot/raw/main/dist/merged.user.js) </div>

版本 2.0 开发中 — [跟踪进度](https://github.com/0000N/ModernBot/issues)

<br />

## 报告问题

**Issues 在此分支中开放** — [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

创建 issue 后，系统会自动回复确认。代码将被修正并提请您验证。

<br />

## 脚本

脚本分为 `src` 目录下的多个模块。

在主文件夹中运行：

```
npm install
npm run dev
```

这将创建一个 nodemon 服务器，将所有模块合并到 `dist/modernbot.user.js` 中。

放入 Tampermonkey：

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

如果出现 `@require: couldn't load` 错误：

```
chrome://extensions/
```

选择 Tampermonkey → `Allow access to file URLs`。

<br />

## 免责声明

本开源机器人专为 Grepolis (InnoGames) 设计。InnoGames 不认可或批准此机器人。使用风险自负。

- 图标来自 [flaticon](https://www.flaticon.com/)
