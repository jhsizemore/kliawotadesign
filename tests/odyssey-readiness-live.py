"""Read-only post-deployment verification. No forms submitted or private lists read."""
import hashlib,json,time,urllib.request
from pathlib import Path
ORIGIN='https://kliawota.design'
FILES=['/mtgtools/odyssey/studio-polish.js','/mtgtools/odyssey/public-renderer.generated.js','/mtgtools/Odyssey/scry/exhibition.js','/mtgtools/Odyssey/scry/subscribers/admin.js','/mtgtools/odyssey/index.html']
def get(path):
 req=urllib.request.Request(ORIGIN+path,headers={'User-Agent':'Odyssey-readiness-public-check','Cache-Control':'no-cache'})
 with urllib.request.urlopen(req,timeout=25) as r:return r.read()
def sha(b):return hashlib.sha256(b).hexdigest()
expected={p:sha(Path('public'+p).read_bytes()) for p in FILES}
for attempt in range(15):
 try:
  delivered={p:sha(get(p)) for p in FILES};assert delivered==expected,'Production files have not caught up yet'
  local=json.loads(Path('public/mtgtools/odyssey/data/odyssey-public-candidate.json').read_text())
  public=json.loads(get('/mtgtools/odyssey/data/odyssey-public-candidate.json'))
  assert public['publicCandidate']['sourceFingerprint']==local['publicCandidate']['sourceFingerprint']
  assert public['publicCandidate']['cardsSha256']==local['publicCandidate']['cardsSha256']
  release=json.loads(get('/mtgtools/odyssey/data/release.json'))
  local_release=json.loads(Path('public/mtgtools/odyssey/data/release.json').read_text())
  assert release['version']==local_release['version'] and release['cardsSha256']==local_release['cardsSha256']
  config=json.loads(get('/mtgtools/odyssey/api/subscriptions/health'));assert config['enabled'] and config['campaignsAutomated'] is False
  placement=json.loads(get('/mtgtools/odyssey/api/art-placement'))
  result={'status':'passed','site':ORIGIN+'/mtgtools/Odyssey/scry/','readOnly':True,'files':delivered,'cards':len(public['cards']),'candidateSource':public['publicCandidate']['sourceVersion'],'candidateCardsSha256':public['publicCandidate']['cardsSha256'],'baseReleaseVersion':release['version'],'signupEnabled':config['enabled'],'campaignsAutomated':config['campaignsAutomated'],'publishedPlacements':len(placement['records']),'privateSubscribersRead':False,'submissionsMade':False}
  out=Path('test-results/odyssey-readiness');out.mkdir(parents=True,exist_ok=True);(out/'production.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));break
 except Exception:
  if attempt==14:raise
  time.sleep(10)
