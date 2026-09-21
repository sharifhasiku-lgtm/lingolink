'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Film, Upload, ArrowLeft, AlertTriangle, Key, Download, Languages } from 'lucide-react';

interface DubbingJob {
  id: string;
  videoName: string;
  status: 'queued' | 'transcribing' | 'translating' | 'dubbing' | 'muxing' | 'ready' | 'error';
  progress: number;
  error?: string;
  outputUrl?: string;
}

export default function DubbingPage() {
  const [job, setJob] = useState<DubbingJob | null>(null);
  const [targetLang, setTargetLang] = useState('eng_Latn');
  const [configError, setConfigError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

  const handleFile = async (file: File) => {
    setConfigError('');
    if (!file.type.startsWith('video/')) {
      setConfigError('Please drop a video file (MP4, WebM, MOV)');
      return;
    }

    const newJob: DubbingJob = {
      id: `${Date.now()}`,
      videoName: file.name,
      status: 'queued',
      progress: 0,
    };
    setJob(newJob);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_lang', targetLang);

      const res = await fetch(`${API_URL}/dubbing/start`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.status === 501) {
        setJob(null);
        setConfigError(
          data.detail ||
            'Dubbing backend not configured. Requires WhisperX + voice cloning TTS + FFmpeg pipeline.'
        );
        return;
      }

      if (!res.ok) throw new Error(data.detail || 'Dubbing failed');
      setJob({ ...newJob, status: 'ready', outputUrl: data.output_url, progress: 100 });
    } catch (err) {
      setJob((j) => (j ? { ...j, status: 'error', error: String(err) } : null));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const statusLabel = (status: DubbingJob['status']) => {
    const map: Record<DubbingJob['status'], string> = {
      queued: 'Queued',
      transcribing: 'Transcribing (WhisperX)...',
      translating: 'Translating (NLLB)...',
      dubbing: 'Generating speech (edge-tts)...',
      muxing: 'Muxing audio + video (FFmpeg)...',
      ready: 'Ready to download',
      error: 'Error',
    };
    return map[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Film className="text-blue-400" />
          <h1 className="text-3xl font-bold">Video Dubbing Studio</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
            Skeleton — not configured
          </span>
        </div>
        <p className="text-white/60 mb-8">
          Drop a video → auto-transcribe → translate → dub with synthesized voice → download
          a dubbed video. Requires a full pipeline on the backend.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Languages size={16} className="text-purple-300" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
              dragging
                ? 'border-purple-400 bg-purple-500/10'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <Upload size={40} className="mx-auto text-white/40 mb-4" />
            <p className="text-lg font-medium mb-1">Drop video here</p>
            <p className="text-sm text-white/60">or click to browse (MP4, WebM, MOV)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {configError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-200 flex gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>{configError}</div>
            </div>
          )}

          {job && (
            <div className="mt-6 bg-black/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium truncate">{job.videoName}</p>
                <span className="text-xs text-white/60">{statusLabel(job.status)}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              {job.status === 'ready' && job.outputUrl && (
                <a
                  href={job.outputUrl}
                  download
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm"
                >
                  <Download size={14} /> Download dubbed video
                </a>
              )}
              {job.status === 'error' && (
                <p className="text-xs text-red-300 mt-2">{job.error}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Key size={16} /> What the Backend Needs
          </h2>
          <ul className="text-sm text-white/70 space-y-2 list-disc list-inside">
            <li>
              <code className="bg-black/40 px-1">ffmpeg</code> — extract audio, mux back
              (already installed in your Docker image)
            </li>
            <li>
              <strong>WhisperX</strong> — word-level timestamps for accurate dubbing alignment
            </li>
            <li>
              <strong>NLLB-200</strong> — you already have this ✅
            </li>
            <li>
              <strong>Voice cloning TTS</strong> — Coqui XTTS or edge-tts (basic) to speak the
              translation
            </li>
            <li>
              <strong>Optional: lip-sync</strong> — Wav2Lip or SadTalker for mouth alignment
            </li>
          </ul>
          <p className="text-xs text-white/50 mt-4">
            This one is <strong>achievable today</strong> using your existing Whisper + NLLB +
            edge-tts stack. No paid accounts needed.
          </p>
        </div>
      </div>
    </div>
  );
}
