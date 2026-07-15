import { produceWithPatches, type Patch } from "immer";
import { uid } from "@taroke/core";
import type { TarokeProject, Token, LineDevice, Route, StanzaPattern, StanzaSlot, FlowScene, Trigger, DeviceInput } from "@taroke/schema";

// Re-export uid so callers don't need to import from core separately
export { uid };

// ── Command result ─────────────────────────────────────────────────────────────

export interface CommandResult {
  present: TarokeProject;
  patches: Patch[];
  inversePatches: Patch[];
  label: string;
}

function cmd(
  project: TarokeProject,
  label: string,
  mutate: (draft: TarokeProject) => void,
): CommandResult {
  const [present, patches, inversePatches] = produceWithPatches(project, mutate);
  return { present: present as TarokeProject, patches, inversePatches, label };
}

// ── Project info ───────────────────────────────────────────────────────────────

export function setProjectTitle(project: TarokeProject, title: string): CommandResult {
  return cmd(project, "Set title", (d) => { d.project.title = title; });
}

export function setProjectAuthor(project: TarokeProject, author: string): CommandResult {
  return cmd(project, "Set author", (d) => { d.project.author = author; });
}

export function setProjectStatement(project: TarokeProject, statement: string): CommandResult {
  return cmd(project, "Set statement", (d) => { d.project.statement = statement; });
}

export function setProjectCredits(project: TarokeProject, credits: string): CommandResult {
  return cmd(project, "Set credits", (d) => { d.project.credits = credits; });
}

export function setProjectSource(project: TarokeProject, sourceTitle: string, sourceUrl: string): CommandResult {
  return cmd(project, "Set source", (d) => {
    d.project.sourceTitle = sourceTitle;
    d.project.sourceUrl = sourceUrl;
  });
}

// ── Token commands ─────────────────────────────────────────────────────────────

export function addToken(project: TarokeProject, bankName: string, literal: string): CommandResult {
  return cmd(project, `Add sample to ${bankName}`, (d) => {
    const tray = d.materials.trays[bankName];
    if (!tray) return;
    const role = d.materials.bankMeta[bankName]?.role ?? "literal";
    tray.push({ id: uid("tok"), literal: literal.trim(), role, weight: 1, lockedLiteral: false });
  });
}

export function updateTokenLiteral(project: TarokeProject, bankName: string, tokenId: string, literal: string): CommandResult {
  return cmd(project, "Edit sample", (d) => {
    const tok = d.materials.trays[bankName]?.find((t) => t.id === tokenId);
    if (tok) tok.literal = literal;
  });
}

export function setTokenWeight(project: TarokeProject, bankName: string, tokenId: string, weight: number): CommandResult {
  return cmd(project, "Set sample weight", (d) => {
    const tok = d.materials.trays[bankName]?.find((t) => t.id === tokenId);
    if (tok) tok.weight = weight;
  });
}

export function setTokenLockedLiteral(project: TarokeProject, bankName: string, tokenId: string, locked: boolean): CommandResult {
  return cmd(project, "Toggle locked literal", (d) => {
    const tok = d.materials.trays[bankName]?.find((t) => t.id === tokenId);
    if (tok) tok.lockedLiteral = locked;
  });
}

export function removeToken(project: TarokeProject, bankName: string, tokenId: string): CommandResult {
  return cmd(project, `Remove sample from ${bankName}`, (d) => {
    const tray = d.materials.trays[bankName];
    if (!tray) return;
    const idx = tray.findIndex((t) => t.id === tokenId);
    if (idx >= 0) tray.splice(idx, 1);
  });
}

export function reorderTokens(project: TarokeProject, bankName: string, orderedIds: string[]): CommandResult {
  return cmd(project, "Reorder samples", (d) => {
    const tray = d.materials.trays[bankName];
    if (!tray) return;
    const map = new Map(tray.map((t) => [t.id, t]));
    const reordered = orderedIds.map((id) => map.get(id)).filter(Boolean) as Token[];
    d.materials.trays[bankName] = reordered;
  });
}

export function setTokenOverride(project: TarokeProject, tokenId: string, form: string, value: string): CommandResult {
  return cmd(project, "Set form override", (d) => {
    if (!d.forms.overrides[tokenId]) d.forms.overrides[tokenId] = {};
    d.forms.overrides[tokenId]![form] = value;
  });
}

// ── Bank meta commands ─────────────────────────────────────────────────────────

