"""Browser checks against actual published records; no invented artwork fixtures."""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get('EXHIBITION_TEST_URL', 'http://127.0.0.1:8765/mtgtools/Odyssey/scry/')
OUT = Path('test-results/odyssey-exhibition')
OUT.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto(BASE, wait_until='domcontentloaded')
        await page.wait_for_function('window.OdysseyExhibition?.catalogue.cards.length > 0', timeout=45000)
        total = await page.evaluate('window.OdysseyExhibition.catalogue.cards.length')
        assert await page.locator('#spoiler').is_hidden()
        assert await page.locator('#cardGrid .candidate').count() == 0
        assert await page.locator('#candidateCount').inner_text() == str(total)
        initial_cards = await page.locator('#exhibition .candidate').count()
        assert initial_cards <= 30, 'Launch experience is too card-dense'
        await page.wait_for_function('document.querySelector("#heroImage img")?.naturalWidth > 0', timeout=60000)
        await page.screenshot(path=str(OUT / 'desktop-hero.png'))
        if await page.locator('#chapter-stone').count():
            await page.locator('#chapter-stone').scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await page.screenshot(path=str(OUT / 'stone-chapter.png'))
        await page.get_by_role('button', name='Open spoiler ↗', exact=True).click()
        await page.wait_for_function('document.querySelectorAll("#cardGrid .candidate").length > 0')
        while await page.locator('#loadMore').is_visible():
            await page.locator('#loadMore').click()
            await page.wait_for_timeout(150)
        assert await page.locator('#cardGrid .candidate').count() == total
        overflow = await page.locator('#cardGrid [data-overflow="true"]').count()
        assert overflow == 0, f'{overflow} candidate rules boxes overflow'
        first_number = await page.locator('#cardGrid .candidate').first.get_attribute('data-card')
        await page.locator('#cardGrid .candidate').first.click()
        assert await page.locator('#detailDialog').is_visible()
        assert await page.locator('#detailText .oracle').count() == 1
        await page.screenshot(path=str(OUT / 'candidate-detail.png'))
        await page.keyboard.press('Escape')
        await page.locator('#search').fill('zzzz-no-candidate-match-zzzz')
        await page.wait_for_timeout(300)
        assert await page.locator('#cardGrid .candidate').count() == 0
        await page.locator('#clearFilters').click()
        await page.locator('#backExhibition').click()
        await page.locator('#social').scroll_into_view_if_needed()
        available = await page.evaluate('window.OdysseyExhibition.catalogue.cards.filter(c=>c.image).slice(0,5).map(c=>String(c.number))')
        geometry = []
        for fmt in ['landscape','square','portrait','story']:
            await page.locator('#promoFormat').select_option(fmt)
            for size in range(1, min(5,len(available))+1):
                selects = await page.locator('.promo-select').all()
                for i, select in enumerate(selects):
                    await select.select_option(available[i] if i < size else '')
                await page.wait_for_timeout(100)
                fits = await page.evaluate('''() => {
                    const r=document.querySelector('#promoStage').getBoundingClientRect();
                    return [...document.querySelectorAll('#promoStage .candidate')].every(e=>{
                        const c=e.getBoundingClientRect(); return c.left>=r.left-1&&c.right<=r.right+1&&c.top>=r.top&&c.bottom<=r.bottom;
                    });
                }''')
                assert fits, f'{size} cards overflow {fmt}'
                geometry.append(f'{fmt}:{size}')
        await page.screenshot(path=str(OUT / 'story-social.png'))
        for width in [390,768,1440]:
            await page.set_viewport_size({'width':width,'height':950})
            await page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
            await page.wait_for_function('window.scrollY < 2')
            await page.wait_for_timeout(400)
            assert await page.locator('#top h1').evaluate('(e) => {const r=e.getBoundingClientRect();return r.bottom>0 && r.top<innerHeight;}')
            assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth+1'), f'Horizontal overflow at {width}'
            await page.screenshot(path=str(OUT / f'hero-{width}.png'))
        await page.goto(BASE + '?view=cards#card-' + str(first_number).zfill(3), wait_until='domcontentloaded')
        await page.wait_for_function('window.OdysseyExhibition')
        assert await page.locator('#detailDialog').is_visible(), 'Card deep link failed'
        await page.keyboard.press('Escape')
        assert await page.locator('#spoiler').is_visible()
        assert not errors, '\n'.join(errors)
        result = {'status':'passed','realCandidates':total,'launchCardAppearances':initial_cards,'rulesOverflow':overflow,'heroImageLoaded':True,'widths':[390,768,1440],'socialLayouts':geometry,'pageErrors':errors}
        (OUT / 'results.json').write_text(json.dumps(result,indent=2))
        print(json.dumps(result,indent=2))
        await browser.close()

asyncio.run(main())
