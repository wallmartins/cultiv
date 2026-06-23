import { cn } from "../lib/cn.js";

export interface InkBleedProps {
  readonly pigment?: "terracotta" | "ochre" | "indigo";
  readonly className?: string;
}

export function InkBleed({ pigment = "terracotta", className }: InkBleedProps) {
  const color =
    pigment === "ochre"
      ? "var(--color-pigment-ochre)"
      : pigment === "indigo"
        ? "var(--color-pigment-indigo)"
        : "var(--color-pigment-terracotta)";

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background: `
          radial-gradient(ellipse 55% 45% at 78% 18%, color-mix(in srgb, ${color} 18%, transparent), transparent 68%),
          radial-gradient(ellipse 40% 35% at 12% 82%, color-mix(in srgb, var(--color-pigment-indigo) 10%, transparent), transparent 70%)
        `,
      }}
    />
  );
}
