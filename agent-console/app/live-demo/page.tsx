'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Radio, Users, ArrowLeft, AlertTriangle, Key, Mic } from 'lucide-react';

export default function LiveDemoPage() {
  const [roomId, setRoomId] = useState('');
  const [configError, setConfigError] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live'>('idle');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const joinRoom = async () => {
    setConfigError('');
    if (!roomId.trim()) {
      setConfigError('Enter a room ID or create a new one');
      return;
    }

    setStatus('connecting');
    try {
      const res = await fetch(`${API_URL}/live/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId }),
      });

      const data = await res.json();

      if (res.status === 501) {
        setStatus('idle');
        setConfigError(
          data.detail ||
            'Live translation backend not configured. Requires OpenAI Realtime API or similar.'
        );
        return;
      }

      if (!res.ok) throw new Error(data.detail || 'Failed to join');
      setStatus('live');
    } catch (err) {
      setStatus('idle');
      setConfigError(String(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Radio className="text-red-400" />
          <h1 className="text-3xl font-bold">Live Translation Demo</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
            Skeleton — not configured
          </span>
        </div>
        <p className="text-white/60 mb-8">
          Two browsers join the same room. Both speak. Each side hears the other
          translated in real-time. Requires a realtime translation API.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={16} /> Join a Room
          </h2>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Room code (e.g. abc-123)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={() => setRoomId(Math.random().toString(36).slice(2, 8))}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
            >
              Generate
            </button>
          </div>

          <button
            onClick={joinRoom}
            disabled={status !== 'idle'}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Mic size={16} />
            {status === 'connecting'
              ? 'Connecting...'
              : status === 'live'
              ? 'Connected'
              : 'Join Room'}
          </button>

          {configError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-200 flex gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>{configError}</div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Key size={16} /> What This Needs
          </h2>
          <ul className="text-sm text-white/70 space-y-2 list-disc list-inside">
            <li>
              <strong>OpenAI Realtime API</strong> — ~$0.06/min per side, low latency (&lt;800ms)
            </li>
            <li>
              <strong>Alternative:</strong> extend your existing Whisper streaming pipeline with
              WebRTC peer connections
            </li>
            <li>
              <strong>WebRTC signaling server</strong> — for peer discovery
            </li>
            <li>
              <strong>Ephemeral token endpoint</strong> — for secure API key distribution
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}