"""Exact source integration. Never modifies canonical card/art assignments or Sheet data."""
from pathlib import Path
from bs4 import BeautifulSoup
import re
R=Path(__file__).resolve().parents[1]
changed=[]
def edit(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,'anchor',s.count(old))
 p.write_text(s.replace(old,new));changed.append(name)
edit('scripts/build-odyssey-public-renderer.cjs',"const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey');", "const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey');\nrequire('./build-odyssey-candidate.cjs').build({root,check:process.argv.includes('--check')});")
edit('public/mtgtools/Odyssey/scry/exhibition.js',"DATA='/mtgtools/odyssey/data/odyssey-data.json'", "DATA='/mtgtools/odyssey/data/odyssey-public-candidate.json'")
edit('public/mtgtools/Odyssey/scry/exhibition.js','const data=await response.json();window.OdysseyStudioRenderer.initialize(data);',"const data=await response.json();if(data.publicCandidate?.schema!=='odyssey-public-candidate/v1')throw Error('Unexpected candidate source.');window.OdysseyCandidateSource=data.publicCandidate;window.OdysseyStudioRenderer.initialize(data);")
edit('public/mtgtools/Odyssey/scry/exhibition.js','Local editor drafts and unsaved crops are not included. Every card is still a candidate.','This is the published candidate file, not a finished set. Saved artwork placement is applied when it matches this card’s assigned art; labelled author previews may include unpublished framing.')
edit('public/mtgtools/odyssey/art-placement-core.js',"const API='/mtgtools/odyssey/api/art-placement',CACHE='odyssey-placement-authoring-v1';", "const API='/mtgtools/odyssey/api/art-placement',CACHE='odyssey-placement-authoring-v1',PREVIEW_CACHE='ue-odyssey-placement-preview-v1';")
edit('public/mtgtools/odyssey/art-placement-core.js','GEOMETRY,API,CACHE,empty','GEOMETRY,API,CACHE,PREVIEW_CACHE,empty')
old="function saveState(){try{localStorage.setItem(P.CACHE,JSON.stringify(state));}catch(_){status('Placement cache is full. Export a backup before leaving this page.');}paint();}"
new="""function saveState(){try{
  localStorage.setItem(P.CACHE,JSON.stringify(state));
  // Presentation-only projection: no card rules, names, private drafts or tokens.
  const records={};for(const d of changes())records[P.key(d.after)]=P.normalize(d.after);
  localStorage.setItem(P.PREVIEW_CACHE,JSON.stringify({schema:P.SCHEMA,authorPreview:true,snapshot:{...P.empty(),records}}));
 }catch(_){status('Placement cache is full. Export a backup before leaving this page.');}paint();}"""
edit('public/mtgtools/odyssey/art-placement-studio.js',old,new)
edit('src/odyssey-worker.js',"import { routeContact } from './odyssey-contact.mjs';", "import { routeContact } from './odyssey-contact.mjs';\nimport { routeSubscriptions } from './odyssey-subscriptions.mjs';")
edit('src/odyssey-worker.js','const response = await routeContact(request, env)', 'const response = await routeSubscriptions(request, env) || await routeContact(request, env)')
edit('src/odyssey-sync.mjs',"import { placementWorkspace } from './odyssey-placement.mjs';", "import { placementWorkspace } from './odyssey-placement.mjs';\nimport { SIGNUP_API, subscriberWorkspace, cleanupSubscriptions } from './odyssey-subscriptions.mjs';")
edit('src/odyssey-sync.mjs','constructor(ctx) { this.ctx = ctx; }', "constructor(ctx) { this.ctx = ctx; }\n\n  async alarm() { await cleanupSubscriptions(this.ctx.storage); }")
edit('src/odyssey-sync.mjs',"    if (url.pathname === '/mtgtools/odyssey/api/art-placement') {", """    if (url.pathname === SIGNUP_API || url.pathname.startsWith(SIGNUP_API+'/')) {
      const result = await subscriberWorkspace(request, this.ctx.storage);
      if (request.method==='POST' && !await this.ctx.storage.getAlarm()) await this.ctx.storage.setAlarm(Date.now()+172800000);
      return result;
    }
    if (url.pathname === '/mtgtools/odyssey/api/art-placement') {""")
