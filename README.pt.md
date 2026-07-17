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

Um fork de [Sau1707/ModernBot](https://github.com/Sau1707/ModernBot), mantido por [0000N](https://github.com/0000N).  
**O código é gerenciado via [OpenCode](https://opencode.ai) — um agente de IA para desenvolvimento e correção do bot.**

## Instalação

### <div align="center"> [Versão 1.0 (src)](https://github.com/0000N/ModernBot/raw/main/dist/modernbot.user.js) </div>

Versão 2.0 em andamento — [Acompanhar progresso](https://github.com/0000N/ModernBot/issues)

<br />

## Reportar um problema

**Issues abertas neste fork** — [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

Ao criar uma issue, uma resposta automática confirma o recebimento. O código será corrigido e proposto para validação.

<br />

## Script

O script é dividido em módulos na pasta `src`.

Execute na pasta principal:

```
npm install
npm run dev
```

Cria um servidor nodemon que mescla os módulos em `dist/modernbot.user.js`.

Coloque no Tampermonkey:

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

Erro `@require: couldn't load`:

```
chrome://extensions/
```

Tampermonkey → `Allow access to file URLs`.

<br />

## Aviso legal

Bot de código aberto para Grepolis (InnoGames). Não é endossado ou aprovado pela InnoGames. Use por sua conta e risco.

- Ícones de [flaticon](https://www.flaticon.com/)
