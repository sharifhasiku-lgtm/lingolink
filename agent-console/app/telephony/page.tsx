'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, PhoneCall, PhoneOff, AlertTriangle, ArrowLeft, Key } from 'lucide-react';

interface CallState {
  status: 'idle' | 'dialing' | 'ringing' | 'active' | 'ended';
  number: string;
  provider: 'twilio' | 'livekit' | 'sip';
}

export default function TelephonyPage() {
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    number: '',
    provider: 'twilio',
  });
  const [configError, setConfigError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const placeCall = async () => {
    setConfigError('');
    if (!callState.number.trim()) {
      setConfigError('Enter a phone number in E.164 format (e.g. +256700000000)');
      return;
    }

    setCallState((s) => ({ ...s, status: 'dialing' }));

    try {
      const res = await fetch(`${API_URL}/telephony/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: callState.number,
          provider: callState.provider,
        }),
      });

      const data = await res.json();

      if (res.status === 501) {
        setCallState((s) => ({ ...s, status: 'idle' }));
        setConfigError(
          data.detail ||
            'Telephony provider not configured. See setup instructions below.'
        );
        return;
      }

      if (!res.ok) throw new Error(data.detail || 'Call failed');
      setCallState((s) => ({ ...s, status: 'active' }));
    } catch (err) {
      setCallState((s) => ({ ...s, status: 'idle' }));
      setConfigError(String(err));
    }
  };

  const hangUp = async () => {
    try {
      await fetch(`${API_URL}/telephony/hangup`, { method: 'POST' });
    } catch {}
    setCallState((s) => ({ ...s, status: 'ended' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <PhoneCall className="text-purple-400" />
          <h1 className="text-3xl font-bold">Telephony</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
            Skeleton — not configured
          </span>
        </div>
        <p className="text-white/60 mb-8">
          Place real phone calls via Twilio, LiveKit, or a SIP trunk. Requires a provider
          account.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Place a Call</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <select
              value={callState.provider}
              onChange={(e) =>
                setCallState((s) => ({ ...s, provider: e.target.value as any }))
              }
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="twilio">Twilio</option>
              <option value="livekit">LiveKit</option>
              <option value="sip">SIP Trunk</option>
            </select>

            <input
              type="tel"
              placeholder="+256700000000"
              value={callState.number}
              onChange={(e) => setCallState((s) => ({ ...s, number: e.target.value }))}
              className="md:col-span-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={placeCall}
              disabled={callState.status !== 'idle'}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Phone size={16} />
              {callState.status === 'dialing'
                ? 'Dialing...'
                : callState.status === 'active'
                ? 'In Call'
                : 'Place Call'}
            </button>

            {callState.status === 'active' && (
              <button
                onClick={hangUp}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg flex items-center gap-2"
              >
                <PhoneOff size={16} /> Hang Up
              </button>
            )}
          </div>

          {configError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-200 flex gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>{configError}</div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Key size={16} /> Setup Instructions
          </h2>

          <div className="space-y-4 text-sm text-white/70">
            <div>
              <h3 className="text-white font-medium mb-1">Option A — Twilio (real phones)</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Sign up at twilio.com (free $15 trial credit)</li>
                <li>Buy a phone number ($1/month)</li>
                <li>Copy your Account SID, Auth Token, and phone number</li>
                <li>Add them to your backend <code className="bg-black/40 px-1">.env</code> file</li>
                <li>Set webhook URL to <code className="bg-black/40 px-1">https://your-backend/twilio/voice</code></li>
              </ol>
            </div>

            <div>
              <h3 className="text-white font-medium mb-1">Option B — LiveKit (WebRTC)</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Sign up at livekit.io (free tier available)</li>
                <li>Create a project, copy the API key and secret</li>
                <li>Add to backend .env</li>
              </ol>
            </div>

            <div>
              <h3 className="text-white font-medium mb-1">Option C — SIP Trunk</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Get SIP credentials from your telco provider</li>
                <li>Configure the SIP bridge in the backend</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}