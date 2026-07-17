# ModernBot — Бот для Grepolis

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

Форк [Sau1707/ModernBot](https://github.com/Sau1707/ModernBot), поддерживается [0000N](https://github.com/0000N).  
**Код управляется через [OpenCode](https://opencode.ai) — ИИ-агент для разработки и исправления бота.**

## Установка

### <div align="center"> [Версия 1.0 (src)](https://github.com/0000N/ModernBot/raw/main/dist/modernbot.user.js) </div>

Версия 2.0 в разработке — [Отслеживать прогресс](https://github.com/0000N/ModernBot/issues)

<br />

## Сообщить о проблеме

**Issues открыты в этом форке** — [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

При создании issue автоматический ответ подтверждает получение. Код будет исправлен и предложен для проверки.

<br />

## Скрипт

Скрипт разделён на модули в папке `src`.

Запустите в основной папке:

```
npm install
npm run dev
```

Создаёт сервер nodemon, который объединяет модули в `dist/modernbot.user.js`.

Вставьте в Tampermonkey:

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

Ошибка `@require: couldn't load`:

```
chrome://extensions/
```

Tampermonkey → `Allow access to file URLs`.

<br />

## Отказ от ответственности

Этот бот с открытым исходным кодом предназначен для Grepolis (InnoGames). InnoGames не поддерживает и не одобряет этого бота. Используйте на свой страх и риск.

— Иконки от [flaticon](https://www.flaticon.com/)
