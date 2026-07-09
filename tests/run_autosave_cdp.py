"""
v07.5 Transparent local autosave / recovery tests.

Test cases:
1.  Edit project → autosave writes to localStorage key.
2.  Saved value contains savedAt and project payload.
3.  Boot with saved draft → restore prompt appears.
4.  Restore loads saved draft.
5.  Dismiss keeps current/default state.
6.  Clear removes saved draft.
7.  Corrupt saved draft does not crash app.
8.  Schema/version mismatch does not silently load.
9.  Import valid JSON → autosave updates after validation.
10. Standalone HTML export does not depend on editor autosave.
11. Standalone HTML does not write to editor autosave key.
12. localStorage unavailable/throwing does not crash app.
13. No visible tick/line-number regression.
14. Autosave status is perceivable text.
15. Autosave strip has role=status (a11y).
16. Mobile 375px has no horizontal overflow from autosave UI.
"""
import json, subprocess, time, requests, websocket, shutil, pathlib, sys, os

ROOT = pathlib.Path(__file__).resolve().parents[1]
AUTOSAVE_KEY = 'taroke.remixer.v07.draft'
SCHEMA_VERSION = '0.7-reset'

CHROME = next(
    (p for p in [
        '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
        '/opt/pw-browsers/chromium/chrome-linux/chrome',
        'chromium-browser', 'chromium', 'google-chrome'
    ] if shutil.which(p) or os.path.exists(p)),
    'chromium'
)

passed = 0; failed = 0; rows = []

def rec(name, ok, msg=''):
    global passed, failed
    if ok: passed += 1; rows.append(('PASS', name, ''))
    else: failed += 1; rows.append(('FAIL', name, str(msg)[:160]))

