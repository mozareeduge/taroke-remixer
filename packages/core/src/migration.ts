import { SCHEMA_VERSION, TRAY_DEFS } from "@taroke/schema";
import type {
  TarokeProject,
  Token,
  LineDevice,
  StanzaPattern,
  ValidationIssue,
} from "@taroke/schema";
import { uid, clone, token } from "./utils.js";
import { roleForTray } from "./utils.js";
import { getTrayTokens, getDevice, getStanza } from "./selection.js";
import { activeScenes } from "./generation.js";
import { projectTrayDefs } from "./utils.js";

export function classicLineDevices(): LineDevice[] {
  return [
    {
      id: "ld_path",
      name: "PATH",
      enabled: true,
      description: "Actor / action / object line device.",
      inputs: [
        { id: "inp_path_above", slot: "above", tray: "above", role: "noun" },
        { id: "inp_path_trans", slot: "trans", tray: "trans", role: "verb" },
        { id: "inp_path_below", slot: "below", tray: "below", role: "noun" },
      ],
      routes: [
        { id: "rt_path_plural", name: "plural", weight: 55, template: "{above:plural} {trans:base} the {below:literal}." },
        { id: "rt_path_singular", name: "singular", weight: 25, template: "{article:a} {above:singular} {trans:thirdSingular} the {below:literal}." },
        { id: "rt_path_literal", name: "literal rough", weight: 20, template: "{above:literal} {trans:literal} the {below:literal}." },
      ],
    },
    {
      id: "ld_site",
      name: "SITE",
      enabled: true,
      description: "Movement / state line device.",
      inputs: [
        { id: "inp_site_thing", slot: "thing", tray: "above", role: "noun" },
        { id: "inp_site_intrans", slot: "intrans", tray: "intrans", role: "verb" },
      ],
      routes: [
        { id: "rt_site_plural", name: "plural", weight: 60, template: "{thing:plural} {intrans:base}." },
        { id: "rt_site_singular", name: "singular", weight: 25, template: "{article:a} {thing:singular} {intrans:thirdSingular}." },
        { id: "rt_site_literal", name: "literal rough", weight: 15, template: "{thing:literal} {intrans:literal}." },
      ],
    },
    {
      id: "ld_cave",
      name: "CAVE",
      enabled: true,
      description: "Command / texture / breath line device.",
      inputs: [
        { id: "inp_cave_imper", slot: "imper", tray: "imper", role: "verb" },
        { id: "inp_cave_adjs", slot: "adjs", tray: "adjs", role: "adjective" },
        { id: "inp_cave_texture", slot: "texture", tray: "texture", role: "noun" },
      ],
      routes: [
        { id: "rt_cave_command", name: "command", weight: 80, template: "{imper:literal} the {adjs:literal} {texture:singular}..." },
        { id: "rt_cave_signal", name: "signal command", weight: 20, template: "{imper:uppercase} the {adjs:literal} {texture:singular}..." },
      ],
    },
  ];
}

export function classicStanzaPatterns(): StanzaPattern[] {
  return [
    {
      id: "st_classic",
      name: "Classic Taroko stanza",
      enabled: true,
      description: "PATH, optional SITE loop, PATH, breath, CAVE, breath.",
      slots: [
        { id: uid("slot"), type: "device", deviceId: "ld_path", label: "PATH", repeat: "once", chance: 100 },
        { id: uid("slot"), type: "device", deviceId: "ld_site", label: "SITE LOOP", repeat: "loop", chance: 62, max: 4 },
        { id: uid("slot"), type: "device", deviceId: "ld_path", label: "PATH", repeat: "once", chance: 100 },
        { id: uid("slot"), type: "breath", label: "BREATH", repeat: "once", chance: 100 },
        { id: uid("slot"), type: "device", deviceId: "ld_cave", label: "CAVE", repeat: "once", chance: 100 },
        { id: uid("slot"), type: "breath", label: "BREATH", repeat: "once", chance: 100 },
      ],
    },
  ];
}

