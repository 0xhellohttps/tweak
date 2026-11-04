"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ACCENTS, PROFILE_BGS, PROFILE_SECTIONS, ACCOUNT_ROLES } from "@/lib/constants";

function clean(v: FormDataEntryValue | null, max = 300): string {
  return String(v ?? "").trim().slice(0, max);
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();

  const roles = formData
    .getAll("roles")
    .map(String)
    .filter((r) => (ACCOUNT_ROLES as readonly string[]).includes(r));

  await db.user.update({
    where: { id: user.id },
    data: {
      displayName: clean(formData.get("displayName"), 48) || user.displayName,
      bio: clean(formData.get("bio"), 1200),
      location: clean(formData.get("location"), 64),
      statusLine: clean(formData.get("statusLine"), 80),
      genres: clean(formData.get("genres"), 200).toLowerCase(),
      website: clean(formData.get("website")),
      instagram: clean(formData.get("instagram"), 64),
      soundcloud: clean(formData.get("soundcloud"), 64),
      bandcamp: clean(formData.get("bandcamp"), 64),
      youtube: clean(formData.get("youtube"), 64),
      spotify: clean(formData.get("spotify"), 128),
      isPrivate: formData.get("isPrivate") === "on",
      roles: roles.length ? roles.join(",") : user.roles,
    },
  });

  revalidatePath(`/u/${user.username}`);
  revalidatePath("/settings/profile");
}

export async function updateCustomization(formData: FormData) {
  const user = await requireUser();

  const accent = String(formData.get("accentColor") ?? "");
  const bg = String(formData.get("profileBg") ?? "");
  const order = String(formData.get("sectionOrder") ?? "");
  const featuredTrackId = String(formData.get("featuredTrackId") ?? "") || null;
  const topFriends = String(formData.get("topFriends") ?? "");

  const validSections = Object.keys(PROFILE_SECTIONS);
  const sections = order
    .split(",")
    .map((s) => s.trim())
    .filter((s) => validSections.includes(s));
  // ensure every section present exactly once
  for (const s of validSections) if (!sections.includes(s)) sections.push(s);

  if (featuredTrackId) {
    const track = await db.track.findUnique({ where: { id: featuredTrackId } });
    if (!track) return;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      accentColor: accent in ACCENTS ? accent : user.accentColor,
      profileBg: bg in PROFILE_BGS ? bg : user.profileBg,
      sectionOrder: sections.join(","),
      featuredTrackId,
      topFriends: topFriends
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8)
        .join(","),
    },
  });

  revalidatePath(`/u/${user.username}`);
  revalidatePath("/settings/profile");
}

export async function setAvatar(url: string) {
  const user = await requireUser();
  if (!url.startsWith("/uploads/")) return;
  await db.user.update({ where: { id: user.id }, data: { avatarUrl: url } });
  revalidatePath(`/u/${user.username}`);
}

export async function setCover(url: string) {
  const user = await requireUser();
  if (!url.startsWith("/uploads/")) return;
  await db.user.update({ where: { id: user.id }, data: { coverUrl: url } });
  revalidatePath(`/u/${user.username}`);
}
