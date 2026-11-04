import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { COMMUNITY_NOUN_PLURAL } from "@/lib/constants";
import { formatCount } from "@/lib/format";

export default async function RoomsPage() {
  const user = await getCurrentUser();

  const rooms = await db.community.findMany({
    orderBy: { members: { _count: "desc" } },
    take: 50,
    include: {
      _count: { select: { members: true } },
      owner: { select: { username: true, displayName: true } },
      members: user ? { where: { userId: user.id } } : false,
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-baseline justify-between">
        <h1 className="tag">04 // THE {COMMUNITY_NOUN_PLURAL.toUpperCase()}</h1>
        {user && (
          <Link href="/rooms/new" className="tag text-(--accent) hover:underline">
            + OPEN A ROOM
          </Link>
        )}
      </div>
      <p className="display mb-6 mt-1 text-2xl font-bold">Find your people.</p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rooms.length === 0 && (
          <div className="border border-edge bg-panel p-8 text-center md:col-span-2">
            <p className="tag">NO ROOMS YET. OPEN THE FIRST ONE.</p>
          </div>
        )}
        {rooms.map((room) => {
          const isMember = Array.isArray(room.members) && room.members.length > 0;
          return (
            <Link
              key={room.id}
              href={`/rooms/${room.slug}`}
              className="group border border-edge bg-panel p-4 transition hover:border-(--accent)"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="display text-lg font-bold group-hover:text-(--accent)">
                  {room.name}
                </div>
                {room.isPrivate && <span className="tag">🔒 PRIVATE</span>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {room.description || "No description. You'll find out inside."}
              </p>
              <div className="mt-3 flex items-center gap-4">
                <span className="tag">{formatCount(room._count.members)} IN HERE</span>
                <span className="tag">BY @{room.owner.username}</span>
                {isMember && <span className="tag ml-auto text-(--accent)">JOINED</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
