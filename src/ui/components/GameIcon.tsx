// ============================================================
//  GameIcon — tinted SVG icon from src/assets/icons via CSS mask.
//  `color` defaults to currentColor, so Tailwind text-* classes tint it too.
// ============================================================

import { iconUrl } from "@/assets/icons";

interface GameIconProps {
  /** File name in src/assets/icons without .svg (see ui/icons.ts for semantic helpers) */
  name: string;
  /** CSS color; defaults to the current text color */
  color?: string;
  /** Pixel size (square) */
  size?: number;
  className?: string;
  /** Accessible label; omit for decorative icons */
  title?: string;
}

export function GameIcon({ name, color = "currentColor", size = 20, className = "", title }: GameIconProps) {
  const url = iconUrl(name);
  if (!url) return null;
  const mask = `url("${url}") center / contain no-repeat`;
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      title={title}
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMask: mask,
        mask,
      }}
    />
  );
}
