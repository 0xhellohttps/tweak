import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.track
    .update({ where: { id }, data: { playCount: { increment: 1 } } })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}
