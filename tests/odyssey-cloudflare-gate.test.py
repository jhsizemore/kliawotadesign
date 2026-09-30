import tempfile,unittest,json
from pathlib import Path
from odyssey_cloudflare_gate import decide,wait,confirm_current
A='a'*40;B='b'*40

def check(**extra):return {'id':5,'head_sha':A,'name':'Workers Builds: kliawotadesign','app':{'slug':'cloudflare-workers-and-pages'},'status':'completed','conclusion':'success',**extra}

class GateTests(unittest.TestCase):
    def test_superseded_is_not_live_success(self):self.assertEqual(decide(B,A,[check()])['state'],'superseded')
    def test_success_requires_the_right_commit_and_provider(self):
        for row in [check(head_sha=B),check(app={'slug':'github-actions'}),check(name='some other site')]:self.assertEqual(decide(A,A,[row])['state'],'waiting')
        self.assertEqual(decide(A,A,[check()])['state'],'ready')
    def test_pending_and_real_failure_are_distinct(self):
        self.assertEqual(decide(A,A,[check(status='in_progress',conclusion=None)])['state'],'waiting')
        self.assertEqual(decide(A,A,[check(conclusion='failure')])['state'],'failed')
    def test_latest_retry_overrides_an_earlier_build(self):
        self.assertEqual(decide(A,A,[check(id=3,conclusion='failure'),check(id=7)])['state'],'ready')
        self.assertEqual(decide(A,A,[check(id=3),check(id=7,status='in_progress',conclusion=None)])['state'],'waiting')
    def test_bounded_wait_records_pending_then_success(self):
        with tempfile.TemporaryDirectory() as d:
            seconds=[0]
            def fetch(path):
                if path.startswith('/git/'):return {'object':{'sha':A}}
                return {'check_runs':[check(status='completed' if seconds[0]>=20 else 'in_progress')]}
            result=wait(A,'jhsizemore/kliawotadesign',fetch,clock=lambda:seconds[0],sleep=lambda n:seconds.__setitem__(0,seconds[0]+n),out=Path(d))
            self.assertEqual(result['state'],'ready');self.assertEqual(len(result['attempts']),3)
            self.assertEqual(json.loads((Path(d)/'deployment.json').read_text())['commit'],A)
    def test_lookup_outage_cannot_turn_green(self):
        with tempfile.TemporaryDirectory() as d:
            def broken(path):raise OSError('offline')
            with self.assertRaises(TimeoutError):wait(A,'jhsizemore/kliawotadesign',broken,timeout=0,out=Path(d))
            self.assertEqual(json.loads((Path(d)/'deployment.json').read_text())['state'],'waiting')
    def test_unsafe_inputs_do_not_reach_network(self):
        def forbidden(path):self.fail('Network called for invalid input')
        with self.assertRaises(ValueError):wait('main;echo bad','jhsizemore/kliawotadesign',forbidden)
        with self.assertRaises(ValueError):wait(A,'unrelated/repo',forbidden)

    def test_main_moving_during_check_lookup_is_not_ready(self):
        with tempfile.TemporaryDirectory() as d:
            heads=iter([A,B])
            def fetch(path):return {'object':{'sha':next(heads)}} if path.startswith('/git/') else {'check_runs':[check()]}
            report=wait(A,'jhsizemore/kliawotadesign',fetch,out=Path(d))
            self.assertEqual(report['state'],'superseded')

    def test_final_check_records_current_without_polling(self):
        with tempfile.TemporaryDirectory() as d:
            calls=[]
            def fetch(path):calls.append(path);return {'object':{'sha':A}}
            report=confirm_current(A,'jhsizemore/kliawotadesign',fetch,out=Path(d))
            self.assertEqual(report['state'],'current');self.assertEqual(calls,['/git/ref/heads/main'])
            self.assertEqual(json.loads((Path(d)/'final-current.json').read_text())['commit'],A)
            self.assertFalse((Path(d)/'deployment.json').exists())

    def test_final_check_fails_on_supersession_or_lookup_outage(self):
        for state in ['superseded','unavailable']:
            with self.subTest(state=state),tempfile.TemporaryDirectory() as d:
                def fetch(path):
                    if state=='unavailable':raise OSError('offline')
                    return {'object':{'sha':B}}
                with self.assertRaises(RuntimeError):confirm_current(A,'jhsizemore/kliawotadesign',fetch,out=Path(d))
                self.assertEqual(json.loads((Path(d)/'final-current.json').read_text())['state'],state)

if __name__=='__main__':unittest.main()
