/* Scenario packs for Island Together.
   All maps are fictional composites. Geography is designed to teach spatial
   systems and is not a representation of a specific community. */
const ISLAND_SCENARIOS = Object.freeze({
  archipelago_logistics: {
    id:'archipelago_logistics',
    name:'Archipelago Logistics',
    shortName:'Archipelago',
    strap:'Three islands · one main port · six seasons',
    topology:'high-island-archipelago',
    geographyBasis:'Fictional Melanesian high-island archipelago with volcanic relief, reef shelves and protected anchorages.',
    summary:'Keep a main island and two outer-island communities connected while climate shocks test freight, local services and preparedness.',
    briefing:'Distance is part of the problem. Materials arrive at one sheltered wharf, outer-island projects depend on small-boat freight, and a disrupted route can turn a sensible plan into a late one.',
    landforms:[
      {id:'main',reef:true,surf:true,d:'M350 104 C326 98 300 106 282 126 C267 143 270 171 254 193 C235 216 220 241 226 267 C233 292 227 317 211 344 C196 370 204 398 226 421 C247 442 247 469 259 492 C273 520 302 532 328 550 C354 568 383 574 414 560 C440 548 462 551 480 538 C494 528 501 509 517 500 C532 492 546 503 561 493 C580 480 589 458 601 438 C615 413 607 390 596 369 C585 347 597 329 617 307 C638 285 634 260 616 242 C600 226 598 207 607 183 C616 159 598 140 574 133 C549 126 526 110 500 117 C474 123 449 112 425 107 C399 101 376 111 350 104Z'},
      {id:'north',reef:true,surf:true,d:'M164 78 C143 85 128 104 127 126 C126 151 112 169 104 190 C95 216 102 245 120 264 C139 284 149 308 148 334 C147 360 161 381 181 385 C203 389 219 371 220 347 C221 322 211 302 220 279 C231 252 246 235 247 207 C249 179 236 155 224 133 C211 108 191 85 164 78Z'},
      {id:'east',reef:true,surf:true,d:'M874 425 C902 409 938 410 965 424 C992 438 1007 466 1000 494 C994 520 1005 540 990 559 C971 582 939 590 912 580 C888 571 868 553 851 533 C834 513 837 486 846 463 C853 445 859 434 874 425Z'},
      {id:'main-islet',reef:true,d:'M281 476 C290 468 305 468 314 478 C320 488 316 502 304 507 C292 512 278 504 276 492 C275 485 277 480 281 476Z'}
    ],
    features:[
      {kind:'highland',d:'M336 145 C368 124 409 127 441 143 C468 157 487 181 493 210 C499 238 487 263 474 285 C458 312 459 340 473 367 C489 398 483 432 462 455 C441 477 406 487 375 474 C347 462 327 440 318 411 C309 382 317 353 307 327 C298 303 279 283 281 256 C283 229 300 209 307 185 C313 166 321 154 336 145Z'},
      {kind:'ridge',d:'M369 145 C393 187 398 230 388 271 C378 314 389 354 407 389 C421 417 420 448 402 473'},
      {kind:'ridge',d:'M435 167 C447 203 440 238 424 270 C409 301 408 331 421 358'},
      {kind:'river',d:'M392 222 C365 255 345 289 329 327 C314 364 294 392 263 414'},
      {kind:'river',d:'M429 246 C451 276 468 307 476 342 C486 386 506 418 540 446'},
      {kind:'harbour',d:'M470 535 C488 520 501 503 517 500 C532 492 546 503 561 493 C556 517 538 535 512 544 C495 550 481 546 470 535Z'},
      {kind:'mangrove',d:'M244 430 C262 448 269 472 259 492 C273 520 302 532 328 550'},
      {kind:'garden',d:'M335 286 C357 271 386 270 405 282 C416 293 411 315 395 329 C376 346 348 342 333 326 C322 314 323 296 335 286Z'},
      {kind:'settlement',d:'M444 400 C462 389 488 389 505 403 C520 416 518 436 502 448 C483 462 456 457 442 442 C431 430 431 410 444 400Z'},
      {kind:'beach',d:'M598 369 C607 390 615 413 601 438'},
      {kind:'reef-pass',d:'M530 513 C547 507 560 495 574 479'}
    ],
    nodes:[
      {id:'port',island:'main',label:'Main wharf',short:'Wharf',kind:'port',x:49,y:72,stats:['supplies','community'],note:'Most imported materials enter through a protected southern anchorage before moving by road or boat.'},
      {id:'town',island:'main',label:'Town & market',short:'Town',kind:'town',x:46,y:59,stats:['food','community'],note:'The island’s main exchange point sits on a lower coastal terrace connected to the wharf.'},
      {id:'clinic',island:'main',label:'Clinic',short:'Clinic',kind:'clinic',x:54,y:55,stats:['water','community'],note:'Health capacity depends on safe water, access and functioning supply routes.'},
      {id:'school',island:'main',label:'School & safe shelter',short:'School',kind:'school',x:54,y:66,stats:['shelter','community'],note:'A shared facility above the harbour supports warnings, shelter and community response.'},
      {id:'gardens',island:'main',label:'Gardens',short:'Gardens',kind:'gardens',x:35,y:43,stats:['food','water'],note:'Gardens occupy flatter volcanic soils below the central ridge.'},
      {id:'source',island:'main',label:'Freshwater source',short:'Water',kind:'water',x:39,y:29,stats:['water'],note:'Catchment condition and storage shape water security through dry seasons.'},
      {id:'coast',island:'main',label:'Exposed coastal village',short:'Coast',kind:'village',x:25,y:58,stats:['shelter','water','community'],note:'Homes on the windward coast are farther from the port and more exposed to coastal flooding and strong wind.'},
      {id:'north',island:'north',label:'North outer island',short:'North island',kind:'outer',x:16,y:31,stats:['food','water','community'],note:'A narrow high island reached by small boat; weather can quickly isolate it.'},
      {id:'east',island:'east',label:'East outer island',short:'East island',kind:'outer',x:87,y:68,stats:['shelter','water','community'],note:'A smaller reef-fringed island with a single practical landing.'}
    ],
    links:[
      {a:'port',b:'town',mode:'road',d:'M529 518 C514 482 501 449 497 425'},
      {a:'town',b:'clinic',mode:'road',d:'M497 425 C526 415 553 405 583 396'},
      {a:'town',b:'school',mode:'road',d:'M497 425 C518 448 548 466 583 475'},
      {a:'town',b:'gardens',mode:'road',d:'M497 425 C455 394 420 354 378 310'},
      {a:'gardens',b:'source',mode:'path',d:'M378 310 C392 275 408 242 421 209'},
      {a:'town',b:'coast',mode:'road',d:'M497 425 C425 431 355 429 270 418'},
      {a:'port',b:'north',mode:'boat',d:'M529 518 C433 452 348 356 273 286 C237 252 207 231 173 223'},
      {a:'port',b:'east',mode:'boat',d:'M529 518 C650 553 782 544 940 490'}
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
    strap:'A ring of motu · fragile freshwater · six seasons',
    topology:'atoll-chain',
    geographyBasis:'Fictional central-Pacific atoll with a broad lagoon, narrow motu, reef passes and almost no high ground.',
    summary:'A low-lying atoll settlement must protect freshwater, food and services while king tides and dry spells threaten several motu at once.',
    briefing:'There is almost no high ground and little spare land. Freshwater, food gardens and boat access are tightly linked, so water security and coastal exposure dominate the plan.',
    landforms:[
      {id:'nw-1',reef:false,d:'M155 188 C177 171 208 163 235 166 C249 169 257 179 251 189 C238 207 207 216 179 213 C160 211 147 201 155 188Z'},
      {id:'north-1',reef:false,d:'M284 132 C321 116 365 108 402 112 C419 114 427 124 418 135 C398 152 359 161 320 157 C294 154 276 145 284 132Z'},
      {id:'north-2',reef:false,d:'M450 103 C487 94 534 94 571 101 C591 105 599 115 586 126 C565 140 522 143 483 136 C456 132 440 118 450 103Z'},
      {id:'ne-1',reef:false,d:'M631 121 C669 126 713 140 741 159 C755 169 753 181 737 188 C708 197 666 184 637 166 C616 153 609 130 631 121Z'},
      {id:'ne-2',reef:false,d:'M790 190 C820 205 847 230 861 255 C869 269 862 282 847 282 C820 279 794 256 779 230 C767 209 772 190 790 190Z'},
      {id:'east-1',reef:false,d:'M882 300 C899 325 905 356 900 386 C896 403 884 410 872 397 C858 379 855 347 860 320 C864 299 873 287 882 300Z'},
      {id:'east-2',reef:false,d:'M876 433 C886 455 883 485 870 508 C861 523 848 524 839 510 C829 491 835 461 847 441 C857 424 870 418 876 433Z'},
      {id:'se-1',reef:false,d:'M798 548 C768 571 729 587 695 592 C677 594 666 584 674 571 C689 550 726 533 760 528 C783 525 809 534 798 548Z'},
      {id:'south-1',reef:false,d:'M625 611 C583 625 534 630 493 625 C471 622 464 610 478 598 C505 582 548 577 590 583 C619 587 643 601 625 611Z'},
      {id:'sw-1',reef:false,d:'M427 596 C387 596 345 588 314 574 C297 566 295 554 310 546 C339 534 382 539 416 551 C440 560 452 590 427 596Z'},
      {id:'west-2',reef:false,d:'M246 535 C220 523 197 503 184 483 C176 470 182 458 196 458 C220 461 246 481 260 503 C270 519 264 535 246 535Z'},
      {id:'west-1',reef:false,d:'M132 423 C119 399 115 367 120 338 C123 321 135 315 147 328 C160 348 162 378 157 405 C153 424 141 438 132 423Z'},
      {id:'west-north',reef:false,d:'M126 282 C131 254 145 226 164 207 C176 195 189 198 191 213 C191 238 175 265 156 285 C143 298 124 301 126 282Z'}
    ],
    features:[
      {kind:'reef-flat',d:'M105 170 C219 91 390 55 554 67 C731 79 868 146 935 257 C990 350 966 465 882 544 C789 632 632 667 466 657 C299 648 165 596 93 501 C28 416 34 280 105 170Z'},
      {kind:'lagoon',d:'M205 205 C304 148 431 126 556 137 C687 149 785 197 834 273 C875 338 858 421 797 479 C727 546 614 572 493 566 C369 560 271 522 218 456 C170 396 163 278 205 205Z'},
      {kind:'reef-pass',d:'M152 285 C178 305 197 319 221 336'},
      {kind:'reef-pass',d:'M845 282 C817 299 799 316 785 337'},
      {kind:'reef-pass',d:'M673 571 C650 548 632 529 610 510'},
      {kind:'garden',d:'M173 458 C196 461 220 480 235 501 C225 509 210 510 197 503 C184 496 176 483 173 458Z'},
      {kind:'settlement',d:'M316 574 C348 588 389 596 427 596 C410 610 378 614 347 606 C329 601 317 591 316 574Z'},
      {kind:'settlement',d:'M631 121 C661 126 697 138 724 153 C705 165 675 164 650 154 C636 148 628 137 631 121Z'}
    ],
    nodes:[
      {id:'port',island:'main',label:'South lagoon landing',short:'Landing',kind:'port',x:52,y:84,stats:['supplies','community'],note:'Most freight is unloaded on the lagoon side of the largest southern motu.'},
      {id:'town',island:'main',label:'Main village',short:'Village',kind:'town',x:38,y:81,stats:['food','community'],note:'The largest settlement occupies a narrow strip between lagoon and ocean.'},
      {id:'clinic',island:'main',label:'Island clinic',short:'Clinic',kind:'clinic',x:45,y:80,stats:['water','community'],note:'Health services depend on safe water and reliable lagoon transport.'},
      {id:'school',island:'main',label:'School & evacuation hall',short:'School',kind:'school',x:32,y:78,stats:['shelter','community'],note:'A strong shared building provides shelter, coordination and continuity after storms.'},
      {id:'gardens',island:'west',label:'Food gardens',short:'Gardens',kind:'gardens',x:20,y:69,stats:['food','water'],note:'Food gardens occupy scarce soil on a broader western motu and are vulnerable to saltwater and drought.'},
      {id:'source',island:'north',label:'Freshwater lens',short:'Freshwater',kind:'water',x:49,y:17,stats:['water'],note:'The most dependable freshwater lens sits beneath the broader northern motu.'},
      {id:'coast',island:'west',label:'Ocean-side homes',short:'Ocean side',kind:'village',x:12,y:52,stats:['shelter','water','community'],note:'Homes on the ocean edge face wave overtopping and strong wind.'},
      {id:'north',island:'north',label:'North motu settlement',short:'North motu',kind:'outer',x:64,y:22,stats:['food','water','community'],note:'A small settlement linked by lagoon boat and narrow reef passages.'},
      {id:'east',island:'east',label:'East motu settlement',short:'East motu',kind:'outer',x:82,y:49,stats:['shelter','water','community'],note:'A lagoon-facing settlement with no road connection to the main village.'}
    ],
    links:[
      {a:'port',b:'town',mode:'path',d:'M562 605 C520 602 466 590 410 583'},
      {a:'town',b:'clinic',mode:'path',d:'M410 583 C438 578 464 576 486 576'},
      {a:'town',b:'school',mode:'path',d:'M410 583 C385 576 365 568 346 562'},
      {a:'port',b:'coast',mode:'boat',d:'M562 605 C430 545 300 459 130 374'},
      {a:'coast',b:'gardens',mode:'path',d:'M130 374 C154 420 181 459 216 497'},
      {a:'port',b:'north',mode:'boat',d:'M562 605 C615 484 663 351 691 158'},
      {a:'north',b:'source',mode:'boat',d:'M691 158 C637 135 584 126 529 122'},
      {a:'port',b:'east',mode:'boat',d:'M562 605 C684 555 788 474 886 353'}
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
  },

  relocation_pathways:{
    id:'relocation_pathways',
    name:'Relocation Pathways',
    shortName:'Relocation',
    strap:'One exposed community · two receiving sites · six seasons',
    topology:'climate-relocation',
    geographyBasis:'Fictional low coral home island paired with a larger rugged volcanic receiving island.',
    summary:'Prepare a safe receiving site while an exposed low-island community faces repeated climate pressure and difficult timing decisions.',
    briefing:'Relocation is not only an engineering problem. The game asks what enabling investments must exist before a move, while keeping community choice, livelihoods and cultural continuity visible as things a technical model cannot decide.',
    landforms:[
      {id:'source-main',reef:true,surf:true,d:'M88 314 C111 292 145 281 178 283 C207 284 235 296 251 315 C264 331 260 349 244 362 C226 377 201 382 177 379 C150 376 126 383 106 373 C87 364 75 347 77 332 C78 325 82 319 88 314Z'},
      {id:'source-motu',reef:true,d:'M132 268 C146 257 166 254 181 261 C192 266 194 278 185 286 C174 296 154 298 140 290 C130 284 125 275 132 268Z'},
      {id:'host',reef:true,surf:true,d:'M421 111 C454 95 493 98 522 112 C550 125 576 118 604 122 C638 127 657 146 674 169 C692 193 720 205 748 217 C776 230 795 253 796 280 C797 306 784 329 795 352 C808 379 838 395 855 420 C873 445 868 474 850 496 C832 519 807 532 788 554 C768 578 738 593 704 594 C668 596 642 581 612 580 C580 579 557 598 523 594 C493 591 470 572 449 552 C429 533 400 524 388 499 C377 476 387 452 379 431 C367 400 339 379 340 345 C341 315 363 291 365 264 C367 235 348 211 357 181 C365 153 390 126 421 111Z'},
      {id:'host-islet',reef:true,d:'M889 471 C904 459 924 459 938 470 C950 480 948 495 936 504 C921 516 899 510 888 497 C881 488 881 478 889 471Z'}
    ],
    features:[
      {kind:'highland',d:'M463 141 C500 128 546 133 578 151 C609 169 626 195 638 224 C651 255 649 286 658 315 C669 350 695 381 696 419 C698 455 679 488 648 508 C617 528 579 535 546 522 C512 509 490 482 473 451 C456 419 445 392 426 364 C406 335 392 304 397 270 C401 236 420 209 431 177 C438 158 447 147 463 141Z'},
      {kind:'ridge',d:'M502 143 C520 180 527 219 520 258 C513 297 523 337 544 373 C566 411 571 455 551 502'},
      {kind:'ridge',d:'M595 169 C600 211 589 247 570 282 C551 316 552 355 568 389'},
      {kind:'river',d:'M527 232 C493 272 474 313 465 355 C457 392 432 422 398 447'},
      {kind:'river',d:'M578 263 C606 293 623 329 626 369 C630 416 654 454 691 484'},
      {kind:'harbour',d:'M449 552 C470 572 493 591 523 594 C557 598 580 579 612 580 C594 604 556 617 515 612 C482 608 457 587 449 552Z'},
      {kind:'mangrove',d:'M765 554 C738 593 704 594 668 596'},
      {kind:'garden',d:'M589 255 C615 244 642 251 656 270 C667 285 658 305 641 317 C620 332 590 326 575 307 C562 291 568 267 589 255Z'},
      {kind:'settlement',d:'M645 420 C666 406 696 407 717 421 C734 433 734 452 716 465 C695 480 662 476 645 459 C633 448 632 430 645 420Z'},
      {kind:'beach',d:'M795 352 C808 379 838 395 855 420'},
      {kind:'reef-pass',d:'M501 602 C522 593 543 588 565 586'}
    ],
    nodes:[
      {id:'port',island:'main',label:'Host island landing',short:'Landing',kind:'port',x:50,y:82,stats:['supplies','community'],note:'People, materials and services arrive through a protected southern landing.'},
      {id:'town',island:'main',label:'Host community',short:'Host village',kind:'town',x:63,y:62,stats:['food','community'],note:'The receiving community occupies a coastal terrace with its own priorities, services and land constraints.'},
      {id:'clinic',island:'main',label:'Host clinic',short:'Clinic',kind:'clinic',x:70,y:58,stats:['water','community'],note:'Health services must support both existing residents and any arriving households.'},
      {id:'school',island:'main',label:'School & shared hall',short:'School',kind:'school',x:68,y:71,stats:['shelter','community'],note:'A shared facility can support shelter and community continuity during transition.'},
      {id:'gardens',island:'main',label:'Host food gardens',short:'Gardens',kind:'gardens',x:58,y:42,stats:['food','water'],note:'Gardens sit on a productive interior bench below the central ridge.'},
      {id:'source',island:'main',label:'Host freshwater source',short:'Water',kind:'water',x:49,y:29,stats:['water'],note:'Any receiving site needs dependable water without undermining existing users.'},
      {id:'coast',island:'source',label:'Low-island home community',short:'Home island',kind:'outer',x:16,y:48,stats:['shelter','water','community'],note:'A fictional low coral community facing repeated coastal pressure. Relocation remains a community decision, not an automatic hazard response.'},
      {id:'north',island:'main',label:'Ridge receiving site',short:'Ridge site',kind:'site',x:48,y:48,stats:['water','shelter','community'],note:'Higher ground above the host village with road access, but services and housing still need investment.'},
      {id:'east',island:'main',label:'Coastal receiving site',short:'Coastal site',kind:'site',x:77,y:53,stats:['water','shelter','community'],note:'Closer to livelihoods and the host village, but lower and more exposed to coastal hazards.'}
    ],
    links:[
      {a:'coast',b:'port',mode:'boat',d:'M173 346 C287 414 390 494 540 590'},
      {a:'port',b:'town',mode:'road',d:'M540 590 C583 542 625 492 680 446'},
      {a:'town',b:'clinic',mode:'road',d:'M680 446 C709 433 734 422 756 418'},
      {a:'town',b:'school',mode:'road',d:'M680 446 C699 471 718 489 734 511'},
      {a:'town',b:'gardens',mode:'road',d:'M680 446 C651 402 632 349 626 302'},
      {a:'gardens',b:'source',mode:'path',d:'M626 302 C592 266 558 236 529 209'},
      {a:'town',b:'north',mode:'road',d:'M680 446 C625 424 571 390 518 346'},
      {a:'town',b:'east',mode:'road',d:'M680 446 C733 432 783 416 832 382'}
    ],
    projectTargets:{
      tank:['coast','north','east'],repair:['town','coast','north','east'],spring:['source'],waterplan:['coast','north','east'],
      beds:['gardens'],seeds:['gardens'],crops:['gardens'],reef:['coast','east'],
      roofs:['coast','north','east'],school:['school'],drain:['town','east'],paths:['clinic','north','east','coast'],
      radio:['town','coast','north','east'],training:['town','north','east'],plan:['school','north','east'],health:['clinic','coast','north','east'],
      stock:['coast','north','east','school','port'],wharf:['port'],savings:['town'],aid:['coast','north','east']
    },
    logistics:{hub:'port',remoteZones:['coast'],baseTravelSeasons:1,disruptionHazards:['shipping','cyclone']},
    hazardTargets:{
      dry:['source','gardens','coast','north','east'],tide:['coast','east'],cyclone:['coast','school','port','east'],
      shipping:['port','coast'],rain:['town','gardens','east'],reefheat:['coast','east'],fuel:['port','town','coast'],illness:['clinic','coast','north','east']
    },
    special:{kind:'relocation',sourceZone:'coast',candidates:['north','east'],households:3,baseline:{north:['access'],east:['access']}},
    goals:[
      {id:'planned',kind:'relocation_planned',target:3,label:'Move 3 households through a prepared pathway'},
      {id:'community',kind:'condition',key:'community',target:3,label:'Keep community capacity at 3 or more'},
      {id:'pressure',kind:'max_stress',target:1,label:'Finish with no place above pressure 1'}
    ]
  }
});
const ACTIVE_SCENARIO_ID='archipelago_logistics';
let selectedScenarioId=ACTIVE_SCENARIO_ID;
let selectedPlayMode='quick';