function combinationSubsets(n: number, k: number): number[][] {
  const result: number[][] = [];
  function helper(start: number, combo: number[]) {
    if (combo.length === k) { result.push([...combo]); return; }
    for (let i = start; i < n; i++) { combo.push(i); helper(i + 1, combo); combo.pop(); }
  }
  helper(0, []);
  return result;
}

export function compileCavePhrases(): Token[] {
  // positions[1] is the texture placeholder; texture variants expand it
  const positions = ["encompassing", "<texture>", "sinuous", "straight", "objective", "arched", "cool", "clear", "dim", "driven"];
  const TEXTURE_IDX = 1;
  const textureVariants = ["rough", "fine"];
  const n = 10;
  const phrases: Token[] = [];
  let seq = 0;

  for (const k of [1, 2, 3, 4]) {
    const subsets = combinationSubsets(n, k);
    const ck = subsets.length;
    const weightWithout = 20160 / (4 * ck);
    const weightWith = 20160 / (8 * ck);
    for (const subset of subsets) {
      if (subset.includes(TEXTURE_IDX)) {
        for (const tv of textureVariants) {
          const text = subset.map((i) => (i === TEXTURE_IDX ? tv : positions[i]!)).join(" ");
          phrases.push({ id: `cave_p${seq++}`, literal: text, role: "literal", weight: weightWith, lockedLiteral: false });
        }
      } else {
        const text = subset.map((i) => positions[i]!).join(" ");
        phrases.push({ id: `cave_p${seq++}`, literal: text, role: "literal", weight: weightWithout, lockedLiteral: false });
      }
    }
  }
  return phrases;
}

function tarokoLineDevices(): LineDevice[] {
  return [
    {
      id: "ld_path",
      name: "PATH",
      enabled: true,
      description: "Actor / action / object — Taroko Gorge path device.",
      inputs: [
        { id: "inp_path_subject", slot: "subject", tray: "path_subject", role: "noun" },
        { id: "inp_path_verb",    slot: "verb",    tray: "trans",        role: "verb" },
        { id: "inp_path_object",  slot: "object",  tray: "below",        role: "noun" },
      ],
      routes: [
        { id: "rt_path_plural_plain",   name: "plural plain",   weight: 31, template: "{subject:plural} {verb:base} the {object:literal}." },
        { id: "rt_path_plural_s",       name: "plural s",       weight: 31, template: "{subject:plural} {verb:base} the {object:literal+s}." },
        { id: "rt_path_singular_plain", name: "singular plain", weight: 31, template: "{subject:singular} {verb:thirdSingular} the {object:literal}." },
        { id: "rt_path_singular_s",     name: "singular s",     weight: 31, template: "{subject:singular} {verb:thirdSingular} the {object:literal+s}." },
        { id: "rt_path_monkeys_plain",  name: "monkeys plain",  weight: 2,  template: "Monkeys {verb:base} the {object:literal}." },
        { id: "rt_path_monkeys_s",      name: "monkeys s",      weight: 2,  template: "Monkeys {verb:base} the {object:literal+s}." },
      ],
    },
    {
      id: "ld_site",
      name: "SITE",
      enabled: true,
      description: "Thing / state — Taroko Gorge site device.",
      inputs: [
        { id: "inp_site_thing", slot: "thing", tray: "site_subject", role: "noun" },
        { id: "inp_site_state", slot: "state", tray: "intrans",      role: "verb" },
      ],
      routes: [
        { id: "rt_site", name: "site", weight: 1, template: "{thing:literal+s} {state:base}." },
      ],
    },
    {
      id: "ld_cave",
      name: "CAVE",
      enabled: true,
      description: "Command / phrase — Taroko Gorge cave device.",
      inputs: [
        // Route command through imper_cap: first-character-capitalized operational bank
        { id: "inp_cave_command", slot: "command", tray: "imper_cap",   role: "verb" },
        { id: "inp_cave_phrase",  slot: "phrase",  tray: "cave_phrases", role: "literal" },
      ],
      routes: [
        { id: "rt_cave", name: "cave", weight: 1, template: "{command:literal} the {phrase:literal} —" },
      ],
    },
  ];
}

