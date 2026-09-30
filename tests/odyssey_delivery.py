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
import re
import time

def verification_origin(value):
    """Allow the production site or an explicitly configured local test server."""
    parsed = urlsplit(value)
    if parsed.username or parsed.password or parsed.path not in {'', '/'} or parsed.query or parsed.fragment:
        raise ValueError('Verification origin must contain only a scheme and host')
    production = parsed.scheme == 'https' and parsed.netloc == 'kliawota.design'
    isolated = parsed.scheme == 'http' and parsed.hostname in {'localhost', '127.0.0.1', '::1'}
    if not (production or isolated):
        raise ValueError('Verification origin must be production or a local HTTP test server')
    # Validate an optional port before any network requests.
    parsed.port
    return value.rstrip('/')


ORIGIN = verification_origin(os.environ.get('ODYSSEY_DELIVERY_ORIGIN', 'https://kliawota.design'))
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

# Observed production-managed injection, 2026-09-30. Pin the script and SRI;
# changes fail closed for review instead of admitting arbitrary third-party JS.
# https://developers.cloudflare.com/web-analytics/faq/#setup
CLOUDFLARE_BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js/v31edd6df95cf4e85bb4c19e7a9bdbcba1788362987495'
CLOUDFLARE_BEACON_SRI = 'sha512-iIg7k2xntmwu6/uSb5tpc/hySgZc4eoL31yB29W6tJFo2akwjPWcEqnCEdJvGexCL0KEQwVYv5BlowfhVz26hg=='


def digest(data):
    return hashlib.sha256(data).hexdigest()


class PageContract(HTMLParser):
    """Keep executable content and loading semantics, ignoring attribute order."""
    BOOLEAN = {'async', 'defer', 'nomodule', 'disabled'}
    RESOURCE_KEYS = ('src', 'href', 'rel', 'type', 'async', 'defer', 'nomodule',
                     'media', 'disabled', 'integrity', 'crossorigin',
                     'referrerpolicy', 'data-cfasync', 'data-cf-beacon')

    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.assets = []
        self.resources = []
        self.controls = []
        self._inline = None
        self.feed(text)
        self.close()

    def handle_starttag(self, tag, values):
        a = dict(values)
        is_script = tag == 'script'
        is_sheet = tag == 'link' and 'stylesheet' in a.get('rel', '').split()
        if is_script or is_sheet or tag == 'style':
            url = a.get('src') if is_script else a.get('href') if is_sheet else None
            attrs = tuple((k, True if k in self.BOOLEAN else a.get(k))
                          for k in self.RESOURCE_KEYS if k in a)
            resource = {'tag': tag, 'url': url, 'attrs': attrs, 'text': ''}
            self.resources.append(resource)
            if url:
                self.assets.append(url)
            if tag in {'script', 'style'}:
                self._inline = resource
        if tag in {'form', 'input', 'select', 'button'} and a.get('id'):
            keys = ('id', 'name', 'type', 'method', 'action', 'required')
            self.controls.append((tag, tuple((k, True if k == 'required' else a.get(k)) for k in keys if k in a)))

    def handle_data(self, data):
        if self._inline is not None:
            self._inline['text'] += data

    def handle_endtag(self, tag):
        if self._inline is not None and tag == self._inline['tag']:
            self._inline = None


def cloudflare_email_script(resource):
    url = resource['url'] or ''
    attrs = dict(resource['attrs'])
    return (resource['tag'] == 'script' and not resource['text'].strip()
            and set(attrs) <= {'src', 'data-cfasync'}
            and attrs.get('data-cfasync', 'false') == 'false'
            and bool(re.fullmatch(r'/cdn-cgi/scripts/[0-9a-f]+/cloudflare-static/email-decode\.min\.js', url)))


def studio_insertion(resource):
    url, attrs = resource['url'], dict(resource['attrs'])
    if url not in STUDIO_INSERTIONS or resource['text'].strip():
        return False
    return ((resource['tag'] == 'script' and attrs == {'src': url})
            or (resource['tag'] == 'link' and attrs == {'href': url, 'rel': 'stylesheet'}))


