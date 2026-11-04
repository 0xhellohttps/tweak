import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { TrackCard } from "@/components/track-card";
import { PostCard } from "@/components/post-card";
import { ACCENTS, PROFILE_SECTIONS, COMMUNITY_NOUN_PLURAL } from "@/lib/constants";
import { postInclude, serializeTrack, trackInclude } from "@/lib/queries";
import { formatCount } from "@/lib/format";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const me = await getCurrentUser();

  const user = await db.user.findUnique({
    where: { username },
    include: {
      tracks: { include: trackInclude, orderBy: { createdAt: "desc" }, take: 20 },
      posts: { include: postInclude, orderBy: { createdAt: "desc" }, take: 20 },
      memberships: {
        where: { status: "ACTIVE" },
        include: { community: { select: { name: true, slug: true, description: true } } },
        take: 8,
      },
      _count: { select: { followers: true, following: true } },
      followers: me ? { where: { followerId: me.id }, select: { followerId: true } } : false,
    },
  });

  if (!user || user.isSuspended) notFound();

  const isMe = me?.id === user.id;
  const accent = ACCENTS[user.accentColor]?.hex ?? ACCENTS.acid.hex;
  const isPrivateToMe = user.isPrivate && !isMe;

  const trackCards = user.tracks.map((t) => serializeTrack(t, me?.id));
  const featuredTrack = user.featuredTrackId
    ? trackCards.find((t) => t.id === user.featuredTrackId) ?? null
    : null;

  const friendIds = user.topFriends.split(",").filter(Boolean);
  const friends = friendIds.length
    ? await db.user.findMany({
        where: { id: { in: friendIds } },
        select: { id: true, username: true, displayName: true, avatarUrl: true, roles: true },
      })
    : [];
  const orderedFriends = friendIds
    .map((id) => friends.find((f) => f.id === id))
    .filter((f): f is (typeof friends)[number] => !!f);

  const roles = user.roles.split(",").filter(Boolean);
  const genres = user.genres.split(",").map((g) => g.trim()).filter(Boolean);
  const links: [string, string][] = [
    ["WEB", user.website],
    ["IG", user.instagram ? `https://instagram.com/${user.instagram.replace(/^@/, "")}` : ""],
    ["SC", user.soundcloud ? `https://soundcloud.com/${user.soundcloud}` : ""],
    ["BC", user.bandcamp ? `https://${user.bandcamp}.bandcamp.com` : ""],
    ["YT", user.youtube ? `https://youtube.com/${user.youtube}` : ""],
    ["SP", user.spotify],
  ];

  const sections = user.sectionOrder.split(",").filter((s) => s in PROFILE_SECTIONS);

  const trackMap = new Map(trackCards.map((t) => [t.id, t]));
  // posts may reference tracks not in user.tracks (reposted drops etc.)
  const missingTrackIds = user.posts
    .map((p) => p.trackId)
    .filter((id): id is string => !!id && !trackMap.has(id));
  if (missingTrackIds.length) {
    const extra = await db.track.findMany({
      where: { id: { in: missingTrackIds } },
      include: trackInclude,
    });
    for (const t of extra) trackMap.set(t.id, serializeTrack(t, me?.id));
  }

  function renderSection(key: string) {
    switch (key) {
      case "featured":
        return featuredTrack ? (
          <section key={key}>
            <h2 className="tag mb-2 text-(--accent)">// {PROFILE_SECTIONS.featured}</h2>
            <TrackCard track={featuredTrack} queue={trackCards} loggedIn={!!me} />
          </section>
        ) : null;
      case "posts":
        return user!.posts.length ? (
          <section key={key}>
            <h2 className="tag mb-2 text-(--accent)">// {PROFILE_SECTIONS.posts}</h2>
            <div className="space-y-3">
              {user!.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  track={post.trackId ? trackMap.get(post.trackId) ?? null : null}
                  meId={me?.id ?? null}
                />
              ))}
            </div>
          </section>
        ) : null;
      case "tracks":
        return trackCards.length ? (
          <section key={key}>
            <h2 className="tag mb-2 text-(--accent)">// {PROFILE_SECTIONS.tracks}</h2>
            <div className="space-y-3">
              {trackCards.map((t) => (
                <TrackCard key={t.id} track={t} queue={trackCards} loggedIn={!!me} />
              ))}
            </div>
          </section>
        ) : null;
      case "circles":
        return user!.memberships.length ? (
          <section key={key}>
            <h2 className="tag mb-2 text-(--accent)">// {COMMUNITY_NOUN_PLURAL.toUpperCase()}</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {user!.memberships.map((m) => (
                <Link
                  key={m.communityId}
                  href={`/rooms/${m.community.slug}`}
                  className="border border-edge bg-panel p-3 transition hover:border-(--accent)"
                >
                  <div className="truncate text-sm font-medium">{m.community.name}</div>
                  <div className="tag mt-1 truncate">{m.role}</div>
                </Link>
              ))}
            </div>
          </section>
        ) : null;
      case "friends":
        return orderedFriends.length ? (
          <section key={key}>
            <h2 className="tag mb-2 text-(--accent)">// {PROFILE_SECTIONS.friends}</h2>
            <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
              {orderedFriends.map((f) => (
                <Link key={f.id} href={`/u/${f.username}`} className="group text-center">
                  <div className="mx-auto w-fit">
                    <Avatar avatarUrl={f.avatarUrl} name={f.displayName} size={56} />
                  </div>
                  <div className="mt-1 truncate text-[10px] text-muted group-hover:text-ink">
                    {f.displayName}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null;
      case "about":
        return (
          <section key={key}>
            <h2 className="tag mb-2 text-(--accent)">// {PROFILE_SECTIONS.about}</h2>
            <div className="border border-edge bg-panel p-4">
              {user!.bio ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{user!.bio}</p>
              ) : (
                <p className="tag">NO BIO. MYSTERIOUS.</p>
              )}
              {genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <Link
                      key={g}
                      href={`/discover?genre=${g}`}
                      className="border border-edge2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted hover:border-(--accent) hover:text-(--accent)"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-4">
                {links
                  .filter(([, url]) => url)
                  .map(([label, url]) => (
                    <a
                      key={label}
                      href={url.startsWith("http") ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tag text-(--accent) hover:underline"
                    >
                      {label} ↗
                    </a>
                  ))}
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  }

  return (
    <div
      className={`bg-profile-${user.profileBg} min-h-dvh`}
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {/* cover */}
      <div className="relative h-44 border-b border-edge md:h-60">
        {user.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 18%, #0a0a0b), #0a0a0b 70%)`,
            }}
          />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4">
        {/* header */}
        <div className="-mt-10 flex flex-wrap items-end gap-4 pb-6">
          <Avatar avatarUrl={user.avatarUrl} name={user.displayName} size={96} />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="display text-2xl font-bold">{user.displayName}</h1>
              {user.isVerified && <span className="text-(--accent)">✓</span>}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="tag">@{user.username}</span>
              {roles.map((r) => (
                <span key={r} className="tag text-(--accent)">
                  {r}
                </span>
              ))}
              {user.location && <span className="tag">// {user.location.toUpperCase()}</span>}
            </div>
            {user.statusLine && (
              <p className="mt-1 text-sm italic text-muted">&ldquo;{user.statusLine}&rdquo;</p>
            )}
          </div>
          <div className="flex items-center gap-4 pb-1">
            <span className="tag">
              <b className="text-ink">{formatCount(user._count.followers)}</b> FOLLOWERS
            </span>
            <span className="tag">
              <b className="text-ink">{formatCount(user._count.following)}</b> FOLLOWING
            </span>
            {isMe ? (
              <Link
                href="/settings/profile"
                className="border border-edge2 px-4 py-1.5 font-mono text-[11px] tracking-[0.15em] text-ink hover:border-(--accent) hover:text-(--accent)"
              >
                EDIT SPACE
              </Link>
            ) : me ? (
              <FollowButton
                userId={user.id}
                following={Array.isArray(user.followers) && user.followers.length > 0}
              />
            ) : null}
          </div>
        </div>

        {isPrivateToMe ? (
          <div className="border border-edge bg-panel p-10 text-center">
            <p className="tag">PRIVATE SPACE</p>
            <p className="mt-2 text-sm text-muted">This one keeps the door shut.</p>
          </div>
        ) : (
          <div className="space-y-8 pb-16">{sections.map(renderSection)}</div>
        )}
      </div>
    </div>
  );
}
