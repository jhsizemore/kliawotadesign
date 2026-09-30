"""Offline behavior tests for production verification; no network or site writes."""
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit
from odyssey_delivery import contract_matches, local_asset, verify_once, wait_for_delivery, verification_origin, studio_dependencies, CLOUDFLARE_BEACON_URL, CLOUDFLARE_BEACON_SRI, ORIGIN

class DeliveryTests(unittest.TestCase):
    def test_html_attribute_reorder_is_not_a_release_change(self):
        a='<script defer src="/mtgtools/a.js?v=1"></script><input id="email" type="email" required>'
        b='<script src="/mtgtools/a.js?v=1" defer=""></script><input required="" type="email" id="email">'
        self.assertTrue(contract_matches(a,b,'/mtgtools/page/')[0])

    def test_changed_script_version_fails(self):
        a='<script src="/mtgtools/a.js?v=1"></script>'
        self.assertFalse(contract_matches(a,a.replace('v=1','v=2'),'/mtgtools/')[0])

    def test_extra_module_and_reordered_scripts_fail(self):
        a='<script src="/mtgtools/a.js"></script><script src="/mtgtools/b.js"></script>'
        b='<script src="/mtgtools/b.js"></script><script src="/mtgtools/a.js"></script>'
        self.assertFalse(contract_matches(a,b,'/mtgtools/')[0])
        self.assertFalse(contract_matches(a,a+'<script src="/mtgtools/unapproved.js"></script>','/mtgtools/')[0])

    def test_known_html_rewrites_only(self):
        a='<script src="/mtgtools/a.js"></script>'
        obfuscated=a+'<script src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>'
        self.assertTrue(contract_matches(a,obfuscated,'/mtgtools/')[0])
        studio=a+'<script src="/mtgtools/odyssey/frame-system.js?v=20260917-1"></script>'
        self.assertTrue(contract_matches(a,studio,'/mtgtools/odyssey/')[0])
        self.assertFalse(contract_matches(a,studio,'/mtgtools/Odyssey/scry/')[0])

    def test_consent_cannot_silently_disappear(self):
        a='<input type="checkbox" id="consent" required>'
        self.assertFalse(contract_matches(a,a.replace(' required',''),'/mtgtools/')[0])

    def test_external_scripts_are_not_fetched_or_accepted(self):
        with self.assertRaises(ValueError):local_asset('https://evil.example/file','/mtgtools/')
        with self.assertRaises(ValueError):local_asset('javascript:alert(1)','/mtgtools/')
        self.assertEqual(local_asset('admin.js?v=2','/mtgtools/Odyssey/scry/subscribers/')[0],ORIGIN+'/mtgtools/Odyssey/scry/subscribers/admin.js?v=2')

    def fixture(self, root):
        paths={'/mtgtools/':'public/mtgtools/index.html'}
        file=root/'public/mtgtools/index.html';file.parent.mkdir(parents=True)
        file.write_text('<script src="/mtgtools/app.js?v=old-cache"></script>')
        (file.parent/'app.js').write_text('current bytes')
        candidate={'cards':[{'id':'ODY-001'}],'publicCandidate':{'sourceVersion':'test','cardsSha256':'abc'}}
        release={'version':'test','cardsSha256':'abc'}
        folder=root/'public/mtgtools/odyssey/data';folder.mkdir(parents=True)
        (folder/'odyssey-public-candidate.json').write_text(json.dumps(candidate));(folder/'release.json').write_text(json.dumps(release))
        def fetch(url):
            if url.endswith('/health'):return b'{"enabled":true,"provider":"private-list","campaignsAutomated":false,"verification":"single-opt-in"}'
            if url.endswith('/art-placement'):return b'{"schema":"odyssey-art-placement/v1","records":{},"revision":0}'
            name='public'+urlsplit(url).path
            if name.endswith('/'):name+='index.html'
            return (root/name).read_bytes()
        return paths,fetch

    def test_exact_browser_url_including_query_is_checked(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);paths,fetch=self.fixture(root);seen=[]
            def recorded(u):seen.append(u);return fetch(u)
            with patch('odyssey_delivery.PAGES',paths):r=verify_once(fetch=recorded,root=root)
            self.assertEqual(r['status'],'passed');self.assertIn(ORIGIN+'/mtgtools/app.js?v=old-cache',seen)
            self.assertFalse(any('verify=' in u for u in seen));self.assertEqual(r['publishedPlacements'],0)

    def test_stale_versioned_bytes_cannot_pass_with_current_unversioned_bytes(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);paths,fetch=self.fixture(root)
            def stale(u):return b'stale' if '?v=' in u else fetch(u)
            with patch('odyssey_delivery.PAGES',paths):r=verify_once(fetch=stale,root=root)
            self.assertEqual(r['status'],'not-ready');self.assertEqual(len(r['errors']),1)

    def test_failure_keeps_diagnostics_instead_of_swallowing_errors(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);paths,fetch=self.fixture(root)
            def unavailable(u):raise TimeoutError('controlled outage')
            with patch('odyssey_delivery.PAGES',paths):
                with self.assertRaises(AssertionError):wait_for_delivery(root/'results',timeout=0,fetch=unavailable,root=root)
            report=json.loads((root/'results/production.json').read_text())
            self.assertEqual(report['status'],'not-ready');self.assertTrue(report['errors']);self.assertIn('controlled outage',report['errors'][0]['error'])

    def test_inline_bootloader_changes_or_disappearance_fail(self):
        local='<style>body{color:red}</style><script>fetch("./app.html?v=1");</script>'
        for changed in ['<html><body>broken</body></html>',local.replace('v=1','v=2'),local+'<script>unexpected()</script>',local.replace('red','blue')]:
            with self.subTest(changed=changed):self.assertFalse(contract_matches(local,changed,'/mtgtools/odyssey/')[0])
        self.assertTrue(contract_matches('<script>one();\r\ntwo();</script>','<script>one();\ntwo();</script>','/mtgtools/')[0])

    def test_script_and_stylesheet_loading_attributes_are_preserved(self):
        for tag,attribute in [('<script defer src="/mtgtools/a.js"></script>','defer '),('<script type="module" src="/mtgtools/a.js"></script>','type="module" '),('<script async src="/mtgtools/a.js"></script>','async '),('<link rel="stylesheet" media="print" href="/mtgtools/a.css">','media="print" ')]:
            with self.subTest(attribute=attribute):self.assertFalse(contract_matches(tag,tag.replace(attribute,''),'/mtgtools/')[0])
        a='<script>setup()</script><script src="/mtgtools/a.js"></script>'
        b='<script src="/mtgtools/a.js"></script><script>setup()</script>'
        self.assertFalse(contract_matches(a,b,'/mtgtools/')[0])

    def test_unknown_cloudflare_script_is_not_allowlisted(self):
        local='<script src="/mtgtools/a.js"></script>'
        for url in ['/cdn-cgi/scripts/anything/email-decode.min.js','/cdn-cgi/scripts/123/cloudflare-static/other.js']:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):contract_matches(local,local+'<script src="'+url+'"></script>','/mtgtools/')

    def test_studio_loader_exposes_browser_dependency_urls(self):
        script="""<script>fetch('./app.html?v=release'); const frame = '<script src="./frame-system.js?v=frame"><' + '/script>'; const style = '<link rel="stylesheet" href="./frame-system.css?v=style">';</script>"""
        pages,assets=studio_dependencies(script,'/mtgtools/odyssey/')
        self.assertEqual(pages,[(ORIGIN+'/mtgtools/odyssey/app.html?v=release','public/mtgtools/odyssey/app.html')])
        self.assertEqual({url for url,_ in assets},{ORIGIN+'/mtgtools/odyssey/frame-system.js?v=frame',ORIGIN+'/mtgtools/odyssey/frame-system.css?v=style'})
        with self.assertRaises(ValueError):studio_dependencies('<script>fetch(nextApp)</script>','/mtgtools/odyssey/')

    def studio_fixture(self,root):
        _,fetch=self.fixture(root)
        folder=root/'public/mtgtools/odyssey'
        (folder/'index.html').write_text("""<script>fetch('./app.html?v=release'); const style='<link rel="stylesheet" href="./frame-system.css?v=style">';</script>""")
        (folder/'app.html').write_text('<script>window.boot=true;</script><script src="./frame-system.js?v=frame"></script>')
        (folder/'frame-system.css').write_text('body{color:red}')
        (folder/'frame-system.js').write_text('window.frame=true')
        return {'/mtgtools/odyssey/':'public/mtgtools/odyssey/index.html'},fetch

    def test_studio_dynamic_app_and_precise_dependencies_are_checked(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);paths,fetch=self.studio_fixture(root);seen=[]
            def recorded(url):seen.append(url);return fetch(url)
            with patch('odyssey_delivery.PAGES',paths):report=verify_once(fetch=recorded,root=root)
            self.assertEqual(report['status'],'passed')
            for url in ['app.html?v=release','frame-system.js?v=frame','frame-system.css?v=style']:
                self.assertIn(ORIGIN+'/mtgtools/odyssey/'+url,seen)

    def test_stale_dynamic_app_or_dependency_cannot_pass(self):
        for target in ['app.html?v=release','frame-system.js?v=frame','frame-system.css?v=style']:
            with self.subTest(target=target),tempfile.TemporaryDirectory() as d:
                root=Path(d);paths,fetch=self.studio_fixture(root)
                def stale(url):return b'<body>old</body>' if url.endswith(target) else fetch(url)
                with patch('odyssey_delivery.PAGES',paths):report=verify_once(fetch=stale,root=root)
                self.assertEqual(report['status'],'not-ready')

    def test_commit_evidence_uses_explicit_target_not_runner_sha(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);paths,fetch=self.fixture(root)
            with patch('odyssey_delivery.PAGES',paths),patch.dict(os.environ,{'ODYSSEY_TARGET_SHA':'a'*40,'GITHUB_SHA':'b'*40}):
                self.assertEqual(verify_once(fetch=fetch,root=root)['commit'],'a'*40)

    def test_supersession_during_delivery_cannot_certify_release(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);paths,fetch=self.fixture(root);heads=iter(['a'*40,'b'*40])
            with patch('odyssey_delivery.PAGES',paths),patch.dict(os.environ,{'ODYSSEY_TARGET_SHA':'a'*40}):
                with self.assertRaisesRegex(RuntimeError,'superseded'):
                    wait_for_delivery(root/'results',timeout=0,fetch=fetch,root=root,current_main=lambda:next(heads))
            report=json.loads((root/'results/production.json').read_text())
            self.assertEqual(report['status'],'unverified');self.assertEqual(report['commit'],'a'*40)

    def test_identity_lookup_outage_cannot_certify_release(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);paths,fetch=self.fixture(root)
            def outage():raise OSError('offline')
            with patch('odyssey_delivery.PAGES',paths),patch.dict(os.environ,{'ODYSSEY_TARGET_SHA':'a'*40}):
                with self.assertRaises(OSError):wait_for_delivery(root/'results',timeout=0,fetch=fetch,root=root,current_main=outage)
            self.assertEqual(json.loads((root/'results/production.json').read_text())['status'],'unverified')

    def test_isolated_test_origin_is_opt_in_and_cannot_target_other_hosts(self):
        self.assertEqual(verification_origin('https://kliawota.design/'),'https://kliawota.design')
        self.assertEqual(verification_origin('http://127.0.0.1:8765'),'http://127.0.0.1:8765')
        for origin in ['https://evil.example','http://kliawota.design','http://localhost@evil.example','http://localhost:8765/path','http://localhost:8765?next=evil']:
            with self.subTest(origin=origin),self.assertRaises(ValueError):verification_origin(origin)
        with patch('odyssey_delivery.ORIGIN','http://127.0.0.1:8765'):
            self.assertEqual(local_asset('app.js?v=1','/mtgtools/')[0],'http://127.0.0.1:8765/mtgtools/app.js?v=1')
            with self.assertRaises(ValueError):local_asset('http://localhost:8765/mtgtools/app.js','/mtgtools/')

    def test_allowed_worker_insertions_cannot_hide_extra_code_or_attributes(self):
        local='<script src="/mtgtools/a.js"></script>'
        inserted='<script src="/mtgtools/odyssey/frame-system.js?v=20260917-1"></script>'
        for changed in [inserted+inserted,inserted.replace('src=','type="module" src='),inserted.replace('</script>','unexpected()</script>')]:
            with self.subTest(changed=changed):self.assertFalse(contract_matches(local,local+changed,'/mtgtools/odyssey/')[0])

    def analytics_tag(self):
        config=json.dumps({'version':'2024.11.0','token':'a'*32,'r':1,'spa':2})
        return f"<script type=\"module\" src=\"{CLOUDFLARE_BEACON_URL}\" integrity=\"{CLOUDFLARE_BEACON_SRI}\" data-cf-beacon='{config}' crossorigin=\"anonymous\"></script>"

    def test_only_exact_known_analytics_insertion_is_allowed(self):
        local='<script src="/mtgtools/a.js"></script>';beacon=self.analytics_tag()
        self.assertTrue(contract_matches(local,local+beacon,'/mtgtools/')[0])
        variants=[beacon+beacon,beacon.replace('static.cloudflareinsights.com','evil.example'),beacon.replace('/beacon.min.js/','/other.js/'),beacon.replace(' integrity="'+CLOUDFLARE_BEACON_SRI+'"',''),beacon.replace(CLOUDFLARE_BEACON_SRI,'sha512-'+('a'*86)+'=='),beacon.replace('crossorigin="anonymous"','crossorigin="use-credentials"'),beacon.replace('type="module"','type="text/javascript"')]
        for changed in variants:
            with self.subTest(changed=changed),self.assertRaises(ValueError):contract_matches(local,local+changed,'/mtgtools/')

    def test_analytics_is_reported_but_not_fetched_as_release_asset(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);paths,fetch=self.fixture(root);seen=[]
            def injected(url):
                seen.append(url);body=fetch(url)
                return body+self.analytics_tag().encode() if url.endswith('/mtgtools/') else body
            with patch('odyssey_delivery.PAGES',paths):report=verify_once(fetch=injected,root=root)
            self.assertEqual(report['status'],'passed');self.assertNotIn(CLOUDFLARE_BEACON_URL,seen)
            self.assertEqual(report['managedInsertions'][0]['integrity'],CLOUDFLARE_BEACON_SRI)
            self.assertEqual(report['candidateIdentity']['repository'],report['candidateIdentity']['delivered'])
            self.assertEqual(report['baseReleaseIdentity']['repository'],report['baseReleaseIdentity']['delivered'])

if __name__=='__main__':unittest.main()
