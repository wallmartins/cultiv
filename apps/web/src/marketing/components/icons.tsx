import { cn } from "@my-ai-orchestrator/ui";

interface IconProps {
  readonly className?: string;
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon
        points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
        fill="currentColor"
        opacity={0.15}
      />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function CompassRose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
      <line x1="60" y1="5" x2="60" y2="115" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <line x1="5" y1="60" x2="115" y2="60" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <polygon points="60,10 65,50 60,45 55,50" fill="currentColor" opacity="0.6" />
      <polygon points="60,110 55,70 60,75 65,70" fill="currentColor" opacity="0.25" />
      <polygon points="10,60 50,55 45,60 50,65" fill="currentColor" opacity="0.25" />
      <polygon points="110,60 70,65 75,60 70,55" fill="currentColor" opacity="0.25" />
      <circle cx="60" cy="60" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function PenIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={cn("h-4 w-4 shrink-0 mt-0.5", className)}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export function ChevronIcon({ className, open }: IconProps & { readonly open?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-5 w-5 text-azul transition-transform duration-300", open && "rotate-180", className)}
    >
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

export function QuoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 32" fill="none" className={cn("h-8 w-10", className)}>
      <path
        d="M0 20.8C0 26.56 3.68 31.04 9.12 32l1.28-3.84C6.72 27.52 5.12 24.64 5.12 22.4c0-3.2 2.56-5.76 5.76-5.76 3.2 0 5.76 2.56 5.76 5.76 0 5.76-4.64 10.4-10.4 10.4H0V20.8zm21.44 0C21.44 26.56 25.12 31.04 30.56 32l1.28-3.84c-3.68-0.64-5.28-3.52-5.28-5.76 0-3.2 2.56-5.76 5.76-5.76 3.2 0 5.76 2.56 5.76 5.76 0 5.76-4.64 10.4-10.4 10.4H21.44V20.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  dark,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly className?: string;
  readonly dark?: boolean;
}) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center mb-12 md:mb-16", className)} data-section-item>
      <span className={cn(
        "inline-block font-inter text-xs font-semibold uppercase tracking-widest mb-4",
        dark ? "text-ocre" : "text-terracota"
      )}>
        {eyebrow}
      </span>
      <h2 className={cn(
        "font-playfair text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight",
        dark ? "text-creme" : "text-azul"
      )}>
        {title}
      </h2>
      {description && (
        <p className={cn(
          "font-inter text-base mt-4 max-w-xl mx-auto",
          dark ? "text-creme/70" : "text-texto-sec"
        )}>
          {description}
        </p>
      )}
    </div>
  );
}

export const intentionIcons = [
  "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
] as const;
