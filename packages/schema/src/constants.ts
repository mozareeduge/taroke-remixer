import type { TrayDef } from "./types.js";

// External schema version — written into exported .taroke.json files.
// Must match v07 to preserve round-trip import compatibility.
export const SCHEMA_VERSION = "0.7-reset" as const;

// Internal editor version — not written into exported files.
export const EDITOR_VERSION = "0.8.0" as const;

export const V07_SCHEMA_VERSION = "0.7-reset" as const;

export const TRAY_DEFS: Readonly<Record<string, TrayDef>> = {
  above:   { label: "ABOVE",   role: "noun",      desc: "actor / upper / subject samples" },
  below:   { label: "BELOW",   role: "noun",      desc: "object / place / lower samples" },
  trans:   { label: "TRANS",   role: "verb",      desc: "transitive action samples" },
  imper:   { label: "IMPER",   role: "verb",      desc: "command samples" },
  intrans: { label: "INTRANS", role: "verb",      desc: "state / movement samples" },
  texture: { label: "TEXTURE", role: "noun",      desc: "surface / matter samples" },
  adjs:    { label: "ADJS",    role: "adjective", desc: "descriptor samples" },
  reserve: { label: "RESERVE", role: "mixed",     desc: "off-stage material" },
} as const;

export interface ThemeTokens {
  name: string;
  bg: string;
  panel: string;
  panel2: string;
  well: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  warn: string;
  surfaceBg: string;
  surfaceText: string;
  surfaceMuted: string;
  surfaceAccent: string;
}

export const THEME_TOKENS: Readonly<Record<string, ThemeTokens>> = {
  night: { name: "Night bench", bg: "#050604", panel: "#11120d", panel2: "#171811", well: "#000000", text: "#f4ecd8", muted: "#9d9277", line: "#38362b", accent: "#a7ff3f", warn: "#ffb84d", surfaceBg: "#000000", surfaceText: "#f4ecd8", surfaceMuted: "#9d9277", surfaceAccent: "#a7ff3f" },
  paper: { name: "Paper machine", bg: "#d4cbb4", panel: "#eee4cf", panel2: "#f8eed8", well: "#fff9ec", text: "#14110b", muted: "#756d5e", line: "#5f5649", accent: "#ff5a2a", warn: "#c97300", surfaceBg: "#f5ead4", surfaceText: "#17110b", surfaceMuted: "#7b6f5e", surfaceAccent: "#ff5a2a" },
  amber: { name: "Amber monitor", bg: "#050403", panel: "#140f08", panel2: "#211609", well: "#000000", text: "#ffdba3", muted: "#b9894f", line: "#49361e", accent: "#ffb84d", warn: "#ff665d", surfaceBg: "#050403", surfaceText: "#ffdba3", surfaceMuted: "#b9894f", surfaceAccent: "#ffb84d" },
  cyan:  { name: "Cold cyan", bg: "#020608", panel: "#081216", panel2: "#0e1b22", well: "#000000", text: "#e7fbff", muted: "#83aab4", line: "#24434b", accent: "#7de7ff", warn: "#ffb84d", surfaceBg: "#00070a", surfaceText: "#e7fbff", surfaceMuted: "#83aab4", surfaceAccent: "#7de7ff" },
} as const;

export const SURFACE_FAMILIES: Readonly<Record<string, { name: string; desc: string }>> = {
  taroko:     { name: "Taroko stream",   desc: "vertical timed poem stream" },
  document:   { name: "Document slip",   desc: "paper/archive surface" },
  split:      { name: "Split apparatus", desc: "poem plus trace evidence" },
  projection: { name: "Projection",      desc: "large performance surface" },
  patch:      { name: "Patch surface",   desc: "machine visible beside output" },
} as const;

export const IRREGULAR_PLURALS: Readonly<Record<string, string>> = {
  man: "men", woman: "women", child: "children", person: "people",
  mouse: "mice", tooth: "teeth", foot: "feet", goose: "geese", ox: "oxen",
  sheep: "sheep", deer: "deer", fish: "fish", aircraft: "aircraft",
  series: "series", species: "species", cactus: "cacti", focus: "foci",
  fungus: "fungi", nucleus: "nuclei", syllabus: "syllabi",
  analysis: "analyses", crisis: "crises", thesis: "theses",
  diagnosis: "diagnoses", phenomenon: "phenomena", criterion: "criteria",
} as const;

export const IRREGULAR_VERB3: Readonly<Record<string, string>> = {
  be: "is", have: "has", do: "does", go: "goes",
} as const;

export const F_END_EXCEPTIONS: ReadonlySet<string> = new Set([
  "roof", "belief", "chef", "chief", "proof", "reef", "cliff", "safe",
]);
