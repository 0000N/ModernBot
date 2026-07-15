# ModernBot — Fork OpenCode

![screenshot](./img/screen.png)

<br />

Maintenu par [0000N](https://github.com/0000N) — Fork de [Sau1707/ModernBot](https://github.com/Sau1707/ModernBot).  
**Le code est géré automatiquement via [OpenCode](https://opencode.ai) — agent IA dédié au développement et à la correction du bot.**

<br />

## Installation

### <div align="center"> [Version 1.0 (src)](https://github.com/0000N/ModernBot/raw/main/dist/merged.user.js) </div>

Version 2.0 Work in progress — [Suivre l'avancement](https://github.com/0000N/ModernBot/issues)

<br /> 

## Signaler un problème

**Les issues sont ouvertes sur ce fork** : [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

Quand tu crées une issue :
- Une réponse automatique confirme la réception
- Le code sera corrigé et proposé pour validation
- Tu es notifié quand la correction est prête

<br />

## Script

The script it's divided in modules under the `src` directory.

by running in the main folder

```
npm install
npm run dev
```

it will create a nodemon server that listen to changes in the code. Each time a file it's saved all the modules are merged into one under the dist folder

Place this into a tampermokey script:

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

In case of loading error `@require: couldn't load ` go to

```
chrome://extensions/
```

Then select tampermoney and add `Allow access to file URLs`

<br />

## Disclaimer

This open-source bot is designed for use with Grepolis, a video game developed by InnoGames. However, please note that this bot is not endorsed or approved by InnoGames, and the use of this bot may be against the game's terms of service. We do not encourage or condone the use of this bot to gain an unfair advantage or violate the game's rules.

The use of this bot is entirely at your own risk, and we accept no liability for any consequences that may arise from its use. By using this bot, you acknowledge and accept that InnoGames may take action against your account for violating their terms of service. We strongly recommend that you read and understand the game's rules before using this bot.

Additionally, this bot is provided as open-source software, and we do not offer any technical support or assistance in its installation, configuration, or use. You are solely responsible for any modifications or customizations you make to the bot's code, and we accept no responsibility for any issues that may arise as a result.

By using this bot, you acknowledge and accept these terms and conditions and agree to use it responsibly and in accordance with the applicable laws and regulations.

- Icons from [flaticon](https://www.flaticon.com/)
