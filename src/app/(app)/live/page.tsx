import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { goLive, endStream } from "@/lib/actions/live";
import { timeAgo } from "@/lib/format";

export default async function LivePage() {
  const me = await getCurrentUser();

  const streams = await db.stream.findMany({
    where: { isLive: true },
    include: {
      user: {
        select: { username: true, displayName: true, avatarUrl: true, genres: true, roles: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  const myStream = me ? await db.stream.findFirst({ where: { userId: me.id } }) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="tag">03 // LIVE</h1>
      <p className="display mb-6 mt-1 text-2xl font-bold">Shot from inside it.</p>

      {me && (
        <div className="mb-6 border border-edge bg-panel p-4">
          {myStream?.isLive ? (
            <div className="flex items-center gap-3">
              <span className="live-dot h-2 w-2 bg-siren" />
              <span className="text-sm">
                You are live: <b>{myStream.title}</b>
              </span>
              <form action={endStream} className="ml-auto">
                <button className="cursor-pointer border border-siren px-4 py-1.5 font-mono text-[11px] tracking-[0.15em] text-siren transition hover:bg-siren hover:text-black">
                  END STREAM
                </button>
              </form>
            </div>
          ) : (
            <form action={goLive} className="flex gap-3">
              <input
                name="title"
                placeholder="name your set..."
                maxLength={100}
                className="flex-1 border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
              />
              <button className="cursor-pointer bg-siren px-5 font-mono text-[11px] tracking-[0.2em] text-black transition hover:opacity-80">
                GO LIVE
              </button>
            </form>
          )}
          <p className="tag mt-2">
            MVP: LIVE STATUS + ROOM CHAT. VIDEO/AUDIO BROADCAST HOOKS UP TO RTMP/WEBRTC NEXT.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {streams.length === 0 && (
          <div className="border border-edge bg-panel p-10 text-center md:col-span-2">
            <p className="tag">NOBODY IS LIVE</p>
            <p className="mt-2 text-sm text-muted">The room is dark. For now.</p>
          </div>
        )}
        {streams.map((s) => (
          <Link
            key={s.id}
            href={`/u/${s.user.username}`}
            className="group border border-edge bg-panel transition hover:border-siren"
          >
            <div className="relative flex h-36 items-center justify-center bg-profile-static">
              <Avatar avatarUrl={s.user.avatarUrl} name={s.user.displayName} size={64} />
              <span className="absolute left-3 top-3 flex items-center gap-1.5 bg-siren px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] text-black">
                <span className="live-dot h-1.5 w-1.5 bg-black" /> LIVE
              </span>
              {s.startedAt && (
                <span className="tag absolute right-3 top-3">{timeAgo(s.startedAt)}</span>
              )}
            </div>
            <div className="p-3">
              <div className="truncate text-sm font-medium group-hover:text-siren">{s.title}</div>
              <div className="tag mt-1">
                {s.user.displayName.toUpperCase()}
                {s.user.genres && ` // ${s.user.genres.split(",")[0]?.toUpperCase()}`}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
