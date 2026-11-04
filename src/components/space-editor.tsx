"use client";

import { useState } from "react";
import { updateCustomization, setAvatar, setCover } from "@/lib/actions/profile";
import { ACCENTS, PROFILE_BGS, PROFILE_SECTIONS } from "@/lib/constants";

type TrackOpt = { id: string; title: string };
type FriendOpt = { id: string; username: string; displayName: string };

async function upload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("upload failed");
  return (await res.json()).url as string;
}

export function SpaceEditor({
  initial,
  tracks,
  followingUsers,
}: {
  initial: {
    accentColor: string;
    profileBg: string;
    sectionOrder: string;
    featuredTrackId: string | null;
    topFriends: string;
  };
  tracks: TrackOpt[];
  followingUsers: FriendOpt[];
}) {
  const [accent, setAccent] = useState(initial.accentColor);
  const [bg, setBg] = useState(initial.profileBg);
  const [order, setOrder] = useState(
    initial.sectionOrder.split(",").filter((s) => s in PROFILE_SECTIONS)
  );
  const [featured, setFeatured] = useState(initial.featuredTrackId ?? "");
  const [friends, setFriends] = useState(initial.topFriends.split(",").filter(Boolean));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const accentHex = ACCENTS[accent]?.hex ?? ACCENTS.acid.hex;

  return (
    <form
      action={async (fd) => {
        await updateCustomization(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-6 border border-edge bg-panel p-6"
      style={{ "--accent": accentHex } as React.CSSProperties}
    >
      <input type="hidden" name="accentColor" value={accent} />
      <input type="hidden" name="profileBg" value={bg} />
      <input type="hidden" name="sectionOrder" value={order.join(",")} />
      <input type="hidden" name="featuredTrackId" value={featured} />
      <input type="hidden" name="topFriends" value={friends.join(",")} />

      {/* images */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="tag mb-1 block">AVATAR</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await setAvatar(await upload(f));
            }}
            className="w-full border border-edge2 bg-void px-2 py-1.5 text-[11px] text-muted file:mr-2 file:cursor-pointer file:border-0 file:bg-panel2 file:px-2 file:py-1 file:font-mono file:text-[10px] file:text-ink"
          />
        </div>
        <div>
          <label className="tag mb-1 block">COVER</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await setCover(await upload(f));
            }}
            className="w-full border border-edge2 bg-void px-2 py-1.5 text-[11px] text-muted file:mr-2 file:cursor-pointer file:border-0 file:bg-panel2 file:px-2 file:py-1 file:font-mono file:text-[10px] file:text-ink"
          />
        </div>
      </div>

      {/* accent */}
      <div>
        <label className="tag mb-2 block">ACCENT</label>
        <div className="flex gap-2">
          {Object.entries(ACCENTS).map(([key, a]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAccent(key)}
              className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] ${
                accent === key ? "border-ink text-ink" : "border-edge2 text-muted"
              }`}
            >
              <span className="h-3 w-3" style={{ background: a.hex }} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* background */}
      <div>
        <label className="tag mb-2 block">BACKGROUND</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PROFILE_BGS).map(([key, b]) => (
            <button
              key={key}
              type="button"
              onClick={() => setBg(key)}
              className={`bg-profile-${key} h-16 w-24 border font-mono text-[9px] tracking-[0.15em] ${
                bg === key ? "border-(--accent) text-(--accent)" : "border-edge2 text-muted"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* section order — drag and drop */}
      <div>
        <label className="tag mb-2 block">SECTION ORDER // DRAG TO REARRANGE</label>
        <ul className="space-y-1">
          {order.map((key, i) => (
            <li
              key={key}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx === null || dragIdx === i) return;
                const next = [...order];
                const [moved] = next.splice(dragIdx, 1);
                next.splice(i, 0, moved);
                setOrder(next);
                setDragIdx(null);
              }}
              className="flex cursor-grab items-center gap-3 border border-edge2 bg-void px-3 py-2 font-mono text-[11px] tracking-[0.15em] text-muted active:cursor-grabbing"
            >
              <span className="text-dim">⠿</span>
              <span className="text-dim">{String(i + 1).padStart(2, "0")} //</span>
              {PROFILE_SECTIONS[key]}
            </li>
          ))}
        </ul>
      </div>

      {/* featured track */}
      <div>
        <label className="tag mb-1 block">FEATURED TRACK</label>
        <select
          value={featured}
          onChange={(e) => setFeatured(e.target.value)}
          className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
        >
          <option value="">—</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* top friends */}
      <div>
        <label className="tag mb-2 block">TOP FRIENDS // MAX 8 // FROM PEOPLE YOU FOLLOW</label>
        <div className="flex flex-wrap gap-2">
          {followingUsers.map((f) => {
            const on = friends.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  setFriends(
                    on
                      ? friends.filter((id) => id !== f.id)
                      : friends.length < 8
                        ? [...friends, f.id]
                        : friends
                  )
                }
                className={`border px-3 py-1 font-mono text-[10px] tracking-[0.15em] ${
                  on ? "border-(--accent) text-(--accent)" : "border-edge2 text-muted"
                }`}
              >
                {on ? `★ ${friends.indexOf(f.id) + 1} ` : ""}
                {f.displayName}
              </button>
            );
          })}
          {followingUsers.length === 0 && (
            <p className="text-xs text-muted">Follow people first.</p>
          )}
        </div>
      </div>

      <button className="w-full cursor-pointer bg-(--accent) py-2.5 font-mono text-xs tracking-[0.2em] text-black transition hover:opacity-80">
        {saved ? "SAVED ✓" : "SAVE SPACE"}
      </button>
    </form>
  );
}
