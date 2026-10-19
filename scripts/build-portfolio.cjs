// Public editorial data only. Keep private sources outside this repository.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content/portfolio.json'), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = iso => new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}).format(new Date(`${iso}T12:00:00Z`));
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10) === value;
const unique = values => new Set(values).size === values.length;
function href(value) {
  if (!value || !(value.startsWith('/') && !value.startsWith('//') || /^https:\/\//.test(value))) throw Error(`Unsupported public URL: ${value}`);
  if (/chatgpt\.site|docs\.google|[?&](token|key|email)=/i.test(value)) throw Error('Private source or credential URL in portfolio data');
  return esc(value);
}
if (!validDate(data.reviewedAt) || !unique(data.projects.map(p=>p.id)) || !unique(data.posts.map(p=>p.id))) throw Error('Invalid review date or duplicate ID');
for (const p of data.projects) {
  if (!p.id || !p.title || !p.description || !p.status) throw Error('Incomplete project');
  if (p.unreleased && (p.href || p.tools)) throw Error('Unreleased projects must not expose working destinations');
  if (p.href) href(p.href);
  if (p.metric && (!validDate(p.metric.asOf) || !Number.isInteger(p.metric.count) || p.metric.count < 0 || p.metric.asOf > data.reviewedAt)) throw Error('Invalid metric');
}
const posts = [...data.posts].sort((a,b)=>b.through.localeCompare(a.through));
for (let i=0;i<posts.length;i++) {
  const p = posts[i];
  if (![p.from,p.through,p.publishedAt].every(validDate) || p.from > p.through || p.publishedAt < p.through || p.publishedAt > data.reviewedAt || !p.paragraphs?.length || !p.title || !p.status) throw Error(`Invalid post: ${p.id}`);
  if (i && posts[i-1].from <= p.through) throw Error('Overlapping archive periods');
  for (const s of p.sources || []) href(s.href);
}
const range = p => `${date(p.from)} – ${date(p.through)}`;
function articles(level, prefix) {
  return posts.map(p=>`<article class="devlog-entry" id="${prefix}${esc(p.id)}">
<p class="devlog-date"><time datetime="${p.from}">${esc(date(p.from))}</time> – <time datetime="${p.through}">${esc(date(p.through))}</time>${p.retrospective?' · Retrospective':''}</p>
<h${level}>${esc(p.title)}</h${level}>
${p.paragraphs.map(x=>`<p>${esc(x)}</p>`).join('\n')}
<p class="devlog-status">${esc(p.status)}</p>
<p class="devlog-published">Written <time datetime="${p.publishedAt}">${esc(date(p.publishedAt))}</time> · <a href="/developer-log/#week-${esc(p.id)}">Permalink</a>${p.sources?.length ? ' · Public record: '+p.sources.map(s=>`<a href="${href(s.href)}">${esc(s.label)}</a>`).join(', ') : ''}</p>
</article>`).join('\n');
}
function project(p) {
  const tag = `<span class="project-tag">${esc(p.status)}</span>`;
  const title = `<span class="project-title">${esc(p.title)}</span>`;
  const description = `<span class="project-description">${esc(p.description)}</span>`;
  if (p.metric) return `<li><div class="project-status" id="dj-radar">${tag}${title}${description}<div class="project-metrics" aria-label="DJ Radar activity snapshot"><span class="project-metric"><strong><data data-dj-radar-count value="${p.metric.count}">${p.metric.count.toLocaleString('en-GB')}</data></strong> indexed entries</span><span class="project-metric"><strong><data data-dj-radar-source-count value="${p.metric.sourceCount}">${p.metric.sourceCount}</data></strong> sources in rotation</span></div><p class="project-snapshot">Index snapshot: <time data-dj-radar-as-of datetime="${p.metric.asOf}">${date(p.metric.asOf)}</time>. Planned rotation; not a count of successful scans.</p></div></li>`;
  if (p.unreleased) return `<li class="project-note">${tag}${title}${description}</li>`;
  const external = p.href.startsWith('https:');
  const tools = p.tools ? `<div class="project-tools" aria-label="${esc(p.title)} tools">${p.tools.map(t=>`<a href="${href(t.href)}">${esc(t.label)}</a>`).join('')}</div>` : '';
  return `<li><a class="project-link" href="${href(p.href)}"${external?' target="_blank" rel="noopener noreferrer"':''}><span>${tag}${title}${description}${external?'<span class="projects-sr-only">Opens in a new tab.</span>':''}</span><span class="project-arrow" aria-hidden="true">${external?'↗':'→'}</span></a>${tools}</li>`;
}
const projectMarkup = `<p class="projects-heading">Public previews &amp; ongoing work</p><p class="projects-intro">Explore what is available now, then see what is still taking shape. Status reviewed ${date(data.reviewedAt)}.</p><ul class="projects-list">${data.projects.filter(p=>!p.unreleased).map(project).join('\n')}</ul><div class="projects-workshop"><p class="projects-heading">Unreleased &amp; in development</p><p class="projects-intro">Early work intended for an audience. Private prototypes have no public access link.</p><ul class="projects-list">${data.projects.filter(p=>p.unreleased).map(project).join('\n')}</ul></div>`;
let home = fs.readFileSync(path.join(root,'public/index.html'),'utf8');
function replaceRegion(source, start, end, content) {
  if (source.split(start).length !== 2 || source.split(end).length !== 2) throw Error(`Expected one generated region: ${start}`);
  const a=source.indexOf(start)+start.length, b=source.indexOf(end);
  if(a>b) throw Error('Generated region order');
  return source.slice(0,a)+'\n'+content+'\n'+source.slice(b);
}
home = replaceRegion(home,'<!-- PORTFOLIO_PROJECTS_START -->','<!-- PORTFOLIO_PROJECTS_END -->',projectMarkup);
home = replaceRegion(home,'<!-- DEVLOG_CONTENT_START -->','<!-- DEVLOG_CONTENT_END -->',articles(3,'log-week-'));
home = home.replace(/<time data-projects-reviewed datetime="[^"]+">[^<]+<\/time>/,`<time data-projects-reviewed datetime="${data.reviewedAt}">${date(data.reviewedAt)}</time>`);
const style = `:root{color-scheme:dark;--cream:#f4efe5;--teal:#70d2c5}*{box-sizing:border-box}body{margin:0;background:#002e2c;color:var(--cream);font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased}a{color:var(--teal);text-underline-offset:4px}a:focus-visible{outline:2px solid var(--teal);outline-offset:5px}main{max-width:780px;margin:auto;padding:48px 28px 80px}header{padding-bottom:28px;border-bottom:1px solid #70d2c566}h1{font-size:clamp(38px,7vw,60px);line-height:1;letter-spacing:-.05em;margin:30px 0 18px}header p{color:#c5d6d0;line-height:1.7;max-width:65ch}.eyebrow,.devlog-date{color:var(--teal);font:11px/1.7 'Courier New',monospace;text-transform:uppercase;letter-spacing:.07em}.archive-nav{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:28px 0 40px}.archive-nav a{font-size:13px;line-height:1.5;padding:5px 0}.devlog-entry{border-top:1px solid #f4efe53d;padding:32px 0;scroll-margin-top:24px;overflow-wrap:anywhere}.devlog-entry h2{font-size:clamp(26px,4vw,34px);line-height:1.15;letter-spacing:-.035em;margin:10px 0 22px}.devlog-entry p{font-size:17px;line-height:1.8;margin:0 0 18px;color:#d7e2dc}.devlog-entry .devlog-date{font-size:11px;color:var(--teal)}.devlog-entry .devlog-status{font-size:14px;border-left:2px solid var(--teal);padding-left:15px;color:#adc3bc}.devlog-entry .devlog-published{font-size:12px;line-height:1.7;color:#adc3bc}footer{border-top:1px solid #70d2c566;padding-top:24px;font-size:13px}@media(max-width:520px){main{padding:28px 20px 50px}.archive-nav{grid-template-columns:1fr;gap:4px}.devlog-entry p{font-size:16px}}`;
const archive = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Developer's Log — Kliawota Disaen</title><meta name="description" content="Weekly notes on the thinking, making and testing behind Kliawota's public projects and work in development."><meta name="theme-color" content="#002e2c"><link rel="canonical" href="https://kliawota.design/developer-log/"><link rel="icon" type="image/webp" href="/assets/kliawota-logo.webp"><style>${style}</style></head><body><main><header><a href="/">← Kliawota Disaen</a><p class="eyebrow">Notes from the workshop</p><h1>Developer's Log</h1><p>Weekly notes on the thinking, making and testing behind the projects.</p><p>The first nine entries reconstruct 19 August–19 October 2026 from dated development records. They were written on 19 October, rather than published in those earlier weeks. Dates use Vanuatu time. Public previews, private prototypes and unreleased projects are identified in each entry.</p><p>Future updates follow a Friday-morning review. A quiet week or an unverified release will be described as such.</p></header><nav class="archive-nav" aria-label="Weekly archive">${posts.map(p=>`<a href="#week-${p.id}">${esc(range(p))}<br>${esc(p.title)}</a>`).join('\n')}</nav>${articles(2,'week-')}<footer><a href="/#ongoing-projects">Explore ongoing projects</a> · <a href="#">Back to top</a><p>Archive reviewed ${date(data.reviewedAt)}.</p></footer></main></body></html>\n`;
const outputs = [['public/index.html',home],['public/developer-log/index.html',archive]];
for (const [name,content] of outputs) {
  const file=path.join(root,name);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(file) || fs.readFileSync(file,'utf8')!==content) throw Error(`Regenerate portfolio: ${name}`);
  } else {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}
}
console.log(`Portfolio ${process.argv.includes('--check')?'checked':'built'}: ${data.projects.length} projects, ${posts.length} weekly entries, reviewed ${data.reviewedAt}.`);
