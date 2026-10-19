// ============================================================
//  assets/icons/index.ts — SVG icon file registry (name → URL).
//
//  Icons: game-icons.net, CC BY 3.0 (authors per icon in credits.json).
//  Every SVG here is sanitized: single-color paths with fill="currentColor",
//  no background, 512×512. Tint them with CSS masks (ui/components/GameIcon)
//  or with render/iconSprites.ts on the canvas.
//
//  Add an icon: put `<name>.svg` in this folder (same format) and reference it
//  by `<name>` — semantic mappings live in ui/icons.ts.
// ============================================================

const files = import.meta.glob("./*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const URLS: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  URLS[path.slice(path.lastIndexOf("/") + 1, -".svg".length)] = url;
}

/** URL of `src/assets/icons/<name>.svg`, or undefined if it does not exist. */
export function iconUrl(name: string): string | undefined {
  const url = URLS[name];
  if (!url && import.meta.env?.DEV) console.warn(`[icons] missing icon: ${name}`);
  return url;
}

export function iconNames(): string[] {
  return Object.keys(URLS).sort();
}