def cloudflare_analytics_script(resource):
    attrs = dict(resource['attrs'])
    if (resource['tag'] != 'script' or resource['text'].strip()
            or set(attrs) != {'src', 'type', 'integrity', 'crossorigin', 'data-cf-beacon'}
            or attrs.get('src') != CLOUDFLARE_BEACON_URL
            or attrs.get('type') != 'module'
            or attrs.get('integrity') != CLOUDFLARE_BEACON_SRI
            or attrs.get('crossorigin') != 'anonymous'):
        return False
    try:
        config = json.loads(attrs['data-cf-beacon'])
    except (ValueError, TypeError):
        return False
    return (isinstance(config, dict) and set(config) == {'version', 'token', 'r', 'spa'}
            and config['version'] == '2024.11.0' and config['r'] == 1 and config['spa'] == 2
            and isinstance(config['token'], str) and bool(re.fullmatch('[0-9a-f]{32}', config['token'])))


def normalized_resources(contract, page, delivered=False):
    result, allowed_insertions = [], set()
    analytics_seen = False
    for resource in contract.resources:
        if delivered and cloudflare_email_script(resource):
            continue
        if delivered and cloudflare_analytics_script(resource) and not analytics_seen:
            analytics_seen = True
            continue
        url = resource['url']
        if delivered and page == '/mtgtools/odyssey/' and studio_insertion(resource) and url not in allowed_insertions:
            allowed_insertions.add(url)
            continue
        attrs = dict(resource['attrs'])
        for key in ('src', 'href'):
            if key in attrs:
                attrs[key] = local_asset(attrs[key], page)[0]
        # HTML delivery may normalize line endings, but must not change JS/CSS.
        content = resource['text'].replace('\r\n', '\n').replace('\r', '\n')
        result.append((resource['tag'], tuple(sorted(attrs.items())), content))
    return result


def studio_dependencies(local, page):
    """Read the canonical Studio loader's literal URLs without executing its JS.

    app.html is fetched and rewritten by the inline bootloader. Its external
    resources and loader-inserted tags are part of the browser delivery contract.
    Fail closed if that loader stops exposing the known literal app URL.
    """
    if page != '/mtgtools/odyssey/':
        return [], []
    scripts = '\n'.join(r['text'] for r in PageContract(local).resources
                        if r['tag'] == 'script' and not r['url'])
    apps = re.findall(r"fetch\(\s*['\"](\./app\.html(?:\?[^'\"]*)?)['\"]", scripts)
    if len(apps) != 1:
        raise ValueError('Studio bootloader must expose exactly one literal app.html URL')
    inserted = re.findall(r"(?:src|href)=[\"]([^\"]+)[\"]", scripts)
    # Resolve every URL now, rejecting an unexpected origin or directory.
    pages = [local_asset(a, page) for a in apps]
    assets = [local_asset(a, page) for a in inserted]
    return pages, assets


def local_asset(url, page):
    """Return a first-party browser asset URL and its repository-relative path."""
    full = urljoin(ORIGIN + page, url)
    parsed = urlsplit(full)
    if (parsed.scheme, parsed.netloc) != (urlsplit(ORIGIN).scheme, urlsplit(ORIGIN).netloc):
        raise ValueError('Unexpected external asset in the release contract')
    if not parsed.path.startswith('/mtgtools/') or '..' in parsed.path.split('/'):
        raise ValueError('Unexpected asset path')
    return full, 'public' + parsed.path


def contract_matches(local, delivered, page):
    expected, actual = PageContract(local), PageContract(delivered)
    if normalized_resources(expected, page) != normalized_resources(actual, page, delivered=True):
        return False, 'Script/style content, loading attributes, URLs or order differ from the repository'
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
        if (urlsplit(response.url).scheme, urlsplit(response.url).netloc) != (urlsplit(ORIGIN).scheme, urlsplit(ORIGIN).netloc):
            raise ValueError('Unexpected cross-origin redirect')
        return data