function tarokoStanzaPatterns(): StanzaPattern[] {
  return [
    {
      id: "st_taroko_0",
      name: "Taroko scene 0",
      enabled: true,
      description: "0 SITE slots: PATH, PATH, BREATH, CAVE, BREATH.",
      slots: [
        { id: "slot_t0_p1",  type: "device", deviceId: "ld_path", label: "PATH",  repeat: "once", chance: 100 },
        { id: "slot_t0_p2",  type: "device", deviceId: "ld_path", label: "PATH",  repeat: "once", chance: 100 },
        { id: "slot_t0_br1", type: "breath", label: "BREATH", repeat: "once", chance: 100 },
        { id: "slot_t0_c1",  type: "device", deviceId: "ld_cave", label: "CAVE",  repeat: "once", chance: 100 },
        { id: "slot_t0_br2", type: "breath", label: "BREATH", repeat: "once", chance: 100 },
      ],
    },
    {
      id: "st_taroko_1",
      name: "Taroko scene 1",
      enabled: true,
      description: "1 SITE slot: PATH, SITE, PATH, BREATH, CAVE, BREATH.",
      slots: [
        { id: "slot_t1_p1",  type: "device", deviceId: "ld_path", label: "PATH",  repeat: "once", chance: 100 },
        { id: "slot_t1_s1",  type: "device", deviceId: "ld_site", label: "SITE",  repeat: "once", chance: 100 },
        { id: "slot_t1_p2",  type: "device", deviceId: "ld_path", label: "PATH",  repeat: "once", chance: 100 },
        { id: "slot_t1_br1", type: "breath", label: "BREATH", repeat: "once", chance: 100 },
        { id: "slot_t1_c1",  type: "device", deviceId: "ld_cave", label: "CAVE",  repeat: "once", chance: 100 },
        { id: "slot_t1_br2", type: "breath", label: "BREATH", repeat: "once", chance: 100 },
      ],
    },
    {
      id: "st_taroko_2",
      name: "Taroko scene 2",
      enabled: true,
      description: "2 SITE slots: PATH, SITE, SITE, PATH, BREATH, CAVE, BREATH.",
      slots: [
        { id: "slot_t2_p1",  type: "device", deviceId: "ld_path", label: "PATH",  repeat: "once", chance: 100 },
        { id: "slot_t2_s1",  type: "device", deviceId: "ld_site", label: "SITE",  repeat: "once", chance: 100 },
        { id: "slot_t2_s2",  type: "device", deviceId: "ld_site", label: "SITE",  repeat: "once", chance: 100 },
        { id: "slot_t2_p2",  type: "device", deviceId: "ld_path", label: "PATH",  repeat: "once", chance: 100 },
        { id: "slot_t2_br1", type: "breath", label: "BREATH", repeat: "once", chance: 100 },
        { id: "slot_t2_c1",  type: "device", deviceId: "ld_cave", label: "CAVE",  repeat: "once", chance: 100 },
        { id: "slot_t2_br2", type: "breath", label: "BREATH", repeat: "once", chance: 100 },
      ],
    },
  ];
}

// Deterministic token builder for canonical defaultProject() IDs only.
// General uid() / token() for user-authored content remain unchanged.
function stoken(id: string, literal: string, role: string, weight = 1): Token {
  return { id, literal, role: role as Token["role"], weight, lockedLiteral: false };
}

