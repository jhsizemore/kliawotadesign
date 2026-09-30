const CACHE='island-together-v10-pacific';
const CORE=[
  "/climate-game/",
  "/climate-game/index.html",
  "/climate-game/style.css",
  "/climate-game/enhanced.css",
  "/climate-game/app.css",
  "/climate-game/world.css",
  "/climate-game/logistics.css",
  "/climate-game/scenarios.js",
  "/climate-game/game.js",
  "/climate-game/logistics.js",
  "/climate-game/world.js",
  "/climate-game/icons.svg",
  "/climate-game/app-icon.svg",
  "/climate-game/photos/santo-beach.jpg",
  "/climate-game/photos/cargo-vanuatu.jpg",
  "/climate-game/photos/coral-bleaching-samoa.jpg",
  "/climate-game/photos/cyclone-satellite.jpg",
  "/climate-game/photos/drought-tuvalu.jpg",
  "/climate-game/photos/food-market.jpg",
  "/climate-game/photos/fuel-vanuatu.jpg",
  "/climate-game/photos/high-tide-takuu.jpg",
  "/climate-game/photos/reef-monitoring-samoa.jpg",
  "/climate-game/photos/roof-repair.jpg",
  "/climate-game/photos/village-clinic-png.jpg",
  "/climate-game/photos/water-tank.jpg",
  "/climate-game/photos/wharf-fiji.jpg",
  "/pacific-game/",
  "/pacific-game/index.html",
  "/pacific-game/manifest.webmanifest"
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('island-together-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res}).catch(()=>caches.match(req).then(hit=>hit||caches.match('/pacific-game/index.html'))));return;}event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>hit)))});