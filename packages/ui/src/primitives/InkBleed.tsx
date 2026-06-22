import { cn } from "../lib/cn.js";

export interface InkBleedProps {
  readonly pigment?: "terracotta" | "ochre";
  readonly className?: string;
}

export function InkBleed({ pigment = "terracotta", className }: InkBleedProps) {
  const color =
    pigment === "ochre" ? "var(--color-pigment-ochre)" : "var(--color-pigment-terracotta)";

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background: `radial-gradient(ellipse 60% 50% at 70% 20%, color-mix(in srgb, ${color} 8%, transparent), transparent 70%)`,
      }}
    />
  );
}
