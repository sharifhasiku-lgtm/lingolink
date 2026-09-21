'use client';

import Link from 'next/link';

export default function Home() {
  const cards = [
    {
      href: '/agent',
      title: '🎙️ Agent Console',
      desc: 'Live call transcription + spoken translation (working)',
      status: 'working',
    },
    {
      href: '/telephony',
      title: '📞 Telephony (WebRTC/SIP)',
      desc: 'Real phone calls via Twilio, LiveKit, or SIP trunk',
      status: 'skeleton',
    },
    {
      href: '/live-demo',
      title: '🔴 Live Translation Demo',
      desc: 'Two browsers, real-time two-way translated audio',
      status: 'skeleton',
    },
    {
      href: '/dubbing',
      title: '🎬 Video Dubbing Studio',
      desc: 'Drag-and-drop video → transcribe → translate → dub',
      status: 'skeleton',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-2xl font-bold mb-4">
            LL
          </div>
          <h1 className="text-4xl font-bold mb-3">LingoLink Studio</h1>
          <p className="text-white/60">Translation tools for agents, callers, and creators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold">{card.title}</h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    card.status === 'working'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {card.status === 'working' ? '● Working' : '○ Skeleton'}
                </span>
              </div>
              <p className="text-white/60 text-sm">{card.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white/60">
          <h3 className="text-white font-semibold mb-2">ℹ️ Status</h3>
          <p>
            Agent Console is fully working (Whisper + NLLB + edge-tts). The other three
            routes are skeletons — every backend call returns{" "}
            <code className="bg-black/40 px-1 rounded">501 Not Implemented</code> until
            you sign up for the required services (Twilio, OpenAI Realtime, LiveKit).
          </p>
        </div>
      </div>
    </div>
  );
}