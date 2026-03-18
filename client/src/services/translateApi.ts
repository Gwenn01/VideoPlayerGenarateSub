const BASE_URL = "http://localhost:8000/api";

// ── Transcribe video ─────────────────────────────────────────────────────────

export const translateVideo = async (file: File) => {
  const formData = new FormData();
  formData.append("video", file);

  const res = await fetch(`${BASE_URL}/translate/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Transcription failed");
  }

  return res.json();
};
