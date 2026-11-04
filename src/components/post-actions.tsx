"use client";

import { useTransition } from "react";
import { toggleLike, toggleRepost, deletePost } from "@/lib/actions/social";
import { formatCount } from "@/lib/format";

export function PostActions({
  postId,
  likeCount,
  repostCount,
  commentCount,
  likedByMe,
  repostedByMe,
  isMine,
  loggedIn,
}: {
  postId: string;
  likeCount: number;
  repostCount: number;
  commentCount: number;
  likedByMe: boolean;
  repostedByMe: boolean;
  isMine: boolean;
  loggedIn: boolean;
}) {
  const [, startTransition] = useTransition();
  if (!loggedIn)
    return (
      <div className="mt-2 flex gap-5">
        <span className="tag">♥ {formatCount(likeCount)}</span>
        <span className="tag">⇄ {formatCount(repostCount)}</span>
        <span className="tag">◇ {formatCount(commentCount)}</span>
      </div>
    );
  return (
    <div className="mt-2 flex gap-5">
      <button
        onClick={() => startTransition(() => toggleLike({ postId }))}
        className={`tag cursor-pointer hover:text-ink ${likedByMe ? "text-(--accent)" : ""}`}
      >
        ♥ {formatCount(likeCount)}
      </button>
      <button
        onClick={() => startTransition(() => toggleRepost({ postId }))}
        className={`tag cursor-pointer hover:text-ink ${repostedByMe ? "text-(--accent)" : ""}`}
      >
        ⇄ {formatCount(repostCount)}
      </button>
      <span className="tag">◇ {formatCount(commentCount)}</span>
      {isMine && (
        <button
          onClick={() => startTransition(() => deletePost(postId))}
          className="tag ml-auto cursor-pointer hover:text-siren"
        >
          DEL
        </button>
      )}
    </div>
  );
}