export function setBankLabel(project: TarokeProject, bankName: string, label: string): CommandResult {
  return cmd(project, "Rename bank", (d) => {
    const meta = d.materials.bankMeta[bankName];
    if (meta) meta.label = label;
  });
}

// ── Line device commands ───────────────────────────────────────────────────────

export function addLineDevice(project: TarokeProject, device: LineDevice): CommandResult {
  return cmd(project, "Add line device", (d) => { d.lineDevices.push(device); });
}

export function updateDeviceName(project: TarokeProject, deviceId: string, name: string): CommandResult {
  return cmd(project, "Rename device", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.name = name;
  });
}

export function updateDeviceDescription(project: TarokeProject, deviceId: string, description: string): CommandResult {
  return cmd(project, "Edit device description", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.description = description;
  });
}

export function toggleDeviceEnabled(project: TarokeProject, deviceId: string): CommandResult {
  return cmd(project, "Toggle device", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.enabled = !dev.enabled;
  });
}

export function removeLineDevice(project: TarokeProject, deviceId: string): CommandResult {
  return cmd(project, "Remove line device", (d) => {
    const idx = d.lineDevices.findIndex((x) => x.id === deviceId);
    if (idx >= 0) d.lineDevices.splice(idx, 1);
  });
}

export function reorderLineDevices(project: TarokeProject, orderedIds: string[]): CommandResult {
  return cmd(project, "Reorder devices", (d) => {
    const map = new Map(d.lineDevices.map((x) => [x.id, x]));
    d.lineDevices = orderedIds.map((id) => map.get(id)).filter(Boolean) as LineDevice[];
  });
}

export function addDeviceInput(project: TarokeProject, deviceId: string, input: DeviceInput): CommandResult {
  return cmd(project, "Add device input", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.inputs.push(input);
  });
}

export function removeDeviceInput(project: TarokeProject, deviceId: string, slot: string): CommandResult {
  return cmd(project, "Remove device input", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (!dev) return;
    const idx = dev.inputs.findIndex((i) => i.slot === slot);
    if (idx >= 0) dev.inputs.splice(idx, 1);
  });
}

export function addRouteObj(project: TarokeProject, deviceId: string, route: Route): CommandResult {
  return cmd(project, "Add route", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.routes.push(route);
  });
}

export function updateRouteTemplate(project: TarokeProject, deviceId: string, routeId: string, template: string): CommandResult {
  return cmd(project, "Edit route template", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    const route = dev?.routes.find((r) => r.id === routeId);
    if (route) route.template = template;
  });
}

export function setRouteWeight(project: TarokeProject, deviceId: string, routeId: string, weight: number): CommandResult {
  return cmd(project, "Set route weight", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    const route = dev?.routes.find((r) => r.id === routeId);
    if (route) route.weight = weight;
  });
}

export function removeRoute(project: TarokeProject, deviceId: string, routeId: string): CommandResult {
  return cmd(project, "Remove route", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (!dev) return;
    const idx = dev.routes.findIndex((r) => r.id === routeId);
    if (idx >= 0) dev.routes.splice(idx, 1);
  });
}

// ── Stanza commands ────────────────────────────────────────────────────────────

export function addStanzaPattern(project: TarokeProject, stanza: StanzaPattern): CommandResult {
  return cmd(project, "Add stanza pattern", (d) => { d.stanzaPatterns.push(stanza); });
}

export function updateStanzaName(project: TarokeProject, stanzaId: string, name: string): CommandResult {
  return cmd(project, "Rename stanza", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (s) s.name = name;
  });
}

export function toggleStanzaEnabled(project: TarokeProject, stanzaId: string): CommandResult {
  return cmd(project, "Toggle stanza", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (s) s.enabled = !s.enabled;
  });
}

export function removeStanzaPattern(project: TarokeProject, stanzaId: string): CommandResult {
  return cmd(project, "Remove stanza pattern", (d) => {
    const idx = d.stanzaPatterns.findIndex((x) => x.id === stanzaId);
    if (idx >= 0) d.stanzaPatterns.splice(idx, 1);
  });
}

export function addStanzaSlot(project: TarokeProject, stanzaId: string, slot: StanzaSlot): CommandResult {
  return cmd(project, "Add stanza slot", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (s) s.slots.push(slot);
  });
}

export function removeStanzaSlot(project: TarokeProject, stanzaId: string, slotId: string): CommandResult {
  return cmd(project, "Remove stanza slot", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (!s) return;
    const idx = s.slots.findIndex((sl) => sl.id === slotId);
    if (idx >= 0) s.slots.splice(idx, 1);
  });
}

