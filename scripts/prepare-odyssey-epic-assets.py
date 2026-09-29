"""Fetch named historical sources only. Never reads generated mockups or edits cards.
Run once on the review branch. Committed image files are the deployment inputs.
"""
from pathlib import Path
from urllib.parse import quote,unquote,urlsplit
import hashlib,io,json,time
import requests
from PIL import Image,ImageOps,ImageDraw
R=Path(__file__).resolve().parents[1];W=R/'public/mtgtools/Odyssey/scry';OUT=W/'assets/editorial';OUT.mkdir(parents=True,exist_ok=True)
D=json.loads((R/'public/mtgtools/odyssey/data/odyssey-data.json').read_text());catalog={a['id']:a for a in D['artworks']}
s=(R/'public/mtgtools/odyssey/data/artwork-delivery-manifest.20260925a.js').read_text();delivery=json.loads(s[s.index('{'):].rstrip(';\n'))['artworks']
IDS=['ART-170','ART-453','ART-260','ART-303','ART-570','ART-454','ART-568','ART-306']
SESSION=requests.Session();SESSION.headers['User-Agent']='OdysseyArtHistory/1.0 (source attribution review; github.com/jhsizemore/kliawotadesign)'
def get(url):
 if urlsplit(url).scheme!='https':raise ValueError('HTTPS source required')
 last=None
 for delay in [0,2,5]:
  if delay:time.sleep(delay)
  try:
   resp=SESSION.get(url,timeout=45);resp.raise_for_status()
   if len(resp.content)>45_000_000:raise ValueError('Source exceeds size budget')
   return resp
  except Exception as e:last=e
 raise last

def commons_original(source):
 name=unquote(source.split('/wiki/File:',1)[1]).replace(' ','_');md5=hashlib.md5(name.encode()).hexdigest()
 return 'https://upload.wikimedia.org/wikipedia/commons/'+md5[0]+'/'+md5[:2]+'/'+quote(name,safe='()_-,;')

def load_image(a):
 # Verified repository full images avoid remote re-fetches for existing works.
 row=delivery.get(a['id'],{})
 if row.get('status')=='verified' and row.get('source')==a['source'] and row.get('title')==a['title']:
  p=R/'public'/row.get('full',{}).get('url','').lstrip('/')
  if p.is_file():return p.read_bytes(),row.get('originalUrl') or a.get('imageUrl') or a['source']
 url=a.get('download') or a.get('imageUrl') or row.get('originalUrl')
 if a.get('originalCommons'):url=commons_original(a['source'])
 response=get(url);blob=response.content
 if a.get('expectedSha1') and hashlib.sha1(blob).hexdigest()!=a['expectedSha1']:raise ValueError('The named source image changed; review required: '+a['id'])
 return blob,response.url

papyrus={'id':'EXH-PAPYRUS','title':"Papyrus fragment with lines from Homer's Odyssey",'artist':'Greek, Ptolemaic; unknown scribe','date':'ca. 285–250 BCE','medium':'Papyrus','institution':'The Metropolitan Museum of Art','objectId':'09.182.50','source':'https://www.metmuseum.org/art/collection/search/248134','download':'https://collectionapi.metmuseum.org/api/collection/v1/iiif/248134/534364/main-image','rights':'Public Domain · The Metropolitan Museum of Art Open Access','kind':'paper','context':'An actual Book 20 manuscript fragment, not a reconstruction or a prop. Gift of Egypt Exploration Fund, 1909.'}
autolycus={'id':'EXH-AUTOLYCUS','title':'Autolycus','artist':'Charles Robert Leslie','date':'ca. 1836','medium':'Oil on canvas','institution':'Victoria and Albert Museum','objectId':'FA.115[O]','source':'https://collections.vam.ac.uk/item/O80881/autolycus-oil-painting-leslie-charles-robert/','imageSource':'https://commons.wikimedia.org/wiki/File:Leslie_-_Autolycus.jpg','download':commons_original('https://commons.wikimedia.org/wiki/File:Leslie_-_Autolycus.jpg'),'expectedSha1':'a1e6d469a5cc21b8fff5dbaf84781eb7998f4f2f','rights':'Public domain painting and PD-Art reproduction via Wikimedia Commons / Shakespeare Illustrated','kind':'paint','context':"Shakespeare’s pedlar from The Winter’s Tale, used as a playful namesake—not an episode from Homer."}
records=[]
for id in IDS:
 a=dict(catalog[id]);a['kind']='paint' if id!='ART-568' else 'print';a['landscape']=True
 if id in ['ART-568','ART-570']:a['originalCommons']=True
 records.append(a)
records += [papyrus,autolycus]
output={};evidence=[]
def save(image,id,tag,maxsize):
 im=image.copy();im.thumbnail((maxsize,maxsize),Image.Resampling.LANCZOS)
 buf=io.BytesIO();im.save(buf,'WEBP',quality=93,method=6);b=buf.getvalue();name=f'{id}-{tag}.{hashlib.sha256(b).hexdigest()[:12]}.webp';(OUT/name).write_bytes(b)
 return {'url':'/mtgtools/Odyssey/scry/assets/editorial/'+name,'width':im.width,'height':im.height}
for a in records:
 blob,download=load_image(a);im=ImageOps.exif_transpose(Image.open(io.BytesIO(blob)));im.load();im=im.convert('RGB')
 if min(im.size)<200:raise ValueError('Unexpected source dimensions: '+a['id'])
 full=save(im,a['id'],'full',4096);display=save(im,a['id'],'display',1600);thumb=save(im,a['id'],'thumb',560)
 entry={k:a[k] for k in ['id','title','artist','date','medium','institution','source','rights','kind','objectId','context','landscape','imageSource'] if k in a}
 entry.update(image=full['url'],thumb=thumb['url'],width=full['width'],height=full['height'],display=display,full=full,verified=True,blocked=False,originalWidth=im.width,originalHeight=im.height,downloadedFrom=download,sourceSha256=hashlib.sha256(blob).hexdigest())
 if a['id']=='EXH-PAPYRUS':
  # Crop only the documented photo's empty grey margins; retain the complete photo in the viewer.
  detail=im.crop((round(im.width*.30),round(im.height*.055),round(im.width*.69),round(im.height*.96)))
  entry['detail']=save(detail,a['id'],'detail',1000)
 output[a['id']]=entry;evidence.append(entry);print(a['id'],a['title'],im.size,flush=True)
(W/'editorial-assets.json').write_text(json.dumps({'schema':'odyssey-editorial-sources/v1','artworks':output},ensure_ascii=False,indent=2))
(W/'editorial-assets.js').write_text('window.OdysseyEditorialAssets='+json.dumps(output,ensure_ascii=False,separators=(',',':'))+';\n')
# Source review image is an unaltered contact sheet, not artwork for the site.
report=R/'test-results/odyssey-epic';report.mkdir(parents=True,exist_ok=True)
wall=Image.new('RGB',(1400,1050),'#ebe5d8');draw=ImageDraw.Draw(wall)
for i,a in enumerate(evidence):
 x=(i%4)*350;y=(i//4)*350;im=Image.open(R/'public'/a['thumb'].lstrip('/'));im.thumbnail((340,280));wall.paste(im,(x+(340-im.width)//2,y+(280-im.height)//2));draw.text((x+5,y+288),a['id']+' '+a['title'][:40],fill='black')
wall.save(report/'historical-sources.jpg');(report/'sources.json').write_text(json.dumps(output,ensure_ascii=False,indent=2))
