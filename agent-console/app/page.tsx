'use client';

import { useEffect, useState, useRef } from 'react';
import { Phone, Mic, MicOff, PhoneOff, Activity, Wifi, WifiOff, Send, Users, Clock } from 'lucide-react';

interface TranscriptLine {
  id: string;
  speaker: 'agent' | 'caller';
  text: string;
  timestamp: string;
}

interface CallSession {
  id: string;
  caller: string;
  phone: string;
  status: 'incoming' | 'active' | 'ended';
  startedAt: string;
  language: string;
}

export default function AgentDashboard() {
  const [connected, setConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMsg, setErrorMsg] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

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
              },
            ]);
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
      };
    } catch (err) {
      setConnectionStatus('error');
      setErrorMsg(String(err));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'audio_chunk_start',
            speaker: 'agent',
            mime: 'audio/webm',
          }));
        }
      };

      recorder.start(2000);
      setIsRecording(true);
    } catch (err) {
      setErrorMsg('Microphone access denied: ' + String(err));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  const acceptCall = () => {
    const newCall: CallSession = {
      id: `call-${Date.now()}`,
      caller: 'Test Caller',
      phone: '+256 700 000 000',
      status: 'active',
      startedAt: new Date().toLocaleTimeString(),
      language: 'Swahili',
    };
    setCurrentCall(newCall);
    setTranscripts([]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'call_start', call_id: newCall.id }));
    }
  };

  const endCall = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'call_end', call_id: currentCall?.id }));
    }
    stopRecording();
    setCurrentCall(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center font-bold">
              LL
            </div>
            <div>
              <h1 className="text-xl font-bold">LingoLink Agent Console</h1>
              <p className="text-xs text-white/60">Real-time translation for call centers</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
                  <p>Language: {currentCall.language}</p>
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
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-white/50 text-xs">Transcripts</p>
                <p className="text-2xl font-bold">{transcripts.length}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-white/50 text-xs">Status</p>
                <p className="text-lg font-bold">{currentCall ? 'Active' : 'Idle'}</p>
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
                <p className="text-xs mt-1">Start a call to begin</p>
              </div>
            ) : (
              transcripts.map((line) => (
                <div
                  key={line.id}
                  className={`flex ${line.speaker === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      line.speaker === 'agent'
                        ? 'bg-purple-600/60 rounded-br-sm'
                        : 'bg-white/10 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-xs text-white/50 mb-1">
                      {line.speaker === 'agent' ? 'Agent' : 'Caller'} • {line.timestamp}
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