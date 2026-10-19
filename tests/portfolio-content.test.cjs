const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'content/portfolio.json'),'utf8'));
const home=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const archive=fs.readFileSync(path.join(root,'public/developer-log/index.html'),'utf8');
for (const [name,html] of [['homepage',home],['archive',archive]]) {
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,`${name}: duplicate ID`);
  assert.equal((html.match(/<article class="devlog-entry"/g)||[]).length,data.posts.length,`${name}: missing post`);
  assert(!/myriadthings\.chatgpt\.site|docs\.google\.com\/spreadsheets|wedding-library|subscriber[s]?\//i.test(html),`${name}: private working destination`);
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (!match[0].includes('application/ld+json')) new Function(match[1]);
  }
}
for(const p of data.posts) {
  assert(home.includes(`id="log-week-${p.id}"`));
  assert(archive.includes(`id="week-${p.id}"`));
  assert(archive.includes(`Written <time datetime="${p.publishedAt}"`));
  assert(home.includes(`/developer-log/#week-${p.id}`));
}
const ascending=[...data.posts].sort((a,b)=>a.from.localeCompare(b.from));
for(let i=1;i<ascending.length;i++) {
  const next=new Date(ascending[i-1].through+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
  assert.equal(ascending[i].from,next.toISOString().slice(0,10),'Backfill has gap');
}
assert(home.indexOf('id="ongoing-projects"')<home.indexOf('id="developers-log"'),'Log must be beneath Projects');
assert(home.includes('data-dj-radar-count value="'+data.projects.find(p=>p.id==='dj-radar').metric.count+'"'));
console.log('Portfolio integrity passed: matching archives, dates, links, private boundaries and script syntax.');
