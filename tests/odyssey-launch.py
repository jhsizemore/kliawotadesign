"""Regression checks for the approved Odyssey logo and January 7 release campaign."""
import asyncio
import hashlib
import json
import os
import struct
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get('EXHIBITION_TEST_URL', 'http://127.0.0.1:8765/mtgtools/Odyssey/scry/')
OUT = Path('test-results/odyssey-art-journey/launch')
OUT.mkdir(parents=True, exist_ok=True)

async def main():
    source = Path('public/mtgtools/Odyssey/scry/assets/brand/the-odyssey-logo.png').read_bytes()
    assert hashlib.sha256(source).hexdigest() == 'e5fc4e98f58ed6052787208f1305d84396c5aafb87a1425fea8e504ef7a0b39c'
    assert source[:8] == b'\x89PNG\r\n\x1a\n'
    assert struct.unpack('>II', source[16:24]) == (1851, 421)
    assert source[25] == 6, 'Approved logo must retain RGBA transparency'
    checks = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto(BASE, wait_until='domcontentloaded')
        await page.wait_for_function('window.OdysseyArtJourney?.allocations.length===20', timeout=60000)
        assert await page.title() == 'The Odyssey — Releases January 7, 2027'
        assert await page.locator('.opening-wordmark img').get_attribute('alt') == 'The Odyssey'
        assert await page.locator('time[datetime="2027-01-07"]').count() == 4
        assert await page.locator('time[datetime="2026-11-01T00:00:00+11:00"]').count() == 2
        assert 'November 1, 2026' in await page.locator('.spoiler-door').inner_text()
        assert (await page.locator('#signupLink').get_attribute('href')).startswith('mailto:')
        assert 'no automatic mailing-list signup' in (await page.locator('#signupNotice').inner_text()).lower()
        assert await page.locator('#mechanicChapters .carousel-slide').count() == 4
        assert await page.locator('#candidateCount').inner_text() == '309'
        og = await page.locator('meta[property="og:image"]').get_attribute('content')
        assert og == 'https://kliawota.design/mtgtools/Odyssey/scry/assets/brand/the-odyssey-release-20270107.jpg'
        preview = await page.request.get(BASE.rstrip('/') + '/assets/brand/the-odyssey-release-20270107.jpg')
        assert preview.ok and (await preview.body()).startswith(b'\xff\xd8')
        for width in (320,390,768,1440):
            await page.set_viewport_size({'width':width,'height':1000})
            await page.evaluate('scrollTo({top:0,behavior:"instant"})')
            await page.locator('.opening-wordmark img').evaluate('(i)=>i.decode()')
            await page.locator('.nav .brand-logo img').evaluate('(i)=>i.decode()')
            await page.locator('#heroImage img').evaluate('(i)=>i.decode()')
            await page.wait_for_timeout(200)
            measurements = await page.evaluate('''() => {
              const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
              const image=document.querySelector('.opening-wordmark img');
              const credit=document.querySelector('#heroCredit').getBoundingClientRect();
              const copy=document.querySelector('.opening-copy').getBoundingClientRect();
              return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,logo:box(image),nav:box(document.querySelector('.nav .brand-logo')),release:box(document.querySelector('.release-announcement')),logoLoaded:image.complete&&image.naturalWidth>=960,logoSource:image.currentSrc,creditOverlap:Math.max(0,Math.min(credit.right,copy.right)-Math.max(credit.left,copy.left))*Math.max(0,Math.min(credit.bottom,copy.bottom)-Math.max(credit.top,copy.top))};
            }''')
            assert measurements['documentWidth'] <= width + 1, measurements
            assert measurements['logoLoaded'], measurements
            assert '/assets/brand/' in measurements['logoSource'], measurements
            for name in ('logo','nav','release'):
                assert measurements[name]['left'] >= -1 and measurements[name]['right'] <= width+1, measurements
                assert measurements[name]['height'] > 0, measurements
            assert measurements['creditOverlap'] == 0, measurements
            await page.screenshot(path=str(OUT/f'opening-{width}.png'))
            checks.append(measurements)
        await page.locator('.opening .actions a[href="#development"]').click()
        await page.locator('#development .release-date').wait_for(state='visible')
        assert 'January 7, 2027' in await page.locator('#development .release-date').inner_text()
        await page.screenshot(path=str(OUT/'signup-desktop.png'))
        assert not errors, errors
        result = {'status':'passed','releaseDate':'2027-01-07','previewDeadlineUnchanged':'2026-11-01T00:00:00+11:00','approvedPngSha256':hashlib.sha256(source).hexdigest(),'responsive':checks,'pageErrors':errors}
        (OUT/'results.json').write_text(json.dumps(result,indent=2)+'\n')
        print(json.dumps(result,indent=2))
        await browser.close()

asyncio.run(main())
