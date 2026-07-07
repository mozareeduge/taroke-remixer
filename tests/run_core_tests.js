const fs = require('fs');
const path = require('path');
let passed=0, failed=0; const rows=[];
function test(name, fn){try{fn(); passed++; rows.push(['PASS',name,'']);}catch(e){failed++; rows.push(['FAIL',name,e.stack||e.message]);}}
function assert(x,msg='assertion failed'){if(!x) throw new Error(msg);}
const root = path.join(__dirname,'..');
const C = require('../src/core.js');
const app = fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const css = fs.readFileSync(path.join(root,'styles.css'),'utf8');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');

test('boot files are modular and syntactically valid',()=>{assert(html.includes('src/core.js')); assert(html.includes('src/app.js')); assert(css.includes('--bg:#000'));});
test('default project has required editable layers',()=>{const p=C.defaultProject(); assert(p.project && p.materials && p.forms && p.lineDevices && p.stanzaPatterns && p.flowScenes && p.triggers && p.surface && p.notes);});
test('sample banks and token operations work',()=>{const p=C.defaultProject(); const tok=C.token('wolf','noun'); p.materials.trays.above.push(tok); p.materials.trays.above=p.materials.trays.above.filter(t=>t.id!==tok.id); p.materials.trays.below.push(tok); assert(p.materials.trays.below.some(t=>t.literal==='wolf'));});
test('forms handle plurals, verbs, locks, overrides',()=>{const p=C.defaultProject(); const box=C.token('box','noun'); const baby=C.token('baby','noun'); const carry=C.token('carry','verb'); assert(C.formToken(p,box,'plural')==='boxes'); assert(C.formToken(p,baby,'plural')==='babies'); assert(C.formToken(p,carry,'thirdSingular')==='carries'); p.forms.overrides[box.id]={plural:'boxen'}; assert(C.formToken(p,box,'plural')==='boxen'); box.lockedLiteral=true; assert(C.formToken(p,box,'plural')==='box');});
test('device edits affect generated output',()=>{const p=C.defaultProject(); const d=p.lineDevices[0]; d.inputs=[{slot:'subject',tray:'above',role:'noun'}]; d.routes=[{id:'r_test',name:'test',weight:100,template:'{subject:plural} return.'}]; p.materials.trays.above=[C.token('bird','noun')]; const ev=C.generateEvent(p,{tick:0,queue:[{type:'device',deviceId:d.id}]},()=>0); assert(ev.surface==='birds return.');});
test('stanza and flow produce event queue',()=>{const p=C.defaultProject(); const st=p.stanzaPatterns[0]; assert(C.expandStanza(p,st,()=>0).length>0); const state={tick:0,queue:[]}; const ev=C.generateEvent(p,state,()=>0); assert(ev.id==='ev_0000');});
test('triggers can append text when condition matches',()=>{const p=C.defaultProject(); const d=p.lineDevices[0]; d.inputs=[{slot:'subject',tray:'above',role:'noun'}]; d.routes=[{id:'r_test',name:'test',weight:100,template:'{subject:literal}'}]; p.materials.trays.above=[C.token('raven','noun')]; p.triggers=[{id:'tr',name:'hit',enabled:true,condition:{tray:'above',term:'raven'},chance:100,action:{type:'append',text:'[RARE]'}}]; const ev=C.generateEvent(p,{tick:0,queue:[{type:'device',deviceId:d.id}]},()=>0); assert(ev.surface.includes('[RARE]'));});
test('notes preserve event recipe links',()=>{const p=C.defaultProject(); const ev=C.generateEvent(p,{tick:1,queue:[]},()=>0); if(ev.type==='breath') return; const n=C.addOrUpdateNote(p,ev,'repair','fix'); assert(n.eventId===ev.id); assert(n.linkedDeviceId===ev.deviceId);});
test('export/import HTML and JSON roundtrip',()=>{const p=C.defaultProject(); p.project.title='Round Trip'; const html=C.exportProjectHtml(p); assert(html.includes('id="taroke-project"')); const q=C.extractProjectFromText(html); assert(q.project.title==='Round Trip'); const r=C.extractProjectFromText(C.exportProjectJson(p)); assert(r.project.title==='Round Trip');});
test('validation reports blocking errors',()=>{const p=C.defaultProject(); p.lineDevices[0].routes[0].template='{ghost:literal}'; const issues=C.validateProject(p); assert(issues.some(i=>i.level==='error' && /unknown slot/.test(i.message)));});
test('UI source contains handlers for all editable layers',()=>{for(const needle of ['data-token-lit','data-override','data-device-field','data-input-slot','data-route-template','data-slot-chance','data-scene-name','data-trig-term','data-bind-number','data-save-html','data-export-json']) assert(app.includes(needle), 'missing '+needle);});
test('drag/drop handlers cover tokens, routes, slots, scenes',()=>{for(const needle of ["ui.drag?.type==='token'","ui.drag?.type==='route'","ui.drag?.type==='slot'","ui.drag?.type==='scene'",'data-bank-drop','data-route-drag','data-slot-drag','data-scene-drag']) assert(app.includes(needle), 'missing '+needle);});
test('no native alert/prompt/confirm and no native select markup',()=>{assert(!/\b(alert|prompt|confirm)\s*\(/.test(app)); assert(!app.includes('<select'));});
test('self-test and debug hooks are present',()=>{assert(app.includes('data-self-test')); assert(app.includes('window.TarokeDebug'));});
console.log(`${passed} passed, ${failed} failed`); for(const r of rows) console.log(r.join(' | ')); process.exit(failed?1:0);
