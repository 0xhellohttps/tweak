"use client";

import { useState } from "react";
import { createTrack } from "@/lib/actions/tracks";
import { GENRES } from "@/lib/constants";

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error((await res.json()).error ?? "upload failed");
  return (await res.json()).url as string;
}

function audioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration || 0));
    });
    audio.addEventListener("error", () => resolve(0));
  });
}

export default function UploadPage() {
  const [audioUrl, setAudioUrl] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [busy, setBusy] = useState<"audio" | "art" | null>(null);
  const [error, setError] = useState("");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="tag">05 // DROP A TRACK</h1>
      <p className="display mb-6 mt-1 text-2xl font-bold">If you made it, it belongs here.</p>

      <form action={createTrack} className="space-y-5 border border-edge bg-panel p-6">
        <div>
          <label className="tag mb-1 block">AUDIO FILE *</label>
          <input
            type="file"
            accept="audio/*"
            required={!audioUrl}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy("audio");
              setError("");
              try {
                const [url, d] = await Promise.all([uploadFile(f), audioDuration(f)]);
                setAudioUrl(url);
                setDuration(d);
              } catch (err) {
                setError(err instanceof Error ? err.message : "upload failed");
              } finally {
                setBusy(null);
              }
            }}
            className="w-full border border-edge2 bg-void px-3 py-2 text-xs text-muted file:mr-3 file:cursor-pointer file:border-0 file:bg-(--accent) file:px-3 file:py-1 file:font-mono file:text-[10px] file:text-black"
          />
          {busy === "audio" && <p className="tag mt-1 text-(--accent)">UPLOADING...</p>}
          {audioUrl && <p className="tag mt-1 text-(--accent)">✓ AUDIO READY</p>}
        </div>

        <div>
          <label className="tag mb-1 block">ARTWORK</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy("art");
              setError("");
              try {
                setArtworkUrl(await uploadFile(f));
              } catch (err) {
                setError(err instanceof Error ? err.message : "upload failed");
              } finally {
                setBusy(null);
              }
            }}
            className="w-full border border-edge2 bg-void px-3 py-2 text-xs text-muted file:mr-3 file:cursor-pointer file:border-0 file:bg-panel2 file:px-3 file:py-1 file:font-mono file:text-[10px] file:text-ink"
          />
          {artworkUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artworkUrl} alt="" className="mt-2 h-24 w-24 border border-edge object-cover" />
          )}
        </div>

        <input type="hidden" name="audioUrl" value={audioUrl} />
        <input type="hidden" name="artworkUrl" value={artworkUrl} />
        <input type="hidden" name="duration" value={duration} />

        <div>
          <label className="tag mb-1 block">TITLE *</label>
          <input
            name="title"
            required
            maxLength={100}
            className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="tag mb-1 block">GENRE</label>
            <select
              name="genre"
              className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
            >
              <option value="">—</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="tag mb-1 block">BPM</label>
            <input
              name="bpm"
              type="number"
              min={40}
              max={300}
              className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
            />
          </div>
        </div>

        <div>
          <label className="tag mb-1 block">NOTES</label>
          <textarea
            name="description"
            rows={3}
            maxLength={1000}
            className="w-full resize-none border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
          />
        </div>

        {error && <p className="text-xs text-siren">{error}</p>}

        <button
          disabled={!audioUrl || busy !== null}
          className="w-full cursor-pointer bg-(--accent) py-2.5 font-mono text-xs tracking-[0.2em] text-black transition hover:opacity-80 disabled:opacity-40"
        >
          DROP IT
        </button>
      </form>
    </div>
  );
}
