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
        { slot: "above", tray: "above", role: "noun" },
        { slot: "trans", tray: "trans", role: "verb" },
        { slot: "below", tray: "below", role: "noun" },
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
        { slot: "thing", tray: "above", role: "noun" },
        { slot: "intrans", tray: "intrans", role: "verb" },
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
        { slot: "imper", tray: "imper", role: "verb" },
        { slot: "adjs", tray: "adjs", role: "adjective" },
        { slot: "texture", tray: "texture", role: "noun" },
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

export function defaultProject(): TarokeProject {
  const trays: TarokeProject["materials"]["trays"] = {
    above:   ["grave", "paper-body", "unknown-box", "gateway", "baby", "office", "joint", "guardrail", "giant-hole"].map((s) => token(s, "noun")),
    below:   ["floor", "wall", "basement", "baby", "rat", "drug", "document", "piece"].map((s) => token(s, "noun")),
    trans:   ["carry", "push", "shake", "refuse", "flirt", "spank", "uplift", "expire"].map((s) => token(s, "verb")),
    imper:   ["enter", "leave", "drink", "twist", "package", "mark"].map((s) => token(s, "verb")),
    intrans: ["rush", "rise", "wait", "soak", "expire"].map((s) => token(s, "verb")),
    texture: ["paper", "foil", "garbage", "shroud", "receipt", "sticky"].map((s) => token(s, "noun")),
    adjs:    ["wet", "broken", "folded", "legal", "black", "exploded", "rainbow"].map((s) => token(s, "adjective")),
    reserve: [],
  };
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      title: "Grave sample",
      author: "Mozare",
      sourceTitle: "Taroko Gorge",
      sourceUrl: "https://collection.eliterature.org/3/works/taroko-gorge/taroko-gorge.html",
      statement: "A local-first remix machine for shaping source samples, form modulation, line devices, stanza patterns, flow scenes, triggers, output surface, and event tape.",
      credits: "Made with TAROKE RIMIXER.",
      language: "en",
    },
    workbench: { theme: "night", relief: "medium", density: "standard", texture: "source" },
    materials: { trays, bankMeta: clone(TRAY_DEFS) },
    forms: { language: "en", casePolicy: "preserve", compoundPolicy: "head", overrides: {} },
    lineDevices: classicLineDevices(),
    stanzaPatterns: classicStanzaPatterns(),
    flowScenes: [{ id: "sc_classic", name: "Classic scene", stanzaId: "st_classic", enabled: true, chance: 100, mode: "loop" }],
    triggers: [{ id: "tr_box", name: "box intrusion", enabled: true, condition: { tray: "above", term: "unknown-box" }, chance: 35, action: { type: "append", text: "[BOX EVENT]" } }],
    surface: { family: "taroko", traceMode: "hidden", theme: "night", speedMs: 1200, retention: 28, fontSize: 21, lineHeight: 1.48, showTitle: true, showSource: true, showTick: false },
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

  // D: bankMeta
  const rawBankMeta = (inp["materials"] as Record<string, unknown> | undefined)?.["bankMeta"];
  const importedBankMeta =
    rawBankMeta && typeof rawBankMeta === "object" ? clone(rawBankMeta as object) as Record<string, Record<string, string>> : {};
  const bankMeta: Record<string, { label: string; role: string; desc: string }> = {};
  for (const k of Object.keys(rawTrays)) {
    const m = importedBankMeta[k] ?? {};
    bankMeta[k] = Object.assign(
      {
        label: TRAY_DEFS[k]?.label ?? k.toUpperCase(),
        role: TRAY_DEFS[k]?.role ?? "literal",
        desc: TRAY_DEFS[k]?.desc ?? "custom sample bank",
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
