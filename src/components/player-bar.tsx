"use client";

import Link from "next/link";
import { usePlayer } from "./player";
import { formatDuration } from "@/lib/format";

export function PlayerBar() {
  const { current, playing, progress, duration, toggle, seek, next, prev } = usePlayer();

  if (!current) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-edge bg-panel/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        {/* artwork + title */}
        <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none md:w-64">
          {current.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.artworkUrl}
              alt=""
              className="h-10 w-10 shrink-0 border border-edge object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 border border-edge bg-panel2" />
          )}
          <div className="min-w-0">
            <div className="truncate text-xs font-medium">{current.title}</div>
            <Link
              href={`/u/${current.artistUsername}`}
              className="truncate text-[11px] text-muted hover:text-ink"
            >
              {current.artistName}
            </Link>
          </div>
          {playing && (
            <span className="eq ml-1 flex h-3 items-end gap-[2px]">
              <span />
              <span />
              <span />
            </span>
          )}
        </div>

        {/* transport */}
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="tag cursor-pointer hover:text-ink"
            aria-label="Previous"
          >
            ◂◂
          </button>
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-9 w-9 cursor-pointer items-center justify-center border border-edge2 bg-panel2 text-ink hover:border-(--accent) hover:text-(--accent)"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button onClick={next} className="tag cursor-pointer hover:text-ink" aria-label="Next">
            ▸▸
          </button>
        </div>

        {/* seek */}
        <div className="hidden flex-1 items-center gap-3 md:flex">
          <span className="tag w-10 text-right">{formatDuration(progress)}</span>
          <input
            type="range"
            className="seek w-full"
            min={0}
            max={duration || current.duration || 1}
            step={0.5}
            value={Math.min(progress, duration || current.duration || 1)}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <span className="tag w-10">{formatDuration(duration || current.duration)}</span>
        </div>
      </div>
    </div>
  );
}
