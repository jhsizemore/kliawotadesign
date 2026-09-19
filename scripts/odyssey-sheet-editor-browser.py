import json,os,time
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/tmp/odyssey-sheet-editor');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('AUDIT_URL','http://127.0.0.1:8787/mtgtools/odyssey/')
report={'url':BASE,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'errors':[]}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for name,width,height in [('desktop',1440,1000),('mobile',390,844)]:
   context=browser.new_context(viewport={'width':width,'height':height});page=context.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(BASE,wait_until='domcontentloaded',timeout=60000)
   page.wait_for_function("window.OdysseySheetEditorMounted && typeof OdysseySheetEditor==='object'",timeout=45000)
   assert page.locator('#openFullCardEditor').count()==1
   assert page.locator('#openSheetPush').count()==1
   page.evaluate('selectCard(2)')
   page.locator('#openFullCardEditor').click()
   page.wait_for_selector('.sheet-dialog[open]')
   assert page.locator('[data-sheet-field]').count()==35
   assert page.locator('[data-sheet-field="Mechanics"]').count()==1
   assert page.locator('[data-sheet-field="Flavour Rationale"]').count()==1
   mechanics=page.locator('[data-sheet-field="Mechanics"]')
   before=mechanics.input_value();edited=before+'; browser-safe-edit'
   mechanics.fill(edited)
   page.wait_for_timeout(80)
   assert page.evaluate("model(2).mechanics").endswith('browser-safe-edit')
   page.locator('[data-review]').first.click()
   page.wait_for_selector('#odSheetPushDialog[open]')
   # Install an isolated in-browser mock of the exact Google values API contract.
   page.evaluate("""() => {
     const E=OdysseySheetEditor;
     window.__sheetPosts=0;
     window.__fakeRows=[E.HEADERS.slice()];
     for(const c of CARDS){
       const r=Array(E.HEADERS.length).fill('');r[0]=c.number;
       for(const f of E.FIELDS)r[E.HEADERS.indexOf(f.h)]=E.val(baseCard(c.number),f);
       window.__fakeRows.push(r);
     }
     window.ODYSSEY_SHEET_TEST_TOKEN='test-token';
     window.ODYSSEY_SHEET_TEST_TRANSPORT=async(path,opt)=>{
       if((opt?.method||'GET')==='GET')return {values:window.__fakeRows.map(r=>r.slice())};
       if(path==='/values:batchUpdate'){
         window.__sheetPosts++;
         const b=JSON.parse(opt.body);
         for(const x of b.data){
           const m=/!([A-Z]+)([0-9]+)$/.exec(x.range),letters=m[1],row=+m[2]-1;
           let col=0;for(const ch of letters)col=col*26+ch.charCodeAt(0)-64;col--;
           window.__fakeRows[row][col]=x.values[0][0];
         }
         return {totalUpdatedCells:b.data.length};
       }
       throw Error('Unexpected mock path '+path);
     };
   }""")
   page.locator('[data-check]').click()
   page.wait_for_selector('.sheet-ok')
   page.locator('#odSheetPushDialog [data-confirm]').check()
   page.locator('#odSheetPushDialog [data-push]').click()
   page.wait_for_function("document.querySelector('[data-report]')?.textContent.includes('Push verified.')",timeout=20000)
   assert page.evaluate('window.__sheetPosts')==1
   assert page.evaluate("""() => {
     const hi=OdysseySheetEditor.HEADERS.indexOf('Mechanics');
     return window.__fakeRows[2][hi].endsWith('browser-safe-edit');
   }""")
   # A second edit with a concurrent live value must block before any write.
   page.locator('[data-close]').click()
   page.wait_for_timeout(50)
   page.locator('#openFullCardEditor').click();page.wait_for_selector('.sheet-dialog[open]')
   field=page.locator('[data-sheet-field="Archetypes"]');arch=field.input_value();field.fill(arch+'; local-change')
   page.locator('[data-review]').first.click();page.wait_for_selector('#odSheetPushDialog[open]')
   page.evaluate("""() => {
     const hi=OdysseySheetEditor.HEADERS.indexOf('Archetypes');
     window.__fakeRows[2][hi]='concurrent-sheet-edit';
   }""")
   posts=page.evaluate('window.__sheetPosts')
   page.locator('[data-check]').click();page.wait_for_selector('.sheet-block')
   assert 'Live value changed' in page.locator('.sheet-block').inner_text()
   assert page.locator('#odSheetPushDialog [data-push]').is_disabled()
   assert page.evaluate('window.__sheetPosts')==posts
   page.screenshot(path=str(OUT/(name+'-safe-push.png')),full_page=False)
   assert not errors,errors
   report[name]={'fullFields':35,'verifiedPush':True,'readBackVerified':True,'conflictBlocked':True,'writesOnConflict':0,'pageErrors':errors}
   context.close()
  browser.close()
 report['passed']=True
except Exception as e:
 report['errors'].append(str(e));report['passed']=False
finally:
 (OUT/'browser-audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
 if not report['passed']:raise SystemExit(1)
