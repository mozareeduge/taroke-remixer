import { describe, it, expect } from "vitest";
import surfaceReducer, {
  appendSurfaceLine,
  clearSurface,
  setRetention,
  setFollowPolicy,
  type SurfaceLine,
} from "../../store/surfaceSlice.js";
import takesReducer, {
  captureTake,
  selectTake,
  renameTake,
  deleteTake,
  clearTakes,
} from "../../store/takesSlice.js";
import { enablePatches } from "immer";
import {
  addDevice,
  removeDevice,
  toggleDevice,
  updateDeviceInputSlot,
  updateDeviceInputTray,
  updateDeviceInputRole,
  addRoute,
  updateRouteName,
  reorderStanzaPatterns,
  updateSlotLabel,
  setSlotDevice,
  setScenePattern,
  addStanzaPattern,
  addFlowScene,
} from "../../store/commands.js";
import { defaultProject } from "@taroke/core";

enablePatches();

function makeLine(overrides: Partial<SurfaceLine> = {}): SurfaceLine {
  return {
    id: "sl_test",
    tick: 0,
    text: "test line",
    trace: "",
    sceneId: null,
    stanzaId: null,
    deviceId: null,
    routeId: null,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ── surfaceSlice ───────────────────────────────────────────────────────────────

describe("surfaceSlice", () => {
  it("initial state has empty lines and tail follow policy", () => {
    const s = surfaceReducer(undefined, { type: "@@INIT" });
    expect(s.lines).toHaveLength(0);
    expect(s.followPolicy).toBe("tail");
    expect(s.retention).toBe(8);
  });

  it("appendSurfaceLine adds a line", () => {
    const line = makeLine({ id: "sl_1", text: "hello" });
    const s = surfaceReducer(undefined, appendSurfaceLine(line));
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0]!.text).toBe("hello");
  });

  it("respects retention limit", () => {
    let s = surfaceReducer(undefined, setRetention(3));
    for (let i = 0; i < 5; i++) {
      s = surfaceReducer(s, appendSurfaceLine(makeLine({ id: `sl_${i}`, text: `line ${i}` })));
    }
    expect(s.lines).toHaveLength(3);
    expect(s.lines[0]!.text).toBe("line 2");
  });

  it("clearSurface empties lines", () => {
    let s = surfaceReducer(undefined, appendSurfaceLine(makeLine()));
    s = surfaceReducer(s, clearSurface());
    expect(s.lines).toHaveLength(0);
  });

  it("setFollowPolicy changes policy", () => {
    const s = surfaceReducer(undefined, setFollowPolicy("manual"));
    expect(s.followPolicy).toBe("manual");
  });
});

// ── takesSlice ────────────────────────────────────────────────────────────────

describe("takesSlice", () => {
  it("initial state has no takes", () => {
    const s = takesReducer(undefined, { type: "@@INIT" });
    expect(s.takes).toHaveLength(0);
    expect(s.selectedTakeId).toBeNull();
  });

  it("captureTake adds a take and selects it", () => {
    const lines = [makeLine({ id: "sl_1", text: "captured" })];
    const s = takesReducer(undefined, captureTake({ id: "take_1", label: "Take 1", lines, projectTitle: "My Project" }));
    expect(s.takes).toHaveLength(1);
    expect(s.takes[0]!.label).toBe("Take 1");
    expect(s.takes[0]!.lines).toEqual(lines);
    expect(s.selectedTakeId).toBe("take_1");
  });

  it("selectTake switches selected take", () => {
    const lines = [makeLine()];
    let s = takesReducer(undefined, captureTake({ id: "take_1", label: "A", lines, projectTitle: "P" }));
    s = takesReducer(s, captureTake({ id: "take_2", label: "B", lines, projectTitle: "P" }));
    s = takesReducer(s, selectTake("take_1"));
    expect(s.selectedTakeId).toBe("take_1");
  });

  it("renameTake updates label", () => {
    const lines = [makeLine()];
    let s = takesReducer(undefined, captureTake({ id: "take_1", label: "Old", lines, projectTitle: "P" }));
    s = takesReducer(s, renameTake({ id: "take_1", label: "New Name" }));
    expect(s.takes[0]!.label).toBe("New Name");
  });

  it("deleteTake removes take and clears selection", () => {
    const lines = [makeLine()];
    let s = takesReducer(undefined, captureTake({ id: "take_1", label: "T", lines, projectTitle: "P" }));
    s = takesReducer(s, deleteTake("take_1"));
    expect(s.takes).toHaveLength(0);
    expect(s.selectedTakeId).toBeNull();
  });

  it("deleteTake selects previous take when available", () => {
    const lines = [makeLine()];
    let s = takesReducer(undefined, captureTake({ id: "take_1", label: "A", lines, projectTitle: "P" }));
    s = takesReducer(s, captureTake({ id: "take_2", label: "B", lines, projectTitle: "P" }));
    s = takesReducer(s, deleteTake("take_2"));
    expect(s.selectedTakeId).toBe("take_1");
  });

  it("clearTakes removes all takes and selection", () => {
    const lines = [makeLine()];
    let s = takesReducer(undefined, captureTake({ id: "take_1", label: "T", lines, projectTitle: "P" }));
    s = takesReducer(s, clearTakes());
    expect(s.takes).toHaveLength(0);
    expect(s.selectedTakeId).toBeNull();
  });
});

// ── Device command extensions ──────────────────────────────────────────────────

