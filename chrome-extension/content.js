let overlayContainer = null;
let originalEl = null;
let translatedEl = null;
let hideTimeout = null;

function createOverlay() {
  if (overlayContainer) return;

  overlayContainer = document.createElement('div');
  overlayContainer.id = 'lingolink-subtitle-overlay';
  overlayContainer.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2147483647;
    max-width: 80vw;
    padding: 12px 24px;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    color: white;
    text-align: center;
    pointer-events: none;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    transition: opacity 0.3s ease;
    opacity: 0;
  `;

  originalEl = document.createElement('div');
  originalEl.style.cssText = `
    font-size: 16px;
    opacity: 0.75;
    margin-bottom: 4px;
  `;

  translatedEl = document.createElement('div');
  translatedEl.style.cssText = `
    font-size: 20px;
    font-weight: 600;
    color: #88ff88;
  `;

  overlayContainer.appendChild(originalEl);
  overlayContainer.appendChild(translatedEl);
  document.body.appendChild(overlayContainer);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'RENDER_SUBTITLE') {
    createOverlay();

    if (message.original) {
      originalEl.textContent = message.original;
    }
    if (message.translated) {
      translatedEl.textContent = message.translated;
    }

    overlayContainer.style.opacity = '1';

    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (overlayContainer) overlayContainer.style.opacity = '0';
    }, 8000);
  }
});

window.addEventListener('beforeunload', () => {
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
});