import { useState, useRef, useCallback } from "react";
import { translateVideo } from "../services/translateApi";
import type { TranslationResult } from "../types/translation";

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const ms = Math.floor((seconds % 1) * 100)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}.${ms}`;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

type Tab = "preview" | "transcript" | "segments";

const STEPS = [
  "Extracting audio",
  "Transcribing",
  "Generating subtitles",
  "Finalizing",
];

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("preview");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) {
      setFile(dropped);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 4000);

    try {
      const data: TranslationResult = await translateVideo(file);
      clearInterval(interval);
      setResult(data);
      setStepIndex(STEPS.length - 1);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#0d0b1e] p-8 font-['Outfit',sans-serif]">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Generate Subtitles
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Upload a video and Whisper will transcribe it automatically
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`relative border rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
            dragging
              ? "border-violet-400 bg-violet-500/5 shadow-[0_0_30px_rgba(139,92,246,0.1)]"
              : "border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {!file ? (
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="text-white/70 font-medium text-sm">
                  Drop your video here
                </p>
                <p className="text-white/30 text-xs mt-1">
                  MP4, MOV, AVI, MKV · up to 500MB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="text-xs text-violet-400 border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 rounded-lg hover:bg-violet-500/20 transition-colors"
              >
                Browse file
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/85 font-medium text-sm truncate">
                  {file.name}
                </p>
                <p className="text-white/35 text-xs mt-0.5">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                onClick={handleRemove}
                className="text-xs text-white/30 hover:text-white/60 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Generate Button */}
        {file && !loading && !result && (
          <button
            onClick={handleSubmit}
            className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_28px_rgba(124,58,237,0.45)]"
          >
            Generate Subtitles
          </button>
        )}

        {/* Loading Steps */}
        {loading && (
          <div className="mt-6 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
            <p className="text-white/30 text-[10px] tracking-[0.15em] uppercase font-medium mb-5">
              Processing
            </p>
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-all duration-300 ${
                      i < stepIndex
                        ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                        : i === stepIndex
                          ? "bg-violet-500/20 border border-violet-400/50"
                          : "bg-white/3 border border-white/8"
                    }`}
                  >
                    {i < stepIndex ? (
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    ) : i === stepIndex ? (
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    ) : null}
                  </div>
                  <span
                    className={`text-sm transition-colors duration-300 ${
                      i < stepIndex
                        ? "text-emerald-400"
                        : i === stepIndex
                          ? "text-white/85 font-medium"
                          : "text-white/25"
                    }`}
                  >
                    {step}
                    {i === stepIndex ? "..." : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            {/* Success banner */}
            <div className="bg-emerald-500/5 border-b border-emerald-500/10 px-5 py-3 flex items-center gap-2">
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              <span className="text-emerald-400 text-xs font-medium">
                Subtitles generated successfully
              </span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/6 px-5">
              {(["preview", "transcript", "segments"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 mr-6 text-xs font-medium capitalize tracking-wide border-b-2 transition-colors ${
                    activeTab === tab
                      ? "text-violet-400 border-violet-400"
                      : "text-white/30 border-transparent hover:text-white/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Preview */}
              {activeTab === "preview" && (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full rounded-xl bg-black"
                  >
                    <source src={result.video_url} />
                    <track
                      src={result.subtitle_url}
                      kind="subtitles"
                      srcLang="en"
                      label="English"
                      default
                    />
                  </video>
                  <div className="flex gap-3">
                    <a
                      href={result.subtitle_url}
                      download
                      className="flex-1 py-2.5 text-center text-xs font-medium text-violet-300 bg-violet-500/10 border border-violet-500/25 rounded-xl hover:bg-violet-500/20 transition-colors"
                    >
                      ↓ Download .srt
                    </a>
                    <a
                      href={result.video_url}
                      download
                      className="flex-1 py-2.5 text-center text-xs font-medium text-white/40 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors"
                    >
                      ↓ Download video
                    </a>
                  </div>
                </div>
              )}

              {/* Transcript */}
              {activeTab === "transcript" && (
                <p className="text-white/65 text-sm leading-relaxed font-light">
                  {result.text}
                </p>
              )}

              {/* Segments */}
              {activeTab === "segments" && (
                <div className="space-y-2">
                  {result.segments.map((seg) => (
                    <div
                      key={seg.id}
                      className="flex gap-3 items-start bg-white/[0.02] rounded-lg px-3 py-2.5"
                    >
                      <span className="font-mono text-[10px] text-violet-400 whitespace-nowrap pt-0.5 shrink-0">
                        {formatTime(seg.start)} → {formatTime(seg.end)}
                      </span>
                      <span className="text-white/65 text-sm leading-relaxed">
                        {seg.text.trim()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
