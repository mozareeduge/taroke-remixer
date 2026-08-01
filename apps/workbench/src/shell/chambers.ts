import type { EditorPanel } from "../store/types.js";

export interface ChamberInfo {
  id: EditorPanel;
  sequence: number;
  label: string;
  description: string;
}

/**
 * The eight chambers in their canonical order, with the sequence number and
 * one-line purpose used by the mobile chamber switcher
 * (04_SOLUTION_ARCHITECTURE.md §3, SHELL-02/SHELL-03: every chamber must be
 * directly discoverable by its full name, not a cryptic abbreviation).
 */
export const CHAMBERS: ChamberInfo[] = [
  { id: "source", sequence: 1, label: "Source", description: "The original text this project remixes" },
  { id: "materials", sequence: 2, label: "Materials", description: "Banks and samples the poem draws from" },
  { id: "forms", sequence: 3, label: "Forms", description: "Grammatical transformation rules for samples" },
  { id: "instruments", sequence: 4, label: "Instruments", description: "Devices that route samples into lines" },
  { id: "composition", sequence: 5, label: "Composition", description: "Patterns and scenes that sequence lines" },
  { id: "automation", sequence: 6, label: "Automation", description: "Triggers that react to what appears" },
  { id: "performance", sequence: 7, label: "Performance", description: "Run the piece and read the Surface" },
  { id: "archive", sequence: 8, label: "Archive", description: "Import, export, and project history" },
];

export function chamberInfo(id: EditorPanel): ChamberInfo {
  return CHAMBERS.find((c) => c.id === id) ?? CHAMBERS[0]!;
}

export function formatChamberSequence(sequence: number): string {
  return String(sequence).padStart(2, "0");
}