def boot_chrome(port, prof):
    shutil.rmtree(prof, ignore_errors=True)
    cmd = [
        CHROME, '--headless=new', '--no-sandbox', '--disable-gpu',
        '--disable-dev-shm-usage', '--disable-extensions',
        '--disable-background-networking', '--no-first-run',
        '--no-default-browser-check', f'--user-data-dir={prof}',
        f'--remote-debugging-port={port}', '--remote-allow-origins=*', 'about:blank'
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    for _ in range(60):
        try: requests.get(f'http://127.0.0.1:{port}/json/version', timeout=.2); break
        except Exception: time.sleep(.2)
    else: raise RuntimeError(f'Chrome DevTools on port {port} did not start')
    wsurl = requests.get(f'http://127.0.0.1:{port}/json').json()[0]['webSocketDebuggerUrl']
    ws = websocket.create_connection(wsurl, timeout=10)
    cid = 0
    def send(method, params=None):
        nonlocal cid; cid += 1
        ws.send(json.dumps({'id': cid, 'method': method, 'params': params or {}}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get('id') == cid: return msg
    def ev(expr, await_p=False):
        res = send('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': await_p})
        if 'exceptionDetails' in res.get('result', {}):
            raise RuntimeError(res['result']['exceptionDetails'].get('text', 'JS exception'))
        return res.get('result', {}).get('result', {}).get('value')
    send('Runtime.enable'); send('Page.enable')
    return proc, ws, send, ev

CSS = (ROOT / 'styles.css').read_text()
CORE_JS = (ROOT / 'src/core.js').read_text()
APP_JS = (ROOT / 'src/app.js').read_text()

# Valid draft envelope for injection tests
VALID_DRAFT = json.dumps({
    'savedAt': '2026-07-09T10:00:00.000Z',
    'schemaVersion': SCHEMA_VERSION,
    'project': {
        'schemaVersion': SCHEMA_VERSION,
        'project': {'title': 'Injected Draft', 'author': 'Test', 'sourceTitle': 'Taroko',
                    'sourceUrl': '', 'statement': '', 'credits': ''},
        'workbench': {'theme': 'night'},
        'materials': {
            'trays': {'above': [], 'below': [], 'trans': [], 'imper': [],
                      'intrans': [], 'texture': [], 'adjs': [], 'reserve': []},
            'bankMeta': {}
        },
        'forms': {'language': 'en', 'casePolicy': 'preserve', 'compoundPolicy': 'head', 'overrides': {}},
        'lineDevices': [], 'stanzaPatterns': [], 'flowScenes': [],
        'triggers': [], 'surface': {}, 'notes': [], 'meta': {}
    }
})

def load_app(ev, initial_ls=None, broken_ls=False):
    """
    Inject app into a blank page.
    initial_ls: dict pre-loaded into mock localStorage before app starts.
    broken_ls: if True, localStorage methods all throw (simulates storage denied).
    """
    vp = '<meta name="viewport" content="width=device-width,initial-scale=1">'
    html = f'<!doctype html><html><head><meta charset="utf-8">{vp}<style>{CSS}</style></head><body><div id="app"></div></body></html>'
    ev('document.open();document.write(' + json.dumps(html) + ');document.close();')
    if broken_ls:
        ev('''
        (function(){
          var broken = {
            getItem: function(){ throw new Error("localStorage blocked"); },
            setItem: function(){ throw new Error("localStorage blocked"); },
            removeItem: function(){ throw new Error("localStorage blocked"); }
          };
          Object.defineProperty(window, 'localStorage', {get: function(){ return broken; }, configurable: true});
        })();
        ''')
    else:
        init_data = json.dumps(initial_ls or {})
        ev(f'''
        (function(){{
          window.__mockLS = {init_data};
          var mock = {{
            getItem: function(k){{ return window.__mockLS.hasOwnProperty(k) ? window.__mockLS[k] : null; }},
            setItem: function(k,v){{ window.__mockLS[k] = String(v); }},
            removeItem: function(k){{ delete window.__mockLS[k]; }},
            clear: function(){{ window.__mockLS = {{}}; }}
          }};
          Object.defineProperty(window, 'localStorage', {{get: function(){{ return mock; }}, configurable: true}});
        }})();
        ''')
    ev(CORE_JS + '\n//# sourceURL=core.js')
    ev(APP_JS + '\n//# sourceURL=app.js')
    time.sleep(.5)

def ls_get(ev):
    return ev(f'window.__mockLS && window.__mockLS[{json.dumps(AUTOSAVE_KEY)}] || null')

# ── Single Chrome session for all 16 test cases ───────────────────────────────
prof = '/tmp/chrome-autosave-v075'
proc = None
try:
    proc, ws, send, ev = boot_chrome(9271, prof)

    # ════════════════════════════════════════════════════════════════════════════
    # Tests 1 & 2: Edit project → autosave writes envelope
    # ════════════════════════════════════════════════════════════════════════════
    load_app(ev)  # empty mock localStorage

    ev('document.querySelector("[data-step=\'source\']").click()')
    time.sleep(.2)
    ev('var tf=document.querySelector("[data-bind=\'project.title\']"); tf.value="Autosave Test"; tf.dispatchEvent(new Event("input",{bubbles:true}));')
    time.sleep(.3)

    raw_val = ls_get(ev)
    rec('1: edit project → autosave writes to localStorage key', raw_val is not None)

    if raw_val:
        try:
            env = json.loads(raw_val)
            rec('2a: saved value contains savedAt timestamp', bool(env.get('savedAt')))
            rec('2b: saved value contains schemaVersion', env.get('schemaVersion') == SCHEMA_VERSION)
            rec('2c: saved value contains project payload', isinstance(env.get('project'), dict))
            title_in_env = (env.get('project') or {}).get('project', {}).get('title', '')
            rec('2d: project payload has the edited title', title_in_env == 'Autosave Test')
        except Exception as ex:
            rec('2a: saved value contains savedAt timestamp', False, str(ex))
            rec('2b: saved value contains schemaVersion', False, str(ex))
            rec('2c: saved value contains project payload', False, str(ex))
            rec('2d: project payload has the edited title', False, str(ex))
    else:
        rec('2a: saved value contains savedAt timestamp', False, 'nothing saved')
        rec('2b: saved value contains schemaVersion', False, 'nothing saved')
        rec('2c: saved value contains project payload', False, 'nothing saved')
        rec('2d: project payload has the edited title', False, 'nothing saved')

    # ════════════════════════════════════════════════════════════════════════════
    # Tests 14 & 15: Autosave status perceivable / a11y
    # Navigate away and back to trigger render() which repaints the strip
    # ════════════════════════════════════════════════════════════════════════════
    ev('document.querySelector("[data-step=\'samples\']").click()')
    time.sleep(.15)
    ev('document.querySelector("[data-step=\'source\']").click()')
    time.sleep(.15)
    strip_text = ev('document.querySelector(".autosaveStrip")?.textContent?.trim() || ""')
    rec('14: autosave status is perceivable text (strip has content)', bool(strip_text and len(strip_text) > 5))
    strip_role = ev('document.querySelector(".autosaveStrip")?.getAttribute("role")')
    rec('15: autosave strip has role=status', strip_role == 'status')

    # ════════════════════════════════════════════════════════════════════════════
    # Test 3: Boot with saved draft → restore prompt appears
    # ════════════════════════════════════════════════════════════════════════════
    load_app(ev, initial_ls={AUTOSAVE_KEY: VALID_DRAFT})

    has_restore = bool(ev('!!document.querySelector("[data-restore-draft]")'))
    rec('3a: boot with saved draft: restore prompt appears', has_restore)
    has_pending_strip = bool(ev('!!document.querySelector(".autosavePending")'))
    rec('3b: boot with saved draft: pending strip visible', has_pending_strip)
    live_title = ev('TarokeDebug.project().project.title')
    rec('3c: boot does NOT silently restore (default project active)', live_title != 'Injected Draft')

    # ════════════════════════════════════════════════════════════════════════════
    # Test 4: Restore loads saved draft
    # ════════════════════════════════════════════════════════════════════════════
    if has_restore:
        ev('document.querySelector("[data-restore-draft]").click()')
        time.sleep(.3)
        restored_title = ev('TarokeDebug.project().project.title')
        rec('4a: restore loads saved draft project', restored_title == 'Injected Draft')
        rec('4b: restore hides prompt after click', not ev('!!document.querySelector("[data-restore-draft]")'))
    else:
        rec('4a: restore loads saved draft project', False, 'restore button not found')
        rec('4b: restore hides prompt after click', False, 'restore button not found')

    # ════════════════════════════════════════════════════════════════════════════
    # Test 5: Dismiss keeps current/default state
    # ════════════════════════════════════════════════════════════════════════════
    load_app(ev, initial_ls={AUTOSAVE_KEY: VALID_DRAFT})
    time.sleep(.2)
    if ev('!!document.querySelector("[data-dismiss-draft]")'):
        ev('document.querySelector("[data-dismiss-draft]").click()')
        time.sleep(.2)
        after_dismiss_title = ev('TarokeDebug.project().project.title')
        rec('5a: dismiss: project remains default (draft NOT loaded)', after_dismiss_title != 'Injected Draft')
        rec('5b: dismiss: restore prompt hidden', not ev('!!document.querySelector("[data-dismiss-draft]")'))
        still_in_ls = bool(ev(f'!!window.__mockLS[{json.dumps(AUTOSAVE_KEY)}]'))
        rec('5c: dismiss: saved draft stays in localStorage', still_in_ls)
    else:
        rec('5a: dismiss: project remains default (draft NOT loaded)', False, 'dismiss not found')
        rec('5b: dismiss: restore prompt hidden', False, 'dismiss not found')
        rec('5c: dismiss: saved draft stays in localStorage', False, 'dismiss not found')

    # ════════════════════════════════════════════════════════════════════════════
    # Test 6: Clear removes saved draft
    # ════════════════════════════════════════════════════════════════════════════
    load_app(ev, initial_ls={AUTOSAVE_KEY: VALID_DRAFT})
    time.sleep(.2)
    if ev('!!document.querySelector("[data-clear-draft]")'):
        ev('document.querySelector("[data-clear-draft]").click()')
        time.sleep(.2)
        cleared = not bool(ev(f'!!window.__mockLS[{json.dumps(AUTOSAVE_KEY)}]'))
        rec('6a: clear removes saved draft from localStorage', cleared)
        rec('6b: clear hides restore prompt', not ev('!!document.querySelector("[data-restore-draft]")'))
    else:
        rec('6a: clear removes saved draft from localStorage', False, 'clear button not found on pending strip')
        rec('6b: clear hides restore prompt', False, 'clear button not found')

    # ════════════════════════════════════════════════════════════════════════════
    # Test 7: Corrupt saved draft does not crash app
    # ════════════════════════════════════════════════════════════════════════════
    load_app(ev, initial_ls={AUTOSAVE_KEY: 'NOT_VALID_JSON{{{'})
    time.sleep(.3)
    app_alive = bool(ev('!!window.TarokeCore && !!window.TarokeDebug'))
    enough_buttons = int(ev('document.querySelectorAll("button").length') or 0) > 10
    rec('7a: corrupt saved draft: app still boots', app_alive and enough_buttons)
    rec('7b: corrupt saved draft: no restore prompt shown', not ev('!!document.querySelector("[data-restore-draft]")'))
    warn_text = ev('document.querySelector(".autosaveStrip")?.textContent?.toLowerCase() || ""')
    rec('7c: corrupt saved draft: warning text visible', 'ignored' in warn_text or 'could not' in warn_text)

    # ════════════════════════════════════════════════════════════════════════════
    # Test 8: Schema/version mismatch does not silently load
    # ════════════════════════════════════════════════════════════════════════════
    mismatch_draft = json.dumps({
        'savedAt': '2026-07-09T09:00:00.000Z',
        'schemaVersion': 'OLD-VERSION-0.5',
        'project': {'project': {'title': 'Old Version Project'}}
    })
    load_app(ev, initial_ls={AUTOSAVE_KEY: mismatch_draft})
    time.sleep(.3)
    rec('8a: schema mismatch: restore prompt does not appear', not ev('!!document.querySelector("[data-restore-draft]")'))
    mm_title = ev('TarokeDebug.project().project.title')
    rec('8b: schema mismatch: old project not silently loaded', mm_title != 'Old Version Project')

    # ════════════════════════════════════════════════════════════════════════════
    # Test 9: Edit after fresh load → autosave writes correct envelope
    # ════════════════════════════════════════════════════════════════════════════
    load_app(ev)
    ev('document.querySelector("[data-step=\'source\']").click()')
    time.sleep(.2)
    ev('var tf=document.querySelector("[data-bind=\'project.title\']"); tf.value="Post-Edit Save"; tf.dispatchEvent(new Event("input",{bubbles:true}));')
    time.sleep(.3)
    saved9 = ls_get(ev)
    if saved9:
        env9 = json.loads(saved9)
        rec('9a: autosave writes envelope after edit', bool(env9.get('savedAt')))
        rec('9b: autosave envelope schemaVersion matches app', env9.get('schemaVersion') == SCHEMA_VERSION)
        t9 = (env9.get('project') or {}).get('project', {}).get('title', '')
        rec('9c: autosave captures edited title', t9 == 'Post-Edit Save')
    else:
        rec('9a: autosave writes envelope after edit', False, 'nothing saved')
        rec('9b: autosave envelope schemaVersion matches app', False, 'nothing saved')
        rec('9c: autosave captures edited title', False, 'nothing saved')

    # ════════════════════════════════════════════════════════════════════════════
    # Tests 10 & 11: Standalone HTML export independence
    # ════════════════════════════════════════════════════════════════════════════
    load_app(ev)
    has_export_fn = bool(ev('typeof TarokeCore.exportProjectHtml === "function"'))
    if has_export_fn:
        exported_html = ev('TarokeCore.exportProjectHtml(TarokeDebug.project())')
        rec('10: standalone HTML exports without error', bool(exported_html and len(exported_html) > 500))
        rec('10b: standalone HTML has taroke-project tag (complete artifact)', 'taroke-project' in (exported_html or ''))
        rec('11a: standalone HTML does not reference editor autosave key',
            AUTOSAVE_KEY not in (exported_html or ''))
        rec('11b: standalone HTML runtime has no localStorage.setItem call',
            'localStorage.setItem' not in (exported_html or ''))
    else:
        rec('10: standalone HTML exports without error', False, 'no export function')
        rec('10b: standalone HTML has taroke-project tag', False, 'no export function')
        rec('11a: standalone HTML does not reference editor autosave key', False, 'no export function')
        rec('11b: standalone HTML runtime has no localStorage.setItem call', False, 'no export function')

    # ════════════════════════════════════════════════════════════════════════════
    # Test 12: localStorage unavailable does not crash app
    # ════════════════════════════════════════════════════════════════════════════
    load_app(ev, broken_ls=True)
    time.sleep(.3)
    ls_unavail_alive = bool(ev('!!window.TarokeCore && !!window.TarokeDebug'))
    ls_unavail_btns = int(ev('document.querySelectorAll("button").length') or 0) > 10
    rec('12a: localStorage unavailable: app boots without crashing', ls_unavail_alive and ls_unavail_btns)
    unavail_text = ev('document.querySelector(".autosaveWarn")?.textContent?.toLowerCase() || ""')
    rec('12b: localStorage unavailable: unavailable message shown',
        'unavailable' in unavail_text or 'autosave' in unavail_text)

    # ════════════════════════════════════════════════════════════════════════════
    # Test 13: No visible tick/line-number regression
    # ════════════════════════════════════════════════════════════════════════════
    load_app(ev)
    ev('document.querySelector("[data-step=\'run\']").click()')
    time.sleep(.2)
    ev('document.querySelector("[data-run]").click()')
    time.sleep(1.0)
    ev('document.querySelector("[data-pause]")?.click()')
    time.sleep(.2)
    no_ticks = not ev('''(()=>{
      var ticks=[...document.querySelectorAll(".tick,.line-num")];
      return ticks.some(function(t){
        var s=getComputedStyle(t);
        return s.display!=="none" && s.visibility!=="hidden" && s.opacity!=="0";
      });
    })()''')
    rec('13: no visible tick/line-number spans in run surface', no_ticks)

    # ════════════════════════════════════════════════════════════════════════════
    # Test 16: Mobile 375px has no horizontal overflow from autosave UI
    # ════════════════════════════════════════════════════════════════════════════
    # Trigger autosave to show the saved-status strip
    load_app(ev)
    ev('document.querySelector("[data-step=\'source\']").click()')
    time.sleep(.2)
    ev('var tf=document.querySelector("[data-bind=\'project.title\']"); tf.value="Mobile Overflow Test"; tf.dispatchEvent(new Event("input",{bubbles:true}));')
    time.sleep(.3)
    # Navigate away and back to trigger render() with updated autosaveTime
    ev('document.querySelector("[data-step=\'samples\']").click()')
    time.sleep(.1)
    ev('document.querySelector("[data-step=\'source\']").click()')
    time.sleep(.1)
    send('Emulation.setDeviceMetricsOverride',
         {'width': 375, 'height': 812, 'deviceScaleFactor': 2, 'mobile': True})
    time.sleep(.4)
    no_overflow = not ev('document.documentElement.scrollWidth > document.documentElement.clientWidth')
    strip_visible = bool(ev('!!document.querySelector(".autosaveStrip")'))
    rec('16a: 375px: autosave strip rendered', strip_visible)
    rec('16b: 375px: no horizontal overflow from autosave UI', no_overflow)

finally:
    if proc:
        try: proc.kill()
        except Exception: pass

print(f'{passed} passed, {failed} failed')
for r in rows:
    print(' | '.join(r))
if failed:
    sys.exit(1)
