import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { Chat, type ChatMessage } from "@/components/chat";
import { joinRoom, leaveRoom, approveMember, createChannel } from "@/lib/actions/rooms";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ch?: string }>;
}) {
  const { slug } = await params;
  const { ch } = await searchParams;
  const me = await getCurrentUser();

  const room = await db.community.findUnique({
    where: { slug },
    include: {
      channels: { orderBy: { position: "asc" } },
      members: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      owner: { select: { username: true } },
    },
  });
  if (!room) notFound();

  const myMembership = me ? room.members.find((m) => m.userId === me.id) : null;
  const isActiveMember = myMembership?.status === "ACTIVE";
  const canMod = isActiveMember && ["OWNER", "ADMIN", "MOD"].includes(myMembership!.role);
  const activeMembers = room.members.filter((m) => m.status === "ACTIVE");
  const pendingMembers = room.members.filter((m) => m.status === "PENDING");

  const channel =
    room.channels.find((c) => c.id === ch) ?? room.channels[0] ?? null;

  let initialMessages: ChatMessage[] = [];
  if (channel && isActiveMember) {
    const msgs = await db.message.findMany({
      where: { channelId: channel.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true } },
      },
    });
    initialMessages = msgs.reverse().map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    }));
  }

  const joinAction = async () => {
    "use server";
    if (!me) redirect("/login");
    await joinRoom(room.id);
  };
  const leaveAction = async () => {
    "use server";
    await leaveRoom(room.id);
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-dvh">
      {/* room header */}
      <div className="flex items-center gap-4 border-b border-edge px-5 py-3">
        <div className="min-w-0">
          <h1 className="display truncate text-lg font-bold">{room.name}</h1>
          <p className="tag truncate">
            {room.isPrivate ? "PRIVATE // " : ""}
            {activeMembers.length} IN HERE // BY @{room.owner.username}
          </p>
        </div>
        <div className="ml-auto">
          {!me ? (
            <Link href="/login" className="tag text-(--accent) hover:underline">
              LOG IN TO JOIN
            </Link>
          ) : !myMembership ? (
            <form action={joinAction}>
              <button className="cursor-pointer border border-(--accent) px-4 py-1.5 font-mono text-[11px] tracking-[0.15em] text-(--accent) transition hover:bg-(--accent) hover:text-black">
                {room.isPrivate ? "REQUEST IN" : "JOIN"}
              </button>
            </form>
          ) : myMembership.status === "PENDING" ? (
            <span className="tag">REQUEST PENDING</span>
          ) : myMembership.role !== "OWNER" ? (
            <form action={leaveAction}>
              <button className="tag cursor-pointer hover:text-siren">LEAVE</button>
            </form>
          ) : (
            <span className="tag text-(--accent)">YOUR ROOM</span>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* channels */}
        <div className="hidden w-44 shrink-0 flex-col border-r border-edge p-3 sm:flex">
          <div className="tag mb-2">CHANNELS</div>
          {room.channels.map((c) => (
            <Link
              key={c.id}
              href={`/rooms/${room.slug}?ch=${c.id}`}
              className={`mb-1 truncate px-2 py-1 font-mono text-[11px] tracking-wide ${
                channel?.id === c.id
                  ? "bg-panel2 text-(--accent)"
                  : "text-muted hover:text-ink"
              }`}
            >
              # {c.name}
            </Link>
          ))}
          {canMod && (
            <form action={createChannel} className="mt-3">
              <input type="hidden" name="communityId" value={room.id} />
              <input
                name="name"
                placeholder="+ new channel"
                maxLength={32}
                className="w-full border border-edge2 bg-void px-2 py-1 font-mono text-[10px] text-muted outline-none focus:border-(--accent)"
              />
            </form>
          )}

          {room.rules && (
            <div className="mt-6">
              <div className="tag mb-1">RULES</div>
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-muted">
                {room.rules}
              </p>
            </div>
          )}
        </div>

        {/* chat */}
        <div className="min-w-0 flex-1 border-r border-edge">
          {!channel ? (
            <p className="tag p-8 text-center">NO CHANNELS</p>
          ) : !isActiveMember ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
              <p className="tag"># {channel.name}</p>
              <p className="text-sm text-muted">
                {room.isPrivate
                  ? "Private room. Request in to read the channels."
                  : "Join the room to read and transmit."}
              </p>
              <p className="display text-xl font-bold">
                {room.description || "You'll find out inside."}
              </p>
            </div>
          ) : (
            <Chat channelId={channel.id} initialMessages={initialMessages} />
          )}
        </div>

        {/* members */}
        <div className="hidden w-48 shrink-0 overflow-y-auto p-3 lg:block">
          <div className="tag mb-2">MEMBERS — {activeMembers.length}</div>
          {activeMembers.slice(0, 40).map((m) => (
            <Link
              key={m.userId}
              href={`/u/${m.user.username}`}
              className="mb-1.5 flex items-center gap-2 text-xs text-muted hover:text-ink"
            >
              <Avatar avatarUrl={m.user.avatarUrl} name={m.user.displayName} size={22} />
              <span className="truncate">{m.user.displayName}</span>
              {m.role !== "MEMBER" && (
                <span className="tag ml-auto shrink-0 text-(--accent)">{m.role}</span>
              )}
            </Link>
          ))}

          {canMod && pendingMembers.length > 0 && (
            <>
              <div className="tag mb-2 mt-5">PENDING — {pendingMembers.length}</div>
              {pendingMembers.map((m) => {
                const approve = async () => {
                  "use server";
                  await approveMember(room.id, m.userId);
                };
                return (
                  <div key={m.userId} className="mb-1.5 flex items-center gap-2 text-xs">
                    <Avatar avatarUrl={m.user.avatarUrl} name={m.user.displayName} size={22} />
                    <span className="truncate text-muted">{m.user.displayName}</span>
                    <form action={approve} className="ml-auto">
                      <button className="tag cursor-pointer text-(--accent) hover:underline">
                        OK
                      </button>
                    </form>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
