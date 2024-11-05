// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const fontSelect = document.getElementById('fontSelect');
    const fontSizeSelect = document.getElementById('fontSize');
    const preview = document.getElementById('preview');
    const enableToggle = document.getElementById('enableToggle');
  
    // Load saved settings
    chrome.storage.sync.get({
      selectedFont: 'Vazirmatn',
      fontSize: '14',
      enabled: true,
      customFont: ''
    }, function(items) {
      fontSelect.value = items.selectedFont;
      fontSizeSelect.value = items.fontSize;
      enableToggle.checked = items.enabled;
      updatePreviewFont(items.selectedFont);
      updatePreviewSize(items.fontSize);
    });
  
    // Handle enable/disable toggle
    enableToggle.addEventListener('change', function() {
      const enabled = this.checked;
      chrome.storage.sync.set({ enabled: enabled }, function() {
        notifyContentScript();
      });
    });
  
    // Handle font selection
    fontSelect.addEventListener('change', function() {
      const selectedFont = this.value;
      chrome.storage.sync.set({ selectedFont: selectedFont }, function() {
        if (selectedFont === 'custom') {
          const customFont = prompt('نام فونت دلخواه را وارد کنید:');
          if (customFont) {
            chrome.storage.sync.set({ customFont: customFont }, notifyContentScript);
            updatePreviewFont(customFont);
          }
        } else {
          notifyContentScript();
        }
      });
      updatePreviewFont(selectedFont);
    });
  
    // Handle font size selection
    fontSizeSelect.addEventListener('change', function() {
      const fontSize = this.value;
      chrome.storage.sync.set({ fontSize: fontSize }, function() {
        notifyContentScript();
      });
      updatePreviewSize(fontSize);
    });
  
    function updatePreviewFont(font) {
      preview.style.fontFamily = `${font}, system-ui`;
    }
  
    function updatePreviewSize(size) {
      preview.style.fontSize = `${size}px`;
    }
  
    function notifyContentScript() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'settingsChanged'});
      });
    }
  });