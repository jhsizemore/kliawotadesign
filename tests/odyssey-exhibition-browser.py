"""Verify the actual published set, shared Studio renderer and public page behavior.
Run with public/ served on port 8765. No invented records or substitute artwork.
"""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get('EXHIBITION_TEST_URL', 'http://127.0.0.1:8765/mtgtools/Odyssey/scry/')
OUT = Path('test-results/odyssey-exhibition')
OUT.mkdir(parents=True, exist_ok=True)
SENTINELS = {'odyssey-layout-overrides-v02':'{"61":{"displayName":"PRIVATE LOCAL DRAFT"}}', 'odyssey-art-crop-profiles-v04':'{"private":{"zoom":8}}'}

async def settled_shot(page, selector, name):
    await page.locator(selector).evaluate('(e)=>e.scrollIntoView({block:"start",behavior:"instant"})')
    await page.locator(selector).evaluate("""async root => {
        const visible = e => !e.closest('[inert]') && e.getClientRects().length;
        const images=[...root.querySelectorAll('img')].filter(visible);
        for(const card of root.querySelectorAll('odyssey-studio-card'))if(visible(card))images.push(...card.shadowRoot.querySelectorAll('img'));
        await Promise.all(images.map(i=>{i.loading='eager';if(i.complete&&i.naturalWidth)return;return new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Screenshot image did not load: '+i.src)),20000);i.addEventListener('load',()=>{clearTimeout(t);resolve();},{once:true});i.addEventListener('error',()=>{clearTimeout(t);reject(Error('Screenshot image failed: '+i.src));},{once:true});});}));
    }""")
    await page.wait_for_timeout(350)
    await page.screenshot(path=str(OUT / name))

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
        await context.add_init_script('for (const [k,v] of Object.entries('+json.dumps(SENTINELS)+')) localStorage.setItem(k,v);')
        page = await context.new_page()
        errors, api_requests = [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: print('BROWSER ERROR:', m.text, flush=True) if m.type=='error' else None)
        page.on('request', lambda req: api_requests.append(req.url) if '/odyssey/api/' in req.url else None)
        await page.goto(BASE+'art.html', wait_until='domcontentloaded')
        await page.wait_for_function('window.OdysseyExhibition?.catalogue.cards.length > 0', timeout=45000)
        total = await page.evaluate('window.OdysseyExhibition.catalogue.cards.length')
        assert await page.locator('#social').count() == 0, 'The composer must not be on the landing page'
        assert await page.locator('#spoiler').is_hidden()
        assert await page.locator('#cardGrid .candidate').count() == 0
        assert await page.locator('#candidateCount').inner_text() == str(total)
        initial_cards = await page.locator('#exhibition odyssey-studio-card').count()
        assert initial_cards <= 20
        assert await page.evaluate('OdysseyStudioRenderer.engine.model(61).displayName !== "PRIVATE LOCAL DRAFT"')
        assert not await page.evaluate('typeof window.model === "function" || !!window.OdysseyPolishInstalled'), 'Editor initialization leaked into public page'
        await page.wait_for_function('document.querySelector("#heroImage img")?.naturalWidth > 0', timeout=60000)
        await settled_shot(page, '#top', 'hero-1440.png')
        await settled_shot(page, '#manifesto', 'project-artwork.png')
        await settled_shot(page, '#mediumChapters', 'materials-clay.png')
        materials = page.locator('#mediumChapters')
        assert await materials.locator('.carousel-slide').count() == 6
        assert await materials.locator('.carousel-slide[inert]').count() == 5
        await materials.get_by_role('button', name='metal', exact=True).click()
        assert await materials.get_attribute('data-slide') == '2'
        await settled_shot(page, '#mediumChapters', 'materials-metal.png')
        viewport = materials.locator('.carousel-viewport')
        await viewport.focus(); await page.keyboard.press('Home')
        assert await materials.get_attribute('data-slide') == '0'
        await viewport.evaluate('(e)=>e.scrollIntoView({block:"center",behavior:"instant"})')
        await viewport.hover(); await page.mouse.wheel(0,180); await page.wait_for_timeout(200)
        assert await materials.get_attribute('data-slide') == '1', 'Wheel must advance an in-view carousel'
        await viewport.focus(); await page.keyboard.press('End')
        assert await materials.get_attribute('data-slide') == '5'
        before_scroll = await page.evaluate('scrollY')
        await viewport.hover(); await page.mouse.wheel(0,240); await page.wait_for_timeout(300)
        assert await page.evaluate('scrollY') > before_scroll + 20, 'The last panel must release page scrolling'
        await settled_shot(page, '#mechanic-fate', 'manifest-fate.png')
        await settled_shot(page, '#mechanic-survival', 'survival-ordeals.png')
        assert await page.locator('#mechanicChapters .mechanic').count() == 4
        assert 'Manifest Hope' not in await page.locator('#mechanicChapters').inner_text()
        themes = page.locator('#storyChapters')
        await themes.get_by_role('button',name='Temptation',exact=True).click()
        assert await themes.get_attribute('data-slide') == '1'
        assert await themes.locator('.carousel-slide[inert]').count() == 2
        await settled_shot(page, '#storyChapters', 'circe-story.png')
        await settled_shot(page, '#development', 'signup-pitch.png')
        await page.locator('#signupRole').select_option('playtesting')
        signup = await page.locator('#signupLink').get_attribute('href')
        assert signup.startswith('mailto:jhsizemore@gmail.com?') and 'playtesting' in signup
        assert 'no automatic mailing-list signup' in (await page.locator('#signupNotice').inner_text()).lower()
        for width in [390,768,1440]:
            await page.set_viewport_size({'width':width,'height':950})
            await page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
            await page.wait_for_timeout(300)
            assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth+1'), f'Horizontal overflow at {width}'
            await page.screenshot(path=str(OUT / f'hero-{width}.png'))
            if width == 390:
                await settled_shot(page, '#mediumChapters','materials-mobile.png')
                await settled_shot(page, '#mechanic-survival','survival-mobile.png')
        await page.get_by_role('button', name='Open spoiler ↗', exact=True).click()
        while await page.locator('#loadMore').is_visible():
            # Dispatch on the actual button: auto-loading may move its viewport position while scrolling.
            await page.locator('#loadMore').evaluate('(e)=>e.click()')
            await page.wait_for_timeout(100)
        assert await page.locator('#cardGrid odyssey-studio-card').count() == total
        await page.wait_for_timeout(400)
        issues = await page.locator('#cardGrid odyssey-studio-card').evaluate_all('''els=>els.map(e=>({number:e.getAttribute('number'),error:e.dataset.renderError,rules:e.shadowRoot.querySelector('.rules')?.dataset.fitState,title:e.shadowRoot.querySelector('.name')?.dataset.fitState})).filter(e=>e.error||e.rules==='overflow'||e.title==='overflow')''')
        assert not issues, json.dumps(issues)
        for number, family in [(200,'prepare'),(209,'saga-creature'),(229,'saga'),(64,'vehicle')]:
            assert await page.locator(f'#cardGrid odyssey-studio-card[number="{number}"]').get_attribute('data-family') == family
        await page.locator('#cardGrid [data-card="209"]').evaluate('(e)=>e.click()')
        assert await page.locator('#detailDialog').is_visible()
        await page.screenshot(path=str(OUT / 'scylla-detail.png'))
        await page.keyboard.press('Escape')
        await page.locator('#cardGrid [data-card="229"]').evaluate('(e)=>e.click()')
        await page.locator('[data-flip="229"]').click()
        assert await page.locator('#detailVisual odyssey-studio-card').get_attribute('face') == 'back'
        assert await page.locator('#detailVisual odyssey-studio-card').get_attribute('data-family') == 'vehicle'
        await page.keyboard.press('Escape')
        await page.locator('#search').fill('zzzz-no-match-zzzz');await page.wait_for_timeout(200)
        assert await page.locator('#cardGrid .candidate').count() == 0
        assert await page.evaluate('Object.fromEntries(Object.keys('+json.dumps(SENTINELS)+').map(k=>[k,localStorage.getItem(k)]))') == SENTINELS
        await page.goto(BASE+'?view=cards#card-200', wait_until='domcontentloaded')
        await page.wait_for_function('window.OdysseyExhibition')
        assert await page.locator('#detailDialog').is_visible()
        await page.keyboard.press('Escape')
        assert not (await page.evaluate('location.hash')).startswith('#card-'), 'Closing a deep-linked dialog should clear its hash'
        await page.goto(BASE+'social/?cards=61,17,209,200,229',wait_until='domcontentloaded')
        await page.wait_for_function('window.OdysseyExhibition')
        assert await page.locator('#social').count() == 1 and await page.locator('#exhibition').count() == 0
        assert await page.locator('.promo-items odyssey-studio-card').count() == 5
        layouts=[]
        chosen=['61','17','209','200','229']
        for fmt in ['landscape','square','portrait','story']:
            await page.locator('#promoFormat').select_option(fmt)
            for count in range(1,6):
                for i, el in enumerate(await page.locator('.promo-select').all()):
                    await el.select_option(chosen[i] if i<count else '')
                await page.wait_for_timeout(70)
                fits=await page.evaluate('''() => {const r=document.querySelector('.promo-items').getBoundingClientRect();return [...document.querySelectorAll('.promo-items .candidate')].every(e=>{const c=e.getBoundingClientRect();return c.left>=r.left-1&&c.right<=r.right+1&&c.top>=r.top-1&&c.bottom<=r.bottom+1;});}''')
                assert fits, f'{fmt}/{count} clips'
                layouts.append(f'{fmt}:{count}')
        await page.locator('#promoFormat').select_option('portrait')
        await page.locator('#promoViewport').scroll_into_view_if_needed()
        await page.wait_for_function('Array.from(document.querySelectorAll("#promoStage odyssey-studio-card")).every(c=>c.shadowRoot.querySelector(".art-img")?.naturalWidth>0)',timeout=60000)
        await page.screenshot(path=str(OUT / 'social-studio.png'))
        try:
            async with page.expect_download(timeout=60000) as event:
                await page.locator('#promoDownload').click()
            await (await event.value).save_as(str(OUT/'studio-reveal-portrait.png'))
        except Exception:
            status=await page.locator('#promoStatus').inner_text()
            print('EXPORT FAILURE STATUS:',status,flush=True)
            failed_svg=await page.evaluate('window.__odysseyFailedExportSVG || null')
            if failed_svg: (OUT/'export-failure.svg').write_text(failed_svg)
            (OUT/'export-failure.json').write_text(json.dumps({'status':status,'errors':errors}))
            await page.screenshot(path=str(OUT/'export-failure.png'))
            raise
        assert 'exported' in (await page.locator('#promoStatus').inner_text()).lower()
        assert not errors, '\n'.join(errors)
        assert all(url.split('?')[0].endswith('/api/art-placement') for url in api_requests), 'The public page requested a private editor API'
        expiry = await context.new_page()
        await expiry.add_init_script('Date.now=()=>Date.parse("2026-11-01T00:00:00+11:00");')
        await expiry.goto(BASE+'?view=cards',wait_until='domcontentloaded')
        await expiry.wait_for_function('window.OdysseyExhibition')
        assert await expiry.locator('#previewClosed').is_visible()
        assert await expiry.locator('#filters').is_hidden()
        assert await expiry.locator('#cardGrid .candidate').count() == 0
        await expiry.close()
        result={'status':'passed','realCandidates':total,'launchCardAppearances':initial_cards,'renderer':'Odyssey Studio source-derived read-only build','rulesAndTitleOverflow':issues,'heroImageLoaded':True,'responsiveWidths':[390,768,1440],'carousels':['materials: arrows, keyboard, wheel, end release, inert','stories: arrows and inert'],'socialLayouts':layouts,'studioPNGExport':True,'privateDraftsIsolated':True,'editorAPIRequests':api_requests,'previewClosesAt':'2026-11-01T00:00:00+11:00','pageErrors':errors}
        (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
        await browser.close()

asyncio.run(main())
