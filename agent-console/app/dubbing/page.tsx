'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Film, Upload, ArrowLeft, Download, Languages,
  CheckCircle2, Loader2, AlertTriangle, Play,
} from 'lucide-react';

interface DubbingResult {
  job_id: string;
  source_lang: string;
  target_lang: string;
  source_text: string;
  translated_text: string;
  output_url: string;
  original_url: string;
  latency_seconds: number;
  message: string;
}

export default function DubbingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState('eng_Latn');
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState<DubbingResult | null>(null);
  const [error, setError] = useState('');
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
    { code: 'por_Latn', name: 'Portuguese' },
    { code: 'rus_Cyrl', name: 'Russian' },
  ];

  const startDubbing = async (selectedFile: File) => {
    setError('');
    setResult(null);
    setFile(selectedFile);

    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a video file (MP4, WebM, MOV)');
      return;
    }

    const maxMB = 100;
    if (selectedFile.size > maxMB * 1024 * 1024) {
      setError(`Video too large (max ${maxMB}MB). Yours is ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setProcessing(true);
    setStage('Uploading video...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('target_lang', targetLang);

      const stages = [
        'Uploading video...',
        'Extracting audio track...',
        'Transcribing speech (Whisper)...',
        'Translating text (NLLB)...',
        'Generating dubbed voice (edge-tts)...',
        'Muxing dubbed audio back into video...',
      ];
      let idx = 0;
      const stageTimer = setInterval(() => {
        idx = Math.min(idx + 1, stages.length - 1);
        setStage(stages[idx]);
      }, 8000);

      const res = await fetch(`${API_URL}/dubbing/start`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(stageTimer);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `HTTP ${res.status}`);
      }

      setResult(data);
      setStage('Complete');
    } catch (err) {
      setError(String(err).replace('Error: ', ''));
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) startDubbing(f);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setStage('');
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
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
            ● Working
          </span>
        </div>
        <p className="text-white/60 mb-8">
          Upload a video → auto-transcribe → translate → dub with synthesized voice → download the dubbed result.
        </p>

        {!result && !processing && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Languages size={16} className="text-purple-300" />
              <label className="text-sm text-white/70">Target language</label>
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
              <p className="text-lg font-medium mb-1">Drop a video here</p>
              <p className="text-sm text-white/60">or click to browse — MP4, WebM, MOV (max 100MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) startDubbing(f);
                }}
              />
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-200 flex gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
          </div>
        )}

        {processing && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Loader2 size={48} className="mx-auto text-purple-400 animate-spin mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Dubbing in progress</h2>
            <p className="text-white/60 mb-6">{file?.name}</p>
            <div className="max-w-md mx-auto bg-black/20 rounded-full h-2 overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-sm text-purple-300">{stage}</p>
            <p className="text-xs text-white/40 mt-4">
              Short videos (&lt;1 min) take 1-3 minutes. Longer videos take proportionally longer.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 flex items-center gap-3">
              <CheckCircle2 size={32} className="text-green-400" />
              <div>
                <h2 className="text-xl font-semibold">Dubbed video ready</h2>
                <p className="text-sm text-white/60">
                  Completed in {result.latency_seconds}s
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Play size={16} className="text-purple-300" /> Preview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/60 mb-2">Original</p>
                  <video
                    src={`${API_URL}${result.original_url}`}
                    controls
                    className="w-full rounded-lg bg-black"
                  />
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-2">Dubbed ({result.target_lang})</p>
                  <video
                    src={`${API_URL}${result.output_url}`}
                    controls
                    className="w-full rounded-lg bg-black border-2 border-green-500/30"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-3">Transcription & Translation</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-white/50 mb-1">Original ({result.source_lang}):</p>
                  <p className="bg-black/20 rounded p-3">{result.source_text}</p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Translated ({result.target_lang}):</p>
                  <p className="bg-black/20 rounded p-3">{result.translated_text}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={`${API_URL}${result.output_url}`}
                download={`dubbed_${result.job_id}.mp4`}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download dubbed video
              </a>
              <button
                onClick={reset}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg"
              >
                Dub another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}