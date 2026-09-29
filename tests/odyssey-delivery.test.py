"""Offline behavior tests for production verification; no network or site writes."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit
from odyssey_delivery import contract_matches, local_asset, verify_once, wait_for_delivery, ORIGIN

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

if __name__=='__main__':unittest.main()
