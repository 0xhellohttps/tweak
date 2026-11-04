"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function toggleFollow(userId: string) {
  const me = await requireUser();
  if (me.id === userId) return;
  const existing = await db.follow.findUnique({
    where: { followerId_followeeId: { followerId: me.id, followeeId: userId } },
  });
  if (existing) {
    await db.follow.delete({
      where: { followerId_followeeId: { followerId: me.id, followeeId: userId } },
    });
  } else {
    await db.follow.create({ data: { followerId: me.id, followeeId: userId } });
  }
  revalidatePath("/feed");
}

export async function toggleLike(target: { trackId?: string; postId?: string }) {
  const me = await requireUser();
  const where = target.trackId
    ? { userId_trackId: { userId: me.id, trackId: target.trackId } }
    : { userId_postId: { userId: me.id, postId: target.postId! } };
  const existing = await db.like.findUnique({ where });
  if (existing) await db.like.delete({ where: { id: existing.id } });
  else
    await db.like.create({
      data: { userId: me.id, trackId: target.trackId, postId: target.postId },
    });
  revalidatePath("/feed");
}

export async function toggleRepost(target: { trackId?: string; postId?: string }) {
  const me = await requireUser();
  const where = target.trackId
    ? { userId_trackId: { userId: me.id, trackId: target.trackId } }
    : { userId_postId: { userId: me.id, postId: target.postId! } };
  const existing = await db.repost.findUnique({ where });
  if (existing) await db.repost.delete({ where: { id: existing.id } });
  else
    await db.repost.create({
      data: { userId: me.id, trackId: target.trackId, postId: target.postId },
    });
  revalidatePath("/feed");
}

export async function createPost(formData: FormData) {
  const me = await requireUser();
  const body = String(formData.get("body") ?? "").trim().slice(0, 500);
  const trackId = String(formData.get("trackId") ?? "") || null;
  if (!body) return;
  await db.post.create({ data: { body, userId: me.id, trackId } });
  revalidatePath("/feed");
}

export async function deletePost(postId: string) {
  const me = await requireUser();
  await db.post.deleteMany({ where: { id: postId, userId: me.id } });
  revalidatePath("/feed");
}

export async function addComment(formData: FormData) {
  const me = await requireUser();
  const body = String(formData.get("body") ?? "").trim().slice(0, 500);
  const trackId = String(formData.get("trackId") ?? "") || undefined;
  const postId = String(formData.get("postId") ?? "") || undefined;
  if (!body || (!trackId && !postId)) return;
  await db.comment.create({ data: { body, userId: me.id, trackId, postId } });
  if (trackId) revalidatePath(`/t/${trackId}`);
  revalidatePath("/feed");
}
