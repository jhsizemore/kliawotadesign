"""Reproducible, assertion-guarded repair of the checked-in upstream build.
The original Vite authoring project is not present in this repository.
Preserve it, and emit a new complete module graph with one canonical entry URL.
"""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/portvilasandbox/assets'
s = (ASSETS / 'index-DKcirIOB.js').read_text()
def replace(old, new, count=1):
    global s
    assert s.count(old) == count, (old[:100], s.count(old), count)
    s = s.replace(old, new)
replace('window.history.replaceState(null,``,', 'window.history.replaceState(window.history.state,``,', 3)
replace('this.mobile=matchMedia(`(pointer:coarse)`).matches', 'this.mobile=matchMedia(`(pointer:coarse)`).matches||innerWidth<820', 2)
replace('this.mobile?2048:4096', 'this.mobile?1024:2048', 2)
replace('resolutionScale:this.mobile?.3:.7', 'resolutionScale:this.mobile?.2:.5')
start = s.index('function lR(){')
end = s.index('async function uR(', start)
s = s[:start] + 'function lR(){return pvOpenStorage()}' + s[end:]
replace('let e=await fetch(`/portvilasandbox/data/world.json`);if(!e.ok)throw Error(`The packaged map could not be loaded.`);qV=await e.json()', 'qV=await pvLoadMap(`/portvilasandbox/data/world.json`)')
replace('let e=await dR();', 'let e=await pvDeadline(dR(),5000,`Saved proposal could not be opened.`);')
replace('let a=await new MB().loadAsync(`/portvilasandbox/assets/vila-kit.glb`);', 'let a=await pvDeadline(new MB().loadAsync(`/portvilasandbox/assets/vila-kit.glb`),25000,`The architecture kit took too long to load.`);')
replace('this.renderer.setAnimationLoop(()=>{if(document.hidden)', 'pvStartRenderLoop(this,()=>{if(document.hidden)')
replace('this.frames.length>600&&this.frames.shift())}),this.ready=!0', 'this.frames.length>600&&this.frames.shift())},pvGraphicsFailed),this.ready=!0')
# Render failure is recoverable without navigating away from unsaved work.
needle='async function kH(){'
helpers='''function pvGraphicsFailed(){pH(`<h2>The 3D view has paused.</h2><p>Your proposal is still here. Open the lighter plan view to continue, or export your scenario.</p><button id="recover-plan" class="primary">Open the plan view</button><button id="recover-export" class="text-button">Export scenario</button>`);$(`#recover-plan`).onclick=DH;$(`#recover-export`).onclick=()=>$(`#export`).click()}
'''
replace(needle, helpers+needle)
replace('catch(e){console.error(e),$(`#loading`).innerHTML=', 'catch(e){console.error(e);if(qV){AH();fH(`3D is unavailable on this device. The plan view is ready.`);return}$(`#loading`).innerHTML=')
replace('JV?.renderer?.setAnimationLoop(null),KV=new RV', 'JV?.ready&&JV.renderer.setAnimationLoop(null),KV=new RV')
# The plan view also needs the selection/layers API used by hierarchical Back.
replace('KV.onSelect=CH,$(`#loading`)?.remove()', 'KV.onSelect=CH,Object.assign(window,{sandbox:{get selected(){return QV},select:CH,clearSelection(){CH(null)},get layersOpen(){return !!rH?.open},closeLayers(){rH?.toggle(!1)}}}),$(`#loading`)?.remove()')
# One versioned URL per JS module: the entry and lazy imports must share identity.
names={'index-DKcirIOB.js':'index-stability-1.js','research-VKi35trJ.js?v=mobile-onboarding-1':'research-stability-1.js','vision-Cc0nS4P1.js':'vision-stability-1.js'}
for old,new in names.items(): s=s.replace(old,new)
s='import {deadline as pvDeadline,loadMap as pvLoadMap,openStorage as pvOpenStorage,startRenderLoop as pvStartRenderLoop} from "./stability-runtime-1.js";\n'+s
(ASSETS / 'index-stability-1.js').write_text(s)
for old,new in [('research-VKi35trJ.js','research-stability-1.js'),('vision-Cc0nS4P1.js','vision-stability-1.js')]:
    s=(ASSETS/old).read_text().replace('./index-DKcirIOB.js','./index-stability-1.js')
    # Research layer state changes must also preserve the history guard.
    s=s.replace('history.replaceState(null,', 'history.replaceState(history.state,')
    (ASSETS/new).write_text(s)
print('Built canonical stability-1 module graph.')
