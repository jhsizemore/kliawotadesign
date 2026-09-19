"""Audit each curated artwork by decoding the actual image, never by URL presence.
Only exact source records are used; no search-result substitutions or invented art.
Full images retain native dimensions/composition. Thumbnails never set print DPI.
Run on an isolated branch; generated assets are published only after review.
"""
from __future__ import annotations
import concurrent.futures, hashlib, io, json, os, re, threading, time
from pathlib import Path
from urllib.parse import urlparse, unquote, quote, urljoin
import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'public/mtgtools/odyssey'
OUT = Path('/tmp/odyssey-artwork-audit')
OUT.mkdir(parents=True, exist_ok=True)
ASSETS = APP / 'assets/artwork'
ASSETS.mkdir(parents=True, exist_ok=True)
DATA = json.loads((APP / 'data/odyssey-data.json').read_text())
SOURCE = (APP / 'app.html').read_text()
KNOWN = json.loads(re.search(r'const KNOWN_IMAGE_URLS=(\{[^\n]+\});', SOURCE).group(1))
NGA = json.loads(re.search(r'const NGA_UUIDS=(\{[\s\S]*?\n\});', SOURCE).group(1))
LOCAL = threading.local()
LOCK = threading.Lock()
HOST_LOCKS = {}
FETCH_LOCKS = {}
FETCH_CACHE = {}
Image.MAX_IMAGE_PIXELS = 150_000_000
UA = 'OdysseyArtworkVerifier/1.0 (+https://kliawota.design/mtgtools/odyssey/)'


def get(url: str, json_data=False):
    p = urlparse(url)
    if p.scheme != 'https' or not p.hostname or p.username:
        raise ValueError('Not a public HTTPS source')
    with LOCK:
        lock = FETCH_LOCKS.setdefault(url, threading.Lock())
        host = HOST_LOCKS.setdefault(p.hostname, threading.Semaphore(2))
    with lock:
        if url in FETCH_CACHE:
            result = FETCH_CACHE[url]
            if isinstance(result, Exception):
                raise result
            return json.loads(result[0]) if json_data else result
        with host:
            if not hasattr(LOCAL, 'session'):
                LOCAL.session = requests.Session()
                LOCAL.session.headers.update({'User-Agent': UA, 'Accept': '*/*'})
            error = None
            for attempt in range(2):
                try:
                    with LOCAL.session.get(url, timeout=(8, 22), stream=True) as response:
                        if response.status_code in (429, 503) and not attempt:
                            delay = response.headers.get('Retry-After', '3')
                            time.sleep(min(15, float(delay) if delay.isdigit() else 3))
                            continue
                        response.raise_for_status()
                        chunks, total = [], 0
                        for block in response.iter_content(65536):
                            total += len(block)
                            if total > 65 * 1024 * 1024:
                                raise ValueError('Source exceeds safe 65 MiB acquisition bound')
                            chunks.append(block)
                        result = (b''.join(chunks), response.url, response.headers.get('Content-Type', ''))
                        # Do not retain all large images in process memory.
                        if total < 400000:
                            FETCH_CACHE[url] = result
                        return json.loads(result[0]) if json_data else result
                except Exception as exc:
                    error = exc
                    if attempt == 0 and isinstance(exc, requests.Timeout):
                        time.sleep(1)
                        continue
                    break
            FETCH_CACHE[url] = error
            raise error


def commons_original(url):
    p = urlparse(url)
    name = None
    if p.hostname == 'commons.wikimedia.org':
        for prefix in ['/wiki/Special:Redirect/file/', '/wiki/Special:FilePath/', '/wiki/File:']:
            if p.path.startswith(prefix):
                name = unquote(p.path[len(prefix):]).replace(' ', '_')
                break
    elif p.hostname in ('upload.wikimedia.org', 'thumb.wikimedia.org'):
        path = p.path.replace('/wikipedia/commons/thumb/', '/wikipedia/commons/')
        parts = path.split('/')
        if len(parts) >= 6 and parts[1:3] == ['wikipedia', 'commons']:
            name = unquote(parts[5]).replace(' ', '_')
    if not name:
        return ''
    digest = hashlib.md5(name.encode()).hexdigest()
    return 'https://upload.wikimedia.org/wikipedia/commons/' + digest[0] + '/' + digest[:2] + '/' + quote(name, safe="!$&'()*+,-.;=@_~")