edit('scripts/build-odyssey-public-renderer.cjs','return window.OdysseyPlacement.apply(m,placementRecords,imageForArt(m));',"const P=window.OdysseyPlacement,r=placementRecords[m.id+'|'+(m.faceRole==='back'?'back':'front')],matched=P.matches(m,r,imageForArt(m));return {...P.apply(m,placementRecords,imageForArt(m)),placementStatus:matched?'applied':r?'mismatch':'default'};")
edit('scripts/build-odyssey-public-renderer.cjs',"this.model=model;const shell=document.createElement('div');", "this.model=model;this.dataset.placement=model.placementStatus;const shell=document.createElement('div');")
form='''<form id="updatesSignup" class="updates-signup">
<label for="updatesEmail">Email address<input id="updatesEmail" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required></label>
<label for="updatesName">Name <span>(optional)</span><input id="updatesName" name="name" type="text" autocomplete="name" maxlength="80"></label>
<fieldset><legend>Keep me posted about</legend><label class="signup-check"><input name="topics" type="checkbox" value="progress" checked>Set progress &amp; reveals</label><label class="signup-check"><input name="topics" type="checkbox" value="membership" checked>When tiered membership opens</label><label class="signup-check"><input name="topics" type="checkbox" value="playtesting" checked>When private playtesting opens</label></fieldset>
<label class="signup-check signup-consent"><input name="consent" type="checkbox" value="yes" required>I agree to receive email updates from Universes Eternal about the topics I’ve selected.</label>
<div class="signup-trap" aria-hidden="true"><label>Leave this blank<input name="website" tabindex="-1" autocomplete="off"></label></div>
<button id="updatesSubmit" class="button light" type="submit">Keep me updated ↗</button><p id="updatesStatus" class="signup-status" tabindex="-1" role="status" aria-live="polite"></p>
<p class="signup-privacy">No purchase required. Unsubscribe from any update. Your address is stored privately; it is not shown on the site. <a href="/mtgtools/Odyssey/scry/updates/privacy.html">Privacy &amp; how the list works ↗</a></p>
<noscript><p>Email signup requires JavaScript. Contact Hunter at jhsizemore@gmail.com for help.</p></noscript></form>'''
for name in ['index.html','art.html','social/index.html']:
 p=R/'public/mtgtools/Odyssey/scry'/name;doc=BeautifulSoup(p.read_text(),'html.parser')
 for script in doc.select('script[src]'):
  src=script.get('src','')
  if 'contact-form.js' in src:script.decompose();continue
  if any(key in src for key in ['exhibition.js?','placement-sync.js?','public-renderer.generated.js?','art-placement-core.js?']):script['src']=src.split('?')[0]+'?v=20260929-candidates-signup1'
 if name!='social/index.html' and not doc.select_one('#updatesSignup'):
  old=doc.select_one('#signupInterest');assert old,name
  old.replace_with(BeautifulSoup(form,'html.parser'))
  for stale in doc.select('#signupNotice,#signupRole,#signupLink,#directInterest'):stale.decompose()
  panel=doc.select_one('#development .participation-panel')
  if panel:
   lead=panel.select_one('.lead');lead.clear();lead.append('Follow the voyage.');lead.append(doc.new_tag('br'));lead.append('Know when the next chapter opens.')
   for para in panel.find_all('p',recursive=False):
    if not set(para.get('class',[]))&{'eyebrow','lead','fine','candidate-truth'}:
     para.string='Get email updates on the set’s progress, new reveals, and the opening of tiered membership and private playtesting. Choose the news you care about below.';break
   benefits=panel.select_one('.signup-benefits')
   if benefits:benefits.decompose()
  title=doc.select_one('#spoilerTitle')
  if title:title.string='Odyssey candidate file'
  header=doc.select_one('.spoiler-header')
  if header:
   note=doc.new_tag('p',attrs={'class':'candidate-source-note'});note.string='The full spoiler is the current candidate file—the same published card source loaded by Odyssey Studio. Nothing shown here is a confirmed final card.';header.append(note)
   status=doc.new_tag('p',attrs={'id':'placementStatus','class':'placement-notice','role':'status'});status.string='Checking published artwork placements…';header.append(status)
  desc=doc.select_one('#preview .preview-copy > p:not([class])')
  if desc:desc.string='This is the complete candidate file, not a second or finished set. Read the current designs, compare the art, and help decide what survives.'
  doc.head.append(BeautifulSoup('<script defer src="/mtgtools/Odyssey/scry/updates-signup.js?v=20260929-candidates-signup1"></script>','html.parser'))
 if not any('updates-signup.css' in x.get('href','') for x in doc.select('link')):doc.head.append(BeautifulSoup('<link rel="stylesheet" href="/mtgtools/Odyssey/scry/updates-signup.css?v=20260929-candidates-signup1">','html.parser'))
 p.write_text(str(doc));changed.append(str(p.relative_to(R)))
