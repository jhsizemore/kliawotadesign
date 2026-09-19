"""Preserve true manual overrides, repair copied catalogue routes, and contain desktop toolbar overflow."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
app=ROOT/'public/mtgtools/odyssey/app.html'
s=app.read_text()
new="""function imageForArt(m){const a=artById[m.artId],saved=(overrides[m.number]&&Object.prototype.hasOwnProperty.call(overrides[m.number],'imageUrl'))?m.imageUrl:'';const mirror=OdysseyArtDelivery.full(a),entry=OdysseyArtDelivery.entry(a);const catalog=!!(mirror&&saved&&[a?.imageUrl,KNOWN_IMAGE_URLS[m.artId],entry?.originalUrl].filter(Boolean).some(u=>badKeyUrl(u)===badKeyUrl(saved)));const manual=catalog?'':saved;return localImageUrls[m.number]||manual||directArtUrl(m.artId)||sizedMuseumUrl(m.imageUrl)||''}"""
s,n=re.subn(r'^function imageForArt\([^\n]*',lambda _:new,s,count=1,flags=re.M);assert n==1
s=s.replace('if(u)await probeImage(u)}catch(e){}qualityAudit.done++','}catch(e){}qualityAudit.done++',1)
style='''<style id="odyssey-desktop-toolbar-fix">
@media screen and (min-width:761px){
 .app{grid-template-rows:128px minmax(0,1fr)}
 .topbar{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:28px 42px 26px;gap:6px 12px;padding:8px 16px;min-width:0}
 .topbar .brand{grid-column:1;grid-row:1;white-space:nowrap}
 .topbar .version{grid-column:2;grid-row:1;justify-self:start;white-space:nowrap}
 .topbar .top-actions{grid-column:1/-1;grid-row:2;display:flex;flex-wrap:nowrap;align-items:stretch;margin:0;min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin}
 .topbar .top-actions>*{flex:0 0 auto;white-space:nowrap}
 .topbar .topstats{grid-column:1/-1;grid-row:3;display:flex;flex-wrap:nowrap;align-items:center;min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;white-space:nowrap;scrollbar-width:thin}
 .topbar .topstats>span{flex:0 0 auto}
}
@media screen and (min-width:761px) and (max-width:1100px){.inspector{top:128px}}
</style>'''
if 'id="odyssey-desktop-toolbar-fix"' not in s:s=s.replace('</head>',style+'\n</head>',1)
app.write_text(s)
t=ROOT/'tests/odyssey-artwork-delivery.test.cjs';tests=t.read_text()
extra=r'''
test('catalogue image choices route to verified full images without mutating saved edits',()=>{const saved={1:{imageUrl:'https://museum.example/original.tif',zoom:1.23,focusX:43}};const context={overrides:saved,localImageUrls:{},artById:{'ART-432':{imageUrl:'https://museum.example/original.tif'}},KNOWN_IMAGE_URLS:{},OdysseyArtDelivery:{full:()=>full,entry:()=>({originalUrl:'https://museum.example/original.tif'})},badKeyUrl:u=>u,directArtUrl:()=>full,sizedMuseumUrl:u=>u};vm.createContext(context);vm.runInContext(single('imageForArt'),context);assert.equal(context.imageForArt({number:1,artId:'ART-432',imageUrl:saved[1].imageUrl}),full);assert.equal(saved[1].imageUrl,'https://museum.example/original.tif');assert.equal(saved[1].zoom,1.23);assert.equal(saved[1].focusX,43);const custom='https://my.example/custom.jpg';assert.equal(context.imageForArt({number:1,artId:'ART-432',imageUrl:custom}),custom);context.localImageUrls[1]='blob:my-upload';assert.equal(context.imageForArt({number:1,artId:'ART-432',imageUrl:custom}),'blob:my-upload');});
'''
if "test('catalogue image choices" not in tests:t.write_text(tests+extra)
b=ROOT/'scripts/odyssey-browser-audit.py';browser=b.read_text()
anchor="   page.evaluate('selectCard(1);openArtOptions(1)')"
extra="""   page.evaluate(\"selectCard(1);applyArt('ART-432');setCropField('zoom',1.23);setCropField('focusX',43);setCropField('focusY',57)\")
   page.wait_for_function(\"document.querySelector('#previewShell .art-img')?.naturalWidth===7195 && document.querySelector('#previewShell .art-img')?.src.includes('/assets/artwork/')\",timeout=45000)
   chosen=page.evaluate(\"({zoom:model(1).zoom,x:model(1).focusX,y:model(1).focusY,art:model(1).artId})\")
   page.reload(wait_until='domcontentloaded')
   page.wait_for_function(\"typeof CARDS!=='undefined' && CARDS.length===309\",timeout=45000)
   page.evaluate('selectCard(1)')
   page.wait_for_function(\"document.querySelector('#previewShell .art-img')?.naturalWidth===7195 && document.querySelector('#previewShell .art-img')?.src.includes('/assets/artwork/')\",timeout=45000)
   assert page.evaluate(\"({zoom:model(1).zoom,x:model(1).focusX,y:model(1).focusY,art:model(1).artId})\")==chosen
   assert page.evaluate(\"model(1).artId\")== 'ART-432'
   if name=='desktop':
    assert page.evaluate(\"document.querySelector('.topbar .topstats').getBoundingClientRect().bottom <= document.querySelector('.topbar').getBoundingClientRect().bottom\"), 'Desktop status badges overlap card browser'
   page.screenshot(path=str(OUT/(name+'-studio.png')),full_page=False)
"""
if 'chosen=page.evaluate' not in browser:
 assert anchor in browser;browser=browser.replace(anchor,extra+anchor,1)
 browser=browser.replace("'cropReloadPreserved':True,","'cropReloadPreserved':True,'selectedArtworkReloadVerified':True,",1)
 b.write_text(browser)
manifest=re.search(r'/data/(artwork-delivery-manifest\.[a-f0-9]+\.js)',s).group(1)
for old in (app.parent/'data').glob('artwork-delivery-manifest.*.js'):
 if old.name!=manifest:old.unlink()
print('Verified catalogue-route recovery and desktop toolbar containment added; saved overrides and card files unchanged.')