describe("addDevice / removeDevice / toggleDevice", () => {
  it("addDevice adds a new device with empty inputs and routes", () => {
    const p = defaultProject();
    const before = p.lineDevices.length;
    const result = addDevice(p, "NEW DEVICE");
    expect(result.present.lineDevices.length).toBe(before + 1);
    const newDev = result.present.lineDevices[result.present.lineDevices.length - 1]!;
    expect(newDev.name).toBe("NEW DEVICE");
    expect(newDev.enabled).toBe(true);
    expect(newDev.inputs).toHaveLength(0);
    expect(newDev.routes).toHaveLength(0);
  });

  it("removeDevice removes by id", () => {
    const p = defaultProject();
    const devId = p.lineDevices[0]!.id;
    const result = removeDevice(p, devId);
    expect(result.present.lineDevices.find((d) => d.id === devId)).toBeUndefined();
  });

  it("toggleDevice flips enabled", () => {
    const p = defaultProject();
    const dev = p.lineDevices[0]!;
    const r1 = toggleDevice(p, dev.id);
    expect(r1.present.lineDevices.find((d) => d.id === dev.id)!.enabled).toBe(!dev.enabled);
    const r2 = toggleDevice(r1.present, dev.id);
    expect(r2.present.lineDevices.find((d) => d.id === dev.id)!.enabled).toBe(dev.enabled);
  });
});

describe("updateDeviceInputSlot / Tray / Role", () => {
  it("updateDeviceInputSlot renames a slot", () => {
    const p = defaultProject();
    const dev = p.lineDevices[0]!;
    const result = updateDeviceInputSlot(p, dev.id, 0, "newslot");
    expect(result.present.lineDevices[0]!.inputs[0]!.slot).toBe("newslot");
  });

  it("updateDeviceInputTray changes bank reference", () => {
    const p = defaultProject();
    const dev = p.lineDevices[0]!;
    const banks = Object.keys(p.materials.trays);
    const newBank = banks[1] ?? banks[0]!;
    const result = updateDeviceInputTray(p, dev.id, 0, newBank);
    expect(result.present.lineDevices[0]!.inputs[0]!.tray).toBe(newBank);
  });

  it("updateDeviceInputRole changes role", () => {
    const p = defaultProject();
    const dev = p.lineDevices[0]!;
    const result = updateDeviceInputRole(p, dev.id, 0, "adjective");
    expect(result.present.lineDevices[0]!.inputs[0]!.role).toBe("adjective");
  });
});

describe("addRoute / updateRouteName", () => {
  it("addRoute creates a new route with unique id", () => {
    const p = defaultProject();
    const dev = p.lineDevices[0]!;
    const before = dev.routes.length;
    const result = addRoute(p, dev.id);
    expect(result.present.lineDevices[0]!.routes.length).toBe(before + 1);
    const newRoute = result.present.lineDevices[0]!.routes[before]!;
    expect(newRoute.id).toBeTruthy();
    expect(newRoute.weight).toBe(50);
  });

  it("updateRouteName renames route", () => {
    const p = defaultProject();
    const dev = p.lineDevices[0]!;
    const routeId = dev.routes[0]!.id;
    const result = updateRouteName(p, dev.id, routeId, "renamed");
    const route = result.present.lineDevices[0]!.routes.find((r) => r.id === routeId)!;
    expect(route.name).toBe("renamed");
  });
});

describe("reorderStanzaPatterns", () => {
  it("reorders patterns by id array", () => {
    const p = defaultProject();
    // Add a second pattern
    const patA = p.stanzaPatterns[0]!;
    const r1 = addStanzaPattern(p, { ...patA, id: "st_b", name: "B", slots: [] });
    const twoIds = r1.present.stanzaPatterns.map((s) => s.id);
    const reversed = [...twoIds].reverse();
    const r2 = reorderStanzaPatterns(r1.present, reversed);
    expect(r2.present.stanzaPatterns.map((s) => s.id)).toEqual(reversed);
  });
});

describe("setSlotDevice / setScenePattern", () => {
  it("setSlotDevice changes slot's deviceId", () => {
    const p = defaultProject();
    const pat = p.stanzaPatterns[0]!;
    const slot = pat.slots.find((s) => s.type === "device")!;
    const newDevId = p.lineDevices[1]?.id ?? p.lineDevices[0]!.id;
    const result = setSlotDevice(p, pat.id, slot.id, newDevId);
    const updatedSlot = result.present.stanzaPatterns[0]!.slots.find((s) => s.id === slot.id)!;
    expect(updatedSlot.deviceId).toBe(newDevId);
  });

  it("setScenePattern changes scene's stanzaId", () => {
    const p = defaultProject();
    const scene = p.flowScenes[0];
    if (!scene || p.stanzaPatterns.length < 2) return;
    const newPatId = p.stanzaPatterns[1]!.id;
    const result = setScenePattern(p, scene.id, newPatId);
    expect(result.present.flowScenes[0]!.stanzaId).toBe(newPatId);
  });
});

describe("updateSlotLabel", () => {
  it("updates slot label", () => {
    const p = defaultProject();
    const pat = p.stanzaPatterns[0]!;
    const slot = pat.slots[0]!;
    const result = updateSlotLabel(p, pat.id, slot.id, "MY SLOT");
    const updated = result.present.stanzaPatterns[0]!.slots[0]!;
    expect(updated.label).toBe("MY SLOT");
  });
});
