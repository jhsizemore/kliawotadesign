/* Local verification server ONLY. Never imported by deployment code. */
import http from 'node:http';import {readFile,stat} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {subscriberWorkspace,SIGNUP_API,OWNER} from '../src/odyssey-subscriptions.mjs';import {MemoryStorage} from './subscription-storage.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public'),port=Number(process.env.PORT||8765),storage=new MemoryStorage();let placement={schema:'odyssey-art-placement/v1',revision:0,records:{}};
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff'};
const google=async(url,opt)=>url==='https://www.googleapis.com/oauth2/v3/userinfo'&&opt.headers.Authorization==='Bearer owner-test-credential'?Response.json({email:OWNER,email_verified:true}):new Response('',{status:403});
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:'+port),headers=new Headers(req.headers);headers.set('CF-Connecting-IP','192.0.2.9');let body;if(!['GET','HEAD'].includes(req.method)){const chunks=[];for await(const c of req){chunks.push(c);if(chunks.reduce((n,x)=>n+x.length,0)>131072)throw Error('Large test payload');}body=Buffer.concat(chunks);}const request=new Request(url,{method:req.method,headers,...(body?{body}: {})});let response;
if(url.pathname.startsWith(SIGNUP_API))response=await subscriberWorkspace(request,storage,google);
else if(url.pathname==='/__test/placements'){placement=JSON.parse(body.toString());response=Response.json({ok:true});}
else if(url.pathname==='/__test/subscribers')response=Response.json([...(await storage.list({prefix:'member:'})).values()]);
else if(url.pathname==='/mtgtools/odyssey/api/art-placement')response=Response.json(placement);
else if(url.pathname==='/mtgtools/odyssey/api/contact')response=Response.json({enabled:false});
else{let name=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!name.startsWith(root+path.sep))throw Error('Invalid path');try{if((await stat(name)).isDirectory())name=path.join(name,'index.html');const bytes=await readFile(name);response=new Response(bytes,{headers:{'Content-Type':types[path.extname(name)]||'application/octet-stream'}});}catch{response=new Response('Not found',{status:404});}}
res.statusCode=response.status;for(const [key,value]of response.headers)res.setHeader(key,value);res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.statusCode=500;res.end(String(e));}}).listen(port,'127.0.0.1',()=>console.log('Odyssey test server: '+port));
