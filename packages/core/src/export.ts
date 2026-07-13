import { THEME_TOKENS } from "@taroke/schema";
import type { TarokeProject } from "@taroke/schema";
import { esc } from "./utils.js";
import { normalizeIdLabel } from "./utils.js";
import { migrateProject } from "./migration.js";
import { IRREGULAR_PLURALS, IRREGULAR_VERB3 } from "@taroke/schema";

export function downloadName(project: TarokeProject, ext: string): string {
  return normalizeIdLabel(project.project?.title ?? "taroke_rimix") + ext;
}

export function surfaceCss(project: TarokeProject): string {
  const theme = THEME_TOKENS[project.surface?.theme ?? ""] ?? THEME_TOKENS["night"]!;
  const size = Number(project.surface?.fontSize ?? 21);
  const lh = Number(project.surface?.lineHeight ?? 1.48);
  const { surfaceBg: bg, surfaceText: text, surfaceMuted: muted, surfaceAccent: accent } = theme;
  const traceHidden = project.surface?.traceMode === "hidden";
  return `:root{--bg:${bg};--text:${text};--muted:${muted};--accent:${accent}}body{margin:0;background:var(--bg);color:var(--text);font:${size}px/${lh} ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden}.wrap{height:100vh;display:grid;grid-template-rows:auto 1fr ${traceHidden ? "0" : "auto"}}.head{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);padding:16px 22px;border-bottom:1px solid color-mix(in srgb,var(--muted),transparent 55%)}.stage{padding:32px;overflow:auto}.line{margin:0 0 14px}.tick{display:none}.trace{${traceHidden ? "display:none;" : ""}font-size:12px;color:var(--muted);border-top:1px solid color-mix(in srgb,var(--muted),transparent 55%);padding:10px 18px;white-space:nowrap;overflow:auto;background:var(--bg)}.rare{color:var(--accent)}`;
}

export function miniRuntime(): string {
  return String.raw`const IRR=${JSON.stringify(IRREGULAR_PLURALS)},V3=${JSON.stringify(IRREGULAR_VERB3)};function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function toks(n){return (project.materials?.trays?.[n]||[]).filter(x=>x.literal)}function split(w){const m=String(w||'').match(/^(.*[-\s])([^\-\s]+)$/);return m?[m[1],m[2]]:['',String(w||'')]}function style(src,out){if(src.toUpperCase()===src&&/[A-Z]/.test(src))return out.toUpperCase();if(src.toLowerCase()===src)return out.toLowerCase();if(src[0]===src[0]?.toUpperCase()&&src.slice(1)===src.slice(1).toLowerCase())return out[0]?.toUpperCase()+out.slice(1).toLowerCase();return out}function plbase(l){return IRR[l]||(/[^aeiou]y$/.test(l)?l.slice(0,-1)+'ies':/(s|x|z|ch|sh)$/.test(l)?l+'es':l+'s')}function v3base(l){return V3[l]||(/[^aeiou]y$/.test(l)?l.slice(0,-1)+'ies':/(s|x|z|ch|sh|o)$/.test(l)?l+'es':l+'s')}function form(t,f){f=String(f||'literal').trim();let lit=t?.literal||'';if(t?.lockedLiteral&&!['uppercase','lowercase','title'].includes(f))return lit;if(f==='literal'||f==='base')return lit;if(f==='uppercase')return lit.toUpperCase();if(f==='lowercase')return lit.toLowerCase();if(f==='literal+s')return lit+'s';let [pre,head]=split(lit),l=head.toLowerCase(),m=head;if(f==='plural')m=plbase(l);else if(f==='thirdSingular')m=v3base(l);return pre+style(head,m)}function clean(s){return String(s||'').replace(/\{[^}]+\}/g,'').replace(/\s+([.,;:!?])/g,'$1').replace(/([,;:!?])\s*([,;:!?])+/g,'$1').replace(/(^|\s)[,;:!?]+\s*/g,'$1').replace(/\(\s*\)/g,'').replace(/\[\s*\]/g,'').replace(/\s{2,}/g,' ').replace(/\s+([.?!])/g,'$1').trim()}function article(w){return /^[aeiou]/i.test(String(w||'').trim())?'an':'a'}function wgt(a){let items=(a||[]).filter(x=>+(x.weight??x.chance)>0),sum=items.reduce((n,x)=>n+ +(x.weight??x.chance),0),r=Math.random()*sum;for(const x of items){r-=+(x.weight??x.chance);if(r<=0)return x}return items[0]||a?.[0]}function dev(id){return (project.lineDevices||[]).find(d=>d.id===id)}function stanza(id){return (project.stanzaPatterns||[]).find(s=>s.id===id)}function exp(st){let out=[];(st?.slots||[]).forEach(slot=>{if(Math.random()*100>+(slot.chance??100))return;if(slot.type==='breath')out.push({type:'breath'});else if(slot.repeat==='loop'){let c=0,max=+(slot.max||4);while(c<max&&Math.random()*100<=+(slot.chance??60)){out.push({type:'device',deviceId:slot.deviceId});c++}}else out.push({type:'device',deviceId:slot.deviceId})});return out}function slot(state){if(!state.queue.length){let sc=wgt((project.flowScenes||[]).filter(s=>s.enabled));state.currentScene=sc?.id;state.currentStanza=sc?.stanzaId;state.queue=exp(stanza(sc?.stanzaId));if(!state.queue.length)state.queue=[{type:'breath'}]}return state.queue.shift()}function generateEvent(project,state){let s=slot(state),tick=state.tick||0;if(s.type==='breath')return{id:'ev_'+String(tick).padStart(4,'0'),tick,type:'breath',surface:'',trace:String(tick).padStart(4,'0')+' BREATH'};let d=dev(s.deviceId),r=wgt(d?.routes||[]),sel={},rend={};(d?.inputs||[]).forEach(i=>sel[i.slot]=wgt(toks(i.tray)));let cdir=new Set(),cderiv=new Set();let surf=clean((r?.template||'').replace(/\{([^}:]+):?([^}]*)\}/g,(_,sl,f)=>{sl=String(sl||'').trim();f=String(f||'literal').trim();if(sl==='article'&&f==='a'){let first=(d.inputs||[]).find(i=>i.role==='noun')||d.inputs?.[0];if(first?.slot)cderiv.add(first.slot);return article(form(sel[first?.slot],'singular'))}let o=form(sel[sl],f||'literal');rend[sl]=o;if(sel[sl])cdir.add(sl);return o}));let consumed=(d?.inputs||[]).reduce((a,i)=>{let tok=sel[i.slot];if(tok&&(cdir.has(i.slot)||cderiv.has(i.slot)))a.push({slot:i.slot,tray:i.tray,src:tok.literal});return a},[]);for(const tr of project.triggers||[]){if(!tr.enabled)continue;let tray=tr.condition?.tray,term=tr.condition?.term;let cands=consumed.filter(c=>c.tray===tray&&(!term||c.src.toLowerCase()===String(term).toLowerCase()));if(!cands.length)continue;if(Math.random()*100<+(tr.chance||0)){let type=tr.action?.type||'append',txt=tr.action?.text||'';if(type==='prepend')surf=txt+' '+surf;else if(type==='replace')surf=txt;else surf=surf+' '+txt;break;}}return{id:'ev_'+String(tick).padStart(4,'0'),tick,type:'line',surface:surf,trace:String(tick).padStart(4,'0')+' '+(d?.name||'')+' / '+(r?.name||'')}}`;
}

