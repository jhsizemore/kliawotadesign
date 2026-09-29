/* Private single-opt-in list. No list data in public assets or Google credentials at rest.
 * The Google Sheet is an explicit owner export; it is never used as a public form. */
export const SIGNUP_API='/mtgtools/odyssey/api/subscriptions';
export const SUBSCRIBER_SHEET='13TFGTa8ZCAdR5ztTsMd151WEAfioIEskoFre7zhazec';
export const OWNER='jhsizemore@gmail.com';
export const CONSENT_VERSION='odyssey-updates-20260929-v1';
export const TOPICS=['progress','membership','playtesting'];
export const HEADERS=['Subscriber ID','Email','Name','Status','Set progress','Membership opening','Playtesting opening','Consent at (UTC)','Consent version','Email verified','Source','Updated at (UTC)','Unsubscribe URL'];
const NAMESPACE='odyssey-private-subscribers-v1',MAX_BODY=4096,MAX_MEMBERS=9999,DAY=86400000;
const encoder=new TextEncoder();
const j=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',...extra}});
const emailOK=s=>typeof s==='string'&&s.length<=254&&/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(s)&&!s.includes('..');
const hex=bytes=>[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
async function hmac(secret,text){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(text))));}
async function secretFor(storage){return storage.transaction(async tx=>{let key=await tx.get('secret:v1');if(!key){key=random();await tx.put('secret:v1',key);}return key;});}
async function readJSON(request){if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))throw Error('Use application/json.');if(Number(request.headers.get('content-length')||0)>MAX_BODY)throw Error('Request too large.');const reader=request.body?.getReader();if(!reader)throw Error('Missing form.');const chunks=[];let n=0;for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>MAX_BODY){await reader.cancel();throw Error('Request too large.');}chunks.push(value);}const b=new Uint8Array(n);let offset=0;for(const c of chunks){b.set(c,offset);offset+=c.length;}const value=JSON.parse(new TextDecoder().decode(b));if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid form.');return value;}
export function validateSignup(value){
 if(Object.keys(value).some(k=>!['email','name','topics','consent','consentVersion','challenge','website'].includes(k)))throw Error('Unexpected form field.');
 const email=typeof value.email==='string'?value.email.trim().toLowerCase():'';
 if(!emailOK(email))throw Error('Enter a valid email address.');
 if(typeof value.name!=='string'||value.name.length>80||/[\x00-\x1f\x7f]/.test(value.name))throw Error('Use a name of 80 characters or fewer.');
 if(!Array.isArray(value.topics)||!value.topics.length||value.topics.length>3||new Set(value.topics).size!==value.topics.length||value.topics.some(t=>!TOPICS.includes(t)))throw Error('Choose at least one update topic.');
 if(value.consent!==true||value.consentVersion!==CONSENT_VERSION)throw Error('Confirm that you want these updates by email.');
 if(value.website!==''||typeof value.challenge!=='string'||value.challenge.length>400)throw Error('Refresh the form and try again.');
 return {email,name:value.name.trim(),topics:TOPICS.filter(t=>value.topics.includes(t)),consentVersion:CONSENT_VERSION,challenge:value.challenge};
}
const cookie=request=>(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('odyssey_signup='))?.slice(15)||'';
function sameOrigin(request){const u=new URL(request.url);return request.headers.get('origin')===u.origin&&request.headers.get('sec-fetch-site')!=='cross-site';}
export async function routeSubscriptions(request,env){const u=new URL(request.url);if(u.pathname!==SIGNUP_API&&!u.pathname.startsWith(SIGNUP_API+'/'))return null;
 const suffix=u.pathname.slice(SIGNUP_API.length);if(!['','/challenge','/admin','/unsubscribe','/health'].includes(suffix))return j({error:'Not found.'},404);
 if(!['GET','POST'].includes(request.method))return j({error:'Method not allowed.'},405);
 if(request.method==='POST'&&!sameOrigin(request))return j({error:'Use the form on this website.'},403);
 if(!env.ODYSSEY_ART_SYNC||env.ODYSSEY_SIGNUPS_ENABLED==='false')return j({enabled:false,error:'Updates signup is temporarily unavailable.'},503);
 if(suffix==='/admin'&&!/^Bearer [A-Za-z0-9._~+\/-]{10,4096}$/.test(request.headers.get('authorization')||''))return j({error:'Owner sign-in required.'},401);
 try{return await env.ODYSSEY_ART_SYNC.get(env.ODYSSEY_ART_SYNC.idFromName(NAMESPACE)).fetch(request);}catch(_){return j({error:'The signup could not be saved. Please try again.'},503);}
}
async function ownerAuth(request,fetcher){const authorization=request.headers.get('authorization')||'';if(!/^Bearer [A-Za-z0-9._~+\/-]{10,4096}$/.test(authorization))return false;try{const r=await fetcher('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:authorization},signal:AbortSignal.timeout(10000)});if(!r.ok)return false;const profile=await r.json();return profile.email_verified===true&&String(profile.email).toLowerCase()===OWNER;}catch(_){return false;}}
const success=()=>j({accepted:true,message:'Thank you for joining the voyage. New signups are saved for your selected updates. Existing preferences, including a previous unsubscribe, stay unchanged.'},202);
export async function subscriberWorkspace(request,storage,fetcher=fetch,clock=Date.now){
 const u=new URL(request.url),suffix=u.pathname.slice(SIGNUP_API.length),now=clock(),day=Math.floor(now/DAY);
 if(request.method==='GET'&&(suffix===''||suffix==='/health')){await storage.get('revision');return j({enabled:true,provider:'private-list',consentVersion:CONSENT_VERSION,topics:TOPICS,verification:'single-opt-in',campaignsAutomated:false});}
 if(request.method==='GET'&&suffix==='/challenge'){
  const secret=await secretFor(storage),nonce=random(),ip=await hmac(secret,'ip:'+day+':'+(request.headers.get('CF-Connecting-IP')||'unknown'));
  const payload=now+'.'+nonce+'.'+ip,signature=await hmac(secret,'form:'+payload);
  return j({challenge:payload+'.'+signature,notBefore:now+1000,expiresAt:now+1200000},200, {'Set-Cookie':'odyssey_signup='+nonce+'; Path='+SIGNUP_API+'; Max-Age=1200; HttpOnly; SameSite=Strict'+(u.protocol==='https:'?'; Secure':'')});
 }
 if(request.method!=='POST')return j({error:'Method not allowed.'},405);
 if(!sameOrigin(request))return j({error:'Use the form on this website.'},403);
 let body;try{body=await readJSON(request);}catch(e){return j({error:e instanceof SyntaxError?'Invalid form.':e.message},400);}
 if(suffix==='/admin')return admin(request,body,storage,fetcher,now);
 const secret=await secretFor(storage);
 if(suffix==='/unsubscribe'){
  if(Object.keys(body).some(k=>k!=='token')||typeof body.token!=='string'||!/^([a-f0-9]{64})\.([a-f0-9]{64})$/.test(body.token))return j({error:'This unsubscribe link is invalid.'},400);
  const [id,signature]=body.token.split('.');if(signature!==await hmac(secret,'unsubscribe:'+id))return j({error:'This unsubscribe link is invalid.'},403);
  await storage.transaction(async tx=>{const row=await tx.get('member:'+id);if(row&&row.status==='active'){row.status='unsubscribed';row.updatedAt=new Date(now).toISOString();await tx.put('member:'+id,row);await tx.put('revision',(await tx.get('revision')||0)+1);}});
  return j({unsubscribed:true,message:'You have been unsubscribed from Odyssey email updates.'});
 }
 if(suffix!=='')return j({error:'Not found.'},404);
 let clean;try{clean=validateSignup(body);}catch(e){return j({error:e.message},400);}
 const parts=clean.challenge.split('.');if(parts.length!==4||parts.some((p,i)=>i===0?!/^\d{13}$/.test(p):!(/^[a-f0-9]{64}$/).test(p)))return j({error:'Refresh the form and try again.'},403);
 const [issued,nonce,ip,signature]=parts,payload=parts.slice(0,3).join('.');
 const currentIP=await hmac(secret,'ip:'+Math.floor(Number(issued)/DAY)+':'+(request.headers.get('CF-Connecting-IP')||'unknown'));
 if(cookie(request)!==nonce||signature!==await hmac(secret,'form:'+payload)||ip!==currentIP||now-Number(issued)<1000||now-Number(issued)>1200000)return j({error:'The form verification expired. Please retry.'},403);
 const id=await hmac(secret,'email:'+clean.email),at=new Date(now).toISOString(),rateKey='rate:'+day+':'+ip;
 const result=await storage.transaction(async tx=>{
  const consumed=await tx.get('used:'+day+':'+nonce);if(consumed)return {accepted:true};
  const total=await tx.get('daily:'+day)||0,rate=await tx.get(rateKey)||{window:now,count:0};
  if(now-rate.window>600000){rate.window=now;rate.count=0;}
  if(rate.count>=5||total>=2000)return {limited:true};
  const existing=await tx.get('member:'+id),count=await tx.get('count')||0;if(!existing&&count>=MAX_MEMBERS)return {full:true};
  rate.count++;await tx.put(rateKey,rate);await tx.put('daily:'+day,total+1);await tx.put('used:'+day+':'+nonce,now);
  if(!existing){await tx.put('member:'+id,{id,email:clean.email,name:clean.name,status:'active',topics:clean.topics,consentAt:at,consentVersion:CONSENT_VERSION,emailVerified:false,source:'odyssey-scry-signup',updatedAt:at});await tx.put('count',count+1);await tx.put('revision',(await tx.get('revision')||0)+1);}
  return {accepted:true};
 });
 if(result.limited)return j({error:'Too many attempts. Please try again later.'},429,{'Retry-After':'600'});
 if(result.full)return j({error:'The signup list is temporarily full. Please contact Hunter.'},503);
 return success();
}
export async function cleanupSubscriptions(storage,now=Date.now()){
 const cutoff=Math.floor(now/DAY)-1;for(const prefix of ['rate:','used:','daily:']){const rows=await storage.list({prefix,limit:10000});const keys=[...rows.keys()].filter(k=>Number(k.split(':')[1])<cutoff);for(let i=0;i<keys.length;i+=128)await storage.delete(keys.slice(i,i+128));}
}
const spreadsheetCell=value=>{const s=String(value??'');return /^[\s]*[=+@-]/.test(s)?"'"+s:s;};
export const csvCell=v=>'"'+spreadsheetCell(v).replace(/"/g,'""')+'"';
async function admin(request,body,storage,fetcher,now){
 if(!await ownerAuth(request,fetcher))return j({error:'This subscriber list is private. Sign in as the owner.'},403);
 if(!['list','csv','sheet','unsubscribe','delete'].includes(body.action)||Object.keys(body).some(k=>!['action','id','confirm'].includes(k)))return j({error:'Unknown list action.'},400);
 if(['unsubscribe','delete'].includes(body.action)){
  if(!/^[a-f0-9]{64}$/.test(body.id||'')||body.confirm!==true)return j({error:'Confirm the selected subscriber action.'},400);
  await storage.transaction(async tx=>{const row=await tx.get('member:'+body.id);if(!row)return;if(body.action==='delete'){await tx.put('member:'+body.id,{id:body.id,status:'deleted',topics:[],updatedAt:new Date(now).toISOString()});}else{row.status='unsubscribed';row.updatedAt=new Date(now).toISOString();await tx.put('member:'+body.id,row);}await tx.put('revision',(await tx.get('revision')||0)+1);});
  return j({updated:true});
 }
 const snapshot=await storage.transaction(async tx=>({revision:await tx.get('revision')||0,rows:[...(await tx.list({prefix:'member:',limit:MAX_MEMBERS})).values()]}));
 const rows=snapshot.rows.filter(r=>r.status!=='deleted').sort((a,b)=>String(b.consentAt).localeCompare(String(a.consentAt)));
 if(body.action==='list')return j({rows,revision:snapshot.revision,total:rows.length,active:rows.filter(r=>r.status==='active').length,sheetId:SUBSCRIBER_SHEET});
 const secret=await secretFor(storage),values=[];
 for(const r of rows.filter(r=>body.action!=='csv'||r.status==='active')){const unsub='https://kliawota.design/mtgtools/Odyssey/scry/updates/manage.html#'+r.id+'.'+await hmac(secret,'unsubscribe:'+r.id);values.push([r.id,r.email,r.name,r.status,...TOPICS.map(t=>r.topics.includes(t)?'YES':'NO'),r.consentAt,r.consentVersion,r.emailVerified?'YES':'NO',r.source,r.updatedAt,unsub]);}
 if(body.action==='csv'){const text='\ufeff'+[HEADERS,...values].map(r=>r.map(csvCell).join(',')).join('\r\n');return new Response(text,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="odyssey-email-signups.csv"','Cache-Control':'no-store, private'}});}
 if(body.confirm!==true)return j({error:'Confirm replacement of the subscriber export in the private Sheet.'},400);
 const auth=request.headers.get('authorization'),base='https://sheets.googleapis.com/v4/spreadsheets/'+SUBSCRIBER_SHEET;
 async function google(path,opt={}){const r=await fetcher(base+path,{...opt,headers:{Authorization:auth,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(r.status===403?'Google denied access to the private signup workbook.':'The Sheet export failed. The website list is unchanged.');return r.json();}
 try{
  const meta=await google('?fields=sheets(properties(sheetId,title,gridProperties))');const tab=meta.sheets?.find(s=>s.properties.title==='Subscribers');if(!tab)throw Error('The Subscribers tab is missing. No Sheet was changed.');
  if(tab.properties.gridProperties.rowCount<MAX_MEMBERS+1)await google(':batchUpdate',{method:'POST',body:JSON.stringify({requests:[{updateSheetProperties:{properties:{sheetId:tab.properties.sheetId,gridProperties:{rowCount:MAX_MEMBERS+1}},fields:'gridProperties.rowCount'}}]})});
  const payload=[HEADERS,...values.map(r=>r.map(spreadsheetCell))];
  await google('/values:batchUpdate',{method:'POST',body:JSON.stringify({valueInputOption:'RAW',data:[{range:"'Subscribers'!A1:M"+payload.length,values:payload}]})});
  if(payload.length<MAX_MEMBERS+1)await google('/values/'+encodeURIComponent("'Subscribers'!A"+(payload.length+1)+':M'+(MAX_MEMBERS+1))+':clear',{method:'POST',body:'{}'});
  const check=await google('/values/'+encodeURIComponent("'Subscribers'!A1:M"+payload.length)+'?valueRenderOption=UNFORMATTED_VALUE');
  const compare=r=>JSON.stringify((r||[]).map(row=>Array.from({length:13},(_,i)=>String(row[i]??''))));if(compare(check.values)!==compare(payload))throw Error('Sheet read-back did not match. Retry the export; the website list is safe.');
  await storage.put('lastExport',{at:new Date(now).toISOString(),revision:snapshot.revision,count:rows.length});
  return j({exported:true,count:rows.length,revision:snapshot.revision,sheetId:SUBSCRIBER_SHEET,newerSignups:(await storage.get('revision')||0)>snapshot.revision});
 }catch(e){return j({error:e.message},502);}
}
