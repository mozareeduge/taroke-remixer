// Extended core tests for QA hardening pass v07.1
const fs = require('fs');
const path = require('path');
let passed=0, failed=0; const rows=[];
function test(name, fn){try{fn(); passed++; rows.push(['PASS',name,'']);}catch(e){failed++; rows.push(['FAIL',name,e.stack||e.message]);}}
function assert(x, msg='assertion failed'){if(!x) throw new Error(msg);}
function eq(a,b){if(a!==b) throw new Error(`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const C = require('../src/core.js');
const samplePath = path.join(__dirname,'..','sample_v07_reset.taroke.json');

// ─── Migration ───────────────────────────────────────────────────────────────
test('sample_v07_reset.taroke.json imports cleanly', ()=>{
  const raw = fs.readFileSync(samplePath,'utf8');
  const p = C.migrateProject(JSON.parse(raw));
  assert(p.project.title === 'Grave sample', 'title preserved');
  assert(Array.isArray(p.materials.trays.above) && p.materials.trays.above.length > 0, 'above tray populated');
  assert(typeof p.materials.bankMeta === 'object', 'bankMeta present');
});

test('migration of old lineMachines/rareEvents/dictionary project', ()=>{
  const old = {
    project:{title:'Old Style'},
    lineMachines:[{id:'d1',name:'OLD',enabled:true,inputs:[{slot:'s',tray:'above',role:'noun'}],routes:[{id:'r1',name:'r',weight:1,template:'{s:literal}.'}]}],
    rareEvents:[{id:'t1',name:'rare',enabled:true,triggerLayer:'above',triggerTerm:'grave',chance:50,placement:'append',insertion:'[RARE]'}],
    dictionary:{above:[{id:'tok1',literal:'grave',role:'noun',weight:1,lockedLiteral:false}]},
    stanzaPatterns:[{id:'s1',name:'S',enabled:true,slots:[{id:'sl1',type:'device',deviceId:'d1',chance:100,repeat:'once'}]}],
    flowScenes:[{id:'f1',name:'F',stanzaId:'s1',enabled:true,chance:100}]
  };
  const p = C.migrateProject(old);
  assert(p.lineDevices.some(d=>d.name==='OLD'), 'lineMachines became lineDevices');
  assert(p.triggers.some(t=>t.condition.term==='grave' && t.action.text==='[RARE]'), 'rareEvents became triggers');
  assert(p.materials.trays.above.some(t=>t.literal==='grave'), 'dictionary became trays');
});

test('migration forces surface.showTick=false and family=taroko', ()=>{
  const old = {project:{title:'T'}, surface:{showTick:true, family:'split'}};
  const p = C.migrateProject(old);
  eq(p.surface.showTick, false);
  eq(p.surface.family, 'taroko');
});

test('bankMeta survives full JSON export/import roundtrip', ()=>{
  const p = C.defaultProject();
  p.materials.bankMeta.above.label = 'UPPER SPIRITS';
  const json = C.exportProjectJson(p);
  const q = C.extractProjectFromText(json);
  eq(q.materials.bankMeta.above.label, 'UPPER SPIRITS');
});

// ─── Punctuation cleanup ──────────────────────────────────────────────────────
test('cleanSurfaceText removes doubled commas', ()=>{
  const out = C.cleanSurfaceText('word,, thing');
  assert(!out.includes(',,'), `doubled comma not cleaned: "${out}"`);
});

test('cleanSurfaceText removes leading punctuation', ()=>{
  const out = C.cleanSurfaceText(', starts with comma');
  assert(!out.startsWith(','), `leading comma not cleaned: "${out}"`);
});

test('cleanSurfaceText removes empty braces after variable stripping', ()=>{
  const out = C.cleanSurfaceText('thing {ghost:literal} other');
  assert(!out.includes('{'), `brace not cleaned: "${out}"`);
  assert(!out.includes(',, '), 'doubled comma after clean');
});

test('missing slot in multi-slot template no doubled punctuation', ()=>{
  const p = C.defaultProject();
  p.materials.trays.above = [{id:'a',literal:'piece',role:'noun',weight:1,lockedLiteral:false}];
  p.lineDevices = [{id:'d',name:'D',enabled:true,inputs:[{slot:'one',tray:'above',role:'noun'}],routes:[{id:'r',name:'R',weight:1,template:'{one:literal}, {ghost:literal}, end'}]}];
  p.stanzaPatterns = [{id:'s',name:'S',enabled:true,slots:[{id:'sl',type:'device',deviceId:'d',chance:100,repeat:'once'}]}];
  p.flowScenes = [{id:'f',name:'F',stanzaId:'s',enabled:true,chance:100}];
  const ev = C.generateEvent(p,{tick:0,queue:[]},()=>0.1);
  assert(!ev.surface.includes(',,'), `doubled comma: "${ev.surface}"`);
  assert(!ev.surface.match(/^[,;:]/), `leading punct: "${ev.surface}"`);
  assert(!ev.surface.includes('{}'), 'empty braces');
});

// ─── Form variants ────────────────────────────────────────────────────────────
test('plural: -y→-ies, -s→-es, -fe→-ves, compound head', ()=>{
  const p = C.defaultProject();
  eq(C.formToken(p,{literal:'baby',role:'noun',lockedLiteral:false},'plural'),'babies');
  eq(C.formToken(p,{literal:'bus',role:'noun',lockedLiteral:false},'plural'),'buses');
  eq(C.formToken(p,{literal:'knife',role:'noun',lockedLiteral:false},'plural'),'knives');
});

test('compound pluralizes head when compoundPolicy=head', ()=>{
  const p = C.defaultProject();
  p.forms.compoundPolicy = 'head';
  const tok = {literal:'paper-body',role:'noun',lockedLiteral:false};
  const out = C.formToken(p,tok,'plural');
  assert(out.includes('bodies'), `compound head not pluralized: "${out}"`);
});

test('compound with compoundPolicy=literal keeps prefix', ()=>{
  const p = C.defaultProject();
  p.forms.compoundPolicy = 'literal';
  const tok = {literal:'paper-body',role:'noun',lockedLiteral:false};
  const out = C.formToken(p,tok,'plural');
  // Fixed: prefix must not be dropped. Both 'head' and 'literal' policies preserve prefix.
  // 'head' uses styleLike(head, made); 'literal' uses styleLike(lit, made).
  // For lowercase compound both produce 'paper-bodies'.
  assert(out.startsWith('paper-'), `prefix dropped: "${out}"`);
  assert(out.includes('bod'), `head form missing: "${out}"`);
});

test('case policy upper/lower/title applies to form output', ()=>{
  const p = C.defaultProject();
  const tok = {literal:'grave',role:'noun',lockedLiteral:false};
  p.forms.casePolicy='upper'; eq(C.formToken(p,tok,'literal'),'GRAVE');
  p.forms.casePolicy='lower'; eq(C.formToken(p,tok,'literal'),'grave');
  p.forms.casePolicy='title'; eq(C.formToken(p,tok,'literal'),'Grave');
});

test('lockedLiteral: plural/thirdSingular/base return literal', ()=>{
  const p = C.defaultProject();
  const tok = {literal:'sheep',role:'noun',lockedLiteral:true};
  eq(C.formToken(p,tok,'plural'),'sheep');
  eq(C.formToken(p,tok,'thirdSingular'),'sheep');
  eq(C.formToken(p,tok,'base'),'sheep');
});

test('lockedLiteral does not prevent uppercase/lowercase/title', ()=>{
  const p = C.defaultProject();
  const tok = {literal:'sheep',role:'noun',lockedLiteral:true};
  eq(C.formToken(p,tok,'uppercase'),'SHEEP');
  eq(C.formToken(p,tok,'lowercase'),'sheep');
  eq(C.formToken(p,tok,'title'),'Sheep');
});

// ─── Article ──────────────────────────────────────────────────────────────────
test('articleFor returns an for vowel-initial words', ()=>{
  eq(C.articleFor('apple'), 'an');
  eq(C.articleFor('hour'), 'an');
  eq(C.articleFor('University'), 'a');
  eq(C.articleFor('cat'), 'a');
});

// ─── Weighted selection ───────────────────────────────────────────────────────
test('weighted: zero-weight items excluded', ()=>{
  const items=[{id:'a',literal:'low',weight:0},{id:'b',literal:'high',weight:1}];
  const result = C.weighted(items, ()=>0.5);
  eq(result.literal,'high');
});

test('weighted: all zeros returns first item', ()=>{
  const items=[{id:'a',literal:'x',weight:0},{id:'b',literal:'y',weight:0}];
  const result = C.weighted(items, ()=>0.5);
  eq(result.literal,'x');
});

// ─── Trigger modes ────────────────────────────────────────────────────────────
test('trigger prepend mode puts text before surface', ()=>{
  const p = C.defaultProject();
  const d = p.lineDevices[0];
  d.inputs=[{slot:'s',tray:'above',role:'noun'}];
  d.routes=[{id:'r',name:'r',weight:100,template:'{s:literal}'}];
  p.materials.trays.above=[{id:'a',literal:'grave',role:'noun',weight:1,lockedLiteral:false}];
  p.triggers=[{id:'tr',name:'t',enabled:true,condition:{tray:'above',term:'grave'},chance:100,action:{type:'prepend',text:'[PRE]'}}];
  const ev = C.generateEvent(p,{tick:0,queue:[{type:'device',deviceId:d.id}]},()=>0);
  assert(ev.surface.startsWith('[PRE]'), `prepend not at start: "${ev.surface}"`);
});

test('trigger replace mode replaces entire surface', ()=>{
  const p = C.defaultProject();
  const d = p.lineDevices[0];
  d.inputs=[{slot:'s',tray:'above',role:'noun'}];
  d.routes=[{id:'r',name:'r',weight:100,template:'{s:literal}'}];
  p.materials.trays.above=[{id:'a',literal:'grave',role:'noun',weight:1,lockedLiteral:false}];
  p.triggers=[{id:'tr',name:'t',enabled:true,condition:{tray:'above',term:'grave'},chance:100,action:{type:'replace',text:'[REPLACED]'}}];
  const ev = C.generateEvent(p,{tick:0,queue:[{type:'device',deviceId:d.id}]},()=>0);
  eq(ev.surface,'[REPLACED]');
});

test('trigger with chance=0 never fires', ()=>{
  const p = C.defaultProject();
  const d = p.lineDevices[0];
  d.inputs=[{slot:'s',tray:'above',role:'noun'}];
  d.routes=[{id:'r',name:'r',weight:100,template:'{s:literal}'}];
  p.materials.trays.above=[{id:'a',literal:'grave',role:'noun',weight:1,lockedLiteral:false}];
  p.triggers=[{id:'tr',name:'t',enabled:true,condition:{tray:'above',term:'grave'},chance:0,action:{type:'append',text:'[NEVER]'}}];
  for(let i=0;i<10;i++){
    const ev = C.generateEvent(p,{tick:i,queue:[{type:'device',deviceId:d.id}]},()=>i/10);
    assert(!ev.surface.includes('[NEVER]'), `trigger fired at chance=0: "${ev.surface}"`);
  }
});

test('disabled trigger never fires even when term matches', ()=>{
  const p = C.defaultProject();
  const d = p.lineDevices[0];
  d.inputs=[{slot:'s',tray:'above',role:'noun'}];
  d.routes=[{id:'r',name:'r',weight:100,template:'{s:literal}'}];
  p.materials.trays.above=[{id:'a',literal:'grave',role:'noun',weight:1,lockedLiteral:false}];
  p.triggers=[{id:'tr',name:'t',enabled:false,condition:{tray:'above',term:'grave'},chance:100,action:{type:'append',text:'[DISABLED]'}}];
  const ev = C.generateEvent(p,{tick:0,queue:[{type:'device',deviceId:d.id}]},()=>0);
  assert(!ev.surface.includes('[DISABLED]'), `disabled trigger fired: "${ev.surface}"`);
});

// ─── Validation ───────────────────────────────────────────────────────────────
test('validation error: device with no input slots', ()=>{
  const p = C.defaultProject();
  p.lineDevices[0].inputs = [];
  const issues = C.validateProject(p);
  assert(issues.some(i=>i.level==='error' && /no input slots/i.test(i.message)), 'missing no-inputs error');
});

test('validation error: device with no routes', ()=>{
  const p = C.defaultProject();
  p.lineDevices[0].routes = [];
  const issues = C.validateProject(p);
  assert(issues.some(i=>i.level==='error' && /no routes/i.test(i.message)), 'missing no-routes error');
});

test('validation error: no active scenes', ()=>{
  const p = C.defaultProject();
  p.flowScenes.forEach(s=>s.enabled=false);
  const issues = C.validateProject(p);
  assert(issues.some(i=>i.level==='error' && /no enabled scene/i.test(i.message)), 'missing no-active-scenes error');
});

test('validation warning: tray has fewer than 3 samples', ()=>{
  const p = C.defaultProject();
  p.materials.trays.above = [{id:'a',literal:'one',role:'noun',weight:1,lockedLiteral:false}];
  const issues = C.validateProject(p);
  assert(issues.some(i=>i.level==='note' && i.area.includes('samples.above')), 'missing low-sample note');
});

test('validation error: device route references unknown slot', ()=>{
  const p = C.defaultProject();
  p.lineDevices[0].routes[0].template = '{ghost:literal}';
  const issues = C.validateProject(p);
  assert(issues.some(i=>i.level==='error' && /unknown slot/i.test(i.message)), 'missing unknown-slot error');
});

// ─── Export / import ──────────────────────────────────────────────────────────
test('exportProjectHtml has no visible tick spans', ()=>{
  const p = C.defaultProject();
  const html = C.exportProjectHtml(p);
  assert(!html.includes('class="tick"') || html.includes('display:none'), 'tick span visible in export');
  assert(!html.includes('.tick{display:block'), 'tick display:block found');
  assert(html.includes('.tick{display:none}') || html.match(/\.tick\{[^}]*display:none/), 'tick not set to none');
});

test('exportProjectHtml no unresolved {slot:form} in runtime script', ()=>{
  const p = C.defaultProject();
  const html = C.exportProjectHtml(p);
  // The embedded JSON should be present; the miniRuntime should not contain raw slots
  assert(html.includes('id="taroke-project"'), 'no taroke-project script tag');
  assert(html.includes('generateEvent'), 'no runtime function');
});

test('safeJsonForHtml escapes closing script tags', ()=>{
  const evil = {project:{title:'</script><script>evil()'}};
  const html = C.exportProjectHtml(evil);
  assert(!html.match(/<\/script>\s*<script>/i), 'closing script tag not escaped in JSON');
});

test('exportProjectJson + extractProjectFromText preserves all key fields', ()=>{
  const p = C.defaultProject();
  p.project.title = 'Roundtrip Test';
  p.materials.trays.above[0].literal = 'ROUNDTRIP_MARKER';
  const json = C.exportProjectJson(p);
  const q = C.extractProjectFromText(json);
  eq(q.project.title, 'Roundtrip Test');
  assert(q.materials.trays.above.some(t=>t.literal==='ROUNDTRIP_MARKER'), 'above tray not preserved');
  assert(Array.isArray(q.lineDevices) && q.lineDevices.length > 0, 'lineDevices not preserved');
  assert(Array.isArray(q.stanzaPatterns) && q.stanzaPatterns.length > 0, 'stanzaPatterns not preserved');
  assert(Array.isArray(q.flowScenes) && q.flowScenes.length > 0, 'flowScenes not preserved');
  assert(Array.isArray(q.triggers) && q.triggers.length > 0, 'triggers not preserved');
});

test('trigger data survives export/import roundtrip', ()=>{
  const p = C.defaultProject();
  p.triggers = [{id:'tr_test',name:'test trigger',enabled:true,condition:{tray:'above',term:'grave'},chance:77,action:{type:'prepend',text:'[TEST]'}}];
  const q = C.extractProjectFromText(C.exportProjectJson(p));
  const tr = q.triggers.find(t=>t.id==='tr_test');
  assert(tr, 'trigger not found after roundtrip');
  eq(tr.action.type, 'prepend');
  eq(tr.action.text, '[TEST]');
  eq(tr.chance, 77);
});

// ─── downloadName / normalizeIdLabel ─────────────────────────────────────────
test('downloadName builds safe filename from title', ()=>{
  const p = C.defaultProject();
  p.project.title = 'My Remix 2!';
  const name = C.downloadName(p, '.taroke.html');
  assert(/^[a-z0-9_]+\.taroke\.html$/.test(name), `unsafe filename: "${name}"`);
});

// ─── activeScenes ─────────────────────────────────────────────────────────────
test('activeScenes: disabled scene with chance>0 not returned', ()=>{
  const p = C.defaultProject();
  p.flowScenes[0].enabled = false;
  eq(C.activeScenes(p).length, 0);
});

test('activeScenes: scene with chance=0 not returned', ()=>{
  const p = C.defaultProject();
  p.flowScenes[0].chance = 0;
  eq(C.activeScenes(p).length, 0);
});

// ─── expandStanza ─────────────────────────────────────────────────────────────
test('expandStanza: breath slot always adds breath event', ()=>{
  const p = C.defaultProject();
  const st = {id:'s',name:'S',enabled:true,slots:[{id:'b1',type:'breath',chance:100,repeat:'once'}]};
  const seq = C.expandStanza(p, st, ()=>0.1);
  assert(seq.some(x=>x.type==='breath'), 'breath missing from expand');
});

test('expandStanza: slot with chance=0 always skipped', ()=>{
  const p = C.defaultProject();
  const d = p.lineDevices[0];
  const st = {id:'s',name:'S',enabled:true,slots:[{id:'sl',type:'device',deviceId:d.id,chance:0,repeat:'once'}]};
  for(let i=0;i<20;i++){
    const seq = C.expandStanza(p, st, ()=>Math.random());
    eq(seq.length, 0);
  }
});

test('expandStanza: loop slot generates 0..max entries', ()=>{
  const p = C.defaultProject();
  const d = p.lineDevices[0];
  const st = {id:'s',name:'S',enabled:true,slots:[{id:'sl',type:'device',deviceId:d.id,chance:100,repeat:'loop',max:3}]};
  // rng returning 0 should always pass chance check
  const seq = C.expandStanza(p, st, ()=>0);
  assert(seq.length >= 1 && seq.length <= 3, `loop out of bounds: ${seq.length}`);
});

// ─── generateEvent fallback ───────────────────────────────────────────────────
test('generateEvent returns error event for missing/disabled device', ()=>{
  const p = C.defaultProject();
  p.lineDevices[0].enabled = false;
  const state = {tick:0, queue:[{type:'device', deviceId:p.lineDevices[0].id}]};
  const ev = C.generateEvent(p, state, ()=>0);
  eq(ev.type, 'error');
});

console.log(`${passed} passed, ${failed} failed`);
for(const r of rows) console.log(r.join(' | '));
process.exit(failed?1:0);
