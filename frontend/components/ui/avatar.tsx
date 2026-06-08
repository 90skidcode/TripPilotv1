import { cn } from "@/lib/cn";

/**
 * Deterministic, soft avatar palette. The same name always maps to the same
 * color so customers/leads keep a stable identity color across the app.
 */
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

export function getInitials(name?: string) {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Avatar
 * Circular initials avatar with a deterministic background color.
 *
 * @example
 * <Avatar name="Deepika Gandhi" />
 * <Avatar name="Acme Corp" className="h-8 w-8 text-xs" />
 */
export function Avatar({ name, className }: { name?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold shrink-0 select-none h-9 w-9 text-sm",
        colorFor(name || "?"),
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
