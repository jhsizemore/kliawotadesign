/* Build-time helper. The adapter is supplied by the existing renderer; no second
 * Three.js instance, image textures, network requests or scene globals are added. */
function pvRefineFacade(group, feature, profile, baseY, material, api) {
  const record = PV_STOREFRONT_EVIDENCE.buildings[feature.sourceId];
  if (!record || profile.levels === 0 || profile.levels !== record.observedLevels ||
      JSON.stringify(feature.footprint) !== JSON.stringify(record.footprint)) return group;
  const edges = api.edges(feature.footprint);
  const floors = api.floors(profile);
  const colour = value => parseInt(value.slice(1), 16);
  const wall = material('photo-wall-' + feature.sourceId, colour(record.palette.wall), .88);
  const trim = material('photo-trim-' + feature.sourceId, colour(record.palette.trim), .84);
  const glass = material('photo-glass-' + feature.sourceId, colour(record.palette.glass), .3, .12);
  const roof = material('photo-roof-' + feature.sourceId, colour(record.palette.roof), .9);
  const observedEdges = record.faces.map(face => edges[face.edge]);
  const toRemove = [];
  group.traverse(mesh => {
    if (!mesh.isMesh) return;
    if (/^storey-shell-/.test(mesh.name)) mesh.material = wall;
    if (/^floor-slab-/.test(mesh.name)) mesh.material = trim;
    if (mesh.name === 'roof-parapet') mesh.material = roof;
    const observed = observedEdges.some(edge => edge &&
      api.distanceToEdge([mesh.position.x, mesh.position.z], edge.a, edge.c) < 1.3 &&
      Math.abs(Math.sin(mesh.rotation.y - edge.yaw)) < .015);
    if (!observed) return;
    const isWindow = /^window-/.test(mesh.name);
    const isBand = ['aggregate-spandrel', 'sunshade'].includes(mesh.name);
    const isCanopy = mesh.name === 'ground-canopy';
    const localY = mesh.position.y - baseY;
    const floor = mesh.parent?.userData?.floor ?? floors.findIndex(level =>
      localY > level.bottom + .05 && localY < level.top - .05);
    if (record.kind === 'paired-window-wall' && (isWindow || isBand || isCanopy) ||
        record.kind === 'ribbon-windows' && isWindow && floor > 0) toRemove.push(mesh);
  });
  for (const mesh of toRemove) { mesh.removeFromParent(); mesh.geometry.dispose(); }
  const detail = new api.Group(); detail.name = 'photo-matched-facade';
  detail.userData = {reference: PV_STOREFRONT_EVIDENCE.reference.url, page: 22,
    captureDate: '2025; exact date unverified', interpretation: true};
  group.add(detail);
  const box = (edge, u, y, width, height, depth, mat, name, outward = .07) => {
    const mesh = new api.Mesh(new api.BoxGeometry(width, height, depth), mat);
    mesh.name = name;
    mesh.position.set(edge.a[0] + edge.dx*u + edge.nx*outward, baseY+y,
      edge.a[1] + edge.dz*u + edge.nz*outward);
    mesh.rotation.y = edge.yaw; detail.add(mesh); return mesh;
  };
  for (const face of record.faces) {
    const edge = edges[face.edge];
    if (!edge) continue;
    for (let floor = 1; floor < floors.length; floor++) {
      const level = floors[floor];
      const y = (level.bottom + level.top)/2;
      if (record.kind === 'paired-window-wall') {
        face.centres.forEach((u, column) => {
          const height = floor === 3 && u === face.tallWindowCentre ? .78 : .44;
          const width = floor === 3 && u === face.tallWindowCentre ? 1.55 : 1.45;
          box(edge,u,y,width,height,.08,glass,'paired-window-'+floor+'-'+column);
          box(edge,u,y,.075,height,.04,wall,'paired-window-divider',.13);
        });
      } else {
        const width = edge.length * face.widthRatio;
        box(edge,.5,y,width,1.05,.08,glass,'ribbon-window-'+floor);
        const panes = Math.max(2, Math.round(width/1.35));
        for (let pane = 1; pane < panes; pane++) {
          const u = (1-face.widthRatio)/2 + face.widthRatio*pane/panes;
          box(edge,u,y,.06,1.05,.035,trim,'ribbon-mullion',.125);
        }
        box(edge,.5,y-.58,width+.12,.1,.13,trim,'ribbon-sill',.09);
      }
    }
    if (record.kind === 'paired-window-wall') {
      const width=2.15, height=2.55, radius=width/2;
      const shape=new api.Shape(); shape.moveTo(-width/2,0);
      shape.lineTo(-width/2,height-radius);
      shape.absarc(0,height-radius,radius,Math.PI,0,true);
      shape.lineTo(width/2,0); shape.closePath();
      const geom=new api.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false,steps:1,curveSegments:8});
      const door=new api.Mesh(geom,material('photo-arched-opening',0x55404a,.9));
      door.name='observed-arched-opening';
      door.position.set(edge.a[0]+edge.dx*face.entranceCentre+edge.nx*.08,baseY+.03,
        edge.a[1]+edge.dz*face.entranceCentre+edge.nz*.08);
      door.rotation.y=edge.yaw; detail.add(door);
    }
  }
  return group;
}
