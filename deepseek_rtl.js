// ==UserScript==
// @name         DeepSeek RTL
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Makes Persian text RTL in chat interface and applies Vazir font with proper mixed language support
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

        /* تنظیم alignment برای متون انگلیسی */
        .ltr-text {
            direction: ltr !important;
            text-align: left !important;
        }

        /* تنظیمات مخصوص لیست‌ها */
        .rtl-persian ul,
        .rtl-persian ol {
            padding-right: 1.5em !important;
            padding-left: 0 !important;
            margin-right: 1.5em !important;
            margin-left: 0 !important;
        }

        .rtl-persian li {
            text-align: right !important;
            direction: rtl !important;
        }

        .rtl-persian li::marker {
            unicode-bidi: isolate;
            direction: rtl !important;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = fontStyle;
    document.head.appendChild(styleSheet);

    function hasPersianText(text) {
        const persianRegex = /[\u0600-\u06FF]/;
        return persianRegex.test(text);
    }

    function isCodeBlock(element) {
        const codeClasses = ['code-block', 'hljs', 'language-', 'prism-code', 'syntax-highlighted'];
        const isCode = element.tagName === 'CODE' || element.tagName === 'PRE';
        const hasCodeClass = Array.from(element.classList).some(cls =>
            codeClasses.some(codeClass => cls.includes(codeClass))
        );

        let parent = element.parentElement;
        while (parent) {
            if (parent.tagName === 'PRE' || parent.tagName === 'CODE' ||
                Array.from(parent.classList).some(cls =>
                    codeClasses.some(codeClass => cls.includes(codeClass))
                )) {
                return true;
            }
            parent = parent.parentElement;
        }

        return isCode || hasCodeClass;
    }

    function shouldProcessElement(element) {
        const excludedTags = ['SCRIPT', 'STYLE'];
        if (excludedTags.includes(element.tagName)) {
            return false;
        }

        if (isCodeBlock(element)) {
            return false;
        }

        if (element.hasAttribute('data-rtl-fixed')) {
            return false;
        }

        return true;
    }

    function processTextNode(textNode) {
        const text = textNode.textContent;
        if (!text.trim()) return; // نادیده گرفتن متن‌های خالی

        const parentElement = textNode.parentElement;
        if (!parentElement || !shouldProcessElement(parentElement)) return;

        if (hasPersianText(text)) {
            parentElement.style.direction = 'rtl';
            parentElement.style.textAlign = 'right';
            parentElement.classList.add('rtl-persian');
        } else {
            parentElement.classList.add('ltr-text');
        }

        parentElement.setAttribute('data-rtl-fixed', 'true');
    }

    function makeRTL(element) {
        if (!shouldProcessElement(element)) {
            return;
        }

        element.childNodes.forEach(node => {
            if (node.nodeType === 3) { // Text node
                processTextNode(node);
            }
        });

        const childElements = element.querySelectorAll('*');
        childElements.forEach(child => {
            if (shouldProcessElement(child)) {
                child.childNodes.forEach(node => {
                    if (node.nodeType === 3) { // Text node
                        processTextNode(node);
                    }
                });
            }
        });
    }

    function handleInput(element) {
        if (element.hasAttribute('data-rtl-input-fixed')) {
            return;
        }

        element.classList.add('rtl-persian');

        const setDirection = () => {
            const content = element.value || element.textContent;
            if (hasPersianText(content)) {
                element.style.direction = 'rtl';
                element.style.textAlign = 'right';
            } else {
                element.style.direction = 'ltr';
                element.style.textAlign = 'left';
            }
        };

        setDirection();

        element.addEventListener('input', setDirection);
        element.addEventListener('focus', setDirection);

        element.setAttribute('data-rtl-input-fixed', 'true');
    }

    function processNewElements() {
        document.querySelectorAll('*').forEach(element => {
            if (element.childNodes.length > 0) {
                makeRTL(element);
            }
        });

        const inputElements = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
        inputElements.forEach(handleInput);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    makeRTL(node);
                    node.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]')
                        .forEach(handleInput);
                }
            });
        });
    });

    function startObserving() {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        processNewElements();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }
})();
