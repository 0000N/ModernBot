# ModernBot — بوت Grepolis

![screenshot](./img/screen.png)

<p align="center" dir="ltr">
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

<div dir="rtl">

نسخة مشتقة من [Sau1707/ModernBot](https://github.com/Sau1707/ModernBot)، بصيانة [0000N](https://github.com/0000N).  
**تتم إدارة الكود عبر [OpenCode](https://opencode.ai) — وكيل ذكاء اصطناعي مخصص لتطوير البوت وإصلاح الأخطاء.**

## التثبيت

### <div align="center"> [الإصدار 1.0 (src)](https://github.com/0000N/ModernBot/raw/main/dist/merged.user.js) </div>

الإصدار 2.0 قيد التطوير — [متابعة التقدم](https://github.com/0000N/ModernBot/issues)

<br />

## الإبلاغ عن مشكلة

**Issues مفتوحة في هذا النسخة المشتقة** — [https://github.com/0000N/ModernBot/issues](https://github.com/0000N/ModernBot/issues)

عند إنشاء issue، رد تلقائي يؤكد الاستلام. سيتم تصحيح الكود واقتراحه للتحقق.

<br />

## السكربت

السكربت مقسم إلى وحدات في مجلد `src`.

قم بتشغيل في المجلد الرئيسي:

```
npm install
npm run dev
```

ينشئ خادم nodemon يدمج جميع الوحدات في `dist/modernbot.user.js`.

ضعه في Tampermonkey:

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

خطأ `@require: couldn't load`:

```
chrome://extensions/
```

اختر Tampermonkey → `Allow access to file URLs`.

<br />

## إخلاء مسؤولية

هذا البوت مفتوح المصدر مخصص للعبة Grepolis (InnoGames). InnoGames لا تؤيد أو توافق على هذا البوت. الاستخدام على مسؤوليتك الخاصة.

- الأيقونات من [flaticon](https://www.flaticon.com/)

</div>
