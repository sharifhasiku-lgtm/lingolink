const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

let creatingOffscreen;

async function hasOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
  });
  return contexts.length > 0;
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) return;
  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }
  creatingOffscreen = chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['USER_MEDIA'],
    justification: 'Capture tab audio for real-time translation'
  });
  await creatingOffscreen;
  creatingOffscreen = null;
}

async function closeOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_CAPTURE') {
    handleStartCapture(message.tabId, message.targetLang)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'STOP_CAPTURE') {
    handleStopCapture()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'SUBTITLE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'RENDER_SUBTITLE',
          original: message.original,
          translated: message.translated
        });
      }
    });
    return false;
  }
});

async function handleStartCapture(tabId, targetLang) {
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId
  });

  await setupOffscreenDocument();

  await chrome.runtime.sendMessage({
    type: 'OFFSCREEN_START',
    streamId,
    targetLang
  });
}

async function handleStopCapture() {
  await chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP' });
  await closeOffscreenDocument();
}

chrome.tabs.onRemoved.addListener(() => {
  closeOffscreenDocument().catch(() => {});
});