def candidates(a):
    values = [a.get('imageUrl'), KNOWN.get(a['id'])]
    if a['id'] in NGA:
        values += ['https://api.nga.gov/iiif/' + NGA[a['id']] + '/full/max/0/default.jpg']
    values += [commons_original(a.get('source', ''))]
    output = []
    for url in values:
        if not url:
            continue
        original = commons_original(url)
        if original:
            output.append(original)
        output.append(url)
    return list(dict.fromkeys(output))


def first_link(obj, keys):
    for key in keys:
        value = obj.get(key)
        if not value:
            continue
        if not isinstance(value, list):
            value = [value]
        for item in value:
            found = item if isinstance(item, str) else item.get('id', item.get('@id', ''))
            if found:
                return found
    return ''


def rijks_data(value):
    return value.replace('http://id.rijksmuseum.nl/', 'https://data.rijksmuseum.nl/').replace('https://id.rijksmuseum.nl/', 'https://data.rijksmuseum.nl/')


def provider(a):
    source = a.get('source', '')
    if 'metmuseum.org/' in source:
        match = re.search(r'(?:search|objects)/(\d+)', source)
        if match:
            record = get('https://collectionapi.metmuseum.org/public/collection/v1/objects/' + match[1], True)
            return [u for u in [record.get('primaryImage'), record.get('primaryImageSmall')] if u]
    if 'rijksmuseum.nl/' in source and a.get('objectId'):
        found = get('https://data.rijksmuseum.nl/search/collection?objectNumber=' + quote(a['objectId']), True)
        hit = (found.get('orderedItems') or found.get('items') or [{}])[0]
        oid = hit if isinstance(hit, str) else hit.get('id', hit.get('@id', ''))
        obj = get(rijks_data(oid) + '?_profile=la-framed', True)
        vis = get(rijks_data(first_link(obj, ['shows', 'show'])) + '?_profile=la-framed', True)
        dig = get(rijks_data(first_link(vis, ['digitally_shown_by', 'digitallyShownBy'])) + '?_profile=la-framed', True)
        access = first_link(dig, ['access_point', 'accessPoint'])
        match = re.search(r'iiif\.micr\.io/([^/]+)', access)
        if match:
            base = 'https://iiif.micr.io/' + match[1]
            return [base + '/full/max/0/default.jpg', base + '/full/2400,/0/default.jpg']
        return [access] if access else []
    # Exact collection page metadata only. Never a keyword image search.
    if source.startswith('https://') and 'commons.wikimedia.org/' not in source:
        body, final_url, content_type = get(source)
        text = body.decode('utf-8', errors='replace')
        tags = re.findall(r'<meta\b[^>]*>', text, re.I)
        import html
        found = []
        for tag in tags:
            if re.search(r'(?:property|name)=[\"\'](?:og:image|twitter:image)[\"\']', tag, re.I):
                match = re.search(r'content=[\"\']([^\"\']+)', tag, re.I)
                if match:
                    url = urljoin(final_url, html.unescape(match[1]))
                    if not re.search(r'logo|favicon|default-social|share-default', url, re.I):
                        found.append(url)
        return found
    return []


def asset(image, name, thumb=False):
    pic = image.copy()
    if thumb:
        pic.thumbnail((480, 360), Image.Resampling.LANCZOS)
    extension = 'webp' if max(pic.size) <= 16383 else 'jpg'
    payload = io.BytesIO()
    if extension == 'webp':
        pic.save(payload, 'WEBP', quality=92 if not thumb else 78, method=4)
    else:
        pic.convert('RGB').save(payload, 'JPEG', quality=92, optimize=True)
    content = payload.getvalue()
    if len(content) >= 25 * 1024 * 1024:
        raise ValueError('Optimized image exceeds static asset limit; original left available')
    checksum = hashlib.sha256(content).hexdigest()
    filename = name + '.' + checksum[:12] + ('.thumb.' if thumb else '.full.') + extension
    (ASSETS / filename).write_bytes(content)
    # Verify the encoded file actually decodes, not just the original.
    with Image.open(io.BytesIO(content)) as check:
        check.load()
        assert check.size == pic.size
    return {'url': '/mtgtools/odyssey/assets/artwork/' + filename, 'width': pic.width, 'height': pic.height, 'bytes': len(content), 'sha256': checksum}


