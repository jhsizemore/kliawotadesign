let identityData=null;
const identityByBuilding=new Map();

function identityTagName(t={}){return t.name||t['name:en']||t.brand||t.operator||t.short_name||''}
function identityCategory(t={}){
  if(t.shop)return `shop · ${String(t.shop).replaceAll('_',' ')}`;
  if(t.amenity)return String(t.amenity).replaceAll('_',' ');
  if(t.tourism)return String(t.tourism).replaceAll('_',' ');
  if(t.office)return `office · ${String(t.office).replaceAll('_',' ')}`;
  if(t.healthcare)return `healthcare · ${String(t.healthcare).replaceAll('_',' ')}`;
  if(t.craft)return `craft · ${String(t.craft).replaceAll('_',' ')}`;
  if(t.leisure)return String(t.leisure).replaceAll('_',' ');
  if(t.historic)return String(t.historic).replaceAll('_',' ');
  if(t.government)return `government · ${String(t.government).replaceAll('_',' ')}`;
  if(t.building)return String(t.building).replaceAll('_',' ');
  return 'mapped place';
}
function identityAddress(t={}){
  const street=t['addr:street']||t['addr:place']||'', num=t['addr:housenumber']||'', city=t['addr:city']||'';
  return [num,street,city].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
}
function identityWebsite(t={}){
  let u=t['contact:website']||t.website||'';
  if(!u)return '';
  if(!/^https?:\/\//i.test(u))u='https://'+u;
  try{return new URL(u).href}catch{return ''}
}
function identityPhone(t={}){return t['contact:phone']||t.phone||''}
function elementWorldPoint(e){
  if(Number.isFinite(e.lon)&&Number.isFinite(e.lat))return world(e.lon,e.lat);
  if(e.center&&Number.isFinite(e.center.lon)&&Number.isFinite(e.center.lat))return world(e.center.lon,e.center.lat);
  if(e.geometry?.length){const ps=e.geometry.map(g=>world(g.lon,g.lat));return{x:ps.reduce((s,p)=>s+p.x,0)/ps.length,z:ps.reduce((s,p)=>s+p.z,0)/ps.length}}
  return null;
}
function isUsefulIdentityElement(e){
  const t=e.tags||{},name=identityTagName(t);
  if(!name)return false;
  if(t.highway||t.natural==='coastline')return false;
  return !!(t.amenity||t.shop||t.tourism||t.office||t.craft||t.healthcare||t.leisure||t.historic||t.government||t.building||t.place||t.man_made||t.public_transport||t.emergency||t.brand||t.operator);
}
function pointSegDistance(p,a,b){const vx=b.x-a.x,vz=b.z-a.z,wx=p.x-a.x,wz=p.z-a.z,l2=vx*vx+vz*vz;if(!l2)return Math.hypot(wx,wz);const t=Math.max(0,Math.min(1,(wx*vx+wz*vz)/l2)),x=a.x+t*vx,z=a.z+t*vz;return Math.hypot(p.x-x,p.z-z)}
function pointPolyDistance(p,poly){if(pointInPoly(p.x,p.z,poly))return 0;let d=Infinity;for(let i=0,j=poly.length-1;i<poly.length;j=i++)d=Math.min(d,pointSegDistance(p,poly[j],poly[i]));return d}
function nearestNamedRoad(x,z){
  let best=null,bd=Infinity;
  for(const e of osmData?.elements||[]){const t=e.tags||{};if(!t.highway||!t.name||!e.geometry?.length)continue;const ps=e.geometry.map(g=>world(g.lon,g.lat)),p={x,z};for(let i=1;i<ps.length;i++){const d=pointSegDistance(p,ps[i-1],ps[i]);if(d<bd){bd=d;best={name:t.name,d}}}}
  return best&&bd<45?best:null;
}
function poiScore(p){const t=p.tags||{};let s=0;if(t.shop)s+=8;if(t.amenity)s+=7;if(t.tourism)s+=6;if(t.office)s+=5;if(t.healthcare)s+=5;if(t.brand)s+=3;if(t.operator)s+=2;if(t.building)s+=1;return s}
function sourceUrl(e){if(!e?.type||!e?.id)return '';return `https://www.openstreetmap.org/${e.type}/${e.id}`}
function uniquePois(list){const seen=new Set(),out=[];for(const p of list){const n=p.name.trim().toLowerCase();if(!n||seen.has(n))continue;seen.add(n);out.push(p)}return out}

async function loadIdentityPOIs(){
  const b=C.b;
  const q=`[out:json][timeout:30];(node["name"](${b.s},${b.w},${b.n},${b.e});node["amenity"](${b.s},${b.w},${b.n},${b.e});node["shop"](${b.s},${b.w},${b.n},${b.e});node["tourism"](${b.s},${b.w},${b.n},${b.e});node["office"](${b.s},${b.w},${b.n},${b.e});node["healthcare"](${b.s},${b.w},${b.n},${b.e});way["name"](${b.s},${b.w},${b.n},${b.e});way["amenity"](${b.s},${b.w},${b.n},${b.e});way["shop"](${b.s},${b.w},${b.n},${b.e});way["tourism"](${b.s},${b.w},${b.n},${b.e});way["office"](${b.s},${b.w},${b.n},${b.e});relation["name"](${b.s},${b.w},${b.n},${b.e});relation["amenity"](${b.s},${b.w},${b.n},${b.e});relation["tourism"](${b.s},${b.w},${b.n},${b.e}););out tags center geom;`;
  const eps=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];let err;
  for(const ep of eps){const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),14000);try{const r=await fetch(ep+'?data='+encodeURIComponent(q),{signal:ac.signal});if(!r.ok)throw Error(String(r.status));identityData=await r.json();clearTimeout(tm);return identityData}catch(e){clearTimeout(tm);err=e}}
  throw err||Error('Identity data unavailable');
}

