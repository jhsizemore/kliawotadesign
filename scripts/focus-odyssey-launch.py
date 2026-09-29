"""One-time DOM migration. Preserves the native renderer, placement sync and data."""
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1]
r=R/'public/mtgtools/Odyssey/scry'
original=(r/'index.html').read_text()
if BeautifulSoup(original,'html.parser').body.get('data-page')=='launch':
 print('Focused launch migration already applied.');raise SystemExit(0)
archive=BeautifulSoup(original,'html.parser')
archive.title.string='The Odyssey — Art-history exhibition'
archive.find('link',rel='canonical')['href']='https://kliawota.design/mtgtools/Odyssey/scry/art.html'
archive.select_one('header nav').insert(0,BeautifulSoup('<a href="/mtgtools/Odyssey/scry/">Set launch ↗</a>','html.parser'))
for el in archive.select('.brand-logo picture'):
 img=el.find('img');el.replace_with(img)
(r/'art.html').write_text(str(archive))
s=BeautifulSoup(original,'html.parser');s.body['data-page']='launch'
s.title.string='The Odyssey — A fan-made Magic: The Gathering set'
for key,text in [('description','A fan-made Magic: The Gathering set retelling Homer’s Odyssey through historical art. Meet Odysseus, explore eight set highlights, and help shape the January 7, 2027 release.'),('twitter:description','A fan-made Magic: The Gathering set retelling Homer’s Odyssey. Explore eight highlights, playtest the candidates and join the voyage.')]:
 s.find('meta',attrs={'name':key})['content']=text
s.find('meta',attrs={'property':'og:description'})['content']='Homer’s epic, reimagined as a fan-made Magic: The Gathering set. Eight ways to play the voyage. All cards are still candidates.'
for el in s.find_all('link'):
 if 'art-direction.css' in el.get('href',''):el.decompose()
for el in s.find_all('script'):
 if 'art-direction.js' in el.get('src',''):el.decompose()
for el in s.find_all('script'):
 if 'exhibition.js?' in el.get('src',''):
  el['src']='/mtgtools/Odyssey/scry/exhibition.js?v=20260929-focused1'
  el.insert_before(BeautifulSoup('<script defer src="/mtgtools/Odyssey/scry/focused-launch.js?v=20260929-focused1"></script>','html.parser'))
for el in s.select('link[rel=stylesheet]'):
 if 'launch.css' in el.get('href',''):el['href']='/mtgtools/Odyssey/scry/launch.css?v=20260929-focused1'
s.head.append(BeautifulSoup('<link rel="stylesheet" href="/mtgtools/Odyssey/scry/focused-launch.css?v=20260929-focused1"/>','html.parser'))
nav=s.select_one('header nav');nav.clear();nav.append(BeautifulSoup('<a data-exhibition href="#mechanics">Explore the set</a><a data-exhibition href="#development">Get involved</a><a class="art-nav" href="/mtgtools/Odyssey/scry/art.html#materials">Art &amp; sources</a><a class="social-nav" href="/mtgtools/Odyssey/scry/social/">Social studio</a><button class="button small" data-spoiler type="button">Open spoiler ↗</button>','html.parser'))
for el in s.select('.brand-logo picture'):
 img=el.find('img');el.replace_with(img)
