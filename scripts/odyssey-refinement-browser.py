"""Real browser regression for rules returns, locale art and safe late-slot review."""
import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];APP=ROOT/'public/mtgtools/odyssey'
OUT=Path(os.environ.get('AUDIT_OUT','/tmp/odyssey-refinement/browser'));OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('AUDIT_URL','http://127.0.0.1:8787/mtgtools/odyssey/')
manifest=json.loads((APP/'data/artwork-manifest.json').read_text());plan=json.loads((ROOT/'scripts/odyssey-refinement-plan.json').read_text())
report={'url':BASE,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'viewports':{},'errors':[]}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for name,width,height in [('desktop',1440,1000),('mobile',390,844)]:
   context=browser.new_context(viewport={'width':width,'height':height});page=context.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(BASE,wait_until='domcontentloaded',timeout=60000)
   page.wait_for_function("typeof CARDS!=='undefined' && CARDS.length===309 && typeof OdysseyRefinement!=='undefined' && window.OdysseyDesignReviewMounted",timeout=45000)
   page.evaluate('document.fonts.ready')
   assert page.evaluate('ART.length')==458
   assert page.evaluate("CARDS.every(c=>!!OdysseyArtDelivery.full(artById[c.primaryArt]))")
   page.evaluate('selectCard(198)')
   page.wait_for_timeout(250)
   assert page.locator('#previewShell .od-ability-label').count()==1
   page.screenshot(path=str(OUT/(name+'-devotion.png')),full_page=False)
   for number,label in [(143,'great-hall'),(270,'windswept-isle'),(273,'palmshade-cove')]:
    page.evaluate('(n)=>selectCard(n)',number)
    page.wait_for_function("document.querySelector('#previewShell .art-img')?.naturalWidth>0",timeout=45000)
    page.wait_for_timeout(120)
    assert page.locator('#previewShell [data-symbol="T"]').count()>0
    assert page.locator('#previewShell [data-rule-sentence]').count()==2
    page.screenshot(path=str(OUT/(name+'-'+label+'.png')),full_page=False)
   # Existing user-defined manual art, all Greek coloured pips and symbols stay intact.
   page.evaluate("selectCard(1);setCropField('zoom',1.23);setCropField('focusX',43);setCropField('focusY',57)")
   crop=page.evaluate("({art:model(1).artId,z:model(1).zoom,x:model(1).focusX,y:model(1).focusY})")
   page.evaluate("selectCard(274);document.getElementById('removeArtCard').click()")
   assert page.evaluate("odysseyReplacementQueue().find(c=>c.number===274)?.action")=='replace-slot'
   page.evaluate("selectCard(275);document.querySelector('[data-design-action=\"recast\"]').click();document.getElementById('removeArtCard').click()")
   assert page.evaluate("odysseyReplacementQueue().find(c=>c.number===275)?.action")=='recast'
   page.evaluate("selectCard(270);document.getElementById('removeArtCard').click()")
   assert page.evaluate('!odysseyReplacementQueue().some(c=>c.number===270)')
   page.reload(wait_until='domcontentloaded');page.wait_for_function("window.OdysseyDesignReviewMounted",timeout=45000)
   assert page.evaluate("odysseyReplacementQueue().find(c=>c.number===274)?.action")=='replace-slot'
   assert page.evaluate("odysseyReplacementQueue().find(c=>c.number===275)?.action")=='recast'
   assert page.evaluate("({art:model(1).artId,z:model(1).zoom,x:model(1).focusX,y:model(1).focusY})")==crop
   page.evaluate('selectCard(275)');page.wait_for_timeout(100)
   page.screenshot(path=str(OUT/(name+'-recast.png')),full_page=False)
   page.evaluate('openArtOptions(143)');page.locator('[data-art-search-scope="all"]').click();page.locator('#artOptionSearch').fill('Great Hall');page.wait_for_timeout(250)
   assert page.locator('#artOptionsGrid [data-art-option="ART-451"]').count()==1
   page.screenshot(path=str(OUT/(name+'-land-artwork.png')),full_page=False)
   page.evaluate('closeArtOptions()')
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2')
   if name=='desktop':
    report['typography']=page.evaluate("""async () => {
      const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:378px;visibility:hidden;';document.body.append(host);const results=[];
      for(const card of CARDS){
        const m={...model(card.number),artId:'',imageUrl:''};const shell=makeCardShell(m);host.append(shell);
        const rendered=shell.querySelector('.render-card');rendered.style.width='378px';fitCardTypography(rendered);
        const rules=rendered.querySelector('.rules');results.push({number:card.number,name:card.name,layout:card.layout,fit:rules?.dataset.fitState,font:rules?.dataset.fittedSize,sentences:rendered.querySelectorAll('[data-rule-sentence]').length,rulesHeight:rules?.clientHeight,scrollHeight:rules?.scrollHeight});shell.remove();
      }
      host.remove();return results;
    }""")
    report['overflowCards']=[r for r in report['typography'] if r['fit']=='overflow']
    # Decode all newly acquired full images and their separate thumbnails in the browser.
    rows=[]
    for art in plan['artworks']:
     r=manifest['artworks'][art['id']]
     for kind in ['full','thumb']:rows.append({'id':art['id'],'kind':kind,**r[kind]})
    report['newImages']=page.evaluate("""async rows => {
      const results=[];for(const row of rows){const im=new Image();im.decoding='async';im.src=row.url;try{await im.decode();results.push({...row,ok:im.naturalWidth===row.width&&im.naturalHeight===row.height});}catch(e){results.push({...row,ok:false,error:String(e)});}im.src='';}return results;
    }""",rows)
    assert all(r['ok'] for r in report['newImages'])
    page.evaluate("""() => {const old=document.getElementById('symbol-proof');old?.remove();const panel=document.createElement('section');panel.id='symbol-proof';panel.style.cssText='position:fixed;inset:140px 30px auto;background:#f4ead6;color:#211d16;padding:30px;z-index:99999;display:flex;gap:25px;align-items:center;flex-wrap:wrap';panel.innerHTML=['C','2','10','T','Q','S','E','P','W/U','2/W','B/P'].map(t=>'<div><div style="margin:10px;transform:scale(2);transform-origin:center">'+OdysseyPolish.symbolHTML(t,false,MANA_PIP_DATA)+'</div><p>'+t+'</p></div>').join('');document.body.append(panel);} """)
    page.locator('#symbol-proof').screenshot(path=str(OUT/'utility-symbols.png'))
   assert not errors,errors
   report['viewports'][name]={'pageErrors':errors,'devotionLabelVerified':True,'landSentenceReturnsVerified':True,'replacementMarkPreserved':True,'recastMarkPreserved':True,'earlierCardsNotRetired':True,'unrelatedCropPreserved':True,'newArtworkSearchVerified':True}
   context.close()
  browser.close()
 assert not report.get('overflowCards'),report.get('overflowCards')
 report['passed']=True
except Exception as error:report['errors'].append(str(error));report['passed']=False
finally:
 (OUT/'browser-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps({k:v for k,v in report.items() if k not in ['typography','newImages']},ensure_ascii=False,indent=2),flush=True)
 if not report['passed']:raise SystemExit(1)
