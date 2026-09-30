/* Scenario packs for Island Together.
   All maps in this prototype are fictional composites designed to teach systems,
   not representations of a specific community. */
const ISLAND_SCENARIOS = Object.freeze({
  archipelago_logistics: {
    id:'archipelago_logistics',
    name:'Archipelago Logistics',
    shortName:'Archipelago',
    strap:'Three islands · one main port · six seasons',
    topology:'high-island-archipelago',
    summary:'Keep a main island and two outer-island communities connected while climate shocks test freight, local services and preparedness.',
    briefing:'Distance is part of the problem. Materials arrive at one wharf, outer-island projects depend on small-boat freight, and a disrupted route can turn a sensible plan into a late one.',
    landforms:[
      {id:'main',d:'M250 179 C337 118 474 105 641 137 C754 159 826 235 806 317 C786 396 714 446 687 519 C661 590 560 607 465 568 C371 529 317 474 302 401 C289 336 221 276 250 179Z',reef:true},
      {id:'north',d:'M95 115 C145 83 220 90 250 132 C276 169 252 217 211 237 C164 260 101 239 80 201 C62 168 67 134 95 115Z',reef:true},
      {id:'east',d:'M873 421 C929 399 987 420 1007 469 C1026 515 991 561 941 572 C891 582 846 550 842 506 C839 468 848 435 873 421Z',reef:true}
    ],
    features:[
      {kind:'water',d:'M570 200 C546 249 532 298 522 355 C516 394 503 431 469 472'}
    ],
    nodes:[
      {id:'port',island:'main',label:'Main wharf',short:'Wharf',kind:'port',x:43,y:67,stats:['supplies','community'],note:'Most imported materials enter here before moving by road or boat.'},
      {id:'town',island:'main',label:'Town & market',short:'Town',kind:'town',x:52,y:49,stats:['food','community'],note:'The island’s main exchange point for food, services and information.'},
      {id:'clinic',island:'main',label:'Clinic',short:'Clinic',kind:'clinic',x:64,y:43,stats:['water','community'],note:'Health capacity depends on safe water, access and functioning supply routes.'},
      {id:'school',island:'main',label:'School & safe shelter',short:'School',kind:'school',x:68,y:57,stats:['shelter','community'],note:'A shared facility that can support warnings, shelter and community response.'},
      {id:'gardens',island:'main',label:'Gardens',short:'Gardens',kind:'gardens',x:47,y:34,stats:['food','water'],note:'Local food production is exposed to drought, intense rain and saltwater.'},
      {id:'source',island:'main',label:'Freshwater source',short:'Water',kind:'water',x:58,y:24,stats:['water'],note:'Catchment condition and storage shape water security through dry seasons.'},
      {id:'coast',island:'main',label:'Coastal village',short:'Coast',kind:'village',x:31,y:47,stats:['shelter','water','community'],note:'Homes and paths here are especially exposed to coastal flooding and strong wind.'},
      {id:'north',island:'north',label:'North outer island',short:'North island',kind:'outer',x:18,y:24,stats:['food','water','community'],note:'A small settlement reached by boat. Delays quickly affect supplies and services.'},
      {id:'east',island:'east',label:'East outer island',short:'East island',kind:'outer',x:85,y:64,stats:['shelter','water','community'],note:'A second outer-island settlement with its own landing and local food systems.'}
    ],
    links:[
      {a:'port',b:'town',mode:'road'},{a:'town',b:'clinic',mode:'road'},{a:'town',b:'school',mode:'road'},
      {a:'town',b:'gardens',mode:'road'},{a:'gardens',b:'source',mode:'path'},{a:'town',b:'coast',mode:'road'},
      {a:'port',b:'north',mode:'boat'},{a:'port',b:'east',mode:'boat'}
    ],
    projectTargets:{
      tank:['coast','north','east'],repair:['town','coast'],spring:['source'],waterplan:['coast','north','east'],
      beds:['gardens'],seeds:['gardens'],crops:['gardens'],reef:['coast','north','east'],
      roofs:['coast','north','east'],school:['school'],drain:['town','coast'],paths:['clinic','coast'],
      radio:['town','north','east'],training:['town'],plan:['school'],health:['clinic','coast'],
      stock:['north','east','coast','school','port'],wharf:['port'],savings:['town'],aid:['north','east']
    },
    logistics:{hub:'port',remoteZones:['north','east'],baseTravelSeasons:1,disruptionHazards:['shipping','cyclone']},
    hazardTargets:{
      dry:['source','gardens','north','east'],tide:['coast','north','east'],cyclone:['coast','school','north','east','port'],
      shipping:['port','north','east'],rain:['town','coast','gardens'],reefheat:['coast','north','east'],
      fuel:['port','town','north','east'],illness:['clinic','coast','north','east']
    },
    goals:[
      {id:'conditions',kind:'min_condition',target:3,label:'Keep every essential at 3 or more'},
      {id:'outer',kind:'remote_projects',target:2,label:'Complete projects on both outer-island routes'},
      {id:'pressure',kind:'max_stress',target:1,label:'Finish with no place above pressure 1'}
    ]
  },

  atoll_water: {
    id:'atoll_water',
    name:'Atoll Water Security',
    shortName:'Atoll',
    strap:'Four motu · fragile freshwater · six seasons',
    topology:'atoll-chain',
    summary:'A low-lying atoll settlement must protect freshwater, food and services while king tides and dry spells threaten several motu at once.',
    briefing:'There is almost no high ground and little spare land. Freshwater, food gardens and boat access are tightly linked, so water security and coastal exposure dominate the plan.',
    landforms:[
      {id:'west',d:'M170 250 C210 210 285 210 320 250 C340 285 325 330 280 348 C230 365 170 340 150 305 C135 285 145 265 170 250Z',reef:true},
      {id:'north',d:'M425 105 C500 70 585 82 625 125 C646 158 625 194 577 209 C520 228 452 214 416 181 C390 156 396 124 425 105Z',reef:true},
      {id:'east',d:'M760 255 C820 220 905 226 946 272 C972 310 954 356 905 379 C851 404 784 386 749 350 C720 319 730 280 760 255Z',reef:true},
      {id:'south',d:'M430 485 C495 447 592 454 650 503 C687 536 684 583 636 613 C578 650 483 644 423 608 C379 581 382 520 430 485Z',reef:true}
    ],
    features:[],
    nodes:[
      {id:'port',island:'main',label:'South landing',short:'Landing',kind:'port',x:52,y:76,stats:['supplies','community'],note:'Most freight is unloaded here before being redistributed around the atoll.'},
      {id:'town',island:'main',label:'Main village',short:'Village',kind:'town',x:48,y:69,stats:['food','community'],note:'The largest settlement shares limited land between homes, services and food production.'},
      {id:'clinic',island:'main',label:'Island clinic',short:'Clinic',kind:'clinic',x:58,y:68,stats:['water','community'],note:'Health services depend on safe water and reliable inter-motu access.'},
      {id:'school',island:'main',label:'School & evacuation hall',short:'School',kind:'school',x:42,y:63,stats:['shelter','community'],note:'A strong shared building provides shelter, coordination and continuity after storms.'},
      {id:'gardens',island:'west',label:'Food gardens',short:'Gardens',kind:'gardens',x:25,y:42,stats:['food','water'],note:'Food gardens are vulnerable to saltwater intrusion, drought and waterlogging.'},
      {id:'source',island:'north',label:'Freshwater lens',short:'Freshwater',kind:'water',x:50,y:20,stats:['water'],note:'Freshwater is limited and easily stressed by drought, contamination and saltwater intrusion.'},
      {id:'coast',island:'west',label:'Ocean-side homes',short:'Ocean side',kind:'village',x:21,y:47,stats:['shelter','water','community'],note:'Homes on the ocean side face wave overtopping and strong wind.'},
      {id:'north',island:'north',label:'North motu settlement',short:'North motu',kind:'outer',x:57,y:24,stats:['food','water','community'],note:'A small settlement beside the most important freshwater area.'},
      {id:'east',island:'east',label:'East motu settlement',short:'East motu',kind:'outer',x:82,y:45,stats:['shelter','water','community'],note:'A boat-dependent settlement exposed to ocean swell and disrupted access.'}
    ],
    links:[
      {a:'port',b:'town',mode:'path'},{a:'town',b:'clinic',mode:'path'},{a:'town',b:'school',mode:'path'},
      {a:'port',b:'coast',mode:'boat'},{a:'coast',b:'gardens',mode:'path'},{a:'port',b:'north',mode:'boat'},
      {a:'north',b:'source',mode:'path'},{a:'port',b:'east',mode:'boat'}
    ],
    projectTargets:{
      tank:['town','coast','north','east'],repair:['town','coast'],spring:['source'],waterplan:['town','coast','north','east'],
      beds:['gardens'],seeds:['gardens'],crops:['gardens'],reef:['coast','north','east'],
      roofs:['town','coast','north','east'],school:['school'],drain:['town'],paths:['clinic','coast'],
      radio:['town','north','east'],training:['town'],plan:['school'],health:['clinic','coast','north','east'],
      stock:['north','east','coast','school','port'],wharf:['port'],savings:['town'],aid:['north','east','coast']
    },
    logistics:{hub:'port',remoteZones:['coast','north','east'],baseTravelSeasons:1,disruptionHazards:['shipping','cyclone']},
    hazardTargets:{
      dry:['source','gardens','north','east'],tide:['source','coast','gardens','north','east'],
      cyclone:['town','coast','school','north','east','port'],shipping:['port','coast','north','east'],
      rain:['town','gardens','source'],reefheat:['coast','north','east'],fuel:['port','town','north','east'],
      illness:['clinic','town','coast','north','east']
    },
    goals:[
      {id:'water',kind:'condition',key:'water',target:4,label:'Finish with water at 4 or more'},
      {id:'food',kind:'condition',key:'food',target:3,label:'Keep food at 3 or more'},
      {id:'pressure',kind:'max_stress',target:1,label:'Finish with no motu above pressure 1'}
    ]
  }
});
const ACTIVE_SCENARIO_ID='archipelago_logistics';
let selectedScenarioId=ACTIVE_SCENARIO_ID;
let selectedPlayMode='quick';
