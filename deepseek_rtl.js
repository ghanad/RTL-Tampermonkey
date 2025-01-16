// ==UserScript==
// @name         DeepSeek RTL
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Makes Persian text RTL in chat interface and applies Vazir font
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const fontStyle = `
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');

        .rtl-persian {
            font-family: Vazirmatn, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = fontStyle;
    document.head.appendChild(styleSheet);

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
            element.style.unicodeBidi = 'plaintext';
            element.classList.add('rtl-persian');
            element.setAttribute('data-rtl-fixed', 'true');
        }
    }

    function handleInput(element) {
        if (element.hasAttribute('data-rtl-input-fixed')) {
            return;
        }

        element.classList.add('rtl-persian');

        element.style.direction = 'rtl';
        element.style.textAlign = 'right';

        element.addEventListener('input', function() {
            if (hasPersianText(this.value)) {
                this.style.direction = 'rtl';
                this.style.textAlign = 'right';
                this.classList.add('rtl-persian');
            } else {
                this.style.direction = 'ltr';
                this.style.textAlign = 'left';
            }
        });

        element.addEventListener('focus', function() {
            if (hasPersianText(this.value)) {
                this.style.direction = 'rtl';
                this.style.textAlign = 'right';
            }
        });

        element.setAttribute('data-rtl-input-fixed', 'true');
    }

    function processNewElements() {
        const textElements = document.querySelectorAll('p, span, div');
        textElements.forEach(element => {
            if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                makeRTL(element);
            }
        });

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