p=R/'public/mtgtools/odyssey/app.html';s=p.read_text().replace('art-placement-core.js?v=20260929-placement1','art-placement-core.js?v=20260929-candidates-signup1').replace('art-placement-studio.js?v=20260929-placement1','art-placement-studio.js?v=20260929-candidates-signup1');p.write_text(s);changed.append(str(p.relative_to(R)))
p=R/'public/mtgtools/odyssey/index.html';s=p.read_text();s=re.sub(r'(app\.html\?v=)[A-Za-z0-9._-]+',r'\g<1>20260929-candidates-signup1',s);p.write_text(s);changed.append(str(p.relative_to(R)))
p=R/'tests/odyssey-focused-launch.py';s=p.read_text()
old="   await page.locator('#signupRole').select_option('playtesting');assert 'mailto:' in await page.locator('#signupLink').get_attribute('href')"
new="   assert await page.locator('#updatesSignup').count()==1;assert await page.locator('#updatesSignup [name=email]').count()==1;assert await page.locator('#signupLink').count()==0"
if old in s:p.write_text(s.replace(old,new))
p=R/'tests/odyssey-exhibition-browser.py';s=p.read_text();start=s.find("        await page.locator('#signupRole').select_option('playtesting')")
if start>=0:
 end=s.index("        for width in [390,768,1440]:",start);s=s[:start]+"        assert await page.locator('#updatesSignup').count()==1\n        assert await page.locator('#updatesSignup [name=consent]').count()==1\n"+s[end:]
s=s.replace("endswith(('/api/art-placement','/api/contact'))","endswith(('/api/art-placement','/api/contact','/api/subscriptions'))");p.write_text(s)
p=R/'tests/odyssey-showcase-browser.py';s=p.read_text();start=s.find("   assert await page.locator('#signupInterest').is_visible()")
if start>=0:
 end=s.index('   assert not errors,errors',start);s=s[:start]+"   assert await page.locator('#updatesSignup').is_visible();assert await page.locator('#directInterest,#signupInterest').count()==0\n   # Signup persistence, consent and unsubscribe are tested against the real handler separately.\n"+s[end:]
 s=s.replace("'disabledFormKeepsEmailLink':True,'failedSendPreservesMessage':True,'successfulSendResetsForm':True,'liveEmailDelivery':'not tested; Cloudflare setup required; browser delivery is mocked',", "'contactReplacedByEmailList':True,'signupPersistence':'covered by real handler in dedicated signup suite',");p.write_text(s)
p=R/'tests/odyssey-placement-browser.py';s=p.read_text().replace("get_by_text('LOCAL ARTWORK PREVIEW',exact=False)","get_by_text('YOUR STUDIO FRAMING PREVIEW',exact=False)");p.write_text(s)
print('Integrated:',*sorted(set(changed)),sep='\n')
