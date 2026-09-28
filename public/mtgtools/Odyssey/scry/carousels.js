/* Finite, user-controlled exhibition carousels. No autoplay, no scroll trap. */
(function(){
'use strict';
function mount(root,{label='Exhibition',titles=[]}={}){
 const slides=[...root.children];if(!slides.length)return null;
 root.classList.add('exhibition-carousel');root.setAttribute('role','region');root.setAttribute('aria-roledescription','carousel');root.setAttribute('aria-label',label);
 const viewport=document.createElement('div');viewport.className='carousel-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label',label+' slides; use left and right arrow keys');
 const track=document.createElement('div');track.className='carousel-track';viewport.append(track);root.append(viewport);slides.forEach((s,i)=>{s.classList.add('carousel-slide');s.setAttribute('role','group');s.setAttribute('aria-roledescription','slide');s.setAttribute('aria-label',(i+1)+' of '+slides.length+': '+(titles[i]||''));track.append(s);});
 const controls=document.createElement('div');controls.className='carousel-controls';
 const previous=document.createElement('button'),next=document.createElement('button'),status=document.createElement('span'),tabs=document.createElement('div');
 previous.type=next.type='button';previous.textContent='←';next.textContent='→';previous.setAttribute('aria-label','Previous '+label.toLowerCase());next.setAttribute('aria-label','Next '+label.toLowerCase());status.className='carousel-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');tabs.className='carousel-tabs';
 const buttons=slides.map((_,i)=>{const b=document.createElement('button');b.type='button';b.textContent=titles[i]||String(i+1);b.onclick=()=>go(i);tabs.append(b);return b;});controls.append(previous,tabs,status,next);root.prepend(controls);
 let index=0,lastWheel=-Infinity,accumulated=0,resetTimer,gestureStart;
 const heightObserver=new ResizeObserver(()=>{viewport.style.height=slides[index].offsetHeight+'px';});
 function sync(){heightObserver.disconnect();heightObserver.observe(slides[index]);viewport.style.height=slides[index].offsetHeight+'px';slides.forEach((s,i)=>{s.inert=i!==index;s.setAttribute('aria-hidden',String(i!==index));});buttons.forEach((b,i)=>{b.setAttribute('aria-current',String(i===index));});previous.disabled=index===0;next.disabled=index===slides.length-1;status.textContent=(index+1)+' / '+slides.length;root.dataset.slide=String(index);}
 function go(i){i=Math.max(0,Math.min(slides.length-1,i));if(i===index)return;const reading=slides[index].contains(document.activeElement);index=i;if(reading)viewport.focus({preventScroll:true});track.style.transform='translateX(-'+(index*100)+'%)';sync();root.dispatchEvent(new CustomEvent('odyssey:slide',{bubbles:true,detail:{index}}));}
 previous.onclick=()=>go(index-1);next.onclick=()=>go(index+1);
 viewport.addEventListener('keydown',e=>{if(/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;const keys={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:slides.length-1};if(e.key in keys){e.preventDefault();go(keys[e.key]);}});
 viewport.addEventListener('wheel',e=>{
  if(e.ctrlKey||e.metaKey||Math.abs(e.deltaX)+Math.abs(e.deltaY)<2)return;
  // If the panel is taller than the screen, let vertical reading take priority.
  const r=viewport.getBoundingClientRect(),horizontal=Math.abs(e.deltaX)>Math.abs(e.deltaY);
  if(!horizontal&&(r.height>innerHeight-80||r.top<40||r.bottom>innerHeight+10))return;
  const delta=horizontal?e.deltaX:e.deltaY,dir=Math.sign(delta);
  if((dir<0&&index===0)||(dir>0&&index===slides.length-1))return;
  e.preventDefault();const now=performance.now();clearTimeout(resetTimer);resetTimer=setTimeout(()=>accumulated=0,160);
  if(now-lastWheel<650)return;if(Math.sign(accumulated)!==dir)accumulated=0;accumulated+=delta*(e.deltaMode===1?16:1);
  if(Math.abs(accumulated)>45){go(index+Math.sign(accumulated));lastWheel=now;accumulated=0;}
 },{passive:false});
 viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')gestureStart=[e.clientX,e.clientY];},{passive:true});
 viewport.addEventListener('pointerup',e=>{if(!gestureStart)return;const [x,y]=gestureStart;gestureStart=null;const dx=e.clientX-x,dy=e.clientY-y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)go(index-Math.sign(dx));},{passive:true});
 viewport.addEventListener('pointercancel',()=>gestureStart=null,{passive:true});sync();return {go,get index(){return index;},slides};
}
window.OdysseyCarousels={mount};
})();
