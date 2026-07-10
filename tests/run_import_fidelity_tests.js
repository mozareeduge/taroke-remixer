// Import fidelity tests for v07.5c
// Verifies that migrateProject() respects the authoritative-import contract.
const fs = require('fs');
const path = require('path');
let passed=0, failed=0; const rows=[];
function test(name, fn){try{fn(); passed++; rows.push(['PASS',name,'']);}catch(e){failed++; rows.push(['FAIL',name,e.stack||e.message]);}}
function assert(x, msg='assertion failed'){if(!x) throw new Error(msg);}
function eq(a, b){if(a!==b) throw new Error(`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);}

const C = require('../src/core.js');
const fixturesDir = path.join(__dirname,'fixtures');

const customFixture = JSON.parse(fs.readFileSync(path.join(fixturesDir,'exact_custom_banks_project.taroke.json'),'utf8'));
const legacyFixture = JSON.parse(fs.readFileSync(path.join(fixturesDir,'legacy_dictionary_project.json'),'utf8'));
const emptyCollFixture = JSON.parse(fs.readFileSync(path.join(fixturesDir,'explicit_empty_collections_project.json'),'utf8'));

const CLASSIC_BANKS = Object.keys(C.TRAY_DEFS).filter(k => k !== 'reserve');

// 1. defaultProject still has classic banks
test('defaultProject still has classic banks', () => {
  const p = C.defaultProject();
  assert(p.materials.trays.above, 'above missing');
  assert(p.materials.trays.below, 'below missing');
  assert(p.materials.trays.trans, 'trans missing');
  assert(p.materials.trays.imper, 'imper missing');
  assert(p.materials.trays.intrans, 'intrans missing');
  assert(p.materials.trays.texture, 'texture missing');
  assert(p.materials.trays.adjs, 'adjs missing');
  assert(p.materials.trays.reserve !== undefined, 'reserve missing');
});

// 2. explicit custom trays remain exact — no classic banks injected
test('explicit custom trays: no classic banks injected', () => {
  const p = C.migrateProject(customFixture);
  const trayKeys = Object.keys(p.materials.trays);
  for(const classic of CLASSIC_BANKS){
    assert(!trayKeys.includes(classic), `classic bank "${classic}" was injected into custom project`);
  }
});

// 3. custom project has exact imported banks
test('custom project: exact custom bank set preserved', () => {
  const p = C.migrateProject(customFixture);
  const expected = ['processed_bodies','labor_verbs','pressure_texture','relations','among_prep','reserve'];
  const actual = Object.keys(p.materials.trays);
  eq(actual.join(','), expected.join(','));
});

// 4. explicit empty trays remain empty
test('explicit empty tray remains empty', () => {
  const p = C.migrateProject(customFixture);
  eq(p.materials.trays.reserve.length, 0);
});

// 5. legacy dictionary migrates exactly — no extra banks
test('legacy dictionary migrates exactly without extra banks', () => {
  const p = C.migrateProject(legacyFixture);
  const trayKeys = Object.keys(p.materials.trays);
  for(const classic of CLASSIC_BANKS){
    assert(!trayKeys.includes(classic), `classic bank "${classic}" injected into legacy dict project`);
  }
  assert(trayKeys.includes('scene_objects'), 'scene_objects missing');
  assert(trayKeys.includes('room_verbs'), 'room_verbs missing');
  eq(trayKeys.length, 2);
});

// 6. missing trays use defaults
test('missing trays use default classic banks', () => {
  const p = C.migrateProject({project:{title:'T'}, surface:{}});
  assert(p.materials.trays.above, 'above missing when no trays given');
  assert(p.materials.trays.below, 'below missing when no trays given');
});

// 7. bankMeta is restricted to actual trays
test('bankMeta contains only actual project trays', () => {
  const p = C.migrateProject(customFixture);
  const trayKeys = new Set(Object.keys(p.materials.trays));
  const metaKeys = Object.keys(p.materials.bankMeta);
  for(const k of metaKeys){
    assert(trayKeys.has(k), `bankMeta key "${k}" has no corresponding tray`);
  }
  for(const k of trayKeys){
    assert(metaKeys.includes(k), `tray "${k}" missing from bankMeta`);
  }
});

// 8. custom role values survive (adverb, preposition)
test('custom role values adverb and preposition survive migration', () => {
  const p = C.migrateProject(customFixture);
  eq(p.materials.bankMeta.relations.role, 'adverb');
  eq(p.materials.bankMeta.among_prep.role, 'preposition');
});

// 9. bankMeta labels survive
test('imported bankMeta labels survive migration', () => {
  const p = C.migrateProject(customFixture);
  eq(p.materials.bankMeta.processed_bodies.label, 'PROCESSED BODIES');
  eq(p.materials.bankMeta.labor_verbs.label, 'LABOR VERBS');
  eq(p.materials.bankMeta.pressure_texture.label, 'PRESSURE TEXTURE');
});

// 10. key order survives
test('tray key order is preserved after migration', () => {
  const p = C.migrateProject(customFixture);
  const keys = Object.keys(p.materials.trays);
  eq(keys[0], 'processed_bodies');
  eq(keys[1], 'labor_verbs');
  eq(keys[keys.length - 1], 'reserve');
});

// 11. explicit empty lineDevices remains empty
test('explicit empty lineDevices remains empty', () => {
  const p = C.migrateProject(emptyCollFixture);
  assert(Array.isArray(p.lineDevices), 'lineDevices not array');
  eq(p.lineDevices.length, 0);
});

// 12. explicit empty stanzaPatterns remains empty
test('explicit empty stanzaPatterns remains empty', () => {
  const p = C.migrateProject(emptyCollFixture);
  assert(Array.isArray(p.stanzaPatterns), 'stanzaPatterns not array');
  eq(p.stanzaPatterns.length, 0);
});

// 13. explicit empty flowScenes remains empty
test('explicit empty flowScenes remains empty', () => {
  const p = C.migrateProject(emptyCollFixture);
  assert(Array.isArray(p.flowScenes), 'flowScenes not array');
  eq(p.flowScenes.length, 0);
});

// 14. validation reports empty/unusable collections
test('validation reports unusable empty-collection project', () => {
  const p = C.migrateProject(emptyCollFixture);
  const issues = C.validateProject(p);
  assert(issues.some(i => i.level === 'error' && i.area === 'flow'), 'no flow error for empty collections');
});

// 15. duplicate token-ID repair is deterministic
test('duplicate token IDs are repaired deterministically', () => {
  const p = C.migrateProject(customFixture);
  const allIds = Object.values(p.materials.trays).flat().map(t => t.id);
  const seen = new Set();
  for(const id of allIds){
    assert(!seen.has(id), `duplicate id "${id}" remains after migration`);
    seen.add(id);
  }
});

// 16. migration is idempotent
test('migration is idempotent: double-migrate does not change structure', () => {
  const p1 = C.migrateProject(customFixture);
  const p2 = C.migrateProject(p1);
  const keys1 = Object.keys(p1.materials.trays);
  const keys2 = Object.keys(p2.materials.trays);
  eq(keys1.join(','), keys2.join(','));
  // Token counts must be stable
  for(const k of keys1){
    eq(p1.materials.trays[k].length, p2.materials.trays[k].length);
  }
  // No new repairs on second pass
  assert(!p2.meta.importRepairs || p2.meta.importRepairs.length === 0, 'second migration still has repairs');
});

// 17. JSON round-trip preserves exact trays
test('JSON round-trip preserves exact custom tray set', () => {
  const p = C.migrateProject(customFixture);
  const json = C.exportProjectJson(p);
  const q = C.extractProjectFromText(json);
  eq(Object.keys(p.materials.trays).join(','), Object.keys(q.materials.trays).join(','));
  for(const k of Object.keys(p.materials.trays)){
    eq(p.materials.trays[k].length, q.materials.trays[k].length);
  }
});

// 18. HTML round-trip preserves exact trays
test('HTML round-trip preserves exact custom tray set', () => {
  const p = C.migrateProject(customFixture);
  const html = C.exportProjectHtml(p);
  const q = C.extractProjectFromText(html);
  eq(Object.keys(p.materials.trays).join(','), Object.keys(q.materials.trays).join(','));
});

// 19. token literals and weights survive round-trip
test('token literals and weights survive JSON round-trip', () => {
  const p = C.migrateProject(customFixture);
  const q = C.extractProjectFromText(C.exportProjectJson(p));
  const origDoc = p.materials.trays.processed_bodies.find(t => t.literal === 'document');
  const roundDoc = q.materials.trays.processed_bodies.find(t => t.literal === 'document');
  assert(roundDoc, 'document token missing after round-trip');
  eq(origDoc.weight, roundDoc.weight);
  eq(origDoc.lockedLiteral, roundDoc.lockedLiteral);
});

// 20. bankMeta roles survive round-trip
test('bankMeta roles survive JSON round-trip', () => {
  const p = C.migrateProject(customFixture);
  const q = C.extractProjectFromText(C.exportProjectJson(p));
  eq(q.materials.bankMeta.relations.role, 'adverb');
  eq(q.materials.bankMeta.among_prep.role, 'preposition');
  eq(q.materials.bankMeta.processed_bodies.label, 'PROCESSED BODIES');
});

// 21. device input tray references survive round-trip
test('device input tray references survive round-trip', () => {
  const p = C.migrateProject(customFixture);
  const q = C.extractProjectFromText(C.exportProjectJson(p));
  const bodyDev = q.lineDevices.find(d => d.id === 'ld_body');
  assert(bodyDev, 'BODY device missing');
  assert(bodyDev.inputs.some(i => i.tray === 'processed_bodies'), 'device input tray not preserved');
});

// 22. migration repair records original and new ID
test('duplicate-ID repair records provenance in meta.importRepairs', () => {
  const p = C.migrateProject(customFixture);
  assert(Array.isArray(p.meta.importRepairs), 'importRepairs missing');
  assert(p.meta.importRepairs.length > 0, 'no repairs recorded for known duplicates');
  const repair = p.meta.importRepairs[0];
  assert(repair.originalId, 'repair missing originalId');
  assert(repair.newId, 'repair missing newId');
  assert(repair.bank, 'repair missing bank');
});

// 23. legacy dict devices migrate
test('legacy dict: lineMachines become lineDevices', () => {
  const p = C.migrateProject(legacyFixture);
  assert(p.lineDevices.some(d => d.name === 'ROOM'), 'ROOM device not migrated');
});

// 24. legacy dict triggers migrate
test('legacy dict: rareEvents become triggers', () => {
  const p = C.migrateProject(legacyFixture);
  assert(p.triggers.some(t => t.condition.term === 'door'), 'door trigger not migrated');
});

// 25. surface invariants are always enforced
test('surface.showTick=false and family=taroko are invariants', () => {
  const p = C.migrateProject({project:{title:'T'}, surface:{showTick:true, family:'split', traceMode:'receipt'}});
  eq(p.surface.showTick, false);
  eq(p.surface.family, 'taroko');
  eq(p.surface.traceMode, 'receipt'); // non-invariant field preserved
});

// 26. absent collections use defaults
test('absent lineDevices use classic defaults', () => {
  const noDevices = {project:{title:'T'}, materials:{trays:{above:[{id:'t1',literal:'x',role:'noun',weight:1,lockedLiteral:false}]}}};
  const p = C.migrateProject(noDevices);
  assert(p.lineDevices.length > 0, 'lineDevices should default when absent');
});

// 27. explicitly present empty materials.trays stays empty (no default banks)
test('explicit empty materials.trays produces empty tray set', () => {
  const emptyTrays = {project:{title:'T'}, materials:{trays:{}}};
  const p = C.migrateProject(emptyTrays);
  eq(Object.keys(p.materials.trays).length, 0);
  // bankMeta should also be empty
  eq(Object.keys(p.materials.bankMeta).length, 0);
});

// 28. projectTrayDefs returns only actual trays (not classic banks for custom project)
test('projectTrayDefs returns only actual project trays', () => {
  const p = C.migrateProject(customFixture);
  const defs = C.projectTrayDefs(p);
  for(const classic of CLASSIC_BANKS){
    assert(!(classic in defs), `projectTrayDefs includes classic bank "${classic}" not in project`);
  }
  assert('processed_bodies' in defs, 'processed_bodies missing from defs');
  assert('relations' in defs, 'relations missing from defs');
});

// 29. generation succeeds on custom project
test('generation succeeds on custom project without errors', () => {
  const p = C.migrateProject(customFixture);
  const state = {tick:0, queue:[]};
  let ok = false;
  for(let i = 0; i < 20; i++){
    const ev = C.generateEvent(p, state, () => 0.3);
    state.tick++;
    if(ev.type === 'line'){ ok = true; break; }
  }
  assert(ok, 'no line event generated from custom project');
});

// 30. validation on custom project reports no missing-tray errors for correct devices
test('validation: custom project with correct device inputs has no missing-tray errors', () => {
  const p = C.migrateProject(customFixture);
  const issues = C.validateProject(p);
  const trayErrors = issues.filter(i => i.level === 'error' && /missing bank/.test(i.message));
  eq(trayErrors.length, 0);
});

console.log(`${passed} passed, ${failed} failed`);
for(const r of rows) console.log(r.join(' | '));
process.exit(failed ? 1 : 0);
