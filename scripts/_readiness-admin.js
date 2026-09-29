/* Owner-only subscriber manager. Tokens stay in memory. A signed-out session
 * cannot be repopulated by a late network response from a previous session. */
(function(){'use strict';
const API='/mtgtools/odyssey/api/subscriptions/admin',KEY='odyssey-google-oauth-client-v1',$=id=>document.getElementById(id);
let token='',rows=[],session=0,expiryTimer,googleReady=null,busy=false;const pending=new Set();
try{$('clientId').value=localStorage.getItem(KEY)||'';}catch(_){}
function status(text){$('status').textContent=text;}
function clearSession(message='Signed out.'){
 session++;token='';rows=[];clearTimeout(expiryTimer);for(const controller of pending)controller.abort();pending.clear();
 $('rows').replaceChildren();$('counts').textContent='';$('exportState').textContent='';$('manager').hidden=true;$('auth').hidden=false;status(message);
}
async function request(action,extra={},raw=false){
 if(!token)throw Error('Sign in first.');const version=session,controller=new AbortController();pending.add(controller);const timeout=setTimeout(()=>controller.abort(),60000);
 try{
  const r=await fetch(API,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action,...extra}),cache:'no-store',signal:controller.signal});
  if(version!==session)throw Error('This session has ended.');
  if(!r.ok){const body=await r.json().catch(()=>({error:'The request failed. Please retry.'}));if(r.status===401||r.status===403)clearSession(body.error||'Sign in again.');throw Error(body.error||'The request failed.');}
  const value=raw?await r.blob():await r.json();if(version!==session)throw Error('This session has ended.');return value;
 }catch(e){if(e.name==='AbortError')throw Error(version===session?'The request timed out. No success was assumed; refresh before retrying a change.':'This session has ended.');throw e;}
 finally{clearTimeout(timeout);pending.delete(controller);}
}
async function load(){
 status('Reading the private list…');const v=await request('list');rows=v.rows;$('counts').textContent=v.active+' active signups · '+v.total+' records';
 $('exportState').textContent=v.sheetNeedsRefresh?(v.lastExport?'The Sheet is out of date. Refresh it before using the exported list.':'No verified Sheet export yet. Use Refresh Google Sheet.'):'The Sheet matches this list revision.';
 $('exportState').dataset.stale=String(v.sheetNeedsRefresh);$('manager').hidden=false;$('auth').hidden=true;paint();status('Private list loaded. No emails have been sent.');
}
function paint(){
 const q=$('search').value.toLowerCase();$('rows').replaceChildren();
 for(const row of rows.filter(r=>[r.email,r.name].join(' ').toLowerCase().includes(q))){
  const tr=document.createElement('tr');
  for(const text of [[row.email,row.name].filter(Boolean).join('\n'),row.status,row.topics.map(t=>({progress:'Set progress',membership:'Membership opening',playtesting:'Playtesting opening'}[t])).join(', '),row.consentAt+'\n'+(row.emailVerified?'Email verified':'Single opt-in; email unverified')]){const td=document.createElement('td');td.textContent=text;td.style.whiteSpace='pre-line';tr.append(td);}
  const td=document.createElement('td');for(const action of ['unsubscribe','delete']){const b=document.createElement('button');b.type='button';b.textContent=action==='delete'?'Delete personal details':'Unsubscribe';b.disabled=action==='unsubscribe'&&row.status==='unsubscribed';b.onclick=()=>run(async()=>{if(!confirm((action==='delete'?'Delete the email and name for ':'Unsubscribe ')+row.email+'?'))return;await request(action,{id:row.id,confirm:true});await load();status('Updated. Refresh the Google Sheet to remove stale details from that export.');});td.append(b);}tr.append(td);$('rows').append(tr);
 }
}
async function run(task){if(busy)return;busy=true;try{await task();}catch(e){if(e.message!=='This session has ended.')status(e.message);}finally{busy=false;}}
async function gis(){
 if(window.google?.accounts?.oauth2)return;if(googleReady)return googleReady;
 googleReady=new Promise((resolve,reject)=>{const s=document.createElement('script');let done=false;const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);if(error){s.remove();reject(error);}else resolve();};const timer=setTimeout(()=>finish(Error('Google sign-in timed out. Retry when your connection recovers.')),15000);s.src='https://accounts.google.com/gsi/client';s.onload=()=>finish(window.google?.accounts?.oauth2?null:Error('Google sign-in is unavailable.'));s.onerror=()=>finish(Error('Google sign-in could not load.'));document.head.append(s);});
 try{await googleReady;}catch(e){googleReady=null;throw e;}
}
$('connect').onclick=()=>run(async()=>{
 const id=$('clientId').value.trim();if(!/^\d+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(id))throw Error('Enter the public Google OAuth client ID used in Studio, not a token or secret.');
 const version=session;await gis();if(version!==session)return;try{localStorage.setItem(KEY,id);}catch(_){}
 const client=google.accounts.oauth2.initTokenClient({client_id:id,scope:'openid email https://www.googleapis.com/auth/spreadsheets',callback:async result=>{
  if(version!==session)return;if(result.error||!result.access_token){status('Google sign-in was not completed.');return;}
  token=result.access_token;clearTimeout(expiryTimer);const seconds=Number(result.expires_in)||3600;expiryTimer=setTimeout(()=>clearSession('Your Google session expired. Sign in again.'),Math.max(1000,(seconds-30)*1000));
  try{await load();}catch(e){if(token)status(e.message);}
 },error_callback:()=>{if(version===session)status('Google sign-in was closed or unavailable.');}});
 client.requestAccessToken({prompt:'consent'});
});
$('refresh').onclick=()=>run(load);$('search').oninput=paint;
$('csv').onclick=()=>run(async()=>{const blob=await request('csv',{},true),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='odyssey-active-email-signups.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status('Active signups exported with consent and unsubscribe links. No campaign has been sent.');});
$('sheet').onclick=()=>run(async()=>{if(!confirm('Replace the Subscribers export in your private Google Sheet with the current website list? The Read me tab is preserved.'))return;status('Writing and verifying the private Google Sheet…');const v=await request('sheet',{confirm:true});await load();status(v.count+' records exported and verified.'+(v.newerSignups?' The list changed during export; refresh again before a campaign.':''));});
$('logout').onclick=()=>clearSession();window.addEventListener('pagehide',()=>clearSession());
})();
