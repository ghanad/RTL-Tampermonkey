// ==UserScript==
// @name         Claude RTL Persian Support
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Add RTL support and Persian font for Claude chat interface including input
// @author       Your Name
// @match        https://claude.ai/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    function addPersianFont() {
        // Add Google Fonts link
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        // Add custom styles
        const style = document.createElement('style');
        style.textContent = `
            /* اولویت اول: وزیرمتن برای همه المان‌های متنی */
            .font-user-message p:lang(fa),
            .font-claude-message p:lang(fa),
            .font-user-message li:lang(fa),
            .font-claude-message li:lang(fa),
            .ProseMirror p:lang(fa),
            .ProseMirror[data-rtl="true"],
            .ProseMirror[data-rtl="true"] p {
                font-family: 'Vazirmatn', 'Tahoma', 'Iranian Sans', 'IRANSans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
            }

            /* تنظیمات RTL برای ویرایشگر */
            .ProseMirror[data-rtl="true"] {
                direction: rtl !important;
                text-align: right !important;
                font-family: 'Vazirmatn', 'Tahoma', 'Iranian Sans', 'IRANSans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
            }

            /* تنظیمات LTR برای ویرایشگر */
            .ProseMirror[data-rtl="false"] {
                direction: ltr !important;
                text-align: left !important;
            }

            /* تنظیمات برای پاراگراف‌های داخل ویرایشگر */
            .ProseMirror p {
                font-family: inherit;
            }

            /* همه متن‌های فارسی */
            *:has(> :not(pre, code)) {
                font-family: inherit;
            }
        `;
        document.head.appendChild(style);
    }

    function enableRTLForPersianText() {
        // Regular expression for Persian/Arabic characters
        const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

        // Find all message containers
        const userMessages = document.querySelectorAll('[data-testid="user-message"]');
        const claudeMessages = document.querySelectorAll('.font-claude-message');

        function handleMessage(element) {
            // Skip if the element is an input
            if (element.tagName === 'INPUT' ||
                element.tagName === 'TEXTAREA' ||
                element.querySelector('input, textarea')) {
                return;
            }

            // Skip code elements
            if (element.tagName === 'CODE' ||
                element.tagName === 'PRE' ||
                element.closest('pre')) {
                return;
            }

            // Find all text content elements including list items
            const textElements = element.querySelectorAll('p.whitespace-pre-wrap, li.whitespace-normal');
            textElements.forEach(textEl => {
                if (persianRegex.test(textEl.textContent)) {
                    textEl.style.direction = 'rtl';
                    textEl.style.textAlign = 'right';
                    textEl.style.paddingLeft = '8px';
                    textEl.style.paddingRight = '8px';
                    textEl.setAttribute('lang', 'fa');

                    // If it's a list item, handle the list minimally
                    const parentList = textEl.closest('ol');
                    if (parentList) {
                        parentList.style.direction = 'rtl';
                        parentList.style.paddingRight = '2rem';
                        parentList.style.paddingLeft = '0';
                    }
                }
            });
        }

        // Apply RTL to both user and Claude messages
        userMessages.forEach(handleMessage);
        claudeMessages.forEach(handleMessage);
    }

    function handleProseMirrorInput() {
        // Regular expression for Persian/Arabic characters
        const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

        function setupProseMirrorObserver() {
            // Find the ProseMirror editor
            const editor = document.querySelector('.ProseMirror');
            if (!editor) return;

            // Set initial direction and font based on content
            updateDirection(editor);

            // Create an observer to watch for content changes
            const observer = new MutationObserver((mutations) => {
                updateDirection(editor);
            });

            // Observe content changes
            observer.observe(editor, {
                childList: true,
                subtree: true,
                characterData: true
            });

            // Also handle keyboard input directly
            editor.addEventListener('input', () => {
                updateDirection(editor);
            });
        }

        function updateDirection(editor) {
            const content = editor.textContent || '';
            const hasPersian = persianRegex.test(content);

            // Update direction and font
            if (hasPersian && editor.getAttribute('data-rtl') !== 'true') {
                editor.setAttribute('data-rtl', 'true');
                editor.setAttribute('lang', 'fa');
            } else if (!hasPersian && editor.getAttribute('data-rtl') !== 'false') {
                editor.setAttribute('data-rtl', 'false');
                editor.removeAttribute('lang');
            }
        }

        // Initial setup
        setupProseMirrorObserver();

        // Also watch for dynamic editor creation
        const observer = new MutationObserver((mutations) => {
            if (document.querySelector('.ProseMirror')) {
                setupProseMirrorObserver();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when DOM is ready
    function init() {
        addPersianFont();
        enableRTLForPersianText();
        handleProseMirrorInput();

        // Set up observer for dynamic content
        const observer = new MutationObserver((mutations) => {
            enableRTLForPersianText();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Handle possible delays in page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();