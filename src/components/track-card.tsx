"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { usePlayer, type PlayerTrack } from "./player";
import { toggleLike, toggleRepost } from "@/lib/actions/social";
import { formatCount, formatDuration } from "@/lib/format";
import { asset } from "@/lib/assets";

export type TrackCardData = PlayerTrack & {
  genre: string;
  bpm: number | null;
  playCount: number;
  likeCount: number;
  repostCount: number;
  likedByMe: boolean;
  repostedByMe: boolean;
};

// deterministic fake waveform from track id
function useWaveform(id: string, bars = 48) {
  return useMemo(() => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    const out: number[] = [];
    for (let i = 0; i < bars; i++) {
      h = (h * 1103515245 + 12345) | 0;
      const v = Math.abs(h % 100) / 100;
      const raw = 0.2 + 0.8 * (0.5 * v + 0.5 * Math.abs(Math.sin(i * 0.4)));
      out.push(Math.round(raw * 1000) / 1000);
    }
    return out;
  }, [id, bars]);
}

export function TrackCard({
  track,
  queue,
  loggedIn,
}: {
  track: TrackCardData;
  queue?: PlayerTrack[];
  loggedIn: boolean;
}) {
  const { play, current, playing } = usePlayer();
  const [, startTransition] = useTransition();
  const waveform = useWaveform(track.id);
  const isCurrent = current?.id === track.id;

  return (
    <div className="flex gap-3 border border-edge bg-panel p-3">
      <button
        onClick={() => play(track, queue)}
        className="group relative h-20 w-20 shrink-0 cursor-pointer border border-edge"
        aria-label="Play"
      >
        {track.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset(track.artworkUrl)} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-panel2" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-lg opacity-0 transition group-hover:opacity-100">
          {isCurrent && playing ? "❚❚" : "▶"}
        </span>
        {isCurrent && playing && (
          <span className="eq absolute bottom-1 right-1 flex h-3 items-end gap-[2px]">
            <span />
            <span />
            <span />
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{track.title}</div>
            <Link
              href={`/u/${track.artistUsername}`}
              className="text-xs text-muted hover:text-ink"
            >
              {track.artistName}
            </Link>
          </div>
          <span className="tag shrink-0">
            {track.genre && <span className="text-(--accent)">{track.genre}</span>}
            {track.bpm ? ` / ${track.bpm}BPM` : ""}
          </span>
        </div>

        {/* waveform */}
        <button
          onClick={() => play(track, queue)}
          className="mt-2 flex h-8 w-full cursor-pointer items-end gap-[2px]"
          aria-label="Play track"
        >
          {waveform.map((v, i) => (
            <span
              key={i}
              className="flex-1"
              style={{
                height: `${(v * 100).toFixed(1)}%`,
                backgroundColor: isCurrent ? "var(--accent)" : "#3a3a42",
                opacity: isCurrent ? 0.9 : 0.8,
              }}
            />
          ))}
        </button>

        <div className="mt-2 flex items-center gap-4">
          <span className="tag">▶ {formatCount(track.playCount)}</span>
          <span className="tag">{formatDuration(track.duration)}</span>
          {loggedIn && (
            <>
              <button
                onClick={() => startTransition(() => toggleLike({ trackId: track.id }))}
                className={`tag cursor-pointer hover:text-ink ${track.likedByMe ? "text-(--accent)" : ""}`}
              >
                ♥ {formatCount(track.likeCount)}
              </button>
              <button
                onClick={() => startTransition(() => toggleRepost({ trackId: track.id }))}
                className={`tag cursor-pointer hover:text-ink ${track.repostedByMe ? "text-(--accent)" : ""}`}
              >
                ⇄ {formatCount(track.repostCount)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
