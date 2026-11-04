import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const channel = await db.channel.findUnique({ where: { id } });
  if (!channel) return NextResponse.json({ error: "not found" }, { status: 404 });

  const membership = await db.communityMember.findUnique({
    where: {
      communityId_userId: { communityId: channel.communityId, userId: user.id },
    },
  });
  if (!membership || membership.status !== "ACTIVE")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const since = req.nextUrl.searchParams.get("since");
  const messages = await db.message.findMany({
    where: {
      channelId: id,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    })),
  });
}
