import { useState } from "react";

export interface AvatarProps {
  readonly src?: string;
  readonly initials: string;
}

// Renders only the badge *content* — callers own the circle element (button in the rail,
// span in settings) and its class.
export function Avatar({ src, initials }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{initials}</>;

  return (
    <img
      className="avatar-image"
      src={src}
      alt=""
      // Google's lh3.googleusercontent.com 403s when a referrer is sent.
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
