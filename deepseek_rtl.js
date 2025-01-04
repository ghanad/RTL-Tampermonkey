// ==UserScript==
// @name         DeepSeek RTL
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Makes Persian text RTL in chat interface and applies Vazir font
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // اضافه کردن فونت وزیرمتن
    const fontStyle = `
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');

        .rtl-persian {
            font-family: Vazirmatn, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
    `;

    // اضافه کردن استایل به صفحه
    const styleSheet = document.createElement('style');
    styleSheet.textContent = fontStyle;
    document.head.appendChild(styleSheet);

    // تنظیمات قابل تغییر
    const config = {
        checkInterval: 1000,
        maxAttempts: 50
    };

    function hasPersianText(text) {
        const persianRegex = /[\u0600-\u06FF]/;
        return persianRegex.test(text);
    }

    function makeRTL(element) {
        if (element.hasAttribute('data-rtl-fixed')) {
            return;
        }

        if (hasPersianText(element.textContent)) {
            element.style.direction = 'rtl';
            element.style.textAlign = 'right';
            element.style.unicodeBidi = 'bidi-override';
            element.classList.add('rtl-persian');
            element.setAttribute('data-rtl-fixed', 'true');
        }
    }

    function handleInput(element) {
        if (element.hasAttribute('data-rtl-input-fixed')) {
            return;
        }

        // اعمال فونت به المان ورودی
        element.classList.add('rtl-persian');

        // تنظیم RTL اولیه
        element.style.direction = 'rtl';
        element.style.textAlign = 'right';

        // رویداد input
        element.addEventListener('input', function() {
            if (hasPersianText(this.value)) {
                this.style.direction = 'rtl';
                this.style.textAlign = 'right';
                this.classList.add('rtl-persian');
            } else {
                this.style.direction = 'ltr';
                this.style.textAlign = 'left';
                // فونت را برای متون غیر فارسی حفظ می‌کنیم
            }
        });

        // رویداد focus
        element.addEventListener('focus', function() {
            if (hasPersianText(this.value)) {
                this.style.direction = 'rtl';
                this.style.textAlign = 'right';
            }
        });

        element.setAttribute('data-rtl-input-fixed', 'true');
    }

    function processNewElements() {
        // پردازش المان‌های متنی معمولی
        const textElements = document.querySelectorAll('p, span, div');
        textElements.forEach(element => {
            if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                makeRTL(element);
            }
        });

        // پردازش ورودی‌های متنی
        const inputElements = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
        inputElements.forEach(handleInput);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                processNewElements();
            }
        });
    });

    // شروع مشاهده تغییرات DOM پس از بارگذاری صفحه
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            processNewElements();
        });
    } else {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        processNewElements();
    }
})();
