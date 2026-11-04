import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { postInclude, serializeTrack, trackInclude } from "@/lib/queries";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { tab } = await searchParams;
  const followingOnly = tab === "following";

  const followees = await db.follow.findMany({
    where: { followerId: user.id },
    select: { followeeId: true },
  });
  const followeeIds = followees.map((f) => f.followeeId);

  const posts = await db.post.findMany({
    where: followingOnly ? { userId: { in: [...followeeIds, user.id] } } : {},
    orderBy: { createdAt: "desc" },
    take: 40,
    include: postInclude,
  });

  // hydrate attached tracks
  const trackIds = posts.map((p) => p.trackId).filter((id): id is string => !!id);
  const tracks = trackIds.length
    ? await db.track.findMany({ where: { id: { in: trackIds } }, include: trackInclude })
    : [];
  const trackMap = new Map(tracks.map((t) => [t.id, serializeTrack(t, user.id)]));

  // right rail data
  const [suggested, freshTracks] = await Promise.all([
    db.user.findMany({
      where: {
        id: { notIn: [...followeeIds, user.id] },
        isSuspended: false,
        isPrivate: false,
      },
      orderBy: { followers: { _count: "desc" } },
      take: 5,
      select: { id: true, username: true, displayName: true, avatarUrl: true, roles: true },
    }),
    db.track.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { user: { select: { username: true, displayName: true } } },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-6">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-6">
          <h1 className="tag">01 // FEED</h1>
          <div className="ml-auto flex gap-4">
            <Link
              href="/feed"
              className={`tag ${!followingOnly ? "text-(--accent)" : "hover:text-ink"}`}
            >
              EVERYONE
            </Link>
            <Link
              href="/feed?tab=following"
              className={`tag ${followingOnly ? "text-(--accent)" : "hover:text-ink"}`}
            >
              FOLLOWING
            </Link>
          </div>
        </div>

        <Composer avatarUrl={user.avatarUrl} displayName={user.displayName} />

        <div className="mt-4 space-y-3">
          {posts.length === 0 && (
            <div className="border border-edge bg-panel p-8 text-center">
              <p className="tag">NOTHING HERE YET</p>
              <p className="mt-2 text-sm text-muted">
                {followingOnly
                  ? "Follow some people. The feed follows."
                  : "Be the first transmission."}
              </p>
            </div>
          )}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              track={post.trackId ? trackMap.get(post.trackId) ?? null : null}
              meId={user.id}
            />
          ))}
        </div>
      </div>

      {/* right rail */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="border border-edge bg-panel p-4">
          <div className="tag mb-3">WHO TO FOLLOW</div>
          <div className="space-y-3">
            {suggested.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Link href={`/u/${s.username}`} className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar avatarUrl={s.avatarUrl} name={s.displayName} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{s.displayName}</div>
                    <div className="tag truncate">{s.roles.split(",")[0]}</div>
                  </div>
                </Link>
                <FollowButton userId={s.id} following={false} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border border-edge bg-panel p-4">
          <div className="tag mb-3">FRESH SOUND</div>
          {freshTracks.map((t) => (
            <Link
              key={t.id}
              href={`/u/${t.user.username}`}
              className="mb-2 block text-xs text-muted hover:text-ink"
            >
              <span className="text-ink">{t.title}</span>
              <br />
              <span className="tag">{t.user.displayName}</span>
            </Link>
          ))}
          <Link href="/discover" className="tag mt-2 block text-(--accent) hover:underline">
            MORE →
          </Link>
        </div>
      </aside>
    </div>
  );
}