export function defaultProject(): TarokeProject {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const above = ["brow", "mist", "shape", "layer", "the crag", "stone", "forest", "height"];
  const below = ["flow", "basin", "shape", "vein", "rippling", "stone", "cove", "rock"];
  const imperLiterals = ["track", "shade", "translate", "stamp", "progress through", "direct", "run", "enter"];
  const pathSubjectWeights = [4, 4, 4, 4, 4, 4, 3, 4];

  const trays: TarokeProject["materials"]["trays"] = {
    above:        above.map((s, i)         => stoken(`tok_above_${i}`, s, "noun")),
    below:        below.map((s, i)         => stoken(`tok_below_${i}`, s, "noun")),
    trans:        ["command", "pace", "roam", "trail", "frame", "sweep", "exercise", "range"]
                    .map((s, i)            => stoken(`tok_trans_${i}`, s, "verb")),
    // imper: preserved exact lowercase source bank
    imper:        imperLiterals.map((s, i) => stoken(`tok_imper_${i}`, s, "verb")),
    intrans:      ["linger", "dwell", "rest", "relax", "hold", "dream", "hum"]
                    .map((s, i)            => stoken(`tok_intrans_${i}`, s, "verb")),
    texture:      ["rough", "fine"].map((s, i) => stoken(`tok_texture_${i}`, s, "noun")),
    cave_fixed:   ["encompassing", "sinuous", "straight", "objective", "arched", "cool", "clear", "dim", "driven"]
                    .map((s, i)            => stoken(`tok_cave_fixed_${i}`, s, "adjective")),
    // imper_cap: operational bank — first-character-capitalized imperative copies for CAVE command input
    imper_cap:    imperLiterals.map((s, i) => stoken(`tok_imper_cap_${i}`, cap(s), "verb")),
    path_subject: above.map((s, i) => stoken(`tok_path_subject_${i}`, cap(s), "noun", pathSubjectWeights[i]!)),
    site_subject: [
      ...above.map((s, i) => stoken(`tok_site_subj_above_${i}`, cap(s), "noun", 1)),
      ...below.map((s, i) => stoken(`tok_site_subj_below_${i}`, cap(s), "noun", 2)),
    ],
    cave_phrases: compileCavePhrases(),
    reserve:      [],
  };

  const bankMeta: Record<string, { label: string; role: string; desc: string }> = {
    above:        { label: "ABOVE",        role: "noun",      desc: "Source: landscape features from above" },
    below:        { label: "BELOW",        role: "noun",      desc: "Source: landscape features from below" },
    trans:        { label: "TRANS",        role: "verb",      desc: "Source: transitive action verbs" },
    imper:        { label: "IMPER",        role: "verb",      desc: "Source: imperative command verbs (lowercase)" },
    intrans:      { label: "INTRANS",      role: "verb",      desc: "Source: intransitive state verbs" },
    texture:      { label: "TEXTURE",      role: "noun",      desc: "Source: surface texture adjectives" },
    cave_fixed:   { label: "CAVE ADJS",   role: "adjective", desc: "Source: fixed cave adjectives" },
    imper_cap:    { label: "IMPER CAP",   role: "verb",      desc: "Derived: first-character-capitalized imperative copies for CAVE command input" },
    path_subject: { label: "PATH SUBJECT", role: "noun",      desc: "Derived: capitalized above tokens with probability weights" },
    site_subject: { label: "SITE SUBJECT", role: "noun",      desc: "Derived: above (weight 1) and below (weight 2) tokens capitalized" },
    cave_phrases: { label: "CAVE PHRASES", role: "literal",   desc: "Derived: compiled adjective phrase combinations (515 entries, total weight 20160)" },
    reserve:      { label: "RESERVE",      role: "mixed",     desc: "Reserve bank" },
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      title: "Taroko Gorge",
      author: "Nick Montfort",
      language: "en",
      sourceTitle: "Taroko Gorge — JavaScript version with links (2016)",
      sourceUrl: "https://collection.eliterature.org/3/files/taroko-gorge/taroko-gorge.html",
      statement: "Canonical initial example for TAROKE RIMIXER, mapped from Nick Montfort's Taroko Gorge into the existing v08 schema. Original lexical arrays are retained; operational derived banks are explicitly identified.",
      credits: `Original Python program: 8 January 2009, Taroko Gorge National Park, Taiwan and Eva Air Flight 28. This JavaScript version, with links: 1 March 2016. Copyright (c) 2009-2016 Nick Montfort <nickm@nickm.com>\n\nPermission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.\n\nMapped as TAROKE RIMIXER's canonical initial example by Mohammad Zare; known schema translations remain visible in the project.`,
    },
    workbench: { theme: "night", relief: "medium", density: "standard", texture: "source" },
    materials: { trays, bankMeta },
    forms: { language: "en", casePolicy: "preserve", compoundPolicy: "head", overrides: {} },
    lineDevices: tarokoLineDevices(),
    stanzaPatterns: tarokoStanzaPatterns(),
    flowScenes: [
      { id: "sc_taroko_0", name: "Taroko 0 SITE", stanzaId: "st_taroko_0", enabled: true, chance: 100, mode: "loop" },
      { id: "sc_taroko_1", name: "Taroko 1 SITE", stanzaId: "st_taroko_1", enabled: true, chance: 100, mode: "loop" },
      { id: "sc_taroko_2", name: "Taroko 2 SITE", stanzaId: "st_taroko_2", enabled: true, chance: 100, mode: "loop" },
    ],
    triggers: [],
    surface: { family: "taroko", traceMode: "hidden", theme: "night", speedMs: 1200, retention: 26, fontSize: 17, lineHeight: 1.23, showTitle: true, showSource: true, showTick: false },
    notes: [],
    meta: { createdWith: "TAROKE RIMIXER", updatedAt: new Date().toISOString() },
  };
}

