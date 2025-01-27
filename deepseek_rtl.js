// ==UserScript==
// @name         DeepSeek RTL Enhanced
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Makes Persian text RTL in chat interface with improved heading and nested element support
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const fontStyle = `
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');

        /* تنظیمات اصلی برای المان‌های فارسی */
        .rtl-persian {
            font-family: Vazirmatn, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            direction: rtl !important;
            text-align: right !important;
        }

        /* تنظیمات مخصوص برای هدینگ‌ها با specificity بالاتر */
        h1.rtl-persian, 
        h2.rtl-persian, 
        h3.rtl-persian, 
        h4.rtl-persian, 
        h5.rtl-persian, 
        h6.rtl-persian {
            direction: rtl !important;
            text-align: right !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            width: 100% !important;
        }

        /* تنظیمات برای هدینگ‌های درون کانتینر RTL */
        .rtl-persian h1, 
        .rtl-persian h2, 
        .rtl-persian h3, 
        .rtl-persian h4, 
        .rtl-persian h5, 
        .rtl-persian h6 {
            direction: rtl !important;
            text-align: right !important;
            width: 100% !important;
        }

        /* تنظیمات برای المان‌های درون هدینگ */
        h1.rtl-persian *, 
        h2.rtl-persian *, 
        h3.rtl-persian *, 
        h4.rtl-persian *, 
        h5.rtl-persian *, 
        h6.rtl-persian * {
            direction: inherit !important;
            text-align: inherit !important;
        }

        /* تنظیمات برای متون انگلیسی */
        .ltr-text {
            direction: ltr !important;
            text-align: left !important;
        }

        /* تنظیمات مخصوص لیست‌ها */
        .rtl-persian ul,
        .rtl-persian ol,
        ul.rtl-persian,
        ol.rtl-persian {
            direction: rtl !important;
            list-style-position: outside !important;
            margin: 13.716px 0 !important;
            padding: 0 27.432px 0 0 !important;
        }

        /* اعمال direction برای bullet ها */
        .rtl-persian ul li::marker,
        .rtl-persian ol li::marker,
        ul.rtl-persian li::marker,
        ol.rtl-persian li::marker {
            direction: rtl !important;
            unicode-bidi: isolate !important;
            margin-left: 0 !important;
            margin-right: 27.432px !important;
        }

        .rtl-persian li,
        li.rtl-persian {
            direction: rtl !important;
            text-align: right !important;
            display: list-item !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 0 !important;
        }

        /* تنظیمات برای code درون لیست */
        .rtl-persian li code,
        li.rtl-persian code {
            direction: ltr !important;
            unicode-bidi: embed !important;
            display: inline-block !important;
            font-family: monospace !important;
        }

        /* تنظیمات برای پاراگراف‌های درون لیست */
        .rtl-persian li p,
        li.rtl-persian p {
            margin: 0 !important;
            padding: 0 !important;
            display: inline !important;
        }

        /* تنظیمات برای المان‌های تو در تو */
        .rtl-persian * {
            direction: inherit;
            text-align: inherit;
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

        return true;
    }

    function processTextNode(textNode) {
        const text = textNode.textContent;
        if (!text.trim()) return;

        const parentElement = textNode.parentElement;
        if (!parentElement || !shouldProcessElement(parentElement)) return;

        // اگر المان والد قبلاً پردازش شده، فقط کلاس را اضافه می‌کنیم
        if (parentElement.hasAttribute('data-rtl-fixed')) {
            if (hasPersianText(text)) {
                parentElement.classList.add('rtl-persian');
            }
            return;
        }

        if (hasPersianText(text)) {
            parentElement.classList.add('rtl-persian');

            // اعمال RTL به همه المان‌های فرزند
            parentElement.querySelectorAll('*').forEach(child => {
                if (shouldProcessElement(child)) {
                    child.classList.add('rtl-persian');
                }
            });
        } else {
            parentElement.classList.add('ltr-text');
        }

        parentElement.setAttribute('data-rtl-fixed', 'true');
    }

    function processHeading(heading) {
        if (heading.hasAttribute('data-rtl-fixed')) return;

        // بررسی مستقیم محتوای متنی هدینگ
        let hasDirectPersianText = false;
        heading.childNodes.forEach(node => {
            if (node.nodeType === 3 && hasPersianText(node.textContent.trim())) {
                hasDirectPersianText = true;
            }
        });

        // بررسی محتوای المان‌های فرزند
        const hasNestedPersianText = Array.from(heading.querySelectorAll('*')).some(
            child => shouldProcessElement(child) && hasPersianText(child.textContent.trim())
        );

        if (hasDirectPersianText || hasNestedPersianText) {
            heading.classList.add('rtl-persian');
            
            // پردازش المان‌های درون هدینگ
            heading.querySelectorAll('*').forEach(child => {
                if (shouldProcessElement(child)) {
                    if (hasPersianText(child.textContent.trim())) {
                        child.classList.add('rtl-persian');
                    }
                }
            });
        }

        heading.setAttribute('data-rtl-fixed', 'true');
    }

    function makeRTL(element) {
        if (!shouldProcessElement(element)) return;

        // پردازش هدینگ‌ها
        if (/^H[1-6]$/.test(element.tagName)) {
            processHeading(element);
        }

        // پردازش نودهای متنی
        element.childNodes.forEach(node => {
            if (node.nodeType === 3) { // Text node
                processTextNode(node);
            }
        });

        // پردازش المان‌های فرزند
        const childElements = element.querySelectorAll('*');
        childElements.forEach(child => {
            if (shouldProcessElement(child)) {
                if (/^H[1-6]$/.test(child.tagName)) {
                    processHeading(child);
                }
                child.childNodes.forEach(node => {
                    if (node.nodeType === 3) {
                        processTextNode(node);
                    }
                });
            }
        });
    }

    function handleInput(element) {
        if (element.hasAttribute('data-rtl-input-fixed')) return;

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
                if (node.nodeType === 1) {
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
