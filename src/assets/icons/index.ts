// ============================================================
//  assets/icons/index.ts — icon file registry (name → URL).
//
//  SVG icons: game-icons.net, CC BY 3.0 (authors per icon in credits.json).
//  Every SVG here is sanitized: single-color paths with fill="currentColor",
//  no background, 512×512. Tint them with CSS masks (ui/components/GameIcon)
//  or with render/iconSprites.ts on the canvas.
//  A PNG in this folder keeps its own colors (친우). GameIcon draws it as an image.
//
//  Add an icon: put `<name>.svg` in this folder (same format) and reference it
//  by `<name>` — semantic mappings live in map.ts.
// ============================================================

const svgFiles = import.meta.glob("./*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const pngFiles = import.meta.glob("./*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const URLS: Record<string, string> = {};
for (const [path, url] of Object.entries(svgFiles)) {
  URLS[path.slice(path.lastIndexOf("/") + 1, -".svg".length)] = url;
}
for (const [path, url] of Object.entries(pngFiles)) {
  URLS[path.slice(path.lastIndexOf("/") + 1, -".png".length)] = url;
}

/** URL of `src/assets/icons/<name>.svg` or `.png`, or undefined if it does not exist. */
export function iconUrl(name: string): string | undefined {
  const url = URLS[name];
  if (!url && import.meta.env?.DEV) console.warn(`[icons] missing icon: ${name}`);
  return url;
}

export function iconNames(): string[] {
  return Object.keys(URLS).sort();
}
