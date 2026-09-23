// ===== LingoLink Chrome Extension — Offscreen Audio Capture =====
// Captures the active tab's audio, sends PCM to the backend WebSocket.

const BACKEND_WS = 'wss://ruling-solar-healing-bureau.trycloudflare.com/ws/agent';

let audioContext = null;
let mediaStream = null;
let sourceNode = null;
let workletNode = null;
let ws = null;
let targetLang = 'eng_Latn';
let active = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OFFSCREEN_START') {
    startCapture(message.streamId, message.targetLang)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error('OFFSCREEN_START error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.type === 'OFFSCREEN_STOP') {
    stopCapture();
    sendResponse({ success: true });
    return false;
  }
});

async function startCapture(streamId, lang) {
  targetLang = lang || 'eng_Latn';

  console.log('[LingoLink] Starting capture for tab stream:', streamId);

  // 1. Capture tab audio via the stream ID from the service worker
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });

  console.log('[LingoLink] Got tab audio stream');

  // 2. Create AudioContext at 16kHz (matches Whisper input)
  audioContext = new AudioContext({ sampleRate: 16000 });
  sourceNode = audioContext.createMediaStreamSource(mediaStream);

  // 3. Route the audio back to speakers so the user still hears the tab
  sourceNode.connect(audioContext.destination);

  // 4. Open WebSocket to backend
  connectWebSocket();

  // 5. Load the PCM worklet and start extracting audio
  await audioContext.audioWorklet.addModule('pcm-worklet.js');
  workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

  workletNode.port.onmessage = (event) => {
    if (!active || !ws || ws.readyState !== WebSocket.OPEN) return;

    const float32 = event.data;
    const pcm16 = floatTo16BitPCM(float32);
    const base64 = arrayBufferToBase64(pcm16.buffer);

    ws.send(JSON.stringify({
      type: 'audio_chunk',
      speaker: 'caller',
      audio: base64,
      mime: 'audio/wav'
    }));
  };

  sourceNode.connect(workletNode);
  workletNode.connect(audioContext.destination);
  active = true;

  console.log('[LingoLink] Capture active');
}

function stopCapture() {
  console.log('[LingoLink] Stopping capture');
  active = false;

  if (workletNode) { try { workletNode.disconnect(); } catch {} workletNode = null; }
  if (sourceNode)  { try { sourceNode.disconnect();  } catch {} sourceNode = null; }

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  if (ws) {
    try { ws.close(); } catch {}
    ws = null;
  }
}

function connectWebSocket() {
  console.log('[LingoLink] Connecting to', BACKEND_WS);
  ws = new WebSocket(BACKEND_WS);

  ws.onopen = () => {
    console.log('[LingoLink] WebSocket connected');
    const callId = `ext-${Date.now()}`;
    ws.send(JSON.stringify({ type: 'agent_hello', agent_id: 'chrome-ext' }));
    ws.send(JSON.stringify({
      type: 'call_start',
      call_id: callId,
      target_lang: targetLang
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'transcript') {
        chrome.runtime.sendMessage({
          type: 'SUBTITLE',
          original: data.speaker === 'caller' ? data.text : null,
          translated: data.speaker === 'caller_translated' ? data.text : null
        });
      }
    } catch (e) {
      console.error('[LingoLink] WS parse error', e);
    }
  };

  ws.onerror = (e) => console.error('[LingoLink] WS error', e);
  ws.onclose = () => console.log('[LingoLink] WS closed');
}

function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return out;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}
