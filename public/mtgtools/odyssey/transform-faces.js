/* Derive printable faces without changing the canonical card or its front art. */
(function(root){
  'use strict';
  function split(model){
    if(model?.layout!=='transform'||!String(model.rules||'').includes('//BACK//'))return null;
    const [frontRules,backSource]=String(model.rules).split('//BACK//',2);
    const names=String(model.displayName||model.name||'').split('//').map(x=>x.trim());
    const types=String(model.type||'').split('//').map(x=>x.trim());
    const stats=String(model.pt||'').split('//').map(x=>x.trim());
    const lines=backSource.trim().split(/\n+/);
    const backName=(lines.shift()||names[1]||'Back face').trim();
    const backArt=model.backFace||{};
    const front={...model,faceRole:'front',name:names[0],displayName:names[0],type:types[0],rules:frontRules.trim(),pt:stats[0]||'',layout:/\bSaga\b/i.test(types[0])?'saga':'standard'};
    const back={...model,faceRole:'back',name:backName,displayName:backName,underlyingName:'',type:types[1]||'',rules:lines.join('\n').trim(),pt:stats[1]||'',mana:'',frame:'C',layout:/\bVehicle\b/i.test(types[1])?'vehicle':'standard',treatment:'',primaryArt:'',artId:backArt.artId||'',imageUrl:backArt.imageUrl||'',credit:backArt.credit||'',source:backArt.source||'',zoom:backArt.zoom??1,focusX:backArt.focusX??0,focusY:backArt.focusY??0,fit:backArt.fit||'cover',artHeight:backArt.artHeight||'normal',frameStyle:backArt.frameStyle||'standard'};
    return {front,back};
  }
  function face(model,side){const pair=split(model);return pair?pair[side==='back'?'back':'front']:model}
  const api={split,face};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OdysseyTransformFaces=api;
})(typeof window!=='undefined'?window:globalThis);
