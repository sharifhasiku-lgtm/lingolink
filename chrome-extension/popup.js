const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const targetLang = document.getElementById('targetLang');

chrome.storage.local.get(['lingolink_target_lang'], (result) => {
  if (result.lingolink_target_lang) {
    targetLang.value = result.lingolink_target_lang;
  }
});

targetLang.addEventListener('change', () => {
  chrome.storage.local.set({ lingolink_target_lang: targetLang.value });
});

startBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    statusEl.textContent = 'No active tab';
    return;
  }

  const url = tab.url || '';
  const isSupported = url.includes('meet.google.com') ||
                     url.includes('zoom.us') ||
                     url.includes('teams.microsoft.com') ||
                     url.includes('teams.live.com');

  if (!isSupported) {
    statusEl.textContent = 'Not a supported meeting page';
    return;
  }

  startBtn.disabled = true;
  statusEl.textContent = 'Starting...';

  chrome.runtime.sendMessage(
    {
      type: 'START_CAPTURE',
      tabId: tab.id,
      targetLang: targetLang.value
    },
    (response) => {
      if (response?.success) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        statusEl.textContent = '🔴 Captions active';
      } else {
        startBtn.disabled = false;
        statusEl.textContent = response?.error || 'Failed to start';
      }
    }
  );
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' }, () => {
    startBtn.disabled = false;
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    statusEl.textContent = 'Stopped';
  });
});