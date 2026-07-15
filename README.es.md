# ModernBot — Bot para Grepolis

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

Un fork de [Sau1707/ModernBot](https://github.com/Sau1707/ModernBot), mantenido por [0000N](https://github.com/0000N).  
**El código se gestiona mediante [OpenCode](https://opencode.ai) — un agente de IA para el desarrollo y corrección del bot.**

## Instalación

### <div align="center"> [Versión 1.0 (src)](https://github.com/0000N/ModernBot/raw/main/dist/merged.user.js) </div>

Versión 2.0 en desarrollo — [Seguir progreso](https://github.com/0000N/ModernBot/issues)

<br />

## Reportar un problema

**Issues abiertos en este fork** — [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

Al crear un issue, una respuesta automática confirma la recepción. El código se corregirá y se propondrá para validación.

<br />

## Script

El script se divide en módulos en `src/`.

Ejecutar en la carpeta principal:

```
npm install
npm run dev
```

Crea un servidor nodemon que combina los módulos en `dist/modernbot.user.js`.

Colocar en Tampermonkey:

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

Error `@require: couldn't load`:

```
chrome://extensions/
```

Tampermonkey → `Allow access to file URLs`.

<br />

## Aviso legal

Bot de código abierto para Grepolis (InnoGames). No está respaldado ni aprobado por InnoGames. Úselo bajo su propio riesgo.

- Iconos de [flaticon](https://www.flaticon.com/)
