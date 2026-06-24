import type { ReactNode, SVGProps } from "react";
import { cn } from "../../lib/cn.js";

export interface CartographyIconProps {
  readonly size?: number;
  readonly className?: string;
  readonly "aria-hidden"?: boolean;
}

const STROKE = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function CartographyIconBase({
  size = 24,
  className,
  "aria-hidden": ariaHidden = true,
  children,
}: CartographyIconProps & { readonly children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      aria-hidden={ariaHidden}
    >
      {children}
    </svg>
  );
}

type PathProps = Omit<SVGProps<SVGPathElement>, "children">;

function PenPath(props: PathProps) {
  return <path {...STROKE} {...props} />;
}

function PenLine(props: SVGProps<SVGLineElement>) {
  return <line {...STROKE} {...props} />;
}

function PenCircle(props: SVGProps<SVGCircleElement>) {
  return <circle {...STROKE} {...props} />;
}

/** Stylized compass — pen-stroke cardinals on a minimal ring */
export function IconCompass(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenCircle cx={12} cy={12} r={8} />
      <PenPath d="M12 4.5 C12.4 7 12.6 8.5 12 10.5" />
      <PenPath d="M19.5 12 C17 12.3 15.5 12.4 13.5 12" />
      <PenPath d="M12 19.5 C11.6 17 11.4 15.5 12 13.5" />
      <PenPath d="M4.5 12 C7 11.7 8.5 11.6 10.5 12" />
      <PenCircle cx={12} cy={12} r={1.25} />
    </CartographyIconBase>
  );
}

/** Folded map sheet with a hand-drawn coastline */
export function IconMap(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M5 6.5 C5.8 5.8 7 5.5 8.5 5.5 H16 C17.2 5.5 18.5 6 19 6.5 V16.5 C18.2 17.2 17 17.5 15.5 17.5 H8 C6.8 17.5 5.5 17 5 16.5 V6.5" />
      <PenPath d="M15.5 5.5 L19 8.5 V6.5 C18.2 5.8 17 5.5 15.5 5.5" />
      <PenPath d="M8 10.5 C9.8 9.2 11.2 11 12.5 10 C13.8 9 15.2 11.2 17 10" />
      <PenPath d="M8 14 C10 12.8 11.5 14.5 13 13.5 C14.5 12.5 16 14 17.5 13" />
    </CartographyIconBase>
  );
}

/** Winding expedition route with waypoint dots */
export function IconRoute(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M4 18 C6.5 14 8 15.5 10 12 C12 8.5 14 10 16 6.5 C17.5 4.5 19 5 21 4" />
      <PenCircle cx={4} cy={18} r={1} />
      <PenCircle cx={10} cy={12} r={1} />
      <PenCircle cx={16} cy={6.5} r={1} />
      <PenCircle cx={21} cy={4} r={1} />
    </CartographyIconBase>
  );
}

/** Location pin — organic teardrop with inner mark */
export function IconPin(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M12 21 C12 21 6.5 14.8 6.5 10.5 C6.5 7.5 8.9 5 12 5 C15.1 5 17.5 7.5 17.5 10.5 C17.5 14.8 12 21 12 21 Z" />
      <PenCircle cx={12} cy={10.5} r={2} />
    </CartographyIconBase>
  );
}

/** Quill pen — nib and feather strokes */
export function IconPen(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M4.5 20 L14 6.5 C15.2 4.8 17.2 4.2 18.8 5.8 C20.4 7.4 19.8 9.4 18.2 10.8 L8.5 20" />
      <PenPath d="M8.5 20 L5.5 21.5 L6.5 18.5" />
      <PenLine x1={14} y1={6.5} x2={18.2} y2={10.8} />
    </CartographyIconBase>
  );
}

/** Rolled parchment scroll with margin lines */
export function IconScroll(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M7 4.5 C7.5 4 8.5 3.8 9.5 4 H18 C19 4 19.5 4.5 19.5 5.5 V18.5 C19.5 19.5 19 20 18 20 H9.5 C8.5 20 7.5 19.7 7 19 V4.5" />
      <PenPath d="M7 4.5 C6.2 5 5.5 6 5.5 7.5 V16.5 C5.5 18 6.2 19 7 19.5" />
      <PenPath d="M10 9 H17 M10 12 H15.5 M10 15 H16.5" />
    </CartographyIconBase>
  );
}

/** Sealed letter — envelope with organic flap */
export function IconLetter(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M4.5 7.5 C4.5 6.5 5.2 5.5 6.5 5.5 H17.5 C18.8 5.5 19.5 6.5 19.5 7.5 V16.5 C19.5 17.5 18.8 18.5 17.5 18.5 H6.5 C5.2 18.5 4.5 17.5 4.5 16.5 V7.5" />
      <PenPath d="M4.5 7.5 L12 13.5 L19.5 7.5" />
      <PenCircle cx={12} cy={15.5} r={1.25} />
    </CartographyIconBase>
  );
}

/** Campfire flame — warm ochre territory marker */
export function IconFire(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M12 21 C12 21 7.5 16.5 7.5 12.5 C7.5 10 9 8 10.5 6.5 C10 8.5 10.8 10 12 9 C12.8 7.5 14.5 6 14.5 8 C16.5 7 17.5 9 17.5 11 C19.5 12 19.5 15 17.5 17 C18.5 19 15.5 21 12 21 Z" />
      <PenPath d="M12 17 C11 15.5 11.5 14 12.5 13 C13.5 14 13 15.5 12 17 Z" />
    </CartographyIconBase>
  );
}

/** Broken compass — cracked ring, misaligned needle */
export function IconBrokenCompass(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M12 4 A8 8 0 0 1 19.5 8.5" />
      <PenPath d="M19.5 15.5 A8 8 0 0 1 12 20" />
      <PenPath d="M4.5 15.5 A8 8 0 0 1 4.5 8.5" />
      <PenPath d="M10 6 L11.5 12 L13 18" />
      <PenPath d="M8.5 8.5 L15.5 15.5" />
    </CartographyIconBase>
  );
}

/** Blurred map — uncertain territory, wavy unreadable lines */
export function IconBlurredMap(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M5 6.5 C6 5.8 7.5 5.5 9 5.5 H16 C17.5 5.5 18.5 6 19 6.5 V16.5 C18 17.2 16.5 17.5 15 17.5 H9 C7.5 17.5 6 17 5 16.5 V6.5" />
      <PenPath d="M7.5 10 C8.5 11.5 7 13 8 14.5 C9 16 7.5 17 8.5 18" opacity={0.45} />
      <PenPath d="M11 9.5 C12 11 10.5 12.5 11.5 14 C12.5 15.5 11 16.5 12 18" opacity={0.45} />
      <PenPath d="M14.5 10 C15.5 11.5 14 13 15 14.5 C16 16 14.5 17 15.5 18" opacity={0.45} />
    </CartographyIconBase>
  );
}

/** Warning beacon — organic triangle with pen-stroke alert mark */
export function IconWarning(props: CartographyIconProps) {
  return (
    <CartographyIconBase {...props}>
      <PenPath d="M12 4.5 L20 18.5 C20.5 19.5 19.8 20.5 18.7 20.5 H5.3 C4.2 20.5 3.5 19.5 4 18.5 L12 4.5" />
      <PenLine x1={12} y1={10} x2={12} y2={15} />
      <circle cx={12} cy={17.5} r={0.75} fill="currentColor" stroke="none" />
    </CartographyIconBase>
  );
}
