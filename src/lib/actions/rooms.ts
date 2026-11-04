"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/format";

export async function createRoom(formData: FormData) {
  const me = await requireUser();
  const name = String(formData.get("name") ?? "").trim().slice(0, 48);
  const description = String(formData.get("description") ?? "").trim().slice(0, 500);
  const isPrivate = formData.get("isPrivate") === "on";
  if (!name) return;

  let slug = slugify(name);
  if (!slug) return;
  const taken = await db.community.findUnique({ where: { slug } });
  if (taken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const room = await db.community.create({
    data: {
      name,
      slug,
      description,
      isPrivate,
      ownerId: me.id,
      members: { create: { userId: me.id, role: "OWNER" } },
      channels: {
        create: [
          { name: "general", kind: "TEXT", position: 0 },
          { name: "tracks", kind: "TEXT", position: 1 },
        ],
      },
    },
  });

  redirect(`/rooms/${room.slug}`);
}

export async function joinRoom(communityId: string) {
  const me = await requireUser();
  const room = await db.community.findUnique({ where: { id: communityId } });
  if (!room) return;
  await db.communityMember.upsert({
    where: { communityId_userId: { communityId, userId: me.id } },
    create: {
      communityId,
      userId: me.id,
      status: room.isPrivate ? "PENDING" : "ACTIVE",
    },
    update: {},
  });
  revalidatePath(`/rooms/${room.slug}`);
  revalidatePath("/rooms");
}

export async function leaveRoom(communityId: string) {
  const me = await requireUser();
  const room = await db.community.findUnique({ where: { id: communityId } });
  if (!room || room.ownerId === me.id) return;
  await db.communityMember.deleteMany({ where: { communityId, userId: me.id } });
  revalidatePath(`/rooms/${room.slug}`);
  revalidatePath("/rooms");
}

export async function approveMember(communityId: string, userId: string) {
  const me = await requireUser();
  const myMembership = await db.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: me.id } },
  });
  if (!myMembership || !["OWNER", "ADMIN", "MOD"].includes(myMembership.role)) return;
  await db.communityMember.update({
    where: { communityId_userId: { communityId, userId } },
    data: { status: "ACTIVE" },
  });
  const room = await db.community.findUnique({ where: { id: communityId } });
  if (room) revalidatePath(`/rooms/${room.slug}`);
}

export async function createChannel(formData: FormData) {
  const me = await requireUser();
  const communityId = String(formData.get("communityId") ?? "");
  const name = slugify(String(formData.get("name") ?? "")).slice(0, 32);
  if (!name) return;
  const membership = await db.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: me.id } },
  });
  if (!membership || !["OWNER", "ADMIN", "MOD"].includes(membership.role)) return;
  const count = await db.channel.count({ where: { communityId } });
  await db.channel.create({ data: { name, communityId, position: count } });
  const room = await db.community.findUnique({ where: { id: communityId } });
  if (room) revalidatePath(`/rooms/${room.slug}`);
}

export async function sendMessage(formData: FormData) {
  const me = await requireUser();
  const channelId = String(formData.get("channelId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 1000);
  if (!body || !channelId) return;

  const channel = await db.channel.findUnique({
    where: { id: channelId },
    include: { community: true },
  });
  if (!channel) return;
  const membership = await db.communityMember.findUnique({
    where: {
      communityId_userId: { communityId: channel.communityId, userId: me.id },
    },
  });
  if (!membership || membership.status !== "ACTIVE") return;

  await db.message.create({ data: { body, channelId, userId: me.id } });
}
