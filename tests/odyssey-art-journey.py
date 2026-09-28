"""Real-asset checks for the curated exhibition, without changing Studio's renderer."""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get('EXHIBITION_TEST_URL', 'http://127.0.0.1:8765/mtgtools/Odyssey/scry/')
OUT = Path('test-results/odyssey-art-journey')
OUT.mkdir(parents=True, exist_ok=True)

async def screenshot(page, selector, name):
    await page.locator(selector).evaluate('(e)=>e.scrollIntoView({block:"start",behavior:"instant"})')
    await page.locator(selector).evaluate('''async root => {
      const visible=e=>!e.closest('[inert]')&&e.getClientRects().length;
      const images=[...root.querySelectorAll('img')].filter(visible);
      for(const c of root.querySelectorAll('odyssey-studio-card'))if(visible(c))images.push(...c.shadowRoot.querySelectorAll('img'));
      await Promise.all(images.map(i=>{i.loading='eager';return i.decode();}));
    }''')
    await page.wait_for_timeout(250)
    await page.screenshot(path=str(OUT/name))

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        page=await browser.new_page(viewport={'width':1440,'height':1050},reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        await page.goto(BASE,wait_until='domcontentloaded')
        await page.wait_for_function('window.OdysseyArtJourney?.allocations.length===20',timeout=60000)
        assignments=await page.evaluate('OdysseyArtJourney.allocations')
        assert len({e['id'] for e in assignments})==20
        assert await page.locator('.art-directed').count()==20
        assert await page.locator('#artworkIndex .index-work').count()==20
        assert not await page.locator('#artworkIndex').get_attribute('open')
        assert await page.locator('#heroImage').get_attribute('data-artwork-id')=='ART-221'
        assert await page.locator('#developmentImage').get_attribute('data-artwork-id')=='ART-245'
        assert await page.locator('#developmentImage').get_attribute('data-artwork-crop')=='entranced-face'
        assert await page.locator('#candidateCount').inner_text()=='309'
        mechanics=page.locator('#mechanicChapters')
        assert await mechanics.locator('.carousel-slide').count()==4
        assert await mechanics.locator('.carousel-slide[inert]').count()==3
        await screenshot(page,'#mechanicChapters','mechanics-fate.png')
        await mechanics.get_by_role('button',name='Survival & Ordeals',exact=True).click()
        assert await mechanics.get_attribute('data-slide')=='1'
        await screenshot(page,'#mechanicChapters','mechanics-survival.png')
        viewport=mechanics.locator('.carousel-viewport')
        await viewport.focus();await page.keyboard.press('Home')
        assert await mechanics.get_attribute('data-slide')=='0'
        await viewport.evaluate('(e)=>e.scrollIntoView({block:"center",behavior:"instant"})')
        await viewport.hover();await page.mouse.wheel(160,0);await page.wait_for_timeout(200)
        assert await mechanics.get_attribute('data-slide')=='1','Wheel should advance the mechanics carousel'
        await viewport.focus();await page.keyboard.press('End')
        assert await mechanics.get_attribute('data-slide')=='3'
        await mechanics.get_by_role('button',name='Previous set mechanics',exact=True).click()
        assert await mechanics.get_attribute('data-slide')=='2'
        await screenshot(page,'#mechanicChapters','mechanics-return.png')
        await screenshot(page,'#development','invitation-desktop.png')
        measurements=await page.evaluate('''() => {
          const image=document.querySelector('#developmentImage img'),p=document.querySelector('.participation-panel').getBoundingClientRect(),r=image.getBoundingClientRect();
          return {width:image.naturalWidth,height:image.naturalHeight,filter:getComputedStyle(image).filter,overlap:Math.max(0,Math.min(p.right,r.right)-Math.max(p.left,r.left))};
        }''')
        assert measurements['width']>=900 and measurements['height']>=1200
        assert measurements['filter']=='none' and measurements['overlap']==0
        await page.locator('#developmentCredit [data-journey-art]').click()
        await page.wait_for_function('document.querySelector("#detailVisual img")?.naturalWidth>0')
        assert await page.locator('#detailDialog').is_visible()
        assert await page.locator('#detailVisual img').get_attribute('src') != await page.locator('#developmentImage img').get_attribute('src')
        assert 'Ulysses and the Sirens' in await page.locator('#detailTitle').inner_text()
        await page.keyboard.press('Escape')
        await page.locator('#artworkIndex summary').click()
        await page.locator('#artIndexOrder').select_option('rank')
        assert await page.locator('.index-work').first.locator('[data-journey-art]').get_attribute('data-journey-art')=='ART-245'
        await screenshot(page,'#artwork-route','artwork-index.png')
        await page.locator('[data-art-placement="material-print"]').click()
        assert await page.locator('#mediumChapters').get_attribute('data-slide')=='4'
        assert await page.locator('#chapter-print .art-directed').get_attribute('data-artwork-id')=='ART-053'
        await screenshot(page,'#mediumChapters','troy-print.png')
        await page.locator('#artworkIndex summary').click()
        for width in [390,768,1440]:
            await page.set_viewport_size({'width':width,'height':1050})
            await screenshot(page,'#development',f'invitation-{width}.png')
            assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),f'Horizontal overflow at {width}'
        await page.set_viewport_size({'width':1440,'height':1050})
        await screenshot(page,'#route-landfalls','landfalls.png')
        await page.get_by_role('button',name='Open spoiler ↗',exact=True).click()
        # Scrolling to Load more also triggers the auto-loader, which can hide
        # the target before a pointer click. Exercise its actual click handler
        # without scrolling and still require every native card below.
        for _ in range(10):
            before=await page.locator('#cardGrid odyssey-studio-card').count()
            if before>=309:
                break
            await page.locator('#loadMore').evaluate('(button)=>{if(!button.hidden&&!button.disabled)button.click();}')
            await page.wait_for_function('(before)=>document.querySelectorAll("#cardGrid odyssey-studio-card").length>before',arg=before,timeout=10000)
        assert await page.locator('#cardGrid odyssey-studio-card').count()==309
        overflow=await page.locator('#cardGrid odyssey-studio-card').evaluate_all('''els=>els.filter(e=>e.dataset.renderError||e.shadowRoot.querySelector('.rules')?.dataset.fitState==='overflow'||e.shadowRoot.querySelector('.name')?.dataset.fitState==='overflow').map(e=>e.getAttribute('number'))''')
        assert not overflow,overflow
        assert not errors,errors
        result={'status':'passed','showcaseWorks':20,'uniqueShowcaseWorks':20,'indexWorks':20,'mechanicsCarousel':['arrows','tabs','keyboard','wheel'],'invitationArtwork':'ART-245','invitationCrop':measurements,'responsiveWidths':[390,768,1440],'nativeStudioCandidates':309,'rulesOverflow':overflow,'pageErrors':errors,'allocations':assignments}
        (OUT/'results.json').write_text(json.dumps(result,indent=2))
        print(json.dumps(result,indent=2))
        await browser.close()

asyncio.run(main())
