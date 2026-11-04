const PALETTE = ["#ff2400", "#c8ff00", "#4da6ff", "#ff4dc4", "#ffb224"];

export function Avatar({
  avatarUrl,
  name,
  size = 40,
}: {
  avatarUrl: string | null;
  name: string;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 border border-edge object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const hue = PALETTE[(name.charCodeAt(0) + name.length) % PALETTE.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center border border-edge bg-panel2 font-mono uppercase"
      style={{ width: size, height: size, color: hue, fontSize: size * 0.4 }}
    >
      {name.slice(0, 1)}
    </div>
  );
}
