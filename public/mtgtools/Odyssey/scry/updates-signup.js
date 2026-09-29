/* Real opt-in collection: no mailto submission and no success without a stored signup. */
(function(){
'use strict';
const API='/mtgtools/odyssey/api/subscriptions',form=document.getElementById('updatesSignup');if(!form)return;
const button=form.querySelector('button[type=submit]'),status=document.getElementById('updatesStatus');let busy=false,settings=null;
function say(text,bad=false){status.textContent=text;status.dataset.state=bad?'error':'info';}
async function json(path,opt={}){const response=await fetch(API+path,{...opt,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});const result=await response.json().catch(()=>({error:'The signup service did not respond. Please retry.'}));if(!response.ok)throw Error(result.error||'Your signup could not be saved.');return result;}
async function ready(){try{settings=await json('');if(!settings.enabled)throw Error('Email signup is temporarily unavailable. Please retry.');button.disabled=false;say('Choose the updates you want. No payment or account needed.');}catch(e){settings=null;button.disabled=false;button.textContent='Try signup again';say(e.message,true);}}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;if(!form.reportValidity())return;
 const data=new FormData(form),topics=data.getAll('topics');if(!topics.length){say('Choose at least one update topic.',true);form.querySelector('[name=topics]').focus();return;}
 busy=true;button.disabled=true;button.textContent='Saving your signup…';say('Saving your email preferences securely…');
 try{
  if(!settings){settings=await json('');if(!settings.enabled)throw Error('Email signup is temporarily unavailable. Please retry.');}
  const challenge=await json('/challenge');await new Promise(resolve=>setTimeout(resolve,Math.max(1050,Number(challenge.notBefore)-Date.now()+60)));
  const body={email:String(data.get('email')||'').trim(),name:String(data.get('name')||'').trim(),topics,consent:data.get('consent')==='yes',consentVersion:settings.consentVersion,challenge:challenge.challenge,website:String(data.get('website')||'')};
  const result=await json('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(result.accepted!==true)throw Error('Your signup was not confirmed. Please retry.');
  form.reset();say(result.message);status.dataset.state='success';status.focus();
 }catch(e){say(e.name==='TimeoutError'?'The request timed out. Your entries are still here; it is safe to retry.':e.message,true);}
 finally{busy=false;button.disabled=false;button.textContent='Keep me updated';}
});
ready();
})();
