const fs=require('node:fs');
const path=require('node:path');

const [input,output]=process.argv.slice(2);
if(!input||!output){
  console.error('Usage: node scripts/build-island-scenario-from-geojson.cjs input.geojson output.json');
  process.exit(2);
}
const geo=JSON.parse(fs.readFileSync(input,'utf8'));
if(geo.type!=='FeatureCollection') throw new Error('Input must be a GeoJSON FeatureCollection.');

const coords=[];
function collect(g){
  if(!g)return;
  if(g.type==='Point') coords.push(g.coordinates);
  else if(g.type==='LineString'||g.type==='MultiPoint') g.coordinates.forEach(c=>coords.push(c));
  else if(g.type==='Polygon'||g.type==='MultiLineString') g.coordinates.flat(1).forEach(c=>coords.push(c));
  else if(g.type==='MultiPolygon') g.coordinates.flat(2).forEach(c=>coords.push(c));
}
geo.features.forEach(f=>collect(f.geometry));
if(!coords.length) throw new Error('No coordinates found.');
const xs=coords.map(c=>c[0]),ys=coords.map(c=>c[1]);
const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
const spanX=Math.max(1e-9,maxX-minX),spanY=Math.max(1e-9,maxY-minY);
const W=1080,H=720,M=55;
const scale=Math.min((W-M*2)/spanX,(H-M*2)/spanY);
const drawW=spanX*scale,drawH=spanY*scale,ox=(W-drawW)/2,oy=(H-drawH)/2;
function project(c){return [ox+(c[0]-minX)*scale,oy+(maxY-c[1])*scale]}
function pathForRing(ring){
  return ring.map((c,i)=>{const [x,y]=project(c);return (i?'L':'M')+' '+x.toFixed(1)+' '+y.toFixed(1)}).join(' ')+' Z';
}
function pathForGeometry(g){
  if(g.type==='Polygon') return g.coordinates.map(pathForRing).join(' ');
  if(g.type==='MultiPolygon') return g.coordinates.flatMap(poly=>poly.map(pathForRing)).join(' ');
  return '';
}

const landforms=[],nodes=[],features=[];
for(const [index,f] of geo.features.entries()){
  const p=f.properties||{},id=String(p.id||p.slug||p.name||('feature-'+(index+1))).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-|-$/g,'');
  if(f.geometry?.type==='Polygon'||f.geometry?.type==='MultiPolygon'){
    landforms.push({id,d:pathForGeometry(f.geometry),reef:p.reef!==false});
  }else if(f.geometry?.type==='Point'){
    const [x,y]=project(f.geometry.coordinates);
    nodes.push({
      id,
      island:p.island||'main',
      label:p.label||p.name||id,
      short:p.short||p.label||p.name||id,
      kind:p.kind||'town',
      x:Number((x/W*100).toFixed(2)),
      y:Number((y/H*100).toFixed(2)),
      stats:Array.isArray(p.stats)?p.stats:['community'],
      note:p.note||''
    });
  }else if(f.geometry?.type==='LineString'){
    const d=f.geometry.coordinates.map((c,i)=>{const [x,y]=project(c);return (i?'L':'M')+' '+x.toFixed(1)+' '+y.toFixed(1)}).join(' ');
    features.push({kind:p.kind||'feature',d});
  }
}

const scenario={
  $schema:'./scenario.schema.json',
  id:path.basename(output,path.extname(output)).toLowerCase().replace(/[^a-z0-9_-]+/g,'-'),
  name:'New real-map scenario',
  shortName:'Real map',
  strap:'Draft scenario · review required',
  topology:'real-map',
  summary:'Draft generated from GeoJSON. Add game rules, validate the geography, and review the scenario with people who know the place before use.',
  briefing:'This file preserves simplified geography only. The game model still requires locally reviewed nodes, links, project choices, hazards and objectives.',
  landforms,
  features,
  nodes,
  links:[],
  projectTargets:{},
  logistics:{hub:nodes.find(n=>n.kind==='port')?.id||nodes[0]?.id||null,remoteZones:[],baseTravelSeasons:1,disruptionHazards:['shipping','cyclone']},
  hazardTargets:{},
  goals:[]
};
fs.writeFileSync(output,JSON.stringify(scenario,null,2)+'\n');
console.log(JSON.stringify({output,landforms:landforms.length,nodes:nodes.length,features:features.length,bounds:[minX,minY,maxX,maxY]},null,2));
