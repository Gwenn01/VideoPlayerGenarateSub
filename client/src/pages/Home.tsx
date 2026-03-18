import { useState, useRef, useCallback, useEffect } from "react";
import { translateVideo } from "../services/translateApi";
import {
  Upload,
  Video,
  Check,
  Loader2,
  Info,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";

const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const STEPS = [
  {
    label: "Extracting audio",
    desc: "Separating audio track from video",
    duration: 4000,
  },
  {
    label: "Transcribing",
    desc: "Whisper AI is analysing speech",
    duration: 8000,
  },
  {
    label: "Generating subtitles",
    desc: "Building SRT timestamp file",
    duration: 5000,
  },
  {
    label: "Finalizing",
    desc: "Attaching subtitles to video",
    duration: 4000,
  },
];

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0); // 0-100 per step
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<{
    subtitle: string;
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Elapsed timer
  useEffect(() => {
    if (loading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const formatElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startStepProgress = (idx: number) => {
    if (progressRef.current) clearInterval(progressRef.current);
    setStepProgress(0);
    const duration = STEPS[idx]?.duration ?? 4000;
    const tick = 80;
    const increment = (tick / duration) * 100;

    progressRef.current = setInterval(() => {
      setStepProgress((p) => {
        if (p >= 95) {
          if (progressRef.current) clearInterval(progressRef.current);
          return 95; // Hold at 95% until confirmed
        }
        return Math.min(p + increment, 95);
      });
    }, tick);
  };

  const advanceStep = useCallback((currentIdx: number) => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEPS.length) {
      setStepIndex(nextIdx);
      startStepProgress(nextIdx);

      stepTimeoutRef.current = setTimeout(() => {
        advanceStep(nextIdx);
      }, STEPS[nextIdx].duration + 500);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) {
      setFile(dropped);
      setError(null);
      setSuccess(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError(null);
      setSuccess(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    setStepIndex(0);
    startStepProgress(0);

    stepTimeoutRef.current = setTimeout(() => {
      advanceStep(0);
    }, STEPS[0].duration + 500);

    try {
      const response = await translateVideo(file); // make sure this returns the data
      setResult(response); //  save subtitle path

      // Finish cleanly
      if (progressRef.current) clearInterval(progressRef.current);
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
      setStepProgress(100);
      setStepIndex(STEPS.length - 1);
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      if (progressRef.current) clearInterval(progressRef.current);
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.subtitle], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitle.srt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const overallProgress =
    ((stepIndex + stepProgress / 100) / STEPS.length) * 100;

  return (
    <div
      className="min-h-full bg-[#080612] p-8"
      style={{ fontFamily: "'DM Sans', 'Outfit', sans-serif" }}
    >
      {/* Ambient glow background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(109,40,217,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              style={{ boxShadow: "0 0 8px rgba(167,139,250,0.9)" }}
            />
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "rgba(167,139,250,0.7)" }}
            >
              Subtitle Generator
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-white tracking-tight leading-tight">
            Generate Subtitles
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Drop a video — Whisper will transcribe it automatically
          </p>
        </div>

        {/* ── DROP ZONE ── */}
        {!loading && (
          <div
            className="relative rounded-2xl transition-all duration-300"
            style={{
              border: dragging
                ? "1px solid rgba(139,92,246,0.6)"
                : file
                  ? "1px solid rgba(16,185,129,0.25)"
                  : "1px dashed rgba(255,255,255,0.1)",
              background: dragging
                ? "rgba(139,92,246,0.06)"
                : file
                  ? "rgba(16,185,129,0.04)"
                  : "rgba(255,255,255,0.02)",
              boxShadow: dragging ? "0 0 40px rgba(139,92,246,0.08)" : "none",
              cursor: file ? "default" : "pointer",
            }}
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

            {/* Empty state */}
            {!file && (
              <div className="p-14 text-center space-y-5">
                <div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(109,40,217,0.12)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    color: "#a78bfa",
                  }}
                >
                  <Upload size={24} strokeWidth={1.4} />
                </div>
                <div>
                  <p className="text-white/70 font-medium text-sm">
                    Drop your video here
                  </p>
                  <p className="text-white/25 text-xs mt-1">
                    MP4 · MOV · AVI · MKV &nbsp;·&nbsp; up to 500 MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-xs px-5 py-2 rounded-lg transition-colors"
                  style={{
                    color: "#a78bfa",
                    border: "1px solid rgba(139,92,246,0.3)",
                    background: "rgba(139,92,246,0.08)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(139,92,246,0.16)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(139,92,246,0.08)")
                  }
                >
                  Browse file
                </button>
              </div>
            )}

            {/* File selected */}
            {file && (
              <div className="p-5 flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    color: "#34d399",
                  }}
                >
                  <Video size={20} strokeWidth={1.5} />
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
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#f87171")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
                  }
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PROCESSING PANEL ── */}
        {loading && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(139,92,246,0.2)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {/* Top bar: file info + elapsed */}
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full bg-violet-400"
                  style={{
                    animation: "pulse 1.5s ease-in-out infinite",
                    boxShadow: "0 0 8px rgba(167,139,250,0.8)",
                  }}
                />
                <span className="text-xs text-white/50 truncate max-w-[200px]">
                  {file?.name}
                </span>
              </div>
              <span
                className="text-xs tabular-nums"
                style={{
                  color: "rgba(167,139,250,0.6)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>

            {/* Overall progress bar */}
            <div
              className="h-0.5 w-full"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${overallProgress}%`,
                  background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                  boxShadow: "0 0 10px rgba(167,139,250,0.5)",
                }}
              />
            </div>

            {/* Steps */}
            <div className="p-5 space-y-1">
              {STEPS.map((step, i) => {
                const isDone = i < stepIndex;
                const isActive = i === stepIndex;
                const isPending = i > stepIndex;

                return (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3.5 transition-all duration-300"
                    style={{
                      background: isActive
                        ? "rgba(139,92,246,0.07)"
                        : "transparent",
                      border: isActive
                        ? "1px solid rgba(139,92,246,0.15)"
                        : "1px solid transparent",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Status indicator */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                        style={{
                          background: isDone
                            ? "rgba(16,185,129,0.15)"
                            : isActive
                              ? "rgba(139,92,246,0.2)"
                              : "rgba(255,255,255,0.05)",
                          border: isDone
                            ? "1px solid rgba(16,185,129,0.4)"
                            : isActive
                              ? "1px solid rgba(139,92,246,0.4)"
                              : "1px solid rgba(255,255,255,0.08)",
                          color: isDone
                            ? "#34d399"
                            : isActive
                              ? "#a78bfa"
                              : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {isDone ? (
                          <Check size={12} strokeWidth={2.5} />
                        ) : isActive ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <span
                            className="text-[9px] font-semibold"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {i + 1}
                          </span>
                        )}
                      </div>

                      {/* Labels */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium transition-colors"
                          style={{
                            color: isDone
                              ? "rgba(255,255,255,0.4)"
                              : isActive
                                ? "rgba(255,255,255,0.9)"
                                : "rgba(255,255,255,0.25)",
                          }}
                        >
                          {step.label}
                        </p>
                        {isActive && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "rgba(167,139,250,0.6)" }}
                          >
                            {step.desc}
                          </p>
                        )}
                      </div>

                      {/* Per-step progress % or done badge */}
                      {isDone && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            color: "#34d399",
                            background: "rgba(16,185,129,0.1)",
                          }}
                        >
                          Done
                        </span>
                      )}
                      {isActive && (
                        <span
                          className="text-[10px] tabular-nums"
                          style={{
                            color: "rgba(167,139,250,0.7)",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {Math.round(stepProgress)}%
                        </span>
                      )}
                    </div>

                    {/* Per-step progress bar */}
                    {isActive && (
                      <div
                        className="mt-3 h-0.5 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${stepProgress}%`,
                            background:
                              "linear-gradient(90deg, #6d28d9, #a78bfa)",
                            boxShadow: "0 0 8px rgba(167,139,250,0.4)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer hint */}
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
            >
              <Info size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
              <p
                className="text-[11px]"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Large files may take several minutes · Keep this tab open
              </p>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {success && result && (
          <div className="mt-4 rounded-xl overflow-hidden bg-emerald-500/5 border border-emerald-500/20">
            {/* Header */}
            <div className="px-4 py-3.5 flex items-center gap-3">
              <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Subtitles generated
                </p>
                <p className="text-xs text-emerald-400/50 mt-0.5">
                  Your file is ready to download
                </p>
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >
              <Download size={15} />
              Download .srt
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div
            className="mt-4 rounded-xl px-4 py-3.5 flex items-start gap-3"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <AlertCircle
              size={18}
              style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <p className="text-sm font-medium text-red-400">
                Something went wrong
              </p>
              <p className="text-xs text-red-400/60 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── SUBMIT BUTTON ── */}
        {file && !loading && (
          <button
            onClick={handleSubmit}
            className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
              boxShadow: "0 0 24px rgba(109,40,217,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 36px rgba(109,40,217,0.5)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 24px rgba(109,40,217,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Generate Subtitles
          </button>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default Home;
