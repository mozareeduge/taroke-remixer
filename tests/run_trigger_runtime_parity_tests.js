// Trigger runtime parity tests — v07.5e
// Core JS tests: consumed-input model, trigger semantics, RNG contract.
'use strict';
const C = require('../src/core.js');
let passed = 0, failed = 0;
const rows = [];
function test(name, fn) {
  try { fn(); passed++; rows.push(['PASS', name, '']); }
  catch (e) { failed++; rows.push(['FAIL', name, e.message]); }
}
function assert(x, msg) { if (!x) throw new Error(msg || 'assertion failed'); }
function eq(a, b, msg) { if (a !== b) throw new Error(msg || `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeProject(overrides = {}) {
  const base = {
    schemaVersion: '0.7-reset',
    project: { title: 'Parity Test', author: 'test' },
    materials: {
      trays: {
        above: [{ id: 'tok_ab1', literal: 'grave', role: 'noun', weight: 1, lockedLiteral: false }],
        below: [{ id: 'tok_bl1', literal: 'floor', role: 'noun', weight: 1, lockedLiteral: false }],
        trans: [{ id: 'tok_tr1', literal: 'carry', role: 'verb', weight: 1, lockedLiteral: false }]
      },
      bankMeta: {
        above: { label: 'ABOVE', role: 'noun', desc: '' },
        below: { label: 'BELOW', role: 'noun', desc: '' },
        trans: { label: 'TRANS', role: 'verb', desc: '' }
      }
    },
    forms: { language: 'en', casePolicy: 'lower', compoundPolicy: 'head', overrides: {} },
    lineDevices: [],
    stanzaPatterns: [],
    flowScenes: [],
    triggers: [],
    surface: { family: 'taroko', traceMode: 'tape', theme: 'night', speedMs: 1200, retention: 28,
      fontSize: 21, lineHeight: 1.48, showTitle: false, showSource: false, showTick: false },
    notes: []
  };
  const merged = Object.assign({}, base, overrides);
  if (overrides.materials) merged.materials = Object.assign({}, base.materials, overrides.materials);
  return C.migrateProject(merged);
}

function device(id, name, inputs, template, enabled = true) {
  return { id, name, enabled, description: '', inputs, routes: [{ id: 'r_' + id, name: 'route', weight: 1, template }] };
}

function oneDeviceProject(inp, template, triggers = []) {
  const dev = device('ld1', 'DEV', inp, template);
  const p = makeProject({
    lineDevices: [dev],
    stanzaPatterns: [{ id: 'st1', name: 'S', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld1', label: 'D', chance: 100, repeat: 1, max: 1 }] }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers
  });
  return p;
}

function run(project, rngVal = 0.5) {
  const rng = () => rngVal;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  return C.generateEvent(project, state, rng);
}

function tr(tray, term, chance, action = { type: 'append', text: '[HIT]' }, enabled = true) {
  return { id: C.uid('tr'), name: 'T_' + tray, enabled, condition: { tray, term }, chance, action };
}

// ── 1. Direct rendered matching slot fires ────────────────────────────────────
test('1: direct rendered slot fires trigger', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', 'grave', 100)]
  );
  const e = run(p);
  assert(e.surface.includes('[HIT]'), 'trigger should fire for consumed above slot');
});

// ── 2. Selected omitted slot does NOT fire ────────────────────────────────────
test('2: selected omitted slot does not fire trigger', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }, { slot: 'below', tray: 'below', role: 'noun' }],
    '{above:literal}.',  // below selected but not in template
    [tr('below', 'floor', 100)]
  );
  const e = run(p);
  assert(!e.surface.includes('[HIT]'), 'trigger must not fire from non-rendered slot');
});

// ── 3. Trigger tray absent from device entirely does not fire ─────────────────
test('3: trigger tray absent from device does not fire', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('trans', 'carry', 100)]  // trans is not an input
  );
  const e = run(p);
  assert(!e.surface.includes('[HIT]'), 'trigger must not fire when tray not an input');
});

// ── 4. Tray present as input but slot omitted from template ───────────────────
test('4: tray present as device input, slot omitted from template, does not fire', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }, { slot: 'trans', tray: 'trans', role: 'verb' }],
    '{above:literal}.',  // trans input exists but slot not rendered
    [tr('trans', 'carry', 100)]
  );
  const e = run(p);
  assert(!e.surface.includes('[HIT]'), 'trans input exists but slot omitted → must not fire');
});

// ── 5. Same tray on two inputs; only consumed slot eligible ───────────────────
test('5: same tray on two inputs; only consumed slot is eligible', () => {
  const p = makeProject({
    materials: {
      trays: {
        above: [
          { id: 'tok_ab1', literal: 'grave', role: 'noun', weight: 1, lockedLiteral: false },
          { id: 'tok_ab2', literal: 'paper', role: 'noun', weight: 1, lockedLiteral: false }
        ]
      },
      bankMeta: { above: { label: 'ABOVE', role: 'noun', desc: '' } }
    },
    lineDevices: [device('ld1', 'DEV',
      [{ slot: 'slot1', tray: 'above', role: 'noun' }, { slot: 'slot2', tray: 'above', role: 'noun' }],
      '{slot1:literal}.')],  // slot2 omitted
    stanzaPatterns: [{ id: 'st1', name: 'S', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld1', label: 'D', chance: 100, repeat: 1, max: 1 }] }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: [tr('above', '', 100)]  // empty term: any above token
  });
  // rng() < 0.5 picks index 0 (grave), rng() = 0 picks index 0
  const rng = () => 0; // both selects and chance
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const e = C.generateEvent(p, state, rng);
  // slot1 (above/grave) is consumed → trigger should fire
  // slot2 (above) is selected but not rendered
  // The fact that an above token is consumed is sufficient for the empty-term trigger
  assert(e.surface.includes('[HIT]'), 'empty-term trigger should fire when any above slot is consumed');
});

// ── 6. Same tray on two consumed inputs ──────────────────────────────────────
test('6: same tray on two consumed inputs; trigger fires once', () => {
  const p = makeProject({
    materials: {
      trays: { above: [{ id: 'tok1', literal: 'grave', role: 'noun', weight: 1, lockedLiteral: false }] },
      bankMeta: { above: { label: 'ABOVE', role: 'noun', desc: '' } }
    },
    lineDevices: [device('ld1', 'DEV',
      [{ slot: 's1', tray: 'above', role: 'noun' }, { slot: 's2', tray: 'above', role: 'noun' }],
      '{s1:literal} {s2:literal}.')],  // both consumed
    stanzaPatterns: [{ id: 'st1', name: 'S', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld1', label: 'D', chance: 100, repeat: 1, max: 1 }] }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: [tr('above', '', 100)]
  });
  const rng = () => 0;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const e = C.generateEvent(p, state, rng);
  const count = (e.surface.match(/\[HIT\]/g) || []).length;
  eq(count, 1, 'trigger should fire exactly once even with two consumed above inputs');
});

// ── 7. Repeated placeholder does not multiply chance ─────────────────────────
test('7: repeated placeholder does not multiply chance RNG call', () => {
  // Track RNG call count
  let rngCalls = 0;
  const rng = () => { rngCalls++; return 0.5; };
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal} {above:plural}.',  // above referenced twice
    [tr('above', '', 100)]
  );
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const before = rngCalls;
  C.generateEvent(p, state, rng);
  const after = rngCalls;
  // RNG calls: 1 (select above token) + 1 (select route) + 1 (trigger chance) = 3
  // Must NOT be 4 (which would indicate an extra chance call per repeated placeholder)
  assert(after - before <= 3, `Expected ≤3 RNG calls, got ${after - before}`);
  assert(after - before >= 3, 'Expected exactly 3 RNG calls (token select, route select, trigger chance)');
});

// ── 8. Singular source term matches rendered plural ───────────────────────────
test('8: singular source literal matches trigger term (grave selects as "grave" literal)', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:plural}.',  // rendered as "graves" but sourceLiteral is "grave"
    [tr('above', 'grave', 100)]  // term matches sourceLiteral not rendered form
  );
  const e = run(p);
  assert(e.surface.includes('[HIT]'), 'trigger term matches source literal, not rendered form');
});

// ── 9. Base verb matches rendered third singular ──────────────────────────────
test('9: base verb source literal matched by trigger term', () => {
  const p = oneDeviceProject(
    [{ slot: 'trans', tray: 'trans', role: 'verb' }],
    '{trans:thirdSingular}.',  // rendered as "carries" but sourceLiteral is "carry"
    [tr('trans', 'carry', 100)]
  );
  const e = run(p);
  assert(e.surface.includes('[HIT]'), 'trigger matches source literal "carry" not rendered "carries"');
});

// ── 10. lockedLiteral source remains matchable ────────────────────────────────
test('10: lockedLiteral token source literal remains matchable', () => {
  const p = makeProject({
    materials: {
      trays: { above: [{ id: 'tok1', literal: 'grave', role: 'noun', weight: 1, lockedLiteral: true }] },
      bankMeta: { above: { label: 'ABOVE', role: 'noun', desc: '' } }
    },
    lineDevices: [device('ld1', 'DEV', [{ slot: 'above', tray: 'above', role: 'noun' }], '{above:plural}.')],
    stanzaPatterns: [{ id: 'st1', name: 'S', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld1', label: 'D', chance: 100, repeat: 1, max: 1 }] }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: [tr('above', 'grave', 100)]
  });
  const e = run(p);
  assert(e.surface.includes('[HIT]'), 'lockedLiteral token sourceLiteral still matchable');
});

// ── 11. Empty term matches any consumed input in tray ─────────────────────────
test('11: empty term matches any consumed input in tray', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 100)]  // empty term = match any
  );
  const e = run(p);
  assert(e.surface.includes('[HIT]'), 'empty term should match any consumed above token');
});

// ── 12. Chance 0 with RNG 0 does not fire ────────────────────────────────────
test('12: chance 0 with RNG 0 does not fire', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 0)]  // chance 0
  );
  const e = run(p, 0);
  assert(!e.surface.includes('[HIT]'), 'chance 0 must never fire');
});

// ── 13. Chance 0 with RNG 0.5 does not fire ──────────────────────────────────
test('13: chance 0 with RNG 0.5 does not fire', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 0)]
  );
  const e = run(p, 0.5);
  assert(!e.surface.includes('[HIT]'), 'chance 0 must never fire regardless of RNG');
});

// ── 14. Chance 100 with RNG 0 fires ──────────────────────────────────────────
test('14: chance 100 with RNG 0 fires', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 100)]
  );
  const e = run(p, 0);
  assert(e.surface.includes('[HIT]'), 'chance 100 must fire when RNG is 0');
});

// ── 15. Chance 100 with RNG 0.999 fires ──────────────────────────────────────
test('15: chance 100 with RNG 0.999 fires', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 100)]
  );
  const e = run(p, 0.999);
  assert(e.surface.includes('[HIT]'), 'chance 100 must fire when RNG is 0.999');
});

// ── 16. Disabled trigger does not fire ───────────────────────────────────────
test('16: disabled trigger does not fire', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 100, { type: 'append', text: '[HIT]' }, false)]  // enabled=false
  );
  const e = run(p);
  assert(!e.surface.includes('[HIT]'), 'disabled trigger must not fire');
});

// ── 17. Disabled device event: no trigger fired ───────────────────────────────
test('17: disabled device produces error event, no trigger', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 100)]
  );
  p.lineDevices[0].enabled = false;
  const rng = () => 0.5;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const e = C.generateEvent(p, state, rng);
  eq(e.type, 'error', 'disabled device should produce error event');
  assert(!e.surface || !e.surface.includes('[HIT]'), 'no trigger from disabled device');
});

// ── 18. Skipped stanza slot: device not visited, no trigger ──────────────────
test('18: stanza slot skipped by chance produces breath, not trigger', () => {
  const p = makeProject({
    lineDevices: [device('ld1', 'DEV', [{ slot: 'above', tray: 'above', role: 'noun' }], '{above:literal}.')],
    stanzaPatterns: [{
      id: 'st1', name: 'S', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld1', label: 'D', chance: 0, repeat: 1, max: 1 }]  // chance 0: never runs
    }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: [tr('above', '', 100)]
  });
  const rng = () => 0;
  const state = { tick: 0, queue: [] };
  const e = C.generateEvent(p, state, rng);
  eq(e.type, 'breath', 'slot with chance 0 expands to breath only');
  assert(!e.surface || !e.surface.includes('[HIT]'), 'no trigger from skipped slot');
});

// ── 19. Append action ─────────────────────────────────────────────────────────
test('19: append action appends text to surface', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 100, { type: 'append', text: '[APPEND]' })]
  );
  const e = run(p);
  assert(e.surface.endsWith('[APPEND]'), `append: surface="${e.surface}"`);
});

// ── 20. Prepend action ────────────────────────────────────────────────────────
test('20: prepend action prepends text to surface', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 100, { type: 'prepend', text: '[PREPEND]' })]
  );
  const e = run(p);
  assert(e.surface.startsWith('[PREPEND]'), `prepend: surface="${e.surface}"`);
});

// ── 21. Replace action ────────────────────────────────────────────────────────
test('21: replace action replaces surface', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 100, { type: 'replace', text: '[REPLACED]' })]
  );
  const e = run(p);
  eq(e.surface, '[REPLACED]', `replace: surface="${e.surface}"`);
});

// ── 22. Multiple triggers preserve first-match priority ───────────────────────
test('22: first matching trigger wins; second does not fire', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [
      tr('above', '', 100, { type: 'append', text: '[FIRST]' }),
      tr('above', '', 100, { type: 'append', text: '[SECOND]' })
    ]
  );
  const e = run(p);
  assert(e.surface.includes('[FIRST]'), 'first trigger must fire');
  assert(!e.surface.includes('[SECOND]'), 'second trigger must not fire (first wins)');
});

// ── 23. No candidate: no chance RNG call ─────────────────────────────────────
test('23: no consumed candidate means no chance RNG call', () => {
  let rngCalls = 0;
  const rng = () => { rngCalls++; return 0.5; };
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }, { slot: 'below', tray: 'below', role: 'noun' }],
    '{above:literal}.',  // below not consumed
    [tr('below', '', 100)]  // trigger on below
  );
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const callsBefore = rngCalls;
  C.generateEvent(p, state, rng);
  const callsAfter = rngCalls;
  // RNG: 1 (above select) + 1 (below select) + 1 (route select) = 3. NO chance call.
  assert(callsAfter - callsBefore <= 3, `Expected ≤3 RNG calls (no chance call), got ${callsAfter - callsBefore}`);
  assert(callsAfter - callsBefore >= 3, 'Expected ≥3 RNG calls (token + token + route)');
});

// ── 24. Multiple candidates: exactly one chance RNG call ──────────────────────
test('24: multiple consumed candidates cause exactly one chance RNG call', () => {
  let chanceCalls = 0;
  // We intercept the pattern: after token selects and route select, the next call is chance.
  // Easier: use a counting RNG and verify total.
  let rngCalls = 0;
  const rng = () => { rngCalls++; return 0.5; };
  const p = makeProject({
    materials: {
      trays: {
        above: [{ id: 'tok1', literal: 'grave', role: 'noun', weight: 1, lockedLiteral: false }],
        trans:  [{ id: 'tok2', literal: 'carry', role: 'verb', weight: 1, lockedLiteral: false }]
      },
      bankMeta: { above: { label: 'A', role: 'noun', desc: '' }, trans: { label: 'T', role: 'verb', desc: '' } }
    },
    lineDevices: [device('ld1', 'DEV',
      [{ slot: 'above', tray: 'above', role: 'noun' }, { slot: 'trans', tray: 'trans', role: 'verb' }],
      '{above:literal} {trans:literal}.')],
    stanzaPatterns: [{ id: 'st1', name: 'S', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld1', label: 'D', chance: 100, repeat: 1, max: 1 }] }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: [{ id: 'tr1', name: 'T', enabled: true,
      condition: { tray: 'above', term: 'grave' }, chance: 0,  // chance 0 so it doesn't fire but we still need the call
      action: { type: 'append', text: '[HIT]' } }]
  });
  // Two consumed inputs: above and trans. Trigger on above with chance 0.
  // RNG calls: above select(1) + trans select(1) + route select(1) + chance(1) = 4
  // (chance IS called because there IS a consumed candidate, even though chance=0)
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const before = rngCalls;
  C.generateEvent(p, state, rng);
  const total = rngCalls - before;
  // With chance=0 the trigger doesn't fire, but the RNG was called for the chance check
  eq(total, 4, `Expected 4 RNG calls (2 selects + 1 route + 1 chance), got ${total}`);
});

// ── 25. Unknown placeholder creates no consumed record ────────────────────────
test('25: unknown placeholder in template creates no consumed record', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal} {noexist:literal}.',
    []
  );
  const rng = () => 0;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const e = C.generateEvent(p, state, rng);
  const consumed = e.consumedInputs || [];
  const slots = consumed.map(c => c.slot);
  assert(!slots.includes('noexist'), 'unknown placeholder must not appear in consumedInputs');
  assert(slots.includes('above'), 'above must be in consumedInputs');
});

// ── 26. Missing token creates no consumed record ──────────────────────────────
test('26: missing token (empty tray) creates no consumed record', () => {
  const p = makeProject({
    materials: {
      trays: { above: [], trans: [{ id: 'tok1', literal: 'carry', role: 'verb', weight: 1, lockedLiteral: false }] },
      bankMeta: { above: { label: 'A', role: 'noun', desc: '' }, trans: { label: 'T', role: 'verb', desc: '' } }
    },
    lineDevices: [device('ld1', 'DEV',
      [{ slot: 'above', tray: 'above', role: 'noun' }, { slot: 'trans', tray: 'trans', role: 'verb' }],
      '{above:literal} {trans:literal}.')],
    stanzaPatterns: [{ id: 'st1', name: 'S', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld1', label: 'D', chance: 100, repeat: 1, max: 1 }] }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: []
  });
  const rng = () => 0;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const e = C.generateEvent(p, state, rng);
  const consumed = e.consumedInputs || [];
  const slots = consumed.map(c => c.slot);
  assert(!slots.includes('above'), 'empty tray produces no token, so above must not be in consumedInputs');
  assert(slots.includes('trans'), 'trans with token must be in consumedInputs');
});

// ── 27. {article:a} marks first noun input as derived consumption ─────────────
test('27: {article:a} marks first noun input as derived consumption', () => {
  const p = makeProject({
    materials: {
      trays: {
        above: [{ id: 'tok1', literal: 'elephant', role: 'noun', weight: 1, lockedLiteral: false }],
        trans: [{ id: 'tok2', literal: 'carry', role: 'verb', weight: 1, lockedLiteral: false }]
      },
      bankMeta: { above: { label: 'A', role: 'noun', desc: '' }, trans: { label: 'T', role: 'verb', desc: '' } }
    },
    lineDevices: [device('ld1', 'DEV',
      [{ slot: 'above', tray: 'above', role: 'noun' }, { slot: 'trans', tray: 'trans', role: 'verb' }],
      '{article:a} {above:singular} {trans:thirdSingular}.')],
    stanzaPatterns: [{ id: 'st1', name: 'S', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld1', label: 'D', chance: 100, repeat: 1, max: 1 }] }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: []
  });
  const rng = () => 0;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const e = C.generateEvent(p, state, rng);
  const consumed = e.consumedInputs || [];
  const aboveEntry = consumed.find(c => c.slot === 'above');
  assert(aboveEntry, 'above must be in consumedInputs (read by {article:a})');
  assert(aboveEntry.direct, 'above is also directly rendered via {above:singular}');
  assert(aboveEntry.derived, 'above is derived-consumed via {article:a}');
  assert(e.surface.startsWith('an '), `article "an" expected for "elephant", got surface: ${e.surface}`);
});

// ── 28. Article-only consumption (not directly rendered) ──────────────────────
test('28: article-only derived consumption eligible for trigger', () => {
  const p = makeProject({
    materials: {
      trays: {
        above: [{ id: 'tok1', literal: 'elephant', role: 'noun', weight: 1, lockedLiteral: false }],
        trans: [{ id: 'tok2', literal: 'carry', role: 'verb', weight: 1, lockedLiteral: false }]
      },
      bankMeta: { above: { label: 'A', role: 'noun', desc: '' }, trans: { label: 'T', role: 'verb', desc: '' } }
    },
    lineDevices: [device('ld1', 'DEV',
      [{ slot: 'above', tray: 'above', role: 'noun' }, { slot: 'trans', tray: 'trans', role: 'verb' }],
      // above only consumed via {article:a}, not directly rendered
      '{article:a} {trans:literal}.')],
    stanzaPatterns: [{ id: 'st1', name: 'S', enabled: true,
      slots: [{ type: 'device', deviceId: 'ld1', label: 'D', chance: 100, repeat: 1, max: 1 }] }],
    flowScenes: [{ id: 'sc1', name: 'S', stanzaId: 'st1', enabled: true, chance: 100, mode: 'macro-flow' }],
    triggers: [tr('above', 'elephant', 100)]
  });
  const rng = () => 0;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const e = C.generateEvent(p, state, rng);
  assert(e.surface.includes('[HIT]'), 'derived-consumed input via {article:a} must be trigger-eligible');
  const aboveEntry = (e.consumedInputs || []).find(c => c.slot === 'above');
  assert(aboveEntry && !aboveEntry.direct && aboveEntry.derived, 'above: direct=false, derived=true');
});

// ── 29. Seeded determinism: same RNG → same result ───────────────────────────
test('29: identical seeded RNG produces identical output', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', '', 50)]
  );
  let calls1 = [], calls2 = [];
  const rng1 = () => { const v = 0.3; calls1.push(v); return v; };
  const rng2 = () => { const v = 0.3; calls2.push(v); return v; };
  const s1 = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const s2 = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const e1 = C.generateEvent(p, s1, rng1);
  const e2 = C.generateEvent(p, s2, rng2);
  eq(e1.surface, e2.surface, 'deterministic RNG produces identical surface');
  eq(calls1.length, calls2.length, 'identical RNG call counts');
});

// ── 30. No doubled punctuation after unknown variable ─────────────────────────
test('30: no doubled punctuation from missing variable', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}, {noexist:literal}.',
    []
  );
  const e = run(p);
  assert(!e.surface.includes(',,'), 'no doubled commas');
  assert(!e.surface.includes(',.'), 'no comma-period');
  assert(!e.surface.match(/^,/), 'no leading comma');
});

// ── 31. consumedInputs contains only route contributors ──────────────────────
test('31: consumedInputs contains exactly the route-contributing inputs', () => {
  const p = oneDeviceProject(
    [
      { slot: 'above', tray: 'above', role: 'noun' },
      { slot: 'below', tray: 'below', role: 'noun' },
      { slot: 'trans', tray: 'trans', role: 'verb' }
    ],
    '{above:literal} {trans:literal}.',  // only above and trans
    []
  );
  const rng = () => 0;
  const state = { tick: 0, queue: [{ type: 'device', deviceId: 'ld1', label: 'D' }] };
  const e = C.generateEvent(p, state, rng);
  const consumed = e.consumedInputs || [];
  const slots = consumed.map(c => c.slot).sort();
  assert(slots.includes('above'), 'above must be consumed');
  assert(slots.includes('trans'), 'trans must be consumed');
  assert(!slots.includes('below'), 'below must NOT be consumed (not in template)');
  eq(consumed.length, 2, 'exactly 2 consumed inputs');
});

// ── 32. Trigger provenance identifies matched slot/token ──────────────────────
test('32: trigger provenance identifies matched slot and source literal', () => {
  const p = oneDeviceProject(
    [{ slot: 'above', tray: 'above', role: 'noun' }],
    '{above:literal}.',
    [tr('above', 'grave', 100)]
  );
  const e = run(p);
  assert(e.trigger, 'trigger must be set on event');
  eq(e.trigger.matchedSlot, 'above', 'matchedSlot must be above');
  eq(e.trigger.matchedSourceLiteral, 'grave', 'matchedSourceLiteral must be grave');
  eq(e.trigger.conditionTray, 'above', 'conditionTray must be above');
  eq(e.trigger.conditionTerm, 'grave', 'conditionTerm must be grave');
});

// ── Run ───────────────────────────────────────────────────────────────────────
console.log('\n=== Trigger Runtime Parity Tests (v07.5e) ===');
for (const r of rows) console.log(r.join(' | '));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
