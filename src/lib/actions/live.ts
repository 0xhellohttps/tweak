"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function goLive(formData: FormData) {
  const me = await requireUser();
  const title = String(formData.get("title") ?? "").trim().slice(0, 100) || "untitled set";
  const existing = await db.stream.findFirst({ where: { userId: me.id } });
  if (existing) {
    await db.stream.update({
      where: { id: existing.id },
      data: { title, isLive: true, startedAt: new Date() },
    });
  } else {
    await db.stream.create({
      data: { title, isLive: true, startedAt: new Date(), userId: me.id },
    });
  }
  revalidatePath("/live");
}

export async function endStream() {
  const me = await requireUser();
  await db.stream.updateMany({
    where: { userId: me.id, isLive: true },
    data: { isLive: false },
  });
  revalidatePath("/live");
}
