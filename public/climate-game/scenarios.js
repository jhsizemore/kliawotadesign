/* Spatial scenario data for Island Together.
   The first vertical slice is deliberately fictional. Geography is a game model,
   not a claim about any specific Pacific community. */
const ISLAND_SCENARIOS = Object.freeze({
  archipelago_logistics: {
    id: 'archipelago_logistics',
    name: 'Archipelago Logistics',
    strap: 'Three islands · one main port · six seasons',
    topology: 'high-island-archipelago',
    summary: 'A fictional Pacific archipelago where freight, local services and preparedness are connected by roads and small-boat routes.',
    nodes: [
      {id:'port',label:'Main wharf',short:'Wharf',kind:'port',x:43,y:67,stats:['supplies','community'],note:'Most imported materials enter here before moving by road or boat.'},
      {id:'town',label:'Town & market',short:'Town',kind:'town',x:52,y:49,stats:['food','community'],note:'The island’s main exchange point for food, services and information.'},
      {id:'clinic',label:'Clinic',short:'Clinic',kind:'clinic',x:64,y:43,stats:['water','community'],note:'Health capacity depends on safe water, access and functioning supply routes.'},
      {id:'school',label:'School & safe shelter',short:'School',kind:'school',x:68,y:57,stats:['shelter','community'],note:'A shared facility that can support warnings, shelter and community response.'},
      {id:'gardens',label:'Gardens',short:'Gardens',kind:'gardens',x:47,y:34,stats:['food','water'],note:'Local food production is exposed to drought, intense rain and saltwater.'},
      {id:'source',label:'Freshwater source',short:'Water',kind:'water',x:58,y:24,stats:['water'],note:'Catchment condition and storage shape water security through dry seasons.'},
      {id:'coast',label:'Coastal village',short:'Coast',kind:'village',x:31,y:47,stats:['shelter','water','community'],note:'Homes and paths here are especially exposed to coastal flooding and strong wind.'},
      {id:'north',label:'North outer island',short:'North island',kind:'outer',x:18,y:24,stats:['food','water','community'],note:'A small settlement reached by boat. Delays quickly affect supplies and services.'},
      {id:'east',label:'East outer island',short:'East island',kind:'outer',x:85,y:64,stats:['shelter','water','community'],note:'A second outer-island settlement with its own landing and local food systems.'}
    ],
    links: [
      {a:'port',b:'town',mode:'road'},
      {a:'town',b:'clinic',mode:'road'},
      {a:'town',b:'school',mode:'road'},
      {a:'town',b:'gardens',mode:'road'},
      {a:'gardens',b:'source',mode:'path'},
      {a:'town',b:'coast',mode:'road'},
      {a:'port',b:'north',mode:'boat'},
      {a:'port',b:'east',mode:'boat'}
    ],
    projectTargets: {
      tank:['coast','north','east'], repair:['town','coast'], spring:['source'], waterplan:['coast','north','east'],
      beds:['gardens'], seeds:['gardens'], crops:['gardens'], reef:['coast','north','east'],
      roofs:['coast','north','east'], school:['school'], drain:['town','coast'], paths:['clinic','coast'],
      radio:['town','north','east'], training:['town'], plan:['school'], health:['clinic','coast'],
      stock:['port'], wharf:['port'], savings:['town'], aid:['north','east']
    },
    hazardTargets: {
      dry:['source','gardens','north','east'],
      tide:['coast','north','east'],
      cyclone:['coast','school','north','east','port'],
      shipping:['port','north','east'],
      rain:['town','coast','gardens'],
      reefheat:['coast','north','east'],
      fuel:['port','town','north','east'],
      illness:['clinic','coast','north','east']
    }
  }
});
const ACTIVE_SCENARIO_ID = 'archipelago_logistics';
