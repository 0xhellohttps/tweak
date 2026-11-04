import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TrackCard } from "@/components/track-card";
import { serializeTrack, trackInclude } from "@/lib/queries";
import { GENRES } from "@/lib/constants";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; sort?: string }>;
}) {
  const user = await getCurrentUser();
  const { genre, sort } = await searchParams;

  const tracks = await db.track.findMany({
    where: genre ? { genre } : {},
    orderBy: sort === "hot" ? { playCount: "desc" } : { createdAt: "desc" },
    take: 50,
    include: trackInclude,
  });

  const cards = tracks.map((t) => serializeTrack(t, user?.id));
  const queue = cards;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="tag">02 // SOUND</h1>
        <div className="flex gap-4">
          <Link
            href={genre ? `/discover?genre=${genre}` : "/discover"}
            className={`tag ${sort !== "hot" ? "text-(--accent)" : "hover:text-ink"}`}
          >
            FRESH
          </Link>
          <Link
            href={genre ? `/discover?genre=${genre}&sort=hot` : "/discover?sort=hot"}
            className={`tag ${sort === "hot" ? "text-(--accent)" : "hover:text-ink"}`}
          >
            MOST PLAYED
          </Link>
        </div>
      </div>
      <p className="display mb-4 text-2xl font-bold">Pick a door.</p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/discover"
          className={`border px-3 py-1 font-mono text-[10px] tracking-[0.15em] ${
            !genre ? "border-(--accent) text-(--accent)" : "border-edge2 text-muted hover:text-ink"
          }`}
        >
          EVERYTHING
        </Link>
        {GENRES.map((g) => (
          <Link
            key={g}
            href={`/discover?genre=${g}`}
            className={`border px-3 py-1 font-mono text-[10px] tracking-[0.15em] uppercase ${
              genre === g
                ? "border-(--accent) text-(--accent)"
                : "border-edge2 text-muted hover:text-ink"
            }`}
          >
            {g}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {cards.length === 0 && (
          <div className="border border-edge bg-panel p-8 text-center">
            <p className="tag">NO SOUND IN THIS DOOR YET</p>
          </div>
        )}
        {cards.map((t) => (
          <TrackCard key={t.id} track={t} queue={queue} loggedIn={!!user} />
        ))}
      </div>
    </div>
  );
}