export function reorderStanzaSlots(project: TarokeProject, stanzaId: string, orderedIds: string[]): CommandResult {
  return cmd(project, "Reorder stanza slots", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (!s) return;
    const map = new Map(s.slots.map((sl) => [sl.id, sl]));
    s.slots = orderedIds.map((id) => map.get(id)).filter(Boolean) as StanzaSlot[];
  });
}

export function setSlotChance(project: TarokeProject, stanzaId: string, slotId: string, chance: number): CommandResult {
  return cmd(project, "Set slot chance", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    const slot = s?.slots.find((sl) => sl.id === slotId);
    if (slot) slot.chance = chance;
  });
}

export function updateSlotLabel(project: TarokeProject, stanzaId: string, slotId: string, label: string): CommandResult {
  return cmd(project, "Set slot label", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    const slot = s?.slots.find((sl) => sl.id === slotId);
    if (slot) slot.label = label;
  });
}

export function setSlotDevice(project: TarokeProject, stanzaId: string, slotId: string, deviceId: string): CommandResult {
  return cmd(project, "Set slot device", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    const slot = s?.slots.find((sl) => sl.id === slotId);
    if (slot) slot.deviceId = deviceId;
  });
}

export function setSlotRepeat(project: TarokeProject, stanzaId: string, slotId: string, repeat: "once" | "loop"): CommandResult {
  return cmd(project, "Set slot repeat", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    const slot = s?.slots.find((sl) => sl.id === slotId);
    if (slot) slot.repeat = repeat;
  });
}

export function reorderStanzaPatterns(project: TarokeProject, orderedIds: string[]): CommandResult {
  return cmd(project, "Reorder patterns", (d) => {
    const map = new Map(d.stanzaPatterns.map((s) => [s.id, s]));
    d.stanzaPatterns = orderedIds.map((id) => map.get(id)).filter(Boolean) as StanzaPattern[];
  });
}

export function setScenePattern(project: TarokeProject, sceneId: string, stanzaId: string): CommandResult {
  return cmd(project, "Set scene pattern", (d) => {
    const s = d.flowScenes.find((x) => x.id === sceneId);
    if (s) s.stanzaId = stanzaId;
  });
}

// ── Flow scene commands ────────────────────────────────────────────────────────

export function addFlowScene(project: TarokeProject, scene: FlowScene): CommandResult {
  return cmd(project, "Add flow scene", (d) => { d.flowScenes.push(scene); });
}

export function updateSceneName(project: TarokeProject, sceneId: string, name: string): CommandResult {
  return cmd(project, "Rename scene", (d) => {
    const s = d.flowScenes.find((x) => x.id === sceneId);
    if (s) s.name = name;
  });
}

export function toggleSceneEnabled(project: TarokeProject, sceneId: string): CommandResult {
  return cmd(project, "Toggle scene", (d) => {
    const s = d.flowScenes.find((x) => x.id === sceneId);
    if (s) s.enabled = !s.enabled;
  });
}

export function setSceneChance(project: TarokeProject, sceneId: string, chance: number): CommandResult {
  return cmd(project, "Set scene chance", (d) => {
    const s = d.flowScenes.find((x) => x.id === sceneId);
    if (s) s.chance = chance;
  });
}

export function removeFlowScene(project: TarokeProject, sceneId: string): CommandResult {
  return cmd(project, "Remove flow scene", (d) => {
    const idx = d.flowScenes.findIndex((x) => x.id === sceneId);
    if (idx >= 0) d.flowScenes.splice(idx, 1);
  });
}

// ── Trigger commands ───────────────────────────────────────────────────────────

export function addTrigger(project: TarokeProject, trigger: Trigger): CommandResult {
  return cmd(project, "Add trigger", (d) => { d.triggers.push(trigger); });
}

export function updateTriggerName(project: TarokeProject, triggerId: string, name: string): CommandResult {
  return cmd(project, "Rename trigger", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) t.name = name;
  });
}

export function toggleTriggerEnabled(project: TarokeProject, triggerId: string): CommandResult {
  return cmd(project, "Toggle trigger", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) t.enabled = !t.enabled;
  });
}

export function setTriggerCondition(project: TarokeProject, triggerId: string, tray: string, term: string): CommandResult {
  return cmd(project, "Set trigger condition", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) { t.condition.tray = tray; t.condition.term = term; }
  });
}

export function setTriggerChance(project: TarokeProject, triggerId: string, chance: number): CommandResult {
  return cmd(project, "Set trigger chance", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) t.chance = chance;
  });
}

