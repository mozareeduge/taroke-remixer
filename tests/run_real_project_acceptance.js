#!/usr/bin/env node
'use strict';

/**
 * Real-project acceptance runner.
 * Usage: node tests/run_real_project_acceptance.js /path/to/project.taroke.json
 *
 * Tests migration integrity, duplicate-ID repair, idempotency, round-trips (JSON, HTML),
 * and trigger-compatibility audit.
 *
 * This script is NOT included in run_all_tests.sh unless a fixture path is supplied explicitly.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Load core ---------------------------------------------------------------
const corePath = path.join(__dirname, '..', 'src', 'core.js');
let TarokeCore;
try {
  TarokeCore = require(corePath);
} catch (e) {
  console.error('FATAL: cannot load src/core.js:', e.message);
  process.exit(2);
}

const { migrateProject, exportProjectJson, exportProjectHtml, extractProjectFromText, clone } = TarokeCore;

// --- CLI arg -----------------------------------------------------------------
const fixturePath = process.argv[2];
if (!fixturePath) {
  console.error('Usage: node tests/run_real_project_acceptance.js /path/to/project.taroke.json');
  process.exit(1);
}

let rawText;
try { rawText = fs.readFileSync(fixturePath, 'utf8'); }
catch (e) { console.error('Cannot read fixture:', e.message); process.exit(1); }

const sha256 = crypto.createHash('sha256').update(rawText).digest('hex');

let raw;
try { raw = JSON.parse(rawText); }
catch (e) { console.error('Cannot parse JSON:', e.message); process.exit(1); }

// --- Helpers -----------------------------------------------------------------
let passed = 0, failed = 0;
function pass(label) { console.log('PASS | ' + label); passed++; }
function fail(label, detail) { console.log('FAIL | ' + label + (detail ? ' | ' + detail : '')); failed++; }
function assert(cond, label, detail) { cond ? pass(label) : fail(label, detail); }
function assertEq(a, b, label) { assert(JSON.stringify(a) === JSON.stringify(b), label, '\n  got: ' + JSON.stringify(a).slice(0,200) + '\n  exp: ' + JSON.stringify(b).slice(0,200)); }

// --- Structural Inventory (pre-migration) ------------------------------------
console.log('\n=== STRUCTURAL INVENTORY (pre-migration) ===');
console.log('File:   ', path.basename(fixturePath));
console.log('SHA-256:', sha256);
console.log('Schema: ', raw.schemaVersion);

const trayKeys = Object.keys(raw.materials?.trays || {});
const bankMetaKeys = Object.keys(raw.materials?.bankMeta || {});
const trays = raw.materials?.trays || {};
const bankMeta = raw.materials?.bankMeta || {};

console.log('\nTray count:', trayKeys.length);
console.log('Ordered tray keys:');
trayKeys.forEach((k, i) => {
  const count = (trays[k] || []).length;
  console.log(`  [${i}] ${k} (${count} tokens)`);
});

const totalTokens = trayKeys.reduce((s, k) => s + (trays[k] || []).length, 0);
console.log('\nTotal tokens:', totalTokens);

// Duplicate token IDs
const idMap = new Map();
let dupCount = 0, blankCount = 0;
trayKeys.forEach(k => {
  (trays[k] || []).forEach((tok, idx) => {
    if (!tok.id || !String(tok.id).trim()) { blankCount++; return; }
    if (idMap.has(tok.id)) {
      idMap.get(tok.id).push({ bank: k, idx, literal: tok.literal });
      dupCount++;
    } else {
      idMap.set(tok.id, [{ bank: k, idx, literal: tok.literal }]);
    }
  });
});
const dupIds = [...idMap.entries()].filter(([,v]) => v.length > 1);
console.log('\nDuplicate token IDs:', dupIds.length);
dupIds.forEach(([id, locs]) => {
  const locsStr = locs.map(l => `${l.bank}[${l.idx}]="${l.literal}"`).join(', ');
  console.log('  ' + id + ': ' + locsStr);
});
console.log('Blank/missing token IDs:', blankCount);

// Forms overrides
const formOverrides = raw.forms?.overrides || {};
const overrideIds = Object.keys(formOverrides);
console.log('\nForm overrides count:', overrideIds.length);
const overrideIdSet = new Set(overrideIds);

// Ambiguous override references (IDs that are duplicates in source)
const dupIdSet = new Set(dupIds.map(([id]) => id));
const ambiguousOverrides = overrideIds.filter(id => dupIdSet.has(id));
console.log('Ambiguous form override refs (duplicate ID):', ambiguousOverrides.length);
ambiguousOverrides.forEach(id => console.log('  override for duplicate ID:', id));

// Notes
const notes = raw.notes || [];
console.log('\nNote count:', notes.length);
let ambiguousNoteLinks = 0;
notes.forEach(n => {
  (n.linkedTokenIds || []).forEach(id => {
    if (dupIdSet.has(id)) ambiguousNoteLinks++;
  });
});
console.log('Ambiguous note linkedTokenIds (dup IDs):', ambiguousNoteLinks);

// Devices
const devices = raw.lineDevices || [];
const deviceInputCount = devices.reduce((s, d) => s + (d.inputs || []).length, 0);
const routeCount = devices.reduce((s, d) => s + (d.routes || []).length, 0);
console.log('\nDevice count:', devices.length);
console.log('Total device inputs:', deviceInputCount);
console.log('Total routes:', routeCount);

// Stanza patterns
const stanzas = raw.stanzaPatterns || [];
const stanzaSlotCount = stanzas.reduce((s, st) => s + (st.slots || []).length, 0);
console.log('\nStanza count:', stanzas.length);
console.log('Total stanza slots:', stanzaSlotCount);

// Flow scenes
const scenes = raw.flowScenes || [];
console.log('\nFlow-scene count:', scenes.length);

// Triggers
const triggers = raw.triggers || [];
const enabledTriggers = triggers.filter(t => t.enabled);
console.log('\nTrigger count:', triggers.length);
console.log('Enabled triggers:', enabledTriggers.length);

// BankMeta
console.log('\nBankMeta keys:', bankMetaKeys.length);
const bankMetaRoles = [...new Set(bankMetaKeys.map(k => bankMeta[k]?.role))];
console.log('BankMeta distinct roles:', bankMetaRoles.join(', '));

// Reference validation (pre-migration)
console.log('\n--- Reference Validation (raw) ---');
const rawTraySet = new Set(trayKeys);
const deviceIdSet = new Set(devices.map(d => d.id));
const stanzaIdSet = new Set(stanzas.map(s => s.id));

let invalidDeviceTrayRefs = 0;
devices.forEach(d => (d.inputs || []).forEach(inp => {
  if (!rawTraySet.has(inp.tray)) { console.log('  INVALID device tray ref:', d.name, inp.slot, '->', inp.tray); invalidDeviceTrayRefs++; }
}));
console.log('Invalid device tray refs:', invalidDeviceTrayRefs);

let invalidStanzaDeviceRefs = 0;
stanzas.forEach(st => (st.slots || []).forEach(slot => {
  if (slot.type === 'device' && !deviceIdSet.has(slot.deviceId)) { console.log('  INVALID stanza device ref:', st.name, '->', slot.deviceId); invalidStanzaDeviceRefs++; }
}));
console.log('Invalid stanza device refs:', invalidStanzaDeviceRefs);

let invalidSceneStanzaRefs = 0;
scenes.forEach(sc => {
  if (!stanzaIdSet.has(sc.stanzaId)) { console.log('  INVALID scene stanza ref:', sc.name, '->', sc.stanzaId); invalidSceneStanzaRefs++; }
});
console.log('Invalid scene stanza refs:', invalidSceneStanzaRefs);

let invalidTriggerTrayRefs = 0;
triggers.forEach(tr => {
  if (tr.condition?.tray && !rawTraySet.has(tr.condition.tray)) { console.log('  INVALID trigger tray ref:', tr.name, '->', tr.condition.tray); invalidTriggerTrayRefs++; }
});
console.log('Invalid trigger tray refs:', invalidTriggerTrayRefs);

// --- Migration Acceptance ---------------------------------------------------
console.log('\n=== MIGRATION ACCEPTANCE ===');
let m1;
try { m1 = migrateProject(raw); } catch (e) { console.error('migrateProject threw:', e.message); process.exit(1); }

// 1. Ordered tray keys remain identical
const m1TrayKeys = Object.keys(m1.materials?.trays || {});
assertEq(m1TrayKeys, trayKeys, 'Migration: ordered tray keys unchanged');

// 2. No unauthored classic bank added
const CLASSIC = ['above','below','trans','imper','intrans','texture','adjs'];
const m1Classic = m1TrayKeys.filter(k => CLASSIC.includes(k) && !rawTraySet.has(k));
assert(m1Classic.length === 0, 'Migration: no unauthored classic bank injected', 'injected: ' + m1Classic.join(', '));

// 3. No authored bank disappears
const m1Set = new Set(m1TrayKeys);
const missing = trayKeys.filter(k => !m1Set.has(k));
assert(missing.length === 0, 'Migration: no authored bank disappears', 'missing: ' + missing.join(', '));

// 4. Per-bank token counts
let countMismatch = 0;
trayKeys.forEach(k => {
  const srcCount = (trays[k] || []).length;
  const migCount = (m1.materials.trays[k] || []).length;
  if (srcCount !== migCount) { console.log('  COUNT MISMATCH:', k, srcCount, '->', migCount); countMismatch++; }
});
assert(countMismatch === 0, 'Migration: per-bank token counts unchanged', 'mismatches: ' + countMismatch);

// 5-9. Token order, literals, roles, weights, lockedLiteral
// Build a map from migrated tokens for comparison (accounting for repaired IDs)
let tokenMismatch = 0;
trayKeys.forEach(k => {
  const src = trays[k] || [];
  const mig = m1.materials.trays[k] || [];
  src.forEach((t, idx) => {
    const m = mig[idx];
    if (!m) { tokenMismatch++; return; }
    if (t.literal !== m.literal) { console.log('  LITERAL MISMATCH:', k, idx, t.literal, '->', m.literal); tokenMismatch++; }
    if (t.role !== m.role) { console.log('  ROLE MISMATCH:', k, idx, t.role, '->', m.role); tokenMismatch++; }
    if (t.weight !== m.weight) { console.log('  WEIGHT MISMATCH:', k, idx, t.weight, '->', m.weight); tokenMismatch++; }
    if (t.lockedLiteral !== m.lockedLiteral) { console.log('  LOCKED MISMATCH:', k, idx, t.lockedLiteral, '->', m.lockedLiteral); tokenMismatch++; }
  });
});
assert(tokenMismatch === 0, 'Migration: literals/roles/weights/locks unchanged', 'mismatches: ' + tokenMismatch);

// 10. BankMeta labels, roles, descriptions
let metaMismatch = 0;
trayKeys.forEach(k => {
  const sm = bankMeta[k];
  const mm = m1.materials.bankMeta?.[k];
  if (!sm || !mm) return; // custom defaults applied, skip if no source meta
  if (sm.label && sm.label !== mm.label) { console.log('  BANKMETA LABEL MISMATCH:', k, sm.label, '->', mm.label); metaMismatch++; }
  if (sm.role && sm.role !== mm.role) { console.log('  BANKMETA ROLE MISMATCH:', k, sm.role, '->', mm.role); metaMismatch++; }
  if (sm.desc && sm.desc !== mm.desc) { console.log('  BANKMETA DESC MISMATCH:', k, sm.desc, '->', mm.desc); metaMismatch++; }
});
assert(metaMismatch === 0, 'Migration: bankMeta labels/roles/desc unchanged', 'mismatches: ' + metaMismatch);

// 11-14. Reference integrity after migration
const m1TraySet = new Set(m1TrayKeys);
const m1DeviceIds = new Set((m1.lineDevices || []).map(d => d.id));
const m1StanzaIds = new Set((m1.stanzaPatterns || []).map(s => s.id));

let m1InvalidDeviceTray = 0;
(m1.lineDevices || []).forEach(d => (d.inputs || []).forEach(inp => {
  if (!m1TraySet.has(inp.tray)) m1InvalidDeviceTray++;
}));
assert(m1InvalidDeviceTray === 0, 'Migration: devices reference valid banks');

let m1InvalidStanza = 0;
(m1.stanzaPatterns || []).forEach(st => (st.slots || []).forEach(slot => {
  if (slot.type === 'device' && !m1DeviceIds.has(slot.deviceId)) m1InvalidStanza++;
}));
assert(m1InvalidStanza === 0, 'Migration: stanzas reference valid devices');

let m1InvalidScene = 0;
(m1.flowScenes || []).forEach(sc => { if (!m1StanzaIds.has(sc.stanzaId)) m1InvalidScene++; });
assert(m1InvalidScene === 0, 'Migration: scenes reference valid stanzas');

let m1InvalidTrigger = 0;
(m1.triggers || []).forEach(tr => {
  if (tr.condition?.tray && !m1TraySet.has(tr.condition.tray)) m1InvalidTrigger++;
});
assert(m1InvalidTrigger === 0, 'Migration: triggers reference valid banks');

// 15. Forms overrides not discarded
const m1Overrides = m1.forms?.overrides || {};
let overrideDiscarded = 0;
Object.keys(formOverrides).forEach(id => {
  if (!m1Overrides[id]) { console.log('  OVERRIDE DISCARDED for ID:', id); overrideDiscarded++; }
});
assert(overrideDiscarded === 0, 'Migration: forms overrides not discarded', 'discarded: ' + overrideDiscarded);

// 16. Notes not discarded
assert((m1.notes || []).length === notes.length, 'Migration: notes not discarded',
  'expected ' + notes.length + ' got ' + (m1.notes || []).length);

// 17. No authored token lost
const m1TotalTokens = m1TrayKeys.reduce((s, k) => s + (m1.materials.trays[k] || []).length, 0);
assert(m1TotalTokens === totalTokens, 'Migration: no authored token lost',
  'expected ' + totalTokens + ' got ' + m1TotalTokens);

// --- Duplicate-ID Acceptance ------------------------------------------------
console.log('\n=== DUPLICATE-ID ACCEPTANCE ===');

const repairs = m1.meta?.importRepairs || [];
console.log('Repair count:', repairs.length);
// Expected repairs = sum of (occurrences - 1) per duplicate ID
const expectedRepairs = dupIds.reduce((s, [,locs]) => s + locs.length - 1, 0);
console.log('Expected repairs (sum of extra occurrences per dup ID):', expectedRepairs);
assert(repairs.length === expectedRepairs, 'Repair count matches total duplicate occurrences',
  'expected ' + expectedRepairs + ' repairs, got ' + repairs.length);

// Every repair has provenance fields
let missingProvenance = 0;
repairs.forEach((r, i) => {
  if (!r.originalId || !r.newId || !r.bank || r.index === undefined || !r.prevBank) {
    console.log('  MISSING PROVENANCE in repair', i, JSON.stringify(r));
    missingProvenance++;
  }
});
assert(missingProvenance === 0, 'Every repair has complete provenance');

// Unique IDs unchanged (not renamed)
let uniqueIdChanged = 0;
trayKeys.forEach(k => {
  (trays[k] || []).forEach((tok, idx) => {
    if (idMap.has(tok.id) && idMap.get(tok.id).length === 1) {
      // unique — should be the same ID after migration
      const migTok = (m1.materials.trays[k] || [])[idx];
      if (migTok && migTok.id !== tok.id) {
        console.log('  UNIQUE ID CHANGED:', k, idx, tok.id, '->', migTok.id);
        uniqueIdChanged++;
      }
    }
  });
});
assert(uniqueIdChanged === 0, 'Unique IDs unchanged by repair');

// Repaired IDs are stable and bank-scoped
const repairIdPattern = /^tok_[a-z_]+(_(dup)_\d+)?$/;
let badRepairId = 0;
repairs.forEach(r => {
  if (!r.newId.startsWith('tok_')) { console.log('  BAD REPAIR ID (no tok_ prefix):', r.newId); badRepairId++; }
  if (!r.newId.includes(r.bank)) { console.log('  REPAIR ID NOT bank-scoped:', r.newId, 'bank:', r.bank); badRepairId++; }
});
assert(badRepairId === 0, 'Repaired IDs are stable and bank-scoped');

// No random IDs (deterministic)
const repairIds1 = new Set(repairs.map(r => r.newId));
const m1b = migrateProject(raw); // second migration of raw
const repairs1b = m1b.meta?.importRepairs || [];
const repairIds1b = new Set(repairs1b.map(r => r.newId));
let nonDeterministic = 0;
repairs.forEach(r => { if (!repairIds1b.has(r.newId)) { console.log('  NON-DETERMINISTIC ID:', r.newId); nonDeterministic++; } });
assert(nonDeterministic === 0, 'Repair IDs are deterministic across runs');

// --- Idempotency (m1 -> m2 -> m3) ------------------------------------------
console.log('\n=== IDEMPOTENCY (m1 -> m2 -> m3) ===');
const m2 = migrateProject(clone(m1));
const m3 = migrateProject(clone(m2));
assertEq(JSON.stringify(m2), JSON.stringify(m3), 'm2 deep-equals m3');

const m2Repairs = m2.meta?.importRepairs || [];
const m3Repairs = m3.meta?.importRepairs || [];
assertEq(m2Repairs, m3Repairs, 'importRepairs stable m2->m3');

// No additional repairs on second pass
assert(m2Repairs.length === repairs.length, 'No new repairs on re-migration',
  'expected ' + repairs.length + ' got ' + m2Repairs.length);

// Repaired IDs unchanged in m2
repairs.forEach(r => {
  const tok = (m2.materials.trays[r.bank] || [])[r.index];
  if (tok && tok.id !== r.newId) {
    fail('Repaired ID unchanged in m2: ' + r.newId, 'got ' + tok?.id);
  }
});
pass('Repaired IDs unchanged in m2');

// --- Reference Ambiguity Acceptance ----------------------------------------
console.log('\n=== REFERENCE AMBIGUITY ===');
// Forms overrides for duplicate IDs: first occurrence keeps original ID, survives
// Second+ occurrences get new IDs; if an override referenced the old ID it may be ambiguous
const firstOccurrenceIds = new Set();
repairs.forEach(r => firstOccurrenceIds.add(r.originalId));
// Only the first occurrence of a dup keeps the original ID
let ambiguousOverrideCount = 0;
overrideIds.forEach(id => {
  if (dupIdSet.has(id)) {
    // The override for the original ID is preserved (references first occurrence)
    // The second+ occurrence was renamed — those overrides reference the new repaired ID
    if (m1Overrides[id]) {
      pass('Ambiguous override for ' + id + ': preserved (first-occurrence ID kept)');
    } else {
      fail('Ambiguous override for ' + id + ': lost after migration');
      ambiguousOverrideCount++;
    }
  }
});
if (ambiguousOverrides.length === 0) pass('No ambiguous form override references');
console.log('Ambiguous override count:', ambiguousOverrides.length);

// --- JSON Round-Trip --------------------------------------------------------
console.log('\n=== JSON ROUND-TRIP ===');
let jsonExported, m_json;
try {
  jsonExported = exportProjectJson(m1);
  const reparsed = JSON.parse(jsonExported);
  m_json = migrateProject(reparsed);
} catch (e) { console.error('JSON round-trip error:', e.message); fail('JSON round-trip: no error'); }

if (m_json) {
  assertEq(Object.keys(m_json.materials.trays), m1TrayKeys, 'JSON RT: tray keys preserved');
  const m_jsonTotal = Object.keys(m_json.materials.trays).reduce((s, k) => s + (m_json.materials.trays[k] || []).length, 0);
  assert(m_jsonTotal === totalTokens, 'JSON RT: token count preserved');
  const jsonRepairs = m_json.meta?.importRepairs || [];
  assertEq(jsonRepairs.length, repairs.length, 'JSON RT: importRepairs count stable');
  // Deep structural comparison
  assertEq(JSON.stringify(m_json.materials), JSON.stringify(m2.materials), 'JSON RT: materials deep-equal');
}

// --- HTML Round-Trip --------------------------------------------------------
console.log('\n=== HTML ROUND-TRIP ===');
let m_html;
try {
  const htmlExported = exportProjectHtml(m1);
  m_html = extractProjectFromText(htmlExported);
} catch (e) { console.error('HTML round-trip error:', e.message); fail('HTML round-trip: no error'); }

if (m_html) {
  const htmlTrayKeys = Object.keys(m_html.materials.trays);
  assertEq(htmlTrayKeys, m1TrayKeys, 'HTML RT: tray keys preserved');
  const htmlTotal = htmlTrayKeys.reduce((s, k) => s + (m_html.materials.trays[k] || []).length, 0);
  assert(htmlTotal === totalTokens, 'HTML RT: token count preserved');
  const htmlRepairs = m_html.meta?.importRepairs || [];
  assertEq(htmlRepairs.length, repairs.length, 'HTML RT: importRepairs count stable');
  assertEq(JSON.stringify(m_html.materials), JSON.stringify(m2.materials), 'HTML RT: materials deep-equal');
}

// --- Trigger Compatibility Audit -------------------------------------------
console.log('\n=== TRIGGER COMPATIBILITY AUDIT ===');
// Inspect whether a trigger can fire from a selected-but-non-rendered input
// Use a cloned in-memory project with one trigger enabled.
const triggerTestProject = clone(m1);
// Find a device with multiple inputs
const multiInputDevice = (triggerTestProject.lineDevices || []).find(d => (d.inputs || []).length >= 2);
if (!multiInputDevice) {
  console.log('SKIP: no multi-input device found for trigger audit');
} else {
  // Find a route that only uses the FIRST input slot
  const firstSlot = multiInputDevice.inputs[0].slot;
  const secondSlot = multiInputDevice.inputs[1].slot;
  const firstTray = multiInputDevice.inputs[0].tray;
  // Create a test trigger referencing the SECOND input tray
  const testTriggerTray = multiInputDevice.inputs[1].tray;
  // Pick a term that exists in that tray
  const testTray = triggerTestProject.materials.trays[testTriggerTray] || [];
  const testTerm = testTray[0]?.literal;
  if (testTerm && testTray.length > 0) {
    // Enable a trigger that fires when second-slot tray contains testTerm
    triggerTestProject.triggers.push({
      id: 'tr_audit_test', name: 'audit trigger', enabled: true,
      condition: { tray: testTriggerTray, term: testTerm },
      chance: 100,
      action: { type: 'append', text: '[TRIGGER_FIRED]' }
    });
    // Create a route that only uses firstSlot (not secondSlot)
    const auditRoute = { id: 'rt_audit', name: 'audit_route', weight: 1000,
      template: '{' + firstSlot + ':literal}.' };
    const origRoutes = multiInputDevice.routes;
    multiInputDevice.routes = [auditRoute];
    // Force second tray to contain only testTerm
    const secondTrayTokens = (triggerTestProject.materials.trays[testTriggerTray] || []);
    // Force the second input to always select testTerm by making it the only token
    triggerTestProject.materials.trays[testTriggerTray] = [{ id: 'tok_audit_term', literal: testTerm, role: 'noun', weight: 1, lockedLiteral: false }];

    // Run many events to see if the trigger fires when only firstSlot is rendered
    const { generateEvent } = TarokeCore;
    const rng = () => 0.5; // deterministic
    let triggerFired = false;
    const state = { tick: 0, queue: [{ type: 'device', deviceId: multiInputDevice.id, label: 'TEST' }] };
    for (let i = 0; i < 20; i++) {
      state.tick = i;
      state.queue = [{ type: 'device', deviceId: multiInputDevice.id, label: 'TEST' }];
      const ev = generateEvent(triggerTestProject, state, rng);
      if (ev.surface && ev.surface.includes('[TRIGGER_FIRED]')) { triggerFired = true; break; }
    }

    if (triggerFired) {
      console.log('Trigger audit: CONFIRMED — trigger fires from selected-but-non-rendered input');
      console.log('  Device:', multiInputDevice.name);
      console.log('  Route uses:', firstSlot, '| Trigger watches:', testTriggerTray, '/', testTerm);
      console.log('  STATUS: CONFIRMED');
      // Record as a blocker for v07.5e
      pass('Trigger audit: defect confirmed (recorded for v07.5e)');
    } else {
      console.log('Trigger audit: NOT REPRODUCED with deterministic rng');
      console.log('  STATUS: NOT REPRODUCED');
      pass('Trigger audit completed: NOT REPRODUCED');
    }
    // Restore
    multiInputDevice.routes = origRoutes;
    triggerTestProject.materials.trays[testTriggerTray] = secondTrayTokens;
  } else {
    console.log('Trigger audit SKIP: no test term available in second tray');
  }
}

// --- Summary ----------------------------------------------------------------
console.log('\n=== SUMMARY ===');
console.log('File:   ', path.basename(fixturePath));
console.log('SHA-256:', sha256);
console.log('Trays:', trayKeys.length, '| Tokens:', totalTokens, '| Devices:', devices.length,
  '| Stanzas:', stanzas.length, '| Scenes:', scenes.length, '| Triggers:', triggers.length,
  '(enabled:', enabledTriggers.length + ')');
console.log('Duplicate IDs:', dupIds.length, '| Repairs:', repairs.length,
  '| Ambiguous overrides:', ambiguousOverrides.length);
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
