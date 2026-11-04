import Link from "next/link";
import { Avatar } from "./avatar";
import { PostActions } from "./post-actions";
import { TrackCard, type TrackCardData } from "./track-card";
import { timeAgo } from "@/lib/format";
import type { PostWithMeta } from "@/lib/queries";

export function PostCard({
  post,
  track,
  meId,
  repostedBy,
}: {
  post: PostWithMeta;
  track: TrackCardData | null;
  meId: string | null;
  repostedBy?: string;
}) {
  const roles = post.user.roles.split(",").filter(Boolean).slice(0, 2);
  return (
    <article className="border border-edge bg-panel p-4">
      {repostedBy && (
        <div className="tag mb-3 text-(--accent)">⇄ REPOSTED BY {repostedBy.toUpperCase()}</div>
      )}
      <div className="flex gap-3">
        <Link href={`/u/${post.user.username}`}>
          <Avatar avatarUrl={post.user.avatarUrl} name={post.user.displayName} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link
              href={`/u/${post.user.username}`}
              className="text-sm font-medium hover:underline"
            >
              {post.user.displayName}
            </Link>
            <span className="tag">@{post.user.username}</span>
            {roles.map((r) => (
              <span key={r} className="tag text-(--accent)">
                {r}
              </span>
            ))}
            <span className="tag ml-auto">{timeAgo(post.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
          {track && (
            <div className="mt-3">
              <TrackCard track={track} loggedIn={!!meId} />
            </div>
          )}
          <PostActions
            postId={post.id}
            likeCount={post.likes.length}
            repostCount={post.reposts.length}
            commentCount={post._count.comments}
            likedByMe={!!meId && post.likes.some((l) => l.userId === meId)}
            repostedByMe={!!meId && post.reposts.some((r) => r.userId === meId)}
            isMine={meId === post.user.id}
            loggedIn={!!meId}
          />
        </div>
      </div>
    </article>
  );
}
