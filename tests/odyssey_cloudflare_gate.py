"""Read-only GitHub gate before live-site verification. No Cloudflare API secret needed."""
import argparse,json,os,re,time
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlencode


def decide(main_sha,target,checks):
    if main_sha!=target:return {'state':'superseded','message':'A newer main commit exists; this run must not certify it.'}
    relevant=[c for c in checks if c.get('head_sha')==target and c.get('name')=='Workers Builds: kliawotadesign' and c.get('app',{}).get('slug')=='cloudflare-workers-and-pages']
    if not relevant:return {'state':'waiting','message':'Waiting for the native Cloudflare build check.'}
    latest=max(relevant,key=lambda c:c.get('id',0))
    result={'state':'waiting','checkId':latest['id'],'buildUrl':latest.get('details_url'),'message':'Cloudflare is still building this commit.'}
    if latest.get('status')=='completed':
        if latest.get('conclusion')=='success':result.update(state='ready',message='The matching native Cloudflare build succeeded.')
        else:result.update(state='failed',message='Native Cloudflare build ended: '+str(latest.get('conclusion')))
    return result


def validate_target(target,repo):
    if not re.fullmatch('[0-9a-f]{40}',target):raise ValueError('Expected a complete commit SHA')
    if repo!='jhsizemore/kliawotadesign':raise ValueError('Unexpected repository')


def github_fetch(repo,path):
    if repo!='jhsizemore/kliawotadesign':raise ValueError('Unexpected repository')
    headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Odyssey-deployment-gate'}
    token=os.environ.get('GH_TOKEN')
    if token:headers['Authorization']='Bearer '+token
    with urlopen(Request('https://api.github.com/repos/'+repo+path,headers=headers),timeout=20) as response:return json.load(response)


def wait(target,repo,fetch,timeout=900,sleep=time.sleep,clock=time.monotonic,out=Path('test-results/odyssey-delivery')):
    validate_target(target,repo)
    out.mkdir(parents=True,exist_ok=True);started=clock();attempts=[]
    while True:
        try:
            head=fetch('/git/ref/heads/main')['object']['sha']
            params=urlencode({'check_name':'Workers Builds: kliawotadesign','per_page':100,'filter':'all'})
            checks=fetch('/commits/'+target+'/check-runs?'+params).get('check_runs',[]) if head==target else []
            result=decide(head,target,checks)
            if result['state']=='ready':
                # main can move between the initial ref lookup and check lookup.
                result=decide(fetch('/git/ref/heads/main')['object']['sha'],target,checks)
        except Exception as e:result={'state':'waiting','message':'Build-status lookup unavailable: '+type(e).__name__}
        attempts.append({'seconds':round(clock()-started,1),**result})
        report={'commit':target,**result,'attempts':attempts}
        (out/'deployment.json').write_text(json.dumps(report,indent=2));print(json.dumps(result),flush=True)
        if result['state'] in {'ready','superseded'}:return report
        if result['state']=='failed':raise RuntimeError(result['message'])
        if clock()-started>=timeout:raise TimeoutError('Cloudflare did not confirm this commit within the deployment window; see deployment.json')
        sleep(10)


def confirm_current(target,repo,fetch,out=Path('test-results/odyssey-delivery')):
    """Final read-only identity check; no deployment polling or success fallback."""
    validate_target(target,repo)
    out.mkdir(parents=True,exist_ok=True)
    report={'commit':target,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
    try:
        head=fetch('/git/ref/heads/main')['object']['sha']
        if not re.fullmatch('[0-9a-f]{40}',head):raise ValueError('Invalid main commit')
        report.update(currentMain=head,state='current' if head==target else 'superseded')
        report['message']='The verified commit is still current main.' if head==target else 'Main changed during verification; this run cannot certify production.'
    except Exception as error:
        report.update(state='unavailable',message='Final main lookup unavailable: '+type(error).__name__)
    (out/'final-current.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report),flush=True)
    if report['state']!='current':raise RuntimeError(report['message'])
    return report


def main():
    repo=os.environ['GITHUB_REPOSITORY'];target=os.environ.get('ODYSSEY_TARGET_SHA') or os.environ['GITHUB_SHA']
    parser=argparse.ArgumentParser()
    parser.add_argument('--confirm-current',action='store_true')
    args=parser.parse_args()
    if args.confirm_current:
        confirm_current(target,repo,lambda path:github_fetch(repo,path))
        return
    result=wait(target,repo,lambda path:github_fetch(repo,path))
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('ready='+('true' if result['state']=='ready' else 'false')+'\n')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as f:f.write('### Odyssey production gate\n'+result['message']+'\nCommit: `'+target+'`\n')

if __name__=='__main__':main()
