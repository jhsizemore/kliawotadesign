"""Native Studio/public-renderer checks. Never writes to a remote API."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('ODYSSEY_BASE_URL','http://127.0.0.1:8765').rstrip('/')
OUT=Path('test-results/odyssey-full-art-basics');OUT.mkdir(parents=True,exist_ok=True)
results={}
with sync_playwright() as p:
    browser=p.chromium.launch()
    context=browser.new_context(viewport={'width':1600,'height':1100},device_scale_factor=1)
    # LocalStorage edits are isolated to this disposable browser. Never let
    # anonymous finishing/sync tools write to production during verification.
    context.route('**/*',lambda route: route.abort() if route.request.method not in ('GET','HEAD') else route.continue_())
    page=context.new_page()
    page.goto(BASE+'/mtgtools/odyssey/',wait_until='domcontentloaded',timeout=60000)
    page.wait_for_function("typeof window.model === 'function' && typeof window.selectCard === 'function' && document.getElementById('frameSystemReadout')",timeout=60000)
    basics=page.evaluate("""() => {
      const seen=new Set();return CARDS.filter(c=>{const t=model(c.number).type;const sub=t.match(/—\\s*(Plains|Island|Swamp|Mountain|Forest)\\b/);if(!/\\bBasic\\b/.test(t)||!sub||seen.has(sub[1]))return false;seen.add(sub[1]);return true;}).map(c=>({number:c.number,type:model(c.number).type,name:model(c.number).displayName}));
    }""")
    assert len(basics)==5,basics
    numbers=[b['number'] for b in basics]
    for b in basics:
        page.evaluate('(n)=>selectCard(n)',b['number'])
        page.locator('#fFrameStyle').select_option('full-art',force=True)
        page.wait_for_selector('#previewShell .basic-land-full-art')
        geometry=page.evaluate("""() => {
          const c=document.querySelector('#previewShell .render-card'),box=s=>c.querySelector(s).getBoundingClientRect(),a=box('.artbox'),t=box('.typebar'),n=box('.titlebar'),d=box('.basic-land-medallion'),f=box('.footer'),text=box('.type-text');
          return {mana:c.dataset.basicLandMana,medals:c.querySelectorAll('.basic-land-medallion').length,artHeight:a.height,barTop:t.top,nameBottom:n.bottom,medalRight:d.right,textLeft:text.left,barBottom:t.bottom,footerTop:f.top,rules:getComputedStyle(c.querySelector('.rules')).display,label:document.querySelector('#fFrameStyle option[value="full-art"]').label,modelStyle:model(selected).frameStyle,cropKey:cropProfileKey(model(selected))};
        }""")
        assert geometry['rules']=='none',geometry
        assert geometry['medals']==1 and geometry['mana'] in 'WUBRG',geometry
        assert geometry['artHeight']>450 and geometry['barTop']-geometry['nameBottom']>350,geometry
        assert geometry['medalRight']<=geometry['textLeft']+3,geometry
        assert geometry['barBottom']<=geometry['footerTop']+1,geometry
        assert geometry['modelStyle']=='full-art' and '|full-art' in geometry['cropKey'],geometry
        results[b['name']]=geometry
    n=numbers[0]
    page.evaluate("""n=>{selectCard(n);const m={...model(n),zoom:1.17,focusX:9,focusY:-11};diffOverride(n,m);renderPreview();renderPreview();} """,n)
    assert page.locator('#previewShell .basic-land-medallion').count()==1
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function("typeof selectCard==='function' && document.getElementById('frameSystemReadout')",timeout=60000)
    page.evaluate('(n)=>selectCard(n)',n)
    page.wait_for_selector('#previewShell .basic-land-full-art')
    saved=page.evaluate('(n)=>{const m=model(n);return {frameStyle:m.frameStyle,zoom:m.zoom,focusX:m.focusX,focusY:m.focusY}}',n)
    assert saved=={'frameStyle':'full-art','zoom':1.17,'focusX':9,'focusY':-11},saved
    results['persistence']=saved
    page.locator('#fFrameStyle').select_option('standard',force=True)
    assert page.locator('#previewShell .basic-land-medallion').count()==0
    assert page.locator('#previewShell .rules').is_visible()
    page.locator('#fFrameStyle').select_option('full-art',force=True)
    page.wait_for_timeout(1000)
    page.locator('#previewShell').screenshot(path=str(OUT/'studio-full-art-basic.png'))
    guard=page.evaluate("""n=>{
      const m=model(n),out=[];
      for(const extra of [{type:'Land',rules:'This land enters tapped. When it enters, scry 1.'},{type:'Basic Land — Plains',rules:'{T}: Add {W}. You gain 1 life.'}]){
        const sh=makeCardShell({...m,...extra,frameStyle:'full-art'});document.body.append(sh);const c=sh.querySelector('.render-card');out.push({basic:c.classList.contains('basic-land-full-art'),visible:getComputedStyle(c.querySelector('.rules')).display!=='none'});sh.remove();
      } return out;
    }""",n)
    assert all(not x['basic'] and x['visible'] for x in guard),guard
    results['rules_guards']=guard
    page.evaluate("""n=>{const p=document.getElementById('printSheetStage');p.replaceChildren(makeCardShell({...model(n),frameStyle:'full-art'}));}""",n)
    page.emulate_media(media='print')
    print_geometry=page.evaluate("""()=>{const s=document.querySelector('#printSheetStage .card-shell'),c=s.querySelector('.render-card'),r=s.getBoundingClientRect(),t=c.querySelector('.typebar').getBoundingClientRect(),d=c.querySelector('.basic-land-medallion').getBoundingClientRect();return {width:r.width,height:r.height,medal:d.width,rules:getComputedStyle(c.querySelector('.rules')).display,typeY:t.top-r.top};}""")
    assert abs(print_geometry['width']-63*96/25.4)<1,print_geometry
    assert abs(print_geometry['height']-88*96/25.4)<1,print_geometry
    assert print_geometry['rules']=='none' and print_geometry['typeY']>260,print_geometry
    page.locator('#printSheetStage .card-shell').screenshot(path=str(OUT/'print-media-basic.png'))
    results['print']=print_geometry
    page.emulate_media(media='screen')
    page.evaluate("""ns=>{const grid=document.createElement('div');grid.id='basicProof';grid.style.cssText='position:fixed;inset:0;z-index:99999;background:#242424;padding:20px;display:flex;gap:14px;align-items:flex-start';for(const n of ns){const wrap=document.createElement('div');wrap.style.cssText='width:295px;height:414px;position:relative';const sh=makeCardShell({...model(n),frameStyle:'full-art'});sh.style.cssText='transform:scale(.78);transform-origin:0 0;margin:0';wrap.append(sh);grid.append(wrap)}document.body.append(grid);} """,numbers)
    page.wait_for_timeout(3000)
    page.locator('#basicProof').screenshot(path=str(OUT/'five-basic-lands.png'))
    page.evaluate("document.getElementById('basicProof').remove()")
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate('(n)=>selectCard(n)',n)
    assert page.locator('#previewShell .basic-land-medallion').count()==1
    page.wait_for_function("document.querySelector('#previewShell .art-img')?.complete && document.querySelector('#previewShell .art-img')?.naturalWidth > 0")
    page.wait_for_timeout(600)
    page.screenshot(path=str(OUT/'mobile-studio.png'),full_page=True)
    page.locator('#previewShell').screenshot(path=str(OUT/'mobile-basic.png'))
    results['mobile']='390 px viewport: native frame visible'
    public=context.new_page()
    public.goto(BASE+'/mtgtools/Odyssey/scry/',wait_until='domcontentloaded',timeout=60000)
    public.wait_for_function("window.OdysseyStudioRenderer?.engine",timeout=60000)
    public.evaluate("""n=>{const el=document.createElement('odyssey-studio-card');el.id='basicPublicProof';el.setAttribute('number',n);el.setAttribute('frame-style','full-art');el.style.cssText='position:fixed;z-index:99999;top:20px;left:20px;width:378px;height:528px';document.body.append(el);} """,n)
    public.wait_for_function("document.getElementById('basicPublicProof').shadowRoot.querySelector('.basic-land-full-art')")
    public_check=public.evaluate("""()=>{const c=document.getElementById('basicPublicProof').shadowRoot.querySelector('.render-card');return {mana:c.dataset.basicLandMana,rules:getComputedStyle(c.querySelector('.rules')).display,medals:c.querySelectorAll('.basic-land-medallion').length};}""")
    assert public_check['rules']=='none' and public_check['medals']==1,public_check
    public.wait_for_timeout(1500)
    public.locator('#basicPublicProof').screenshot(path=str(OUT/'public-basic.png'))
    results['public']=public_check
    (OUT/'results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps({'success':True,'basics':basics,'results':results},indent=2),flush=True)
    browser.close()
