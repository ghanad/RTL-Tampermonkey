// content.js
function loadSettings(callback) {
  chrome.storage.sync.get({
    selectedFont: 'Vazirmatn',
    customFont: '',
    fontSize: '14',
    enabled: true  // Default value
  }, function(items) {
    callback(items);
  });
}

function addPersianFont(settings) {
  if (!settings.enabled) return;

  // Add Google Fonts link for built-in fonts
  if (settings.selectedFont === 'Vazirmatn') {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  } else if (settings.selectedFont === 'IRANSans') {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://cdn.jsdelivr.net/gh/rastikerdar/iran-sans-web@latest/iran-sans-web.css';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }

  // Add custom styles
  const style = document.createElement('style');
  const fontFamily = settings.selectedFont === 'custom' ? settings.customFont : settings.selectedFont;
  
  style.textContent = `
    .font-user-message p:lang(fa),
    .font-claude-message p:lang(fa),
    .font-user-message li:lang(fa),
    .font-claude-message li:lang(fa) {
      font-family: '${fontFamily}', 'Tahoma', system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
      font-size: ${settings.fontSize}px !important;
    }
  `;
  document.head.appendChild(style);
}

function enableRTLForPersianText(enabled = true) {
  if (!enabled) return;

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
        const parentList = textEl.closest('ol, ul');
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

// Initialize with settings
function initialize() {
  loadSettings(function(settings) {
    addPersianFont(settings);
    setTimeout(() => enableRTLForPersianText(settings.enabled), 1000);
  });
}

// Run when content changes with debouncing
let timeoutId = null;
const observer = new MutationObserver((mutations) => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  loadSettings(function(settings) {
    timeoutId = setTimeout(() => enableRTLForPersianText(settings.enabled), 100);
  });
});

// Start initialization
initialize();

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'settingsChanged') {
    initialize();
  }
});