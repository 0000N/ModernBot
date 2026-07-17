# ModernBot — Bot per Grepolis

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

Un fork di [Sau1707/ModernBot](https://github.com/Sau1707/ModernBot), mantenuto da [0000N](https://github.com/0000N).  
**Il codice è gestito tramite [OpenCode](https://opencode.ai) — un agente IA per lo sviluppo e la correzione del bot.**

## Installazione

### <div align="center"> [Versione 1.0 (src)](https://github.com/0000N/ModernBot/raw/main/dist/modernbot.user.js) </div>

Versione 2.0 in lavorazione — [Segui i progressi](https://github.com/0000N/ModernBot/issues)

<br />

## Segnala un problema

**Issue aperte su questo fork** — [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

Alla creazione di un'issue, una risposta automatica conferma la ricezione. Il codice verrà corretto e proposto per la validazione.

<br />

## Script

Lo script è diviso in moduli nella cartella `src`.

Esegui nella cartella principale:

```
npm install
npm run dev
```

Crea un server nodemon che unisce i moduli in `dist/modernbot.user.js`.

Incolla in Tampermonkey:

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

Errore `@require: couldn't load`:

```
chrome://extensions/
```

Tampermonkey → `Allow access to file URLs`.

<br />

## Dichiarazione di non responsabilità

Bot open-source progettato per Grepolis (InnoGames). Non è approvato da InnoGames. Utilizzo a proprio rischio.

- Icone da [flaticon](https://www.flaticon.com/)
