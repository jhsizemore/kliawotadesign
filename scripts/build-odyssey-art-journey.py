"""Create exhibition derivatives only. Never alter the set file, source images or card crops.
Run from the repository root with Pillow installed. The single replacement source is
another reproduction of the same Waterhouse painting, not a new illustration.
"""
import hashlib
import io
import json
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path('public')
PAGE = ROOT / 'mtgtools/Odyssey/scry'
OUT = PAGE / 'assets/journey'
PLAN = json.loads((PAGE / 'art-direction.json').read_text())
DATA = json.loads((ROOT / 'mtgtools/odyssey/data/odyssey-data.json').read_text())
MANIFEST = json.loads((ROOT / 'mtgtools/odyssey/data/artwork-manifest.json').read_text())['artworks']
ARTS = {a['id']: a for a in DATA['artworks']}
OUT.mkdir(parents=True, exist_ok=True)
Image.MAX_IMAGE_PIXELS = 100000000
report = {'version': PLAN['version'], 'assets': {}}

def save_variant(image, name, max_size, quality=90):
    result = image.copy()
    result.thumbnail(max_size, Image.Resampling.LANCZOS)
    data = io.BytesIO()
    result.save(data, format='WEBP', quality=quality, method=6)
    raw = data.getvalue()
    filename = name + '.' + hashlib.sha256(raw).hexdigest()[:12] + '.webp'
    (OUT / filename).write_bytes(raw)
    return {'url': '/mtgtools/Odyssey/scry/assets/journey/' + filename,
            'width': result.width, 'height': result.height, 'bytes': len(raw),
            'sha256': hashlib.sha256(raw).hexdigest()}

for entry in PLAN['entries']:
    aid = entry['id']; art = ARTS[aid]; record = MANIFEST[aid]
    assert record['status'] == 'verified', aid
    assert record['title'] == art['title'] and record['source'] == art['source'], aid
    original = ROOT / record['full']['url'].lstrip('/')
    assert original.is_file(), str(original)
    blob = original.read_bytes()
    assert hashlib.sha256(blob).hexdigest() == record['full']['sha256'], aid
    source = art['source']; provenance = 'Published identity-checked artwork delivery record'
    if entry.get('upgrade'):
        upgrade = entry['upgrade']
        request = urllib.request.Request(upgrade['image'], headers={'User-Agent': 'OdysseyArtHistoryExhibition/1.0 (source-attributed educational fan project)'})
        with urllib.request.urlopen(request, timeout=90) as response:
            blob = response.read(35000000)
        source = upgrade['source']; provenance = 'Google Art Project reproduction via Wikimedia Commons; NGV collection identity checked'
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(blob))).convert('RGB')
    if entry.get('upgrade'):
        assert list(image.size) == entry['upgrade']['expectedSize'], (aid, image.size)
    asset = {'id': aid, 'title': art['title'], 'artist': art.get('artist'), 'date': art.get('date'),
             'medium': art.get('medium'), 'institution': art.get('institution'), 'rights': art.get('rights'),
             'source': source, 'catalogueSource': art['source'], 'verification': provenance,
             'masterWidth': image.width, 'masterHeight': image.height,
             'sourceSha256': hashlib.sha256(blob).hexdigest(),
             'full': save_variant(image, aid + '-full', (3600, 3600), 93),
             'display': save_variant(image, aid + '-display', (2000, 2000), 91),
             'thumb': save_variant(image, aid + '-thumb', (600, 450), 86)}
    if aid == 'ART-245':
        asset['museum'] = entry['upgrade']['museum']
        asset['rights'] = 'Public-domain painting; faithful Google Art Project reproduction via Wikimedia Commons. Detail cropped for this exhibition; complete work available in the viewer.'
        rect = [0.586, 0.28, 0.70, 0.64]
        crop = image.crop(tuple(round(v * (image.width if i % 2 == 0 else image.height)) for i, v in enumerate(rect)))
        asset['face'] = save_variant(crop, aid + '-entranced-face', (1600, 2200), 95)
        asset['face']['sourceRect'] = rect
        asset['face']['description'] = 'Detail: Odysseus listening to the Sirens, face and upper body; no retouching or generated pixels.'
    report['assets'][aid] = asset
    print(aid, art['title'], image.size, flush=True)

assert len(report['assets']) == 20
(PAGE / 'art-journey-assets.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
# Machine-readable data is also available before the exhibition-ready event.
(PAGE / 'art-journey-assets.js').write_text('window.OdysseyJourneyAssets=' + json.dumps(report, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('Created 20 credited responsive artwork families; no upscaling or AI imagery.')
