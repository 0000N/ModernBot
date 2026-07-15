# ModernBot — Bot Grepolis

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

Un fork de [Sau1707/ModernBot](https://github.com/Sau1707/ModernBot), maintenu par [0000N](https://github.com/0000N).  
**Le code est géré via [OpenCode](https://opencode.ai) — un agent IA dédié au développement et à la correction du bot.**

## Installation

### 1. Installer Tampermonkey
Si tu ne l'as pas : [Installer Tampermonkey](https://www.tampermonkey.net/)

### 2. Clique ici pour installer ModernBot

<p align="center">
  <a href="https://raw.githubusercontent.com/0000N/ModernBot/main/dist/merged.user.js">
    <img src="https://img.shields.io/badge/Installer%20ModernBot-v1.22-brightgreen?style=for-the-badge&logo=tampermonkey" alt="Installer ModernBot">
  </a>
</p>

**Ou copie cette URL dans ton navigateur :**
```
https://raw.githubusercontent.com/0000N/ModernBot/main/dist/merged.user.js
```

Tampermonkey détectera automatiquement le script et te demandera de l'installer.

### 3. Terminé ! ✅
Connecte-toi à Grepolis, tu verras l'icône ModernBot à côté du panthéon.

---

Version 2.0 en cours — [Suivre l'avancement](https://github.com/0000N/ModernBot/issues)

<br />

## Signaler un problème

**Les issues sont ouvertes sur ce fork** — [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

Quand tu crées une issue :
- Une réponse automatique confirme la réception
- Le code sera corrigé et proposé pour validation
- Tu es notifié quand la correction est prête

<br />

## Script

Le script est divisé en modules dans le dossier `src`.

Exécute dans le dossier principal :

```
npm install
npm run dev
```

Cela crée un serveur nodemon qui écoute les modifications. Chaque fichier sauvegardé fusionne tous les modules dans `dist/modernbot.user.js`.

Place ceci dans un script Tampermonkey :

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

Erreur `@require: couldn't load` ? Va dans :

```
chrome://extensions/
```

Sélectionne Tampermonkey et ajoute `Allow access to file URLs`.

<br />

## Avertissement

Ce bot open-source est conçu pour Grepolis (InnoGames). Il n'est ni approuvé ni cautionné par InnoGames. Utilisation à vos risques et périls.

- Icônes de [flaticon](https://www.flaticon.com/)
