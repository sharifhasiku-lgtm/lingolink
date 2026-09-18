'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Phone, Mic, MicOff, PhoneOff, Activity, Wifi, WifiOff,
  Send, Users, Clock, Languages, Volume2, VolumeX, Square,
} from 'lucide-react';

// ---- Audio helpers ----

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * 2;
  const wavBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return wavBuffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

// ---- Types ----

interface TranscriptLine {
  id: string;
  speaker: 'agent' | 'caller' | 'agent_translated' | 'caller_translated' | 'system';
  text: string;
  timestamp: string;
  chunk?: number;
}

interface CallSession {
  id: string;
  caller: string;
  phone: string;
  status: 'incoming' | 'active' | 'ended';
  startedAt: string;
  language: string;
}

// Which voices read translations, per target language
const VOICE_MAP: Record<string, string[]> = {
  eng_Latn: ['en-US-AriaNeural', 'en-US-JennyNeural', 'en-GB-SoniaNeural'],
  swh_Latn: ['sw-KE-ZuriNeural'],
  fra_Latn: ['fr-FR-DeniseNeural', 'fr-FR-HenriNeural'],
  deu_Latn: ['de-DE-KatjaNeural', 'de-DE-ConradNeural'],
  spa_Latn: ['es-ES-ElviraNeural', 'es-MX-DaliaNeural'],
  arb_Arab: ['ar-SA-ZariyahNeural'],
  zho_Hans: ['zh-CN-XiaoxiaoNeural'],
  hin_Deva: ['hi-IN-SwaraNeural'],
};

const NLLB_LANG_TO_EDGE: Record<string, string> = {
  eng_Latn: 'en-US',
  swh_Latn: 'sw-KE',
  fra_Latn: 'fr-FR',
  deu_Latn: 'de-DE',
  spa_Latn: 'es-ES',
  arb_Arab: 'ar-SA',
  zho_Hans: 'zh-CN',
  hin_Deva: 'hi-IN',
};

