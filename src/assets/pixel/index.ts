// ============================================================
//  assets/pixel/index.ts — short name → bundled URL for the pixel-art PNGs.
//
//  Names are the path under this folder without ".png", e.g. "units/char-survivor".
//  Files are copied here by `npm run assets:pixel` (scripts/sync-pixel-assets.mjs)
//  from the source packs in art/ (CC0, plus Euroan, Cheon, and Kali under CC BY-SA).
//  Linya's run, idle, and portrait are side views supplied for this project.
//  Data only — usable from game and ui.
// ============================================================

const files = import.meta.glob("./**/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const URLS: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  URLS[path.slice(2, -".png".length)] = url;
}

export function pixelUrl(name: string): string | undefined {
  return URLS[name];
}

export function pixelNames(): string[] {
  return Object.keys(URLS);
}
