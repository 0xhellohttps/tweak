import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createRoom } from "@/lib/actions/rooms";
import { COMMUNITY_NOUN } from "@/lib/constants";

export default async function NewRoomPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="tag">04 // OPEN A {COMMUNITY_NOUN.toUpperCase()}</h1>
      <p className="display mb-6 mt-1 text-2xl font-bold">Run your scene.</p>

      <form action={createRoom} className="space-y-5 border border-edge bg-panel p-6">
        <div>
          <label className="tag mb-1 block">NAME *</label>
          <input
            name="name"
            required
            maxLength={48}
            placeholder="acid warehouse collective"
            className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
          />
        </div>
        <div>
          <label className="tag mb-1 block">WHAT IS THIS PLACE</label>
          <textarea
            name="description"
            rows={3}
            maxLength={500}
            className="w-full resize-none border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
          />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPrivate" />
          <span className="tag">PRIVATE // MEMBERS NEED APPROVAL</span>
        </label>
        <button className="w-full cursor-pointer bg-(--accent) py-2.5 font-mono text-xs tracking-[0.2em] text-black transition hover:opacity-80">
          OPEN IT
        </button>
      </form>
    </div>
  );
}
