import json, subprocess, time, requests, websocket, shutil, pathlib, sys, re

ROOT = pathlib.Path(__file__).resolve().parents[1]
prof = '/tmp/chrome-prof-taroke-livepreview'
shutil.rmtree(prof, ignore_errors=True)
CHROME = next((p for p in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium/chrome-linux/chrome','chromium-browser','chromium','google-chrome'] if __import__('shutil').which(p) or __import__('os').path.exists(p)), 'chromium')
cmd = [CHROME,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-extensions','--disable-background-networking','--no-first-run','--no-default-browser-check',f'--user-data-dir={prof}','--remote-debugging-port=9249','--remote-allow-origins=*','about:blank']
chrome = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
passed=0; failed=0; rows=[]

def record(name, ok, msg=''):
    global passed, failed
    if ok: passed+=1; rows.append(('PASS',name,''))
    else: failed+=1; rows.append(('FAIL',name,msg))

AUTOSAVE_KEY = 'taroke.remixer.v07.draft'
BLANK_HTML = '<!doctype html><html><head><meta charset="utf-8"><title>test</title></head><body><div id="app"></div></body></html>'

MOCK_LS = """
(function(){
  if(typeof window.__mockLsStore === 'undefined') window.__mockLsStore = {};
  const store = window.__mockLsStore;
  Object.defineProperty(window, 'localStorage', {
    get(){
      return {
        getItem(k){ return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null; },
        setItem(k,v){ store[k]=String(v); },
        removeItem(k){ delete store[k]; },
        clear(){ Object.keys(store).forEach(k=>delete store[k]); },
        get length(){ return Object.keys(store).length; },
        key(i){ return Object.keys(store)[i]??null; }
      };
    }, configurable:true
  });
})();
"""

try:
    for _ in range(60):
        try:
            requests.get('http://127.0.0.1:9249/json/version', timeout=.2)
            break
        except Exception:
            time.sleep(.2)
    else:
        raise RuntimeError('Chrome DevTools did not start')

    wsurl = requests.get('http://127.0.0.1:9249/json').json()[0]['webSocketDebuggerUrl']
    ws = websocket.create_connection(wsurl, timeout=10)
    cid = 0

    def send(method, params=None):
        global cid
        cid += 1
        ws.send(json.dumps({'id':cid,'method':method,'params':params or {}}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get('id') == cid:
                return msg

    def eval_js(expr, await_promise=False):
        res = send('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': await_promise})
        if 'exceptionDetails' in res.get('result', {}):
            raise RuntimeError(res['result']['exceptionDetails'].get('text', 'JS exception'))
        return res.get('result', {}).get('result', {}).get('value')

    send('Runtime.enable'); send('Page.enable')

    core_text = (ROOT/'src/core.js').read_text()
    app_text  = (ROOT/'src/app.js').read_text()

    def boot_fresh(extra_before='', mock_ls=True):
        eval_js('document.open();document.write('+json.dumps(BLANK_HTML)+');document.close();')
        if mock_ls:
            eval_js(MOCK_LS)
        if extra_before:
            eval_js(extra_before)
        eval_js(core_text + '\n//# sourceURL=core.js')
        eval_js(app_text  + '\n//# sourceURL=app.js')
        time.sleep(.5)

    def ls_get(key):
        return eval_js(f'(window.localStorage||{{getItem:()=>null}}).getItem({json.dumps(key)})')

    def nav_export():
        eval_js('document.querySelector(`[data-step="export"]`).click()')
        time.sleep(.3)

    def nav_source():
        eval_js('document.querySelector(`[data-step="source"]`).click()')
        time.sleep(.2)

    # ── Boot fresh ──────────────────────────────────────────────────────────────
    boot_fresh()

    # ── Test 1: Export panel contains iframe with livePreviewFrame class ────────
    nav_export()
    has_iframe = eval_js('!!document.querySelector("iframe.livePreviewFrame")')
    record('export contains iframe preview', has_iframe)

    # ── Test 2: iframe has sandbox attribute ───────────────────────────────────
    sandbox_val = eval_js('document.querySelector("iframe.livePreviewFrame")?.getAttribute("sandbox") ?? null')
    record('iframe has sandbox attribute', sandbox_val is not None)

    # ── Test 3: iframe sandbox contains allow-scripts ──────────────────────────
    record('iframe sandbox contains allow-scripts',
           sandbox_val is not None and 'allow-scripts' in str(sandbox_val))

    # ── Test 4: iframe sandbox does not contain allow-same-origin ─────────────
    record('iframe sandbox does not contain allow-same-origin',
           sandbox_val is not None and 'allow-same-origin' not in str(sandbox_val))

    # ── Test 5: iframe has non-empty srcdoc attribute ─────────────────────────
    srcdoc_len = eval_js('(document.querySelector("iframe.livePreviewFrame")?.getAttribute("srcdoc") || "").length')
    record('iframe has non-empty srcdoc', (srcdoc_len or 0) > 200)

    # ── Test 6: iframe srcdoc contains embedded project JSON ──────────────────
    srcdoc_has_json = eval_js(
        '(document.querySelector("iframe.livePreviewFrame")?.getAttribute("srcdoc") || "").includes("taroke-project")')
    record('iframe srcdoc contains embedded project JSON', bool(srcdoc_has_json))

    # ── Test 7: iframe srcdoc contains artifact runtime ───────────────────────
    srcdoc_has_runtime = eval_js(
        '(document.querySelector("iframe.livePreviewFrame")?.getAttribute("srcdoc") || "").includes("generateEvent")')
    record('iframe srcdoc has artifact runtime', bool(srcdoc_has_runtime))

    # ── Test 8: generated output has no unresolved {slot:form} variables ───────
    try:
        ev_surface = eval_js('''(function(){
            const p = window.TarokeDebug.project();
            const C = window.TarokeCore;
            const st = {tick:0, queue:[]};
            let out = '';
            for(let i=0;i<10;i++){
                const ev = C.generateEvent(p, st); st.tick++;
                if(ev.type==='line') out += ev.surface + ' ';
            }
            return out;
        })()''')
        has_unresolved = bool(re.search(r'\{[a-zA-Z_][^}]*:[a-zA-Z_][^}]*\}', str(ev_surface or '')))
        record('generated output has no unresolved {slot:form} variables', not has_unresolved)
    except Exception as e:
        record('generated output has no unresolved {slot:form} variables', False, str(e))

    # ── Test 9: artifact CSS hides tick spans ─────────────────────────────────
    try:
        artifact_css = eval_js('window.TarokeCore.surfaceCss(window.TarokeDebug.project())')
        tick_hidden_in_css = '.tick{display:none}' in (artifact_css or '')
        record('iframe artifact CSS hides tick spans', tick_hidden_in_css)
    except Exception as e:
        record('iframe artifact CSS hides tick spans', False, str(e))

    # ── Test 10: edit project title → refresh → iframe srcdoc reflects update ──
    # Navigate to source to access the title input (not rendered on export step)
    try:
        new_title = 'LIVE_PREVIEW_UPDATE_TEST'
        nav_source()
        eval_js('var _inp = document.querySelector(\'[data-bind="project.title"]\'); _inp.value = ' + json.dumps(new_title) + ';')
        eval_js('_inp.dispatchEvent(new Event("input", {bubbles:true}))')
        time.sleep(.1)
        nav_export()
        # Refresh button must be clicked after navigating back to export
        eval_js('document.querySelector("[data-refresh-preview]").click()')
        time.sleep(.3)
        new_srcdoc = eval_js('document.querySelector("iframe.livePreviewFrame")?.getAttribute("srcdoc") || ""')
        title_found = new_title in (new_srcdoc or '')
        record('edit project then refresh updates iframe content', title_found)
    except Exception as e:
        record('edit project then refresh updates iframe content', False, str(e))

    # ── Test 11: JSON export button remains present ────────────────────────────
    json_btn = eval_js('!!document.querySelector("[data-export-json]")')
    record('JSON export button remains available', bool(json_btn))

    # ── Test 12: HTML export button remains present ───────────────────────────
    html_btn = eval_js('!!document.querySelector("[data-save-html]")')
    record('HTML export button remains available', bool(html_btn))

    # ── Test 13: standalone HTML has required structure ────────────────────────
    try:
        standalone = eval_js('window.TarokeCore.exportProjectHtml(window.TarokeDebug.project())')
        has_struct = (
            '<!doctype html>' in (standalone or '').lower() and
            'taroke-project' in (standalone or '') and
            'generateEvent' in (standalone or '') and
            '<div class="wrap">' in (standalone or '')
        )
        record('standalone HTML has required structure', has_struct)
    except Exception as e:
        record('standalone HTML has required structure', False, str(e))

    # ── Test 14: preview failure does not crash the app ───────────────────────
    # Boot fresh, override exportProjectHtml to throw, navigate to export (auto-builds)
    # Verify error state is shown and app remains functional
    boot_fresh()
    eval_js('window.TarokeCore.exportProjectHtml = function(){ throw new Error("preview-test-error"); }')
    nav_export()
    time.sleep(.2)
    app_alive = eval_js('document.querySelectorAll("button").length > 3')
    error_shown = eval_js('!!document.querySelector(".previewMsg[role=alert]")')
    record('preview failure does not crash app', bool(app_alive) and bool(error_shown))

    # ── Boot fresh to restore for remaining tests ──────────────────────────────
    boot_fresh()
    nav_export()

    # ── Test 15: Refresh button is keyboard reachable ─────────────────────────
    refresh_reachable = eval_js('''(function(){
        const btn = document.querySelector("[data-refresh-preview]");
        if(!btn) return false;
        const s = window.getComputedStyle(btn);
        return s.display !== "none" && s.visibility !== "hidden" && btn.offsetWidth > 0;
    })()''')
    record('preview refresh button is keyboard reachable', bool(refresh_reachable))

    # ── Test 16: preview status is perceivable ────────────────────────────────
    status_text = eval_js('''(function(){
        const el = document.querySelector(".previewSection .autosaveMuted");
        if(!el) return "";
        const s = window.getComputedStyle(el);
        return (s.display !== "none" && el.textContent.trim().length > 0) ? el.textContent.trim() : "";
    })()''')
    record('preview status is perceivable', bool(status_text and len(str(status_text)) > 3))

    # ── Test 17: preview refresh does not write to editor autosave key ─────────
    # Boot fresh, explicitly remove the autosave key (beforeunload from prior boot
    # may have written it), then navigate to export and refresh — key must stay absent.
    boot_fresh()
    eval_js('localStorage.removeItem(' + json.dumps(AUTOSAVE_KEY) + ')')
    nav_export()
    time.sleep(.1)
    eval_js('document.querySelector("[data-refresh-preview]").click()')
    time.sleep(.3)
    ls_after = ls_get(AUTOSAVE_KEY)
    record('preview refresh does not write to editor autosave key', ls_after is None)

    # ── Test 18: mobile 375px: no horizontal overflow on export step ──────────
    send('Emulation.setDeviceMetricsOverride',{'width':375,'height':812,'deviceScaleFactor':2,'mobile':True})
    time.sleep(.2)
    nav_export()
    time.sleep(.2)
    overflow = eval_js('document.body.scrollWidth > document.body.clientWidth')
    record('mobile 375px: no horizontal overflow on export step', not overflow)
    send('Emulation.clearDeviceMetricsOverride')

    # ── Test 19: export preview controls have accessible text labels ──────────
    nav_export()
    time.sleep(.1)
    refresh_label = eval_js('''(function(){
        const btn = document.querySelector("[data-refresh-preview]");
        return btn ? btn.textContent.trim() : "";
    })()''')
    save_label = eval_js('''(function(){
        const btn = document.querySelector("[data-save-html]");
        return btn ? btn.textContent.trim() : "";
    })()''')
    has_refresh_label = bool(refresh_label and len(str(refresh_label)) > 5)
    has_save_label = bool(save_label and len(str(save_label)) > 5)
    record('export preview controls have accessible text labels', has_refresh_label and has_save_label)

finally:
    chrome.terminate()
    chrome.wait()
    shutil.rmtree(prof, ignore_errors=True)

for status, name, msg in rows:
    print(f'{status} | {name} | {msg}')
print(f'{passed} passed, {failed} failed')
if failed:
    sys.exit(1)
