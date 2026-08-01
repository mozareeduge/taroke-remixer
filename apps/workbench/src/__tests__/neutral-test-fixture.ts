/**
 * PHASE_A_NEUTRAL_TEST_FIXTURE
 * Schema-complete synthetic project for structural E2E and visual checks.
 * Contains no Grave material, no original Taroko Gorge source, no production defaults.
 */

import type { TarokeProject } from "@taroke/schema";

export const PHASE_A_NEUTRAL_TEST_FIXTURE: TarokeProject = {
  schemaVersion: "0.8.0",
  project: {
    title: "Neutral Test Project",
    author: "Test Author",
    statement: "A synthetic project for structural testing",
    credits: "",
    language: "en",
    sourceTitle: "Synthetic Source",
    sourceUrl: "",
  },
  workbench: {
    theme: "dark",
    relief: "flat",
    density: "normal",
    texture: "off",
  },
  materials: {
    bankMeta: {
      nouns: { label: "Nouns", role: "noun", desc: "Test noun bank" },
      verbs: { label: "Verbs", role: "verb", desc: "Test verb bank" },
    },
    trays: {
      nouns: [
        { id: "tok_n1", literal: "river", role: "noun", weight: 1, lockedLiteral: false },
        { id: "tok_n2", literal: "stone", role: "noun", weight: 1, lockedLiteral: false },
      ],
      verbs: [
        { id: "tok_v1", literal: "carry", role: "verb", weight: 1, lockedLiteral: false },
        { id: "tok_v2", literal: "hold", role: "verb", weight: 1, lockedLiteral: false },
      ],
    },
  },
  forms: {
    language: "en",
    casePolicy: "preserve",
    compoundPolicy: "hyphen",
    overrides: {},
  },
  lineDevices: [
    {
      id: "ld_test1",
      name: "TEST",
      enabled: true,
      description: "Test device",
      inputs: [
        { id: "inp_1", slot: "noun", tray: "nouns", role: "noun" },
        { id: "inp_2", slot: "verb", tray: "verbs", role: "verb" },
      ],
      routes: [
        { id: "rt_1", name: "default", weight: 100, template: "{noun:literal} {verb:literal}" },
      ],
    },
  ],
  stanzaPatterns: [
    {
      id: "st_test1",
      name: "Test Pattern",
      enabled: true,
      description: "",
      slots: [
        { id: "slot_1", type: "device", deviceId: "ld_test1", label: "TEST", repeat: "once", chance: 100 },
        { id: "slot_2", type: "breath", label: "BREATH", repeat: "once", chance: 80 },
      ],
    },
  ],
  flowScenes: [
    {
      id: "sc_test1",
      name: "Test Scene",
      stanzaId: "st_test1",
      enabled: true,
      chance: 100,
      mode: "loop",
    },
  ],
  triggers: [
    {
      id: "trig_1",
      name: "Test Trigger",
      enabled: true,
      chance: 50,
      condition: { tray: "nouns", term: "river" },
      action: { type: "append", text: " flows" },
    },
  ],
  surface: {
    family: "sans",
    speedMs: 1200,
    retention: 28,
    fontSize: 16,
    lineHeight: 1.5,
    theme: "dark",
    traceMode: "off",
    showTitle: false,
    showSource: false,
    showTick: false,
  },
  notes: [],
  meta: {
    createdWith: "taroke-workbench@0.8.0",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
};