def verify_once(fetch=get, root=ROOT):
    report = {'status': 'pending', 'site': ORIGIN + '/mtgtools/Odyssey/scry/',
              'commit': os.environ.get('ODYSSEY_TARGET_SHA') or os.environ.get('GITHUB_SHA', ''), 'readOnly': True,
              'submissionsMade': False, 'privateSubscribersRead': False,
              'pages': [], 'assets': [], 'managedInsertions': [], 'errors': []}
    assets = {}
    pages = list(PAGES.items())
    for page, filename in pages:
        try:
            local = (root / filename).read_text()
            delivered = fetch(ORIGIN + page).decode('utf-8')
            same, reason = contract_matches(local, delivered, page)
            report['pages'].append({'url': ORIGIN + page, 'contractMatches': same,
                                    'rawHTMLIdentical': local == delivered})
            if not same:
                raise ValueError(reason)
            for resource in PageContract(delivered).resources:
                if cloudflare_analytics_script(resource):
                    attrs = dict(resource['attrs'])
                    report['managedInsertions'].append({
                        'page': ORIGIN + page, 'kind': 'cloudflare-web-analytics',
                        'url': resource['url'], 'type': attrs['type'],
                        'integrity': attrs['integrity'], 'crossorigin': attrs['crossorigin'],
                        'configurationVersion': json.loads(attrs['data-cf-beacon'])['version']})
                elif resource['url'] and not cloudflare_email_script(resource):
                    full, path = local_asset(resource['url'], page)
                    assets[full] = path
            dynamic_pages, dynamic_assets = studio_dependencies(local, page)
            for full, path in dynamic_pages:
                pages.append((full.removeprefix(ORIGIN), path))
            assets.update(dynamic_assets)
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
        report['candidateIdentity'] = {
            label: {'datasetVersion': value.get('datasetVersion'),
                    'sourceVersion': value.get('publicCandidate', {}).get('sourceVersion'),
                    'cardsSha256': value.get('publicCandidate', {}).get('cardsSha256'),
                    'sourceFingerprint': value.get('publicCandidate', {}).get('sourceFingerprint'),
                    'cards': len(value.get('cards', []))}
            for label, value in [('repository', local), ('delivered', public)]}
        if public != local:
            raise ValueError('Delivered candidate is not the repository candidate')
        report['candidateSource'] = public['publicCandidate']['sourceVersion']
        report['candidateCardsSha256'] = public['publicCandidate']['cardsSha256']
        report['cards'] = len(public['cards'])
        release = json.loads(fetch(ORIGIN + '/mtgtools/odyssey/data/release.json'))
        expected = json.loads((root / 'public/mtgtools/odyssey/data/release.json').read_text())
        report['baseReleaseIdentity'] = {
            label: {'version': value.get('version'), 'cardsSha256': value.get('cardsSha256')}
            for label, value in [('repository', expected), ('delivered', release)]}
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
                      fetch=get, sleep=time.sleep, clock=time.monotonic, root=ROOT,
                      current_main=None):
    """Bounded propagation wait AFTER successful deployment; retain diagnostics."""
    out.mkdir(parents=True, exist_ok=True)
    started, attempts = clock(), []
    target = os.environ.get('ODYSSEY_TARGET_SHA')
    if target and current_main is None:
        from odyssey_cloudflare_gate import github_fetch, validate_target
        repo = os.environ.get('GITHUB_REPOSITORY', 'jhsizemore/kliawotadesign')
        validate_target(target, repo)
        current_main = lambda: github_fetch(repo, '/git/ref/heads/main')['object']['sha']

    def require_current():
        if not target:
            return
        head = current_main()
        if head != target:
            raise RuntimeError('Release was superseded by main commit ' + str(head))

    while True:
        try:
            require_current()
            report = verify_once(fetch=fetch, root=root)
            require_current()
        except Exception as error:
            # A superseded or unconfirmable commit must never be certified.
            report = {'status': 'unverified', 'commit': target,
                      'checkedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                      'errors': [{'check': 'release-identity', 'error': str(error)[:300]}]}
            report['attempts'] = attempts
            (out / 'production.json').write_text(json.dumps(report, indent=2))
            raise
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