function buildIdentityIndex(){
  identityByBuilding.clear();
  const baseEls=osmData?.elements||[], buildingWays=new Map(baseEls.filter(e=>e.type==='way'&&e.tags?.building).map(e=>[String(e.id),e]));
  const poiRaw=(identityData?.elements||[]).filter(isUsefulIdentityElement).map(e=>{const p=elementWorldPoint(e);return p?{element:e,tags:e.tags||{},name:identityTagName(e.tags||{}),category:identityCategory(e.tags||{}),p}:null}).filter(Boolean);
  const poiMap=new Map();for(const p of poiRaw)poiMap.set(`${p.element.type}/${p.element.id}`,p);const pois=[...poiMap.values()];
  let identified=0,high=0;
  for(const mesh of buildingMeshes){
    const ud=mesh.userData,t=ud.t||{},way=buildingWays.get(String(ud.id)),poly=(way?.geometry||[]).slice(0,-1).map(g=>world(g.lon,g.lat));
    const ownName=identityTagName(t),ownCategory=identityCategory(t),ownAddr=identityAddress(t),ownWeb=identityWebsite(t),ownPhone=identityPhone(t);
    let inside=[],adjacent=[];
    if(poly.length>=3){for(const p of pois){const d=pointPolyDistance(p.p,poly);if(d===0)inside.push({...p,d});else if(d<=16)adjacent.push({...p,d})}}
    inside=uniquePois(inside.sort((a,b)=>poiScore(b)-poiScore(a)));
    adjacent=uniquePois(adjacent.sort((a,b)=>a.d-b.d||poiScore(b)-poiScore(a)));
    let confidence='low',primary=ownName||'',source='No matched named place',srcElement=way||null,matched=null;
    if(ownName){confidence='high';source='Name mapped directly on building footprint'}
    else if(inside.length){confidence='high';matched=inside[0];primary=inside.length===1?inside[0].name:`${inside[0].name} + ${inside.length-1} more`;source=inside.length===1?'Named OSM place inside footprint':'Multiple named OSM places inside footprint';srcElement=inside[0].element}
    else if(adjacent.length){confidence='medium';matched=adjacent[0];primary=adjacent[0].name;source=`Named OSM place ${Math.round(adjacent[0].d)} m from footprint`;srcElement=adjacent[0].element}
    const occ=inside.map(p=>p.name).filter(n=>n!==ownName),road=nearestNamedRoad(ud.cx,ud.cz),tags=matched?.tags||t;
    const address=ownAddr||identityAddress(tags)||(road?`Near ${road.name}`:'Not mapped');
    const category=matched?.category||(ownName?ownCategory:(t.amenity||t.shop||t.tourism||t.office?ownCategory:'building'));
    const website=ownWeb||identityWebsite(tags),phone=ownPhone||identityPhone(tags);
    if(confidence!=='low')identified++;if(confidence==='high')high++;
    const rec={primary:primary||'Unnamed building',confidence,category,address,occupants:occ,website,phone,source,sourceUrl:sourceUrl(srcElement),road:road?.name||'',sourceElement:srcElement,fetchedAt:new Date().toISOString()};
    identityByBuilding.set(String(ud.id),rec);ud.identity=rec;
  }
  if($('idstat'))$('idstat').textContent=identified;
  if($('hcstat'))$('hcstat').textContent=high;
  if($('poistat'))$('poistat').textContent=pois.length;
  return{identified,high,pois:pois.length};
}
