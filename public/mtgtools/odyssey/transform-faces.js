/* Derive printable faces without changing the canonical card or its front art. */
(function(root){
  'use strict';
  function splitTransform(model){
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
  function splitBattle(model){
    if(model?.layout!=='battle'||!model.backFace||typeof model.backFace!=='object')return null;
    const source=model.backFace;
    // A Battle only gains a second printable face when its identity and frame
    // are explicit. Never guess them from the front or an inset text marker.
    if(!source.name||!source.type||!source.rules||!source.frame)return null;
    const front={...model,faceRole:'front',pt:String(model.defense??model.pt??'')};
    const back={...model,faceRole:'back',name:String(source.name),displayName:String(source.displayName||source.name),underlyingName:'',type:String(source.type),rules:String(source.rules),mana:String(source.mana||''),pt:String(source.pt||''),frame:String(source.frame),layout:String(source.layout||'standard'),flavor:String(source.flavor||''),treatment:'',primaryArt:'',artId:source.artId||'',imageUrl:source.imageUrl||'',credit:source.credit||'',source:source.source||'',zoom:source.zoom??1,focusX:source.focusX??0,focusY:source.focusY??0,fit:source.fit||'cover',artHeight:source.artHeight||'normal',frameStyle:source.frameStyle||'standard'};
    return {front,back};
  }
  function split(model){return splitTransform(model)||splitBattle(model)}
  function face(model,side){const pair=split(model);return pair?pair[side==='back'?'back':'front']:model}
  const api={split,face};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OdysseyTransformFaces=api;
})(typeof window!=='undefined'?window:globalThis);
