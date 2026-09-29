"""Read-only production verification after a deployment. Never submits a signup."""
import hashlib,json,time,urllib.request
from pathlib import Path
BASE='https://kliawota.design'
def get(path):
 request=urllib.request.Request(BASE+path,headers={'User-Agent':'Odyssey-public-release-check','Cache-Control':'no-cache'})
 with urllib.request.urlopen(request,timeout=25) as response:return response.read()
expected=json.loads(Path('public/mtgtools/odyssey/data/odyssey-public-candidate.json').read_text())['publicCandidate']['sourceFingerprint']
script=Path('public/mtgtools/Odyssey/scry/updates-signup.js').read_bytes()
last=None
for attempt in range(12):
 try:
  page=get('/mtgtools/Odyssey/scry/').decode();assert 'id="updatesSignup"' in page and 'id="signupInterest"' not in page
  data=json.loads(get('/mtgtools/odyssey/data/odyssey-public-candidate.json'));assert data['publicCandidate']['sourceFingerprint']==expected
  delivered=get('/mtgtools/Odyssey/scry/updates-signup.js');assert hashlib.sha256(delivered).digest()==hashlib.sha256(script).digest()
  status=json.loads(get('/mtgtools/odyssey/api/subscriptions/health'));assert status['enabled'] is True and status['provider']=='private-list'
  placement=json.loads(get('/mtgtools/odyssey/api/art-placement'))
  result={'status':'passed','site':BASE+'/mtgtools/Odyssey/scry/','cards':len(data['cards']),'candidateVersion':data['datasetVersion'],'sourceFingerprint':expected,'signupEnabled':status['enabled'],'signupProvider':status['provider'],'emailVerification':status['verification'],'campaignsAutomated':status['campaignsAutomated'],'publishedPlacements':len(placement['records']),'readOnlyProductionCheck':True}
  out=Path('test-results/odyssey-signup');out.mkdir(parents=True,exist_ok=True);(out/'production.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));break
 except Exception as error:
  last=error
  if attempt==11:raise
  time.sleep(10)
