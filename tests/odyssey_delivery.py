"""Read-only production verification of the URLs visitors actually load.

Run after the native Cloudflare build completes. HTML is compared structurally
because Cloudflare may rewrite it; first-party scripts/styles are byte-checked at
THEIR REFERENCED URL, including the real version query. No cache-busting URLs,
credentials, subscriber reads, form submissions, or writes are used.
"""
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
import hashlib
import json
import os
import time

ORIGIN = 'https://kliawota.design'
ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    '/mtgtools/Odyssey/scry/': 'public/mtgtools/Odyssey/scry/index.html',
    '/mtgtools/Odyssey/scry/art.html': 'public/mtgtools/Odyssey/scry/art.html',
    '/mtgtools/Odyssey/scry/social/': 'public/mtgtools/Odyssey/scry/social/index.html',
    '/mtgtools/Odyssey/scry/subscribers/': 'public/mtgtools/Odyssey/scry/subscribers/index.html',
    '/mtgtools/odyssey/': 'public/mtgtools/odyssey/index.html',
}
# These two tags are explicitly inserted by the existing site Worker.
STUDIO_INSERTIONS = {
    '/mtgtools/odyssey/frame-system.js?v=20260917-1',
    '/mtgtools/odyssey/frame-system.css?v=20260917-1',
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


class PageContract(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.assets = []
        self.controls = []
        self.feed(text)

    def handle_starttag(self, tag, values):
        a = dict(values)
        if tag == 'script' and a.get('src'):
            self.assets.append(a['src'])
        if tag == 'link' and a.get('rel') == 'stylesheet' and a.get('href'):
            self.assets.append(a['href'])
        if tag in {'form', 'input', 'select', 'button'} and a.get('id'):
            keys = ('id', 'name', 'type', 'method', 'action', 'required')
            self.controls.append((tag, tuple((k, True if k == 'required' else a.get(k)) for k in keys if k in a)))


def local_asset(url, page):
    """Return a first-party browser asset URL and its repository-relative path."""
    full = urljoin(ORIGIN + page, url)
    parsed = urlsplit(full)
    if parsed.scheme != 'https' or parsed.netloc != 'kliawota.design':
        raise ValueError('Unexpected external asset in the release contract')
    if not parsed.path.startswith('/mtgtools/') or '..' in parsed.path.split('/'):
        raise ValueError('Unexpected asset path')
    return full, 'public' + parsed.path


def contract_matches(local, delivered, page):
    expected, actual = PageContract(local), PageContract(delivered)
    # Cloudflare Email Address Obfuscation adds this script to HTML containing
    # addresses. It is not an application module. No other extra JS is accepted.
    actual.assets = [a for a in actual.assets
                     if not a.startswith('/cdn-cgi/scripts/') or not a.endswith('/email-decode.min.js')]
    if page == '/mtgtools/odyssey/':
        actual.assets = [a for a in actual.assets if a not in STUDIO_INSERTIONS]
    exp = [local_asset(a, page)[0] for a in expected.assets]
    got = [local_asset(a, page)[0] for a in actual.assets]
    if exp != got:
        return False, 'Script/style URLs or order differ from the repository'
    if expected.controls != actual.controls:
        return False, 'Form/control contract differs from the repository'
    return True, ''


def get(url):
    request = Request(url, headers={'User-Agent': 'Odyssey-readonly-production-check',
                                    'Cache-Control': 'no-cache'})
    with urlopen(request, timeout=25) as response:
        data = response.read(8_000_001)
        if len(data) > 8_000_000:
            raise ValueError('Response exceeds verification limit')
        if urlsplit(response.url).netloc != 'kliawota.design':
            raise ValueError('Unexpected cross-origin redirect')
        return data


def verify_once(fetch=get, root=ROOT):
    report = {'status': 'pending', 'site': ORIGIN + '/mtgtools/Odyssey/scry/',
              'commit': os.environ.get('GITHUB_SHA', ''), 'readOnly': True,
              'submissionsMade': False, 'privateSubscribersRead': False,
              'pages': [], 'assets': [], 'errors': []}
    assets = {}
    for page, filename in PAGES.items():
        try:
            local = (root / filename).read_text()
            delivered = fetch(ORIGIN + page).decode('utf-8')
            same, reason = contract_matches(local, delivered, page)
            report['pages'].append({'url': ORIGIN + page, 'contractMatches': same,
                                    'rawHTMLIdentical': local == delivered})
            if not same:
                raise ValueError(reason)
            for a in PageContract(local).assets:
                full, path = local_asset(a, page)
                assets[full] = path
        except Exception as e:
            report['errors'].append({'url': ORIGIN + page, 'error': str(e)[:300]})

    def check(item):
        url, filename = item
        try:
            actual, expected = digest(fetch(url)), digest((root / filename).read_bytes())
            return {'url': url, 'expected': expected, 'delivered': actual,
                    'matches': expected == actual}
        except Exception as e:
            return {'url': url, 'matches': False, 'error': str(e)[:300]}
    with ThreadPoolExecutor(max_workers=6) as pool:
        report['assets'] = list(pool.map(check, sorted(assets.items())))
    report['errors'].extend({'url': a['url'], 'error': a.get('error', 'Delivered asset bytes differ')}
                            for a in report['assets'] if not a['matches'])
    try:
        path = '/mtgtools/odyssey/data/odyssey-public-candidate.json'
        public = json.loads(fetch(ORIGIN + path))
        local = json.loads((root / ('public' + path)).read_text())
        if public != local:
            raise ValueError('Delivered candidate is not the repository candidate')
        report['candidateSource'] = public['publicCandidate']['sourceVersion']
        report['candidateCardsSha256'] = public['publicCandidate']['cardsSha256']
        report['cards'] = len(public['cards'])
        release = json.loads(fetch(ORIGIN + '/mtgtools/odyssey/data/release.json'))
        expected = json.loads((root / 'public/mtgtools/odyssey/data/release.json').read_text())
        if (release['version'], release['cardsSha256']) != (expected['version'], expected['cardsSha256']):
            raise ValueError('Base-release identity differs from repository')
        report['baseReleaseVersion'] = release['version']
    except Exception as e:
        report['errors'].append({'check': 'candidate-source', 'error': str(e)[:300]})
    try:
        config = json.loads(fetch(ORIGIN + '/mtgtools/odyssey/api/subscriptions/health'))
        if config.get('enabled') is not True or config.get('provider') != 'private-list':
            raise ValueError('Signup collection is unavailable')
        if config.get('campaignsAutomated') is not False:
            raise ValueError('Unexpected campaign configuration')
        report['signupEnabled'] = config['enabled']
        report['campaignsAutomated'] = config['campaignsAutomated']
        report['emailVerification'] = config.get('verification')
        placement = json.loads(fetch(ORIGIN + '/mtgtools/odyssey/api/art-placement'))
        if placement.get('schema') != 'odyssey-art-placement/v1' or not isinstance(placement.get('records'), dict):
            raise ValueError('Invalid public placement response')
        report['publishedPlacements'] = len(placement['records'])
        report['placementRevision'] = placement['revision']
    except Exception as e:
        report['errors'].append({'check': 'public-services', 'error': str(e)[:300]})
    report['status'] = 'passed' if not report['errors'] else 'not-ready'
    report['checkedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    return report


def wait_for_delivery(out=Path('test-results/odyssey-delivery'), timeout=180,
                      fetch=get, sleep=time.sleep, clock=time.monotonic, root=ROOT):
    """Bounded propagation wait AFTER successful deployment; retain diagnostics."""
    out.mkdir(parents=True, exist_ok=True)
    started, attempts = clock(), []
    while True:
        report = verify_once(fetch=fetch, root=root)
        attempts.append({'at': report['checkedAt'], 'status': report['status'], 'errors': report['errors']})
        report['attempts'] = attempts
        (out / 'production.json').write_text(json.dumps(report, indent=2))
        print(json.dumps({'attempt': len(attempts), 'status': report['status'], 'errors': report['errors']}), flush=True)
        if report['status'] == 'passed':
            return report
        if clock() - started >= timeout:
            raise AssertionError('Production did not match the checked release; see ' + str(out / 'production.json'))
        sleep(10)


if __name__ == '__main__':
    wait_for_delivery()