export default function AgentDashboard() {
  const [connected, setConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMsg, setErrorMsg] = useState('');
  const [targetLang, setTargetLang] = useState('eng_Latn');
  const [chunkCount, setChunkCount] = useState(0);

  // Phase 3 state
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceName, setVoiceName] = useState('en-US-AriaNeural');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

  const LANGS = [
    { code: 'eng_Latn', name: 'English' },
    { code: 'swh_Latn', name: 'Swahili' },
    { code: 'fra_Latn', name: 'French' },
    { code: 'spa_Latn', name: 'Spanish' },
    { code: 'deu_Latn', name: 'German' },
    { code: 'arb_Arab', name: 'Arabic' },
    { code: 'zho_Hans', name: 'Chinese' },
    { code: 'hin_Deva', name: 'Hindi' },
  ];

  // Auto-update voice when target language changes
  useEffect(() => {
    const voices = VOICE_MAP[targetLang];
    if (voices && voices.length > 0) {
      setVoiceName(voices[0]);
    }
  }, [targetLang]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // ---- Speech queue ----
  const speakNext = () => {
    if (!ttsEnabled) return;
    if (isSpeakingRef.current) return;
    if (speechQueueRef.current.length === 0) return;

    const text = speechQueueRef.current.shift();
    if (!text) return;

    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = NLLB_LANG_TO_EDGE[targetLang] || 'en-US';
    utterance.lang = langCode;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const matching = voices.find(
      (v) => v.name === voiceName || v.lang === langCode
    );
    if (matching) utterance.voice = matching;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      speakNext();
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      speakNext();
    };

    window.speechSynthesis.speak(utterance);
  };

  const enqueueSpeech = (text: string) => {
    if (!ttsEnabled) return;
    speechQueueRef.current.push(text);
    speakNext();
  };

  const stopSpeaking = () => {
    speechQueueRef.current = [];
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  };

  // ---- WebSocket ----
  const connectWebSocket = () => {
    setConnectionStatus('connecting');
    setErrorMsg('');
    try {
      const ws = new WebSocket(`${WS_URL}/ws/agent`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        setConnected(true);
        ws.send(JSON.stringify({ type: 'agent_hello', agent_id: 'agent-001' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript') {
            setTranscripts((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                speaker: data.speaker || 'caller',
                text: data.text,
                timestamp: new Date().toLocaleTimeString(),
                chunk: data.chunk,
              },
            ]);
            if (data.chunk) setChunkCount(data.chunk);

            // Phase 3: play translated bubbles out loud
            if (
              (data.speaker === 'caller_translated' ||
                data.speaker === 'agent_translated') &&
              data.text
            ) {
              enqueueSpeech(data.text);
            }
          } else if (data.type === 'system') {
            setTranscripts((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                speaker: 'system',
                text: data.text,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          } else if (data.type === 'error') {
            setErrorMsg(data.message);
          }
        } catch (err) {
          console.error('Message parse error:', err);
        }
      };

      ws.onerror = () => {
        setConnectionStatus('error');
        setErrorMsg('WebSocket connection failed. Is the backend running?');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setConnected(false);
        stopSpeaking();
      };
    } catch (err) {
      setConnectionStatus('error');
      setErrorMsg(String(err));
    }
  };

  // ---- Recording ----
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      const recordedChunks: Float32Array[] = [];

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        recordedChunks.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      recorderIntervalRef.current = setInterval(async () => {
        if (recordedChunks.length === 0) return;

        const totalLen = recordedChunks.reduce((sum, c) => sum + c.length, 0);
        const merged = new Float32Array(totalLen);
        let offset = 0;
        for (const c of recordedChunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        recordedChunks.length = 0;

        const audioBuffer = audioCtx.createBuffer(1, merged.length, 16000);
        audioBuffer.getChannelData(0).set(merged);

        const wavArrayBuffer = audioBufferToWav(audioBuffer);
        const base64 = arrayBufferToBase64(wavArrayBuffer);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'audio_chunk',
              speaker: 'caller',
              audio: base64,
              mime: 'audio/wav',
            })
          );
        }
      }, 4000);

      setIsRecording(true);
    } catch (err) {
      setErrorMsg('Microphone access denied: ' + String(err));
    }
  };

  const stopRecording = () => {
    if (recorderIntervalRef.current) {
      clearInterval(recorderIntervalRef.current);
      recorderIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const acceptCall = () => {
    const newCall: CallSession = {
      id: `call-${Date.now()}`,
      caller: 'Test Caller',
      phone: '+256 700 000 000',
      status: 'active',
      startedAt: new Date().toLocaleTimeString(),
      language: 'Auto-detect',
    };
    setCurrentCall(newCall);
    setTranscripts([]);
    setChunkCount(0);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'call_start',
        call_id: newCall.id,
        target_lang: targetLang,
      }));
    }
  };

  const endCall = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'call_end', call_id: currentCall?.id }));
    }
    stopRecording();
    stopSpeaking();
    setCurrentCall(null);
  };

  const speakerLabel = (speaker: string) => {
    if (speaker === 'agent') return 'Agent';
    if (speaker === 'caller') return 'Caller';
    if (speaker === 'agent_translated') return 'Agent (translated)';
    if (speaker === 'caller_translated') return 'Caller (translated)';
    return 'System';
  };

  const speakerBubble = (speaker: string) => {
    if (speaker === 'agent') return 'bg-purple-600/60 rounded-br-sm';
    if (speaker === 'agent_translated') return 'bg-purple-900/60 border border-purple-400 rounded-br-sm';
    if (speaker === 'caller') return 'bg-white/10 rounded-bl-sm';
    if (speaker === 'caller_translated') return 'bg-emerald-900/40 border border-emerald-400 rounded-bl-sm';
    return 'bg-yellow-900/30 text-yellow-100 border border-yellow-600';
  };

  const isAgentSide = (speaker: string) => speaker.startsWith('agent');
  const isSystem = (speaker: string) => speaker === 'system';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center font-bold">
              LL
            </div>
            <div>
              <h1 className="text-xl font-bold">LingoLink Agent Console</h1>
              <p className="text-xs text-white/60">Real-time transcription + spoken translation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Target language */}
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-1.5">
              <Languages size={14} className="text-purple-300" />
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                disabled={!!currentCall}
                className="bg-transparent text-sm focus:outline-none disabled:opacity-50"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code} className="text-black">
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice selector */}
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-1.5">
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="bg-transparent text-xs focus:outline-none max-w-[160px]"
              >
                {(VOICE_MAP[targetLang] || []).map((v) => (
                  <option key={v} value={v} className="text-black">
                    {v.split('-').slice(-1)[0].replace('Neural', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Mute toggle */}
            <button
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                if (ttsEnabled) stopSpeaking();
              }}
              title={ttsEnabled ? 'Mute translation audio' : 'Unmute translation audio'}
              className={`p-2 rounded-lg ${ttsEnabled ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}
            >
              {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Stop current speech */}
            <button
              onClick={stopSpeaking}
              disabled={!isSpeaking}
              title="Stop current playback"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30"
            >
              <Square size={16} />
            </button>

            {/* Connection */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                connectionStatus === 'connected'
                  ? 'bg-green-500/20 text-green-300'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : connectionStatus === 'error'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-gray-500/20 text-gray-300'
              }`}
            >
              {connectionStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="capitalize">{connectionStatus}</span>
            </div>
            {!connected ? (
              <button
                onClick={connectWebSocket}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium"
              >
                Connect
              </button>
            ) : (
              <button
                onClick={() => wsRef.current?.close()}
                className="px-4 py-2 bg-red-600/80 hover:bg-red-500 rounded-lg text-sm font-medium"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
        <section className="lg:col-span-1 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
              Current Call
            </h2>
            {currentCall ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">{currentCall.caller}</p>
                    <p className="text-xs text-white/60">{currentCall.phone}</p>
                  </div>
                </div>
                <div className="text-xs text-white/60 space-y-1">
                  <p className="flex items-center gap-2">
                    <Clock size={12} /> Started: {currentCall.startedAt}
                  </p>
                  <p>Target: {LANGS.find((l) => l.code === targetLang)?.name}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition ${
                      isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
                    }`}
                  >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                    {isRecording ? 'Stop Mic' : 'Start Mic'}
                  </button>
                  <button
                    onClick={endCall}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg flex items-center justify-center"
                  >
                    <PhoneOff size={16} />
                  </button>
                </div>
                {isRecording && (
                  <div className="text-xs text-green-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    Listening... WAV chunks every 4s
                  </div>
                )}
                {isSpeaking && (
                  <div className="text-xs text-purple-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                    Playing translated audio...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Phone size={40} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/50 text-sm mb-4">No active call</p>
                <button
                  onClick={acceptCall}
                  disabled={!connected}
                  className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
                >
                  Simulate Incoming Call
                </button>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
              Session Stats
            </h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-white/50 text-xs">Lines</p>
                <p className="text-xl font-bold">{transcripts.length}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-white/50 text-xs">Chunks</p>
                <p className="text-xl font-bold">{chunkCount}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-white/50 text-xs">Audio</p>
                <p className="text-base font-bold">
                  {ttsEnabled ? (isSpeaking ? 'Playing' : 'On') : 'Muted'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[calc(100vh-10rem)]">
          <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity size={16} className="text-purple-400" />
              Live Transcript
            </h2>
            <button
              onClick={() => setTranscripts([])}
              className="text-xs text-white/60 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {transcripts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/30">
                <Users size={48} className="mb-3" />
                <p className="text-sm">Transcripts will appear here</p>
                <p className="text-xs mt-1">Start a call, then click "Start Mic"</p>
              </div>
            ) : (
              transcripts.map((line) => (
                <div
                  key={line.id}
                  className={`flex ${isSystem(line.speaker) ? 'justify-center' : isAgentSide(line.speaker) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${speakerBubble(line.speaker)}`}>
                    <p className="text-xs text-white/60 mb-1">
                      {speakerLabel(line.speaker)} • {line.timestamp}
                      {line.chunk ? ` • chunk ${line.chunk}` : ''}
                    </p>
                    <p className="text-sm">{line.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message (coming soon)..."
                disabled
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm disabled:cursor-not-allowed"
              />
              <button disabled className="px-4 py-2 bg-white/10 rounded-lg disabled:cursor-not-allowed">
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {errorMsg && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm max-w-md">
          {errorMsg}
        </div>
      )}
    </div>
  );
}