function hasProp(obj: unknown, key: string): boolean {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
}

export function migrateProject(input: unknown): TarokeProject {
  const base = defaultProject();
  const p = clone(input ?? {}) as Record<string, unknown>;
  const inp = (input ?? {}) as Record<string, unknown>;

  if (p["lineMachines"] && !p["lineDevices"]) p["lineDevices"] = p["lineMachines"];
  p["schemaVersion"] = SCHEMA_VERSION;
  p["project"] = Object.assign({}, base.project, (p["project"] as object) ?? {});
  p["workbench"] = Object.assign({}, base.workbench, (p["workbench"] as object) ?? (p["appearance"] as object) ?? {});

  // A/B/C: Tray selection — explicit modern trays > legacy dictionary > default
  const hasExplicitTrays = hasProp(inp["materials"], "trays");
  const hasLegacyDict = hasProp(inp, "dictionary");

  let rawTrays: Record<string, unknown[]>;
  if (hasExplicitTrays) {
    if (!p["materials"] || typeof p["materials"] !== "object") p["materials"] = {};
    rawTrays = ((p["materials"] as Record<string, unknown>)["trays"] as Record<string, unknown[]>) ?? {};
  } else if (hasLegacyDict) {
    p["materials"] = p["materials"] && typeof p["materials"] === "object" ? p["materials"] : {};
    rawTrays = clone((inp["dictionary"] as Record<string, unknown[]>) ?? {});
  } else {
    p["materials"] = clone(base.materials);
    rawTrays = clone(base.materials.trays) as unknown as Record<string, unknown[]>;
  }

  // D: bankMeta — TRAY_DEFS > base bankMeta > k.toUpperCase() for unknown banks
  const rawBankMeta = (inp["materials"] as Record<string, unknown> | undefined)?.["bankMeta"];
  const importedBankMeta =
    rawBankMeta && typeof rawBankMeta === "object" ? clone(rawBankMeta as object) as Record<string, Record<string, string>> : {};
  const bankMeta: Record<string, { label: string; role: string; desc: string }> = {};
  for (const k of Object.keys(rawTrays)) {
    const m = importedBankMeta[k] ?? {};
    bankMeta[k] = Object.assign(
      {
        label: TRAY_DEFS[k]?.label ?? base.materials.bankMeta[k]?.label ?? k.toUpperCase(),
        role:  TRAY_DEFS[k]?.role  ?? base.materials.bankMeta[k]?.role  ?? "literal",
        desc:  TRAY_DEFS[k]?.desc  ?? base.materials.bankMeta[k]?.desc  ?? "custom sample bank",
      },
      m,
    );
    if (!bankMeta[k]!.label) bankMeta[k]!.label = k.toUpperCase();
    if (!bankMeta[k]!.role) bankMeta[k]!.role = "literal";
    if (!bankMeta[k]!.desc) bankMeta[k]!.desc = "custom sample bank";
  }

  // Normalize tokens and repair duplicate token IDs
  const seenIds = new Map<string, { bank: string; idx: number }>();
  const repairs: TarokeProject["meta"]["importRepairs"] = [];
  const trays: TarokeProject["materials"]["trays"] = {};
  for (const k of Object.keys(rawTrays)) {
    const trayRole = bankMeta[k]?.role ?? roleForTray(k);
    trays[k] = ((rawTrays[k] ?? []) as Array<string | Partial<Token>>).map((x, idx) => {
      const tok: Token =
        typeof x === "string"
          ? token(x, trayRole)
          : Object.assign({ id: uid("tok"), literal: "", role: trayRole, weight: 1, lockedLiteral: false }, x as object) as Token;
      if (!tok.id) tok.id = uid("tok");
      if (seenIds.has(tok.id)) {
        const prev = seenIds.get(tok.id)!;
        const newId = "tok_" + k + "_dup_" + idx;
        repairs!.push({ originalId: tok.id, newId, bank: k, index: idx, prevBank: prev.bank });
        tok.id = newId;
      } else {
        seenIds.set(tok.id, { bank: k, idx });
      }
      return tok;
    });
  }

  (p["materials"] as Record<string, unknown>)["trays"] = trays;
  (p["materials"] as Record<string, unknown>)["bankMeta"] = bankMeta;
  p["forms"] = Object.assign({}, base.forms, (p["forms"] as object) ?? {});

  // E: Collections — absent → use defaults; explicitly present (even empty) → preserve
  const hasLD = hasProp(inp, "lineDevices") || hasProp(inp, "lineMachines");
  const hasSP = hasProp(inp, "stanzaPatterns");
  const hasFS = hasProp(inp, "flowScenes");
  const hasTR = hasProp(inp, "triggers") || hasProp(inp, "rareEvents");

  p["lineDevices"] = hasLD
    ? Array.isArray(p["lineDevices"]) ? p["lineDevices"] : []
    : base.lineDevices;

  // Ensure every DeviceInput has a stable id (migration for pre-id projects)
  for (const dev of (p["lineDevices"] as Array<Record<string, unknown>>) ?? []) {
    if (Array.isArray(dev["inputs"])) {
      const seenInputIds = new Set<string>();
      for (const inp2 of dev["inputs"] as Array<Record<string, unknown>>) {
        if (!inp2["id"] || typeof inp2["id"] !== "string") {
          inp2["id"] = uid("inp");
        }
        // Repair duplicate input IDs within this device
        if (seenInputIds.has(inp2["id"] as string)) {
          inp2["id"] = uid("inp");
        }
        seenInputIds.add(inp2["id"] as string);
      }
    }
  }
  p["stanzaPatterns"] = hasSP
    ? Array.isArray(p["stanzaPatterns"]) ? p["stanzaPatterns"] : []
    : base.stanzaPatterns;
  p["flowScenes"] = hasFS
    ? Array.isArray(p["flowScenes"]) ? p["flowScenes"] : []
    : base.flowScenes;

  if (!hasTR) {
    p["triggers"] = base.triggers;
  } else if (Array.isArray(p["triggers"])) {
    // preserve as-is
  } else if (Array.isArray(p["rareEvents"])) {
    p["triggers"] = (p["rareEvents"] as Array<Record<string, unknown>>).map((r) => ({
      id: r["id"] ?? uid("tr"),
      name: r["name"],
      enabled: r["enabled"],
      condition: { tray: r["triggerLayer"], term: r["triggerTerm"] },
      chance: r["chance"],
      action: { type: r["placement"] ?? "append", text: r["insertion"] },
    }));
  } else {
    p["triggers"] = [];
  }

  // F: Surface — merge defaults; enforce invariants (showTick=false, family='taroko')
  p["surface"] = Object.assign({}, base.surface, (p["surface"] as object) ?? {});
  (p["surface"] as Record<string, unknown>)["showTick"] = false;
  (p["surface"] as Record<string, unknown>)["family"] = "taroko";

  p["notes"] = Array.isArray(p["notes"])
    ? (p["notes"] as Array<Record<string, unknown>>).map((n) => {
        const x = clone(n);
        return x;
      })
    : [];

  p["meta"] = Object.assign({}, base.meta, (p["meta"] as object) ?? {});
  const prevRepairs = Array.isArray((inp["meta"] as Record<string, unknown> | undefined)?.["importRepairs"])
    ? clone((inp["meta"] as Record<string, unknown>)["importRepairs"] as object[])
    : [];
  const newRepairIds = new Set((repairs ?? []).map((r) => r.newId));
  const mergedRepairs = [
    ...(prevRepairs as typeof repairs ?? []).filter((r) => !newRepairIds.has(r!.newId)),
    ...(repairs ?? []),
  ];
  delete (p["meta"] as Record<string, unknown>)["importRepairs"];
  if (mergedRepairs.length) {
    (p["meta"] as Record<string, unknown>)["importRepairs"] = mergedRepairs;
  }

  return p as unknown as TarokeProject;
}

