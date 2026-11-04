import { db } from "./db";
import type { TrackCardData } from "@/components/track-card";

export const trackInclude = {
  user: { select: { username: true, displayName: true } },
  likes: { select: { userId: true } },
  reposts: { select: { userId: true } },
} as const;

type TrackWithMeta = NonNullable<
  Awaited<ReturnType<typeof db.track.findFirst<{ include: typeof trackInclude }>>>
>;

export function serializeTrack(t: TrackWithMeta, meId?: string | null): TrackCardData {
  return {
    id: t.id,
    title: t.title,
    audioUrl: t.audioUrl,
    artworkUrl: t.artworkUrl,
    duration: t.duration,
    artistName: t.user.displayName,
    artistUsername: t.user.username,
    genre: t.genre,
    bpm: t.bpm,
    playCount: t.playCount,
    likeCount: t.likes.length,
    repostCount: t.reposts.length,
    likedByMe: !!meId && t.likes.some((l) => l.userId === meId),
    repostedByMe: !!meId && t.reposts.some((r) => r.userId === meId),
  };
}

export const postInclude = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true, roles: true } },
  likes: { select: { userId: true } },
  reposts: { select: { userId: true } },
  _count: { select: { comments: true } },
} as const;

export type PostWithMeta = NonNullable<
  Awaited<ReturnType<typeof db.post.findFirst<{ include: typeof postInclude }>>>
>;

export async function getTrackCardById(trackId: string, meId?: string | null) {
  const t = await db.track.findUnique({ where: { id: trackId }, include: trackInclude });
  return t ? serializeTrack(t, meId) : null;
}
