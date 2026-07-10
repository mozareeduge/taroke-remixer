// Trigger compatibility regression — v07.5e required
// Status: CONFIRMED defect — trigger fires from selected-but-non-rendered input.
//
// This file is NOT included in run_all_tests.sh.
// It documents the confirmed defect for v07.5e.
// Run standalone: node tests/run_trigger_compatibility_regression.js
'use strict';
const C = require('../src/core.js');
let passed = 0, failed = 0;
const rows = [];
function test(name, fn) {
  try { fn(); passed++; rows.push(['PASS', name, '']); }
  catch (e) { failed++; rows.push(['FAIL', name, e.message]); }
}
function assert(x, msg) { if (!x) throw new Error(msg || 'assertion failed'); }
function mustFail(name, fn) {
  // Documents a known defect: this assertion is expected to fail until v07.5e fixes it.
  try { fn(); failed++; rows.push(['KNOWN-DEFECT', name, 'Trigger fired from non-rendered slot (v07.5e required)']); }
  catch (e) { passed++; rows.push(['PASS', name + ' [defect blocked correctly]', '']); }
}

// Defect: trigger fires when selected tray matches trigger condition,
// even if that tray's slot is not rendered in the chosen route template.

test('CONFIRMED: trigger fires from selected-but-non-rendered input', () => {
  // Build a project with two inputs; route only renders slot_a.
  const project = {
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
      id: 'ld_two_inputs', name: 'TWO_INPUTS', enabled: true,
      description: 'device with two inputs, route renders only first slot',
      inputs: [
        { slot: 'slot_a', tray: 'bank_a', role: 'noun' },
        { slot: 'slot_b', tray: 'bank_b', role: 'noun' }
      ],
      routes: [
        // Only renders {slot_a}; slot_b is selected but not in template
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
  };

  const migrated = C.migrateProject(project);
  const rng = () => 0.5; // deterministic: always picks middle element
  const state = { tick: 0, queue: [] };
  state.queue = [{ type: 'device', deviceId: 'ld_two_inputs', label: 'TEST' }];
  const event = C.generateEvent(migrated, state, rng);

  // Defect: the trigger fires because bank_b / beta is selected even though
  // the route template only references slot_a.
  const triggerFired = event.surface && event.surface.includes('[TRIGGER_FIRED]');

  // This assert documents the defect. When v07.5e fixes the engine, this
  // assertion must be inverted: trigger must NOT fire from a non-rendered slot.
  // CURRENTLY: trigger fires → DEFECT CONFIRMED (test passes as documentation)
  assert(triggerFired,
    'Defect NOT reproduced: trigger did not fire from non-rendered slot — v07.5e may already be fixed');

  // Additional assertion: the rendered surface without the trigger should only
  // contain slot_a output.
  const surfaceWithoutTrigger = event.surface.replace('[TRIGGER_FIRED]', '').trim();
  assert(surfaceWithoutTrigger.includes('alpha'),
    'slot_a (alpha) should be present in output');
});

test('trigger does NOT fire when non-rendered slot is absent from device inputs', () => {
  // A project with ONE input slot; trigger watches a different bank not used as input.
  const project = {
    schemaVersion: '0.7-reset',
    project: { title: 'Trigger Regression 2' },
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
      id: 'ld_one_input', name: 'ONE_INPUT', enabled: true, description: '',
      inputs: [{ slot: 'slot_a', tray: 'bank_a', role: 'noun' }],
      routes: [{ id: 'rt_a', name: 'a', weight: 1, template: '{slot_a:literal}.' }]
    }],
    stanzaPatterns: [{
      id: 'st_test', name: 'TEST', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld_one_input', label: 'ONE', chance: 100, repeat: 1, max: 1 }]
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
  };
  const migrated = C.migrateProject(project);
  const rng = () => 0.5;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld_one_input', label: 'TEST' }] };
  const event = C.generateEvent(migrated, state, rng);
  // Trigger references bank_b which is NOT an input to this device → should not fire
  assert(!(event.surface && event.surface.includes('[TRIGGER_FIRED]')),
    'Trigger fired even though bank_b is not an input to the device');
});

console.log('\n=== Trigger Compatibility Regression ===');
console.log('STATUS: CONFIRMED — trigger fires from selected-but-non-rendered input.');
console.log('v07.5e is required to fix the trigger engine.');
console.log('The Grave artwork correctly disables all triggers as a workaround.\n');
for (const r of rows) console.log(r.join(' | '));
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\nNOTE: failures here indicate unexpected behavior (defect may be fixed or regressed).');
}
process.exit(failed > 0 ? 1 : 0);