export function setTriggerAction(project: TarokeProject, triggerId: string, type: "append" | "prepend" | "replace", text: string): CommandResult {
  return cmd(project, "Set trigger action", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) { t.action.type = type; t.action.text = text; }
  });
}

export function removeTrigger(project: TarokeProject, triggerId: string): CommandResult {
  return cmd(project, "Remove trigger", (d) => {
    const idx = d.triggers.findIndex((x) => x.id === triggerId);
    if (idx >= 0) d.triggers.splice(idx, 1);
  });
}

// ── Surface commands ───────────────────────────────────────────────────────────

export function setSurfaceSpeed(project: TarokeProject, speedMs: number): CommandResult {
  return cmd(project, "Set surface speed", (d) => { d.surface.speedMs = speedMs; });
}

export function setSurfaceRetention(project: TarokeProject, retention: number): CommandResult {
  return cmd(project, "Set surface retention", (d) => { d.surface.retention = retention; });
}

export function setSurfaceFontSize(project: TarokeProject, fontSize: number): CommandResult {
  return cmd(project, "Set font size", (d) => { d.surface.fontSize = fontSize; });
}

export function setSurfaceTheme(project: TarokeProject, theme: string): CommandResult {
  return cmd(project, "Set surface theme", (d) => { d.surface.theme = theme; });
}

export function setSurfaceTraceMode(project: TarokeProject, traceMode: string): CommandResult {
  return cmd(project, "Set trace mode", (d) => { d.surface.traceMode = traceMode; });
}

// ── Forms commands ─────────────────────────────────────────────────────────────

export function setCasePolicy(project: TarokeProject, casePolicy: string): CommandResult {
  return cmd(project, "Set case policy", (d) => { d.forms.casePolicy = casePolicy; });
}

export function setCompoundPolicy(project: TarokeProject, compoundPolicy: string): CommandResult {
  return cmd(project, "Set compound policy", (d) => { d.forms.compoundPolicy = compoundPolicy; });
}

// ── Device shorthand aliases ───────────────────────────────────────────────────

export function addDevice(project: TarokeProject, name: string): CommandResult {
  const device: LineDevice = {
    id: uid("ld"),
    name,
    enabled: true,
    description: "",
    inputs: [],
    routes: [],
  };
  return cmd(project, "Add device", (d) => { d.lineDevices.push(device); });
}

export function removeDevice(project: TarokeProject, deviceId: string): CommandResult {
  return removeLineDevice(project, deviceId);
}

export function toggleDevice(project: TarokeProject, deviceId: string): CommandResult {
  return toggleDeviceEnabled(project, deviceId);
}

export function updateDeviceInputSlot(project: TarokeProject, deviceId: string, idx: number, slot: string): CommandResult {
  return cmd(project, "Rename input slot", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev?.inputs[idx]) dev.inputs[idx]!.slot = slot.trim();
  });
}

export function updateDeviceInputTray(project: TarokeProject, deviceId: string, idx: number, tray: string): CommandResult {
  return cmd(project, "Change input bank", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev?.inputs[idx]) dev.inputs[idx]!.tray = tray;
  });
}

export function updateDeviceInputRole(project: TarokeProject, deviceId: string, idx: number, role: string): CommandResult {
  return cmd(project, "Change input role", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev?.inputs[idx]) dev.inputs[idx]!.role = role;
  });
}

export function reorderDeviceInputs(project: TarokeProject, deviceId: string, newOrder: number[]): CommandResult {
  return cmd(project, "Reorder device inputs", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (!dev) return;
    const reordered = newOrder.map((i) => dev.inputs[i]).filter(Boolean) as DeviceInput[];
    dev.inputs = reordered;
  });
}

export function updateRouteName(project: TarokeProject, deviceId: string, routeId: string, name: string): CommandResult {
  return cmd(project, "Rename route", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    const route = dev?.routes.find((r) => r.id === routeId);
    if (route) route.name = name;
  });
}

// addRoute shorthand — creates a new default route
export function addRoute(project: TarokeProject, deviceId: string, routeOverride?: Partial<Route>): CommandResult {
  const route: Route = {
    id: uid("rt"),
    name: `Route ${(project.lineDevices.find((d) => d.id === deviceId)?.routes.length ?? 0) + 1}`,
    weight: 50,
    template: "",
    ...routeOverride,
  };
  return cmd(project, "Add route", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.routes.push(route);
  });
}