main=s.select_one('#exhibition');main.clear()
main.append(BeautifulSoup('''
<section id="top" class="opening launch-opening" aria-labelledby="heroTitle">
<div class="opening-art" id="heroImage"></div><div class="opening-shade" aria-hidden="true"></div>
<div class="opening-copy"><p class="eyebrow">A FAN-MADE MAGIC: THE GATHERING SET</p><h1 class="opening-wordmark" id="heroTitle"><img src="/mtgtools/Odyssey/scry/assets/brand/the-odyssey-logo.png" width="1851" height="421" alt="The Odyssey" fetchpriority="high"/></h1><p class="tagline">The war is over.<br/>The hard part is getting home.</p><p class="opening-sub">Homer’s famous epic, retold as a <strong>Magic: The Gathering</strong> set. Gods, monsters and the long voyage home—illustrated by historical art, not AI-generated images.</p><p class="release-announcement"><span>Planned release</span><time datetime="2027-01-07">January 7, 2027</time></p><div class="actions"><a class="button light" href="#mechanics">Discover the set ↓</a><a class="text-button" href="#development">Help shape the voyage ↗</a></div><p class="hero-status">Unofficial fan project · In development · Every card is a candidate</p></div>
<div class="hero-card-feature"><p class="eyebrow">MEET YOUR ODYSSEUS</p><div id="heroCard"></div><p class="hero-card-caption">Odysseus, Cunning Voyager<br/><span>A current card candidate. Click to read.</span></p></div><div class="opening-label" id="heroCredit"></div>
</section>
<section id="mechanics" class="launch-highlights" aria-labelledby="mechanicsTitle"><div class="section section-heading"><p class="eyebrow">EIGHT WAYS INTO THE EPIC</p><h2 id="mechanicsTitle">The Odyssey<br/><em>in Magic.</em></h2><p class="lead">Hidden identities. Living legends. Trials worth surviving. Explore the ideas we’re bringing to the battlefield.</p><p class="fine">Scroll or swipe through eight highlights, or choose a title below. These designs are still being playtested.</p></div><div id="mechanicChapters"></div></section>
<section id="development" class="section development launch-invitation" aria-labelledby="involvementTitle"><div class="section-art" id="developmentImage" aria-hidden="true"></div><div class="participation-panel"><p class="eyebrow">COME ABOARD</p><h2 id="involvementTitle">Help decide<br/><em>what survives.</em></h2><p class="lead">There’s a whole set here.<br/>Now help make it one worth playing.</p><p>Follow the reveals, playtest the cards, or bring your eye for design, Homer and art history. Tell us what sings, what breaks, and what deserves a place in the final file.</p><div class="signup-benefits"><span>New previews &amp; release news</span><span>Playtest invitations</span><span>Design &amp; art-history contributions</span></div><form id="signupInterest"><label for="signupRole">I’d like to<select id="signupRole"><option value="updates">Follow the reveals</option><option value="playtesting">Playtest the set</option><option value="contributing">Contribute design or art research</option></select></label><a class="button light" href="mailto:jhsizemore@gmail.com?subject=Odyssey%20%E2%80%94%20register%20my%20interest" id="signupLink">Join the voyage ↗</a></form><p class="fine" id="signupNotice">Register interest by email. This opens a message to Hunter; send it to take part. There is no automatic mailing-list signup on this page.</p><p class="candidate-truth"><strong id="candidateCount">—</strong> working candidates · <strong>0 confirmed</strong><br/>No purchase required. Feedback informs the design; it does not guarantee inclusion.</p></div><div class="background-credit" id="developmentCredit"></div></section>
<section id="preview" class="spoiler-door section launch-preview" aria-labelledby="previewTitle"><div class="section-art" id="spoilerImage" aria-hidden="true"></div><div class="preview-copy"><p class="eyebrow">A LIMITED LOOK INSIDE THE WORKING FILE</p><h2 id="previewTitle">The temporary<br/><em>full spoiler.</em></h2><p class="lead">A little curiosity is a useful thing.</p><p>Inspect every current candidate. Read the cards, find your favourites, and bring the difficult questions.</p><button class="button light" data-spoiler type="button">Open the candidate gallery ↗</button><p class="fine">Full-spoiler preview closes <time datetime="2026-11-01T00:00:00+11:00">November 1, 2026</time> (Port Vila time). Curated previews continue after that. Planned release: <time datetime="2027-01-07">January 7, 2027</time>.</p></div><div class="background-credit" id="spoilerCredit"></div></section>
''','html.parser'))
s.select_one('.site-footer .fine:last-child').string='Launch build 20260929-focused1'
s.select_one('.site-footer').insert(-1,BeautifulSoup('<a href="/mtgtools/Odyssey/scry/art.html#artwork-route">Explore the 20-work art-history exhibition ↗</a>','html.parser'))
(r/'index.html').write_text(str(s))
p=r/'exhibition.js';text=p.read_text();old="const IS_SOCIAL=document.body.dataset.page==='social';";assert text.count(old)==1;text=text.replace(old,old+"\nconst IS_LAUNCH=document.body.dataset.page==='launch';")
old="if(IS_SOCIAL)setupPromo();else{$('candidateCount').textContent=cat.cards.length;hero();materialChapters();mechanics();stories();backgroundSections();}"
new="if(IS_SOCIAL)setupPromo();else{$('candidateCount').textContent=cat.cards.length;if(!IS_LAUNCH){hero();materialChapters();mechanics();stories();backgroundSections();}}"
assert text.count(old)==1;text=text.replace(old,new);p.write_text(text)
p=r/'launch.css';text=p.read_text();text=text.replace('background:#142a2e;border:1px solid #9a845754;border-radius:2px;padding:8px 12px','background:transparent;border:0;border-radius:0;padding:0');text=text.replace('width:250px;padding:12px 16px','width:250px;padding:0');text=text.replace('width:150px;padding:7px 9px','width:150px;padding:0');text+='\n/* Recolour only the non-transparent logo pixels; never fill its rectangle. */\n.nav .brand-logo img,.site-footer .brand-logo img{filter:brightness(0);background:transparent}.nav .brand-logo,.site-footer .brand-logo{box-shadow:none;backdrop-filter:none}\n';p.write_text(text)
for n in ['art.html','social/index.html']:
 p=r/n;doc=BeautifulSoup(p.read_text(),'html.parser')
 for el in doc.select('link[rel=stylesheet]'):
  if 'launch.css' in el.get('href',''):el['href']='/mtgtools/Odyssey/scry/launch.css?v=20260929-focused1'
 for el in doc.select('.brand-logo picture'):
  im=el.find('img');el.replace_with(im)
 p.write_text(str(doc))
# Preserve the long exhibition's existing browser coverage on its new destination.
p=R/'tests/odyssey-exhibition-browser.py';text=p.read_text();old="await page.goto(BASE, wait_until='domcontentloaded')";assert text.count(old)==1;text=text.replace(old,"await page.goto(BASE+'art.html', wait_until='domcontentloaded')");p.write_text(text)
print('Four-section launch installed. Canonical cards, artwork and Studio placement are unchanged.')