export function standaloneRuntime(): string {
  return `(()=>{const project=JSON.parse(document.getElementById('taroke-project').textContent);${miniRuntime()}let state={tick:0,queue:[]};const stage=document.getElementById('stage'),trace=document.getElementById('trace'),max=project.surface?.retention||28;document.getElementById('head').textContent=(project.project?.title||'Untitled')+' / '+(project.project?.author||'')+' / after '+(project.project?.sourceTitle||'Taroko');function line(){const e=generateEvent(project,state);state.tick++;if(e.type!=='breath'){const p=document.createElement('p');p.className='line';p.innerHTML=esc(e.surface);stage.appendChild(p);}while(stage.children.length>max)stage.removeChild(stage.firstChild);stage.scrollTop=stage.scrollHeight;if(trace)trace.textContent=e.trace}line();setInterval(line,Math.max(250,project.surface?.speedMs||1200));})();`;
}

export function safeJsonForHtml(project: TarokeProject): string {
  return JSON.stringify(project, null, 2)
    .replace(/<\//gi, "<\\/")
    .replace(/<!--/g, "<\\!--");
}

export function exportProjectHtml(project: TarokeProject): string {
  const json = safeJsonForHtml(project);
  const css = surfaceCss(project);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(project.project?.title ?? "TAROKE")}</title><style>${css}</style></head><body><script type="application/json" id="taroke-project">${json}</script><div class="wrap"><div class="head" id="head"></div><main class="stage" id="stage"></main><div class="trace" id="trace">TAROKE RIMIXER artifact / import this HTML to edit</div></div><script>${standaloneRuntime()}<\/script></body></html>`;
}

export function exportProjectJson(project: TarokeProject): string {
  return JSON.stringify(project, null, 2);
}

export function extractProjectFromText(text: string): TarokeProject {
  const s = String(text ?? "");
  const m = s.match(/<script[^>]*id=["']taroke-project["'][^>]*>([\s\S]*?)<\/script>/i);
  const raw = m
    ? (m[1] ?? "").replace(/<\\\/script/gi, "</script").replace(/<\\!--/g, "<!--")
    : s;
  return migrateProject(JSON.parse(raw));
}