def audit(a):
    start = time.monotonic()
    row = {'id': a['id'], 'title': a['title'], 'credit': a.get('credit', ''), 'source': a.get('source', ''), 'rights': a.get('rights', ''), 'attempts': []}
    seen = set()
    groups = [candidates(a), None]
    for group in groups:
        if group is None:
            try:
                group = provider(a)
            except Exception as error:
                row['attempts'].append({'stage': 'exact-source-metadata', 'error': str(error)[:300]})
                continue
        for url in group:
            if not url or url in seen:
                continue
            seen.add(url)
            try:
                raw, final_url, content_type = get(url)
                if not content_type.lower().startswith(('image/', 'application/octet-stream')):
                    raise ValueError('Non-image response: ' + content_type)
                with Image.open(io.BytesIO(raw)) as source_image:
                    source_image.load()
                    if source_image.width < 100 or source_image.height < 100:
                        raise ValueError('Only a small icon/placeholder was returned')
                    image = ImageOps.exif_transpose(source_image).convert('RGB')
                row.update({'status': 'verified', 'originalUrl': final_url, 'requestedUrl': url, 'width': image.width, 'height': image.height, 'originalBytes': len(raw), 'sourceSha256': hashlib.sha256(raw).hexdigest()})
                rights = a.get('rights', '').lower()
                public = any(t in rights for t in ['public domain', 'cc0', 'cc by', 'cc-by', 'pd-old'])
                if public and 'restricted' not in rights:
                    row['full'] = asset(image, a['id'])
                    row['thumb'] = asset(image, a['id'], True)
                    row['delivery'] = 'same-origin'
                else:
                    row['delivery'] = 'external-preview'
                    row['note'] = 'Preview verified, but not mirrored or upscaled; existing reuse/print restrictions retained.'
                row['seconds'] = round(time.monotonic() - start, 2)
                print(a['id'], row['status'], row['delivery'], str(image.width) + 'x' + str(image.height), flush=True)
                return row
            except Exception as error:
                row['attempts'].append({'url': url, 'error': str(error)[:300]})
    row.update({'status': 'unavailable', 'seconds': round(time.monotonic() - start, 2)})
    print(a['id'], 'UNAVAILABLE', json.dumps(row['attempts'])[:300], flush=True)
    return row


if __name__ == '__main__':
    selected = set(os.environ.get('ART_IDS', '').split(',')) - {''}
    old_file = APP / 'data/artwork-manifest.json'
    old = json.loads(old_file.read_text()) if old_file.exists() else {'artworks': {}}
    artworks = [a for a in DATA['artworks'] if not selected or a['id'] in selected]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        rows = list(pool.map(audit, artworks))
    merged = old.get('artworks', {})
    merged.update({row['id']: row for row in rows})
    manifest = {'schema': 'odyssey-artwork-delivery/v1', 'revision': 'artwork-performance-v1', 'checkedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'datasetVersion': DATA['datasetVersion'], 'artworks': dict(sorted(merged.items()))}
    summary = {'total': len(merged), 'verified': sum(r['status'] == 'verified' for r in merged.values()), 'sameOrigin': sum(r.get('delivery') == 'same-origin' for r in merged.values()), 'externalPreviews': [r['id'] for r in merged.values() if r.get('delivery') == 'external-preview'], 'unavailable': [r['id'] for r in merged.values() if r['status'] != 'verified'], 'originalBytes': sum(r.get('originalBytes', 0) for r in merged.values()), 'fullBytes': sum(r.get('full', {}).get('bytes', 0) for r in merged.values()), 'thumbnailBytes': sum(r.get('thumb', {}).get('bytes', 0) for r in merged.values())}
    manifest['summary'] = summary
    text = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    old_file.write_text(text)
    (OUT / 'artwork-audit.json').write_text(text)
    (OUT / 'summary.json').write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2), flush=True)
