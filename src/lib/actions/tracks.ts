"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function createTrack(formData: FormData) {
  const me = await requireUser();
  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  const description = String(formData.get("description") ?? "").trim().slice(0, 1000);
  const genre = String(formData.get("genre") ?? "").trim().toLowerCase().slice(0, 32);
  const bpmRaw = Number(formData.get("bpm"));
  const audioUrl = String(formData.get("audioUrl") ?? "");
  const artworkUrl = String(formData.get("artworkUrl") ?? "") || null;
  const duration = Math.max(0, Math.floor(Number(formData.get("duration")) || 0));

  if (!title || !audioUrl.startsWith("/uploads/")) return;
  if (artworkUrl && !artworkUrl.startsWith("/uploads/")) return;

  const track = await db.track.create({
    data: {
      title,
      description,
      genre,
      bpm: Number.isFinite(bpmRaw) && bpmRaw > 0 ? Math.floor(bpmRaw) : null,
      audioUrl,
      artworkUrl,
      duration,
      userId: me.id,
    },
  });

  // auto-post the drop to the feed, X-style
  await db.post.create({
    data: { body: `dropped a new track`, userId: me.id, trackId: track.id },
  });

  redirect(`/u/${me.username}`);
}

export async function deleteTrack(trackId: string) {
  const me = await requireUser();
  await db.track.deleteMany({ where: { id: trackId, userId: me.id } });
  revalidatePath(`/u/${me.username}`);
}
