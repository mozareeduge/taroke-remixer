// Trigger runtime parity regression — v07.5e fix verification
// Formerly documented the confirmed defect; now asserts the correct behaviour.
//
// Run standalone: node tests/run_trigger_compatibility_regression.js
// Also included in run_all_tests.sh via run_trigger_runtime_parity_tests.js.
'use strict';
const C = require('../src/core.js');
let passed = 0, failed = 0;
const rows = [];
function test(name, fn) {
  try { fn(); passed++; rows.push(['PASS', name, '']); }
  catch (e) { failed++; rows.push(['FAIL', name, e.message]); }
}
function assert(x, msg) { if (!x) throw new Error(msg || 'assertion failed'); }

// Project: two inputs; route renders only slot_a; trigger watches slot_b tray.
function twoInputProject() {
  return C.migrateProject({
    schemaVersion: '0.7-reset',
    project: { title: 'Trigger Regression', author: 'test' },
    materials: {
      trays: {
        bank_a: [{ id: 'ta_1', literal: 'alpha', role: 'noun', weight: 1, lockedLiteral: false }],
        bank_b: [{ id: 'tb_1', literal: 'beta', role: 'noun', weight: 1, lockedLiteral: false }]
      },
      bankMeta: {
        bank_a: { label: 'BANK_A', role: 'noun', desc: '' },
        bank_b: { label: 'BANK_B', role: 'noun', desc: '' }
      }
    },
    forms: { language: 'en', casePolicy: 'lower', compoundPolicy: 'head', overrides: {} },
    lineDevices: [{
      id: 'ld_two_inputs', name: 'TWO_INPUTS', enabled: true, description: '',
      inputs: [
        { slot: 'slot_a', tray: 'bank_a', role: 'noun' },
        { slot: 'slot_b', tray: 'bank_b', role: 'noun' }
      ],
      routes: [
        // Only renders {slot_a}; slot_b is selected but not in template.
        { id: 'rt_a_only', name: 'a_only', weight: 1, template: '{slot_a:literal}.' }
      ]
    }],
    stanzaPatterns: [{
      id: 'st_test', name: 'TEST', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld_two_inputs', label: 'TWO_INPUTS', chance: 100, repeat: 1, max: 1 }]
    }],
    flowScenes: [{ id: 'sc_test', name: 'TEST', stanzaId: 'st_test', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: [{
      id: 'tr_bank_b_beta', name: 'bank_b beta trigger', enabled: true,
      condition: { tray: 'bank_b', term: 'beta' },
      chance: 100,
      action: { type: 'append', text: '[TRIGGER_FIRED]' }
    }],
    surface: { family: 'taroko', traceMode: 'tape', theme: 'night', speedMs: 1200, retention: 28,
      fontSize: 21, lineHeight: 1.48, showTitle: false, showSource: false, showTick: false },
    notes: []
  });
}

test('selected-but-omitted slot DOES NOT fire trigger (v07.5e fix)', () => {
  const project = twoInputProject();
  const rng = () => 0.5;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld_two_inputs', label: 'TEST' }] };
  const event = C.generateEvent(project, state, rng);
  assert(!event.surface.includes('[TRIGGER_FIRED]'),
    'Trigger fired from slot_b (bank_b) which was selected but NOT rendered in the route template. Fix failed.');
  assert(event.surface.includes('alpha'),
    'slot_a (alpha) must appear in rendered output');
});

test('consumed slot CAN fire trigger', () => {
  // Same device but route now renders slot_b too.
  const project = twoInputProject();
  project.lineDevices[0].routes[0].template = '{slot_a:literal} {slot_b:literal}.';
  const rng = () => 0.5;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld_two_inputs', label: 'TEST' }] };
  const event = C.generateEvent(project, state, rng);
  assert(event.surface.includes('[TRIGGER_FIRED]'),
    'Trigger should fire when slot_b (bank_b/beta) is consumed by the route template');
});

test('trigger absent from device inputs does not fire', () => {
  const project = C.migrateProject({
    schemaVersion: '0.7-reset',
    project: { title: 'T3' },
    materials: {
      trays: {
        bank_a: [{ id: 'ta_1', literal: 'alpha', role: 'noun', weight: 1, lockedLiteral: false }],
        bank_b: [{ id: 'tb_1', literal: 'beta', role: 'noun', weight: 1, lockedLiteral: false }]
      },
      bankMeta: { bank_a: { label: 'A', role: 'noun', desc: '' }, bank_b: { label: 'B', role: 'noun', desc: '' } }
    },
    forms: { language: 'en', casePolicy: 'lower', compoundPolicy: 'head', overrides: {} },
    lineDevices: [{
      id: 'ld1', name: 'ONE', enabled: true, description: '',
      inputs: [{ slot: 'slot_a', tray: 'bank_a', role: 'noun' }],
      routes: [{ id: 'r1', name: 'r1', weight: 1, template: '{slot_a:literal}.' }]
    }],
    stanzaPatterns: [{ id: 'st1', name: 'S', enabled: true, slots: [{ type: 'device', deviceId: 'ld1', label: 'X', chance: 100, repeat: 1, max: 1 }] }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: [{ id: 'tr1', name: 't', enabled: true, condition: { tray: 'bank_b', term: 'beta' }, chance: 100, action: { type: 'append', text: '[HIT]' } }],
    surface: { family: 'taroko', traceMode: 'tape', theme: 'night', speedMs: 1200, retention: 28, fontSize: 21, lineHeight: 1.48, showTitle: false, showSource: false, showTick: false },
    notes: []
  });
  const rng = () => 0.5;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'X' }] };
  const event = C.generateEvent(project, state, rng);
  assert(!event.surface.includes('[HIT]'), 'Trigger fired for bank_b not used as any device input');
});

console.log('\n=== Trigger Compatibility Regression (v07.5e verified) ===');
for (const r of rows) console.log(r.join(' | '));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
