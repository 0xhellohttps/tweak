import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateProfile } from "@/lib/actions/profile";
import { deleteAccount } from "@/lib/actions/auth";
import { SpaceEditor } from "@/components/space-editor";
import { ACCOUNT_ROLES } from "@/lib/constants";

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="tag mb-1 block">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
      />
    </div>
  );
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [tracks, following] = await Promise.all([
    db.track.findMany({
      where: { userId: user.id },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    db.follow.findMany({
      where: { followerId: user.id },
      include: {
        followee: { select: { id: true, username: true, displayName: true } },
      },
    }),
  ]);

  const myRoles = user.roles.split(",");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-baseline justify-between">
        <h1 className="tag">EDIT SPACE</h1>
        <Link href={`/u/${user.username}`} className="tag text-(--accent) hover:underline">
          VIEW MY SPACE →
        </Link>
      </div>
      <p className="display mb-6 mt-1 text-2xl font-bold">Your space. Your rules.</p>

      {/* customization */}
      <div className="tag mb-2">01 // THE LOOK</div>
      <SpaceEditor
        initial={{
          accentColor: user.accentColor,
          profileBg: user.profileBg,
          sectionOrder: user.sectionOrder,
          featuredTrackId: user.featuredTrackId,
          topFriends: user.topFriends,
        }}
        tracks={tracks}
        followingUsers={following.map((f) => f.followee)}
      />

      {/* identity */}
      <div className="tag mb-2 mt-8">02 // THE FACTS</div>
      <form action={updateProfile} className="space-y-4 border border-edge bg-panel p-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="DISPLAY NAME" name="displayName" defaultValue={user.displayName} />
          <Field label="LOCATION" name="location" defaultValue={user.location} placeholder="Austin, TX" />
        </div>
        <Field
          label="STATUS LINE"
          name="statusLine"
          defaultValue={user.statusLine}
          placeholder="what's the current state of you"
        />
        <div>
          <label className="tag mb-1 block">BIO</label>
          <textarea
            name="bio"
            rows={4}
            defaultValue={user.bio}
            className="w-full resize-none border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
          />
        </div>
        <Field
          label="GENRES // COMMA SEPARATED"
          name="genres"
          defaultValue={user.genres}
          placeholder="techno, acid, electro"
        />
        <div>
          <label className="tag mb-2 block">ROLES</label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_ROLES.map((role) => (
              <label key={role} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="roles"
                  value={role}
                  defaultChecked={myRoles.includes(role)}
                  className="peer sr-only"
                />
                <span className="block border border-edge2 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] text-muted transition peer-checked:border-(--accent) peer-checked:text-(--accent)">
                  {role}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="WEBSITE" name="website" defaultValue={user.website} />
          <Field label="INSTAGRAM" name="instagram" defaultValue={user.instagram} placeholder="handle" />
          <Field label="SOUNDCLOUD" name="soundcloud" defaultValue={user.soundcloud} placeholder="handle" />
          <Field label="BANDCAMP" name="bandcamp" defaultValue={user.bandcamp} placeholder="handle" />
          <Field label="YOUTUBE" name="youtube" defaultValue={user.youtube} placeholder="@handle" />
          <Field label="SPOTIFY" name="spotify" defaultValue={user.spotify} placeholder="artist url" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPrivate" defaultChecked={user.isPrivate} />
          <span className="tag">PRIVATE SPACE // ONLY YOU SEE THE CONTENT</span>
        </label>
        <button className="w-full cursor-pointer bg-(--accent) py-2.5 font-mono text-xs tracking-[0.2em] text-black transition hover:opacity-80">
          SAVE FACTS
        </button>
      </form>

      {/* danger */}
      <div className="tag mb-2 mt-8 text-siren">03 // THE EXIT</div>
      <form action={deleteAccount} className="border border-siren/40 bg-panel p-6">
        <p className="text-sm text-muted">
          Deleting your account removes everything: tracks, posts, rooms you own, all of it.
          Type your username to confirm.
        </p>
        <div className="mt-3 flex gap-3">
          <input
            name="confirm"
            placeholder={user.username}
            className="flex-1 border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-siren"
          />
          <button className="cursor-pointer border border-siren px-4 py-2 font-mono text-[11px] tracking-[0.15em] text-siren transition hover:bg-siren hover:text-black">
            DELETE
          </button>
        </div>
      </form>
    </div>
  );
}