export function validateProject(project: TarokeProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (level: ValidationIssue["level"], area: string, message: string, action: string) =>
    issues.push({ level, area, message, action });

  const defs = projectTrayDefs(project);
  for (const name of Object.keys(project.materials?.trays ?? {})) {
    const def = defs[name] ?? { label: name, role: "literal", desc: "" };
    const c = getTrayTokens(project, name).length;
    if (name !== "reserve" && c === 0)
      push("warning", "samples." + name, `${def.label} has no samples. Devices using it will print blanks.`, "Add samples or reroute the device input.");
    if (name !== "reserve" && c > 0 && c < 3)
      push("note", "samples." + name, `${def.label} has only ${c} sample${c === 1 ? "" : "s"}. Repetition will be strong.`, "Accept the pressure or add more samples.");
  }

  for (const d of project.lineDevices ?? []) {
    if (!d.name) push("error", "devices." + d.id, "A line device has no name.", "Name the device.");
    if (!d.inputs?.length) push("error", "devices." + d.id, `${d.name} has no input slots.`, "Add at least one slot.");
    if (!d.routes?.length) push("error", "devices." + d.id, `${d.name} has no routes.`, "Add a route template.");
    const slots = new Set((d.inputs ?? []).map((i) => i.slot));
    for (const i of d.inputs ?? []) {
      if (!project.materials?.trays?.[i.tray])
        push("error", "devices." + d.id, `${d.name} input ${i.slot} points to missing bank ${i.tray}.`, "Choose an existing sample bank.");
    }
    for (const r of d.routes ?? []) {
      const mentioned = [...String(r.template ?? "").matchAll(/\{([^}:]+):?([^}]*)\}/g)]
        .map((x) => x[1] ?? "")
        .filter((s) => s !== "article");
      for (const s of mentioned) {
        if (!slots.has(s))
          push("error", "devices." + d.id, `${d.name} route "${r.name ?? "untitled"}" uses unknown slot {${s}}.`, "Add a matching input slot or change the template.");
      }
    }
  }

  for (const st of project.stanzaPatterns ?? []) {
    if (!st.slots?.some((s) => s.type === "device"))
      push("error", "stanza." + st.id, `${st.name} has no line device slots.`, "Drag or add at least one device.");
  }

  if (!activeScenes(project).length)
    push("error", "flow", "No enabled scene can run.", "Enable one flow scene and stanza pattern.");

  return issues;
}
