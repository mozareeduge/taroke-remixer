import { describe, it, expect } from "vitest";
import { enablePatches } from "immer";
enablePatches();
import { configureStore } from "@reduxjs/toolkit";
import projectReducer, { mutateProject, setProject } from "../../store/projectSlice.js";
import selectionReducer, { selectBank, selectToken, selectTrigger, selectDevice } from "../../store/selectionSlice.js";
import editorReducer, { setActivePanel } from "../../store/editorSlice.js";
import runtimeReducer from "../../store/runtimeSlice.js";
import historyReducer from "../../store/historySlice.js";
import importReceiptReducer from "../../store/importReceiptSlice.js";
import takesReducer from "../../store/takesSlice.js";
import surfaceReducer from "../../store/surfaceSlice.js";
import feedbackReducer from "../../store/feedbackSlice.js";
import { selectionIntegrityMiddleware } from "../../store/selectionIntegrityMiddleware.js";
import { selectionOwner, selectionAllowedInPanel, validateSelection } from "../../store/selectionRules.js";
import { removeToken } from "../../store/commands.js";
import { PHASE_A_NEUTRAL_TEST_FIXTURE } from "../neutral-test-fixture.js";

function makeStore() {
  const store = configureStore({
    reducer: {
      project: projectReducer,
      selection: selectionReducer,
      editor: editorReducer,
      runtime: runtimeReducer,
      history: historyReducer,
      importReceipt: importReceiptReducer,
      takes: takesReducer,
      surface: surfaceReducer,
      feedback: feedbackReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActionPaths: ["payload.patches", "payload.inversePatches"] },
      }).concat(selectionIntegrityMiddleware),
  });
  store.dispatch(mutateProject({ present: PHASE_A_NEUTRAL_TEST_FIXTURE, patches: [], inversePatches: [], label: "load fixture" }));
  return store;
}

describe("selectionRules (SEL-01)", () => {
  it("assigns each target type to exactly one owning chamber", () => {
    expect(selectionOwner({ type: "bank", bankName: "nouns" })).toBe("materials");
    expect(selectionOwner({ type: "token", bankName: "nouns", tokenId: "t1" })).toBe("materials");
    expect(selectionOwner({ type: "device", deviceId: "d1" })).toBe("instruments");
    expect(selectionOwner({ type: "route", deviceId: "d1", routeId: "r1" })).toBe("instruments");
    expect(selectionOwner({ type: "stanza", stanzaId: "s1" })).toBe("composition");
    expect(selectionOwner({ type: "scene", sceneId: "sc1" })).toBe("composition");
    expect(selectionOwner({ type: "trigger", triggerId: "tr1" })).toBe("automation");
    expect(selectionOwner(null)).toBeNull();
  });

  it("selectionAllowedInPanel rejects a target owned by a different chamber", () => {
    const bankTarget = { type: "bank" as const, bankName: "nouns" };
    expect(selectionAllowedInPanel(bankTarget, "materials")).toBe(true);
    expect(selectionAllowedInPanel(bankTarget, "automation")).toBe(false);
    expect(selectionAllowedInPanel(null, "automation")).toBe(true);
  });

  it("validateSelection detects deleted objects", () => {
    const project = PHASE_A_NEUTRAL_TEST_FIXTURE;
    expect(validateSelection(project, { type: "token", bankName: "nouns", tokenId: "tok_n1" })).toBe(true);
    expect(validateSelection(project, { type: "token", bankName: "nouns", tokenId: "does-not-exist" })).toBe(false);
    expect(validateSelection(project, { type: "bank", bankName: "does-not-exist" })).toBe(false);
    expect(validateSelection(project, { type: "trigger", triggerId: "trig_1" })).toBe(true);
  });
});

describe("selectionIntegrityMiddleware — chamber ownership (SEL-01, SEL-06)", () => {
  it("never leaves an incompatible selection visible after switching chambers", () => {
    const store = makeStore();
    store.dispatch(selectBank("nouns"));
    expect(store.getState().selection.primary).toEqual({ type: "bank", bankName: "nouns" });

    store.dispatch(setActivePanel("automation"));
    const after = store.getState().selection.primary;
    expect(after === null || selectionAllowedInPanel(after, "automation")).toBe(true);
    expect(after).not.toEqual({ type: "bank", bankName: "nouns" });
  });

  it("restores a chamber's own last valid selection when returning to it", () => {
    const store = makeStore();
    store.dispatch(selectBank("nouns"));
    store.dispatch(setActivePanel("automation"));
    store.dispatch(selectTrigger("trig_1"));

    store.dispatch(setActivePanel("materials"));
    expect(store.getState().selection.primary).toEqual({ type: "bank", bankName: "nouns" });

    store.dispatch(setActivePanel("automation"));
    expect(store.getState().selection.primary).toEqual({ type: "trigger", triggerId: "trig_1" });
  });

  it("does not restore a remembered selection that no longer resolves", () => {
    const store = makeStore();
    store.dispatch(selectToken({ bankName: "nouns", tokenId: "tok_n1" }));
    store.dispatch(setActivePanel("automation"));

    // Delete the remembered token from another chamber's perspective.
    store.dispatch(mutateProject(removeToken(store.getState().project.present, "nouns", "tok_n1")));

    store.dispatch(setActivePanel("materials"));
    expect(store.getState().selection.primary).toBeNull();
  });
});

describe("selectionIntegrityMiddleware — repair after mutation (SEL-04)", () => {
  it("clears selection when the selected token is removed", () => {
    const store = makeStore();
    store.dispatch(selectToken({ bankName: "nouns", tokenId: "tok_n1" }));
    expect(store.getState().selection.primary).not.toBeNull();

    store.dispatch(mutateProject(removeToken(store.getState().project.present, "nouns", "tok_n1")));
    expect(store.getState().selection.primary).toBeNull();
  });

  it("leaves selection intact when the mutation does not affect it", () => {
    const store = makeStore();
    store.dispatch(selectToken({ bankName: "nouns", tokenId: "tok_n1" }));
    store.dispatch(mutateProject(removeToken(store.getState().project.present, "verbs", "tok_v1")));
    expect(store.getState().selection.primary).toEqual({ type: "token", bankName: "nouns", tokenId: "tok_n1" });
  });

  it("clears an invalid selection on project replacement (import)", () => {
    const store = makeStore();
    store.dispatch(selectDevice("ld_test1"));
    expect(store.getState().selection.primary).not.toBeNull();

    store.dispatch(setProject({ ...PHASE_A_NEUTRAL_TEST_FIXTURE, lineDevices: [] }));
    expect(store.getState().selection.primary).toBeNull();
  });
});
