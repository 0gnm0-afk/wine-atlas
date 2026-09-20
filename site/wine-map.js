'use strict';

// All geometry, markers and leader lines share Leaflet's geographic projection.
// These hand-generalized swaths illustrate distribution, NOT appellation boundaries.
const WINE_SWATHS = {
  bordeaux: [[45.5,-1.08],[45.4,-.7],[45.05,-.45],[45.02,.05],[44.8,.2],[44.5,-.1],[44.4,-.45],[44.65,-.75],[45,-.85]],
  burgundy: [[47.4,4.8],[47.28,5.1],[46.8,4.9],[46.25,4.8],[46.15,4.6],[46.8,4.65]],
  champagne: [[49.28,3.6],[49.32,4.2],[49,4.3],[48.8,4],[48.95,3.4]],
  loire: [[47.15,-1.6],[47.45,-.6],[47.35,.5],[47.6,1.4],[47.4,2.8],[47.1,2.9],[47.17,1.2],[47.1,.3],[47.2,-.6],[46.98,-1.5]],
  medoc: [[45.5,-1.05],[45.38,-.9],[45.2,-.72],[45.02,-.63],[44.94,-.67],[45.13,-.83],[45.3,-1.04]],
  pauillac: [[45.24,-.78],[45.24,-.74],[45.19,-.72],[45.16,-.73],[45.16,-.79]],
  margaux: [[45.09,-.7],[45.08,-.66],[45.01,-.64],[44.98,-.67],[45.02,-.72]],
  graves: [[44.78,-.67],[44.78,-.55],[44.6,-.38],[44.49,-.28],[44.48,-.42],[44.65,-.57]],
  'pessac-leognan': [[44.83,-.69],[44.83,-.6],[44.75,-.52],[44.68,-.58],[44.71,-.68]],
  sauternes: [[44.57,-.39],[44.57,-.29],[44.51,-.27],[44.5,-.35]],
  pomerol: [[44.957,-.225],[44.955,-.184],[44.926,-.177],[44.917,-.208]],
  'lalande-pomerol': [[44.981,-.24],[44.984,-.195],[44.953,-.177],[44.951,-.225]],
  'saint-emilion': [[44.93,-.17],[44.94,-.08],[44.91,-.03],[44.85,-.08],[44.855,-.18]],
  'napa-valley': [[38.64,-122.62],[38.64,-122.43],[38.42,-122.24],[38.22,-122.2],[38.18,-122.42],[38.44,-122.51]],
  calistoga: [[38.62,-122.61],[38.61,-122.54],[38.56,-122.52],[38.54,-122.56]],
  'diamond-mountain': [[38.57,-122.63],[38.57,-122.59],[38.51,-122.55],[38.51,-122.61]],
  'howell-mountain': [[38.64,-122.46],[38.61,-122.4],[38.55,-122.42],[38.56,-122.49]],
  'saint-helena': [[38.55,-122.52],[38.53,-122.46],[38.47,-122.43],[38.47,-122.48]],
  rutherford: [[38.49,-122.47],[38.48,-122.4],[38.45,-122.39],[38.44,-122.43]],
  oakville: [[38.455,-122.45],[38.455,-122.38],[38.42,-122.36],[38.415,-122.42]],
  yountville: [[38.42,-122.4],[38.425,-122.35],[38.375,-122.32],[38.37,-122.36]],
  'stags-leap-district': [[38.435,-122.335],[38.43,-122.3],[38.385,-122.285],[38.38,-122.32]],
  'oak-knoll': [[38.38,-122.36],[38.375,-122.3],[38.32,-122.27],[38.32,-122.32]],
  coombsville: [[38.32,-122.26],[38.32,-122.21],[38.27,-122.2],[38.265,-122.25]],
  carneros: [[38.28,-122.51],[38.28,-122.39],[38.23,-122.32],[38.19,-122.4],[38.22,-122.5]],
  'cote-dor': [[47.34,4.96],[47.3,5.04],[46.88,4.82],[46.88,4.72],[47.17,4.87]],
  'cote-de-beaune': [[47.1,4.84],[47.1,4.91],[46.9,4.81],[46.9,4.72]],
  sonoma: [[38.85,-123.15],[38.83,-122.8],[38.46,-122.5],[38.2,-122.47],[38.15,-122.75],[38.49,-123.08]],
  mendocino: [[39.75,-123.8],[39.65,-123.15],[39.05,-123],[38.8,-123.45],[39.3,-123.8]],
  'central-coast': [[37.25,-122.35],[37.25,-121.65],[36.4,-120.9],[35.65,-120.35],[34.65,-119.65],[34.45,-120.15],[35.6,-121.05],[36.6,-121.8]],
  'central-valley': [[40,-122.3],[39.5,-121.8],[38,-120.65],[35.3,-118.7],[35.15,-119.2],[37.8,-121.3],[39.5,-122.5]],
  'columbia-valley': [[47.5,-120.5],[47.3,-119],[46.2,-118.4],[45.7,-120.6],[46.3,-120.8]],
  rioja: [[42.65,-3],[42.65,-2.55],[42.35,-1.9],[42.15,-1.9],[42.4,-2.8]],
  'ribera-del-duero': [[41.8,-4.3],[41.85,-3.4],[41.6,-3.3],[41.55,-4.25]],
  mendoza: [[-32.5,-69.3],[-32.6,-68.5],[-33.8,-68.7],[-34,-69.2]],
};

function smoothSwath(vertices) {
  const result = [];
  for (let i=0; i<vertices.length; i++) {
    const p0=vertices[(i+vertices.length-1)%vertices.length], p1=vertices[i], p2=vertices[(i+1)%vertices.length], p3=vertices[(i+2)%vertices.length];
    for (let step=0; step<8; step++) {
      const t=step/8;
      result.push([0,1].map(d => .5*((2*p1[d])+(-p0[d]+p2[d])*t+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*t*t+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*t*t*t)));
    }
  }
  return result;
}

const MAP_VIEWS = {
  west: { title:'미국 서부', scene:'west', bounds:[[33,-125],[48.8,-117]] },
  napa: { title:'나파 밸리', scene:'west', bounds:[[38.18,-122.68],[38.66,-122.15]] },
  sonoma: { title:'소노마', scene:'west', bounds:[[38.13,-123.35],[38.86,-122.4]] },
  europe: { title:'유럽 전체', scene:'europe', bounds:[[36,-6],[50.6,23]] },
  france: { title:'프랑스', scene:'europe', bounds:[[42,-5.3],[50.8,8.3]] },
  bordeaux: { title:'보르도', scene:'europe', bounds:[[44.43,-1.2],[45.53,.18]] },
  burgundy: { title:'부르고뉴', scene:'europe', bounds:[[46.75,4.45],[47.4,5.2]] },
  argentina: { title:'아르헨티나', scene:'other', bounds:[[-36,-72],[-30,-66]] },
  australia: { title:'호주', scene:'other', bounds:[[-39,134],[-31,143]] },
};

class WineMap {
  constructor(nodes, onSelect) {
    this.nodes = nodes;
    this.onSelect = onSelect;
    this.scene = 'europe';
    this.selected = 'bordeaux';
    this.map = L.map('atlas-map', {minZoom:3, maxZoom:15, zoomSnap:.25, scrollWheelZoom:false, zoomControl:false, attributionControl:true});
    this.map.attributionControl.setPrefix(false);
    this.map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>');
    L.control.zoom({position:'bottomright', zoomInTitle:'확대', zoomOutTitle:'축소'}).addTo(this.map);
    L.control.scale({imperial:false, position:'bottomleft'}).addTo(this.map);
    this.map.createPane('areas'); this.map.getPane('areas').style.zIndex = 410;
    this.map.createPane('water'); this.map.getPane('water').style.zIndex = 420;
    L.geoJSON(window.ATLAS_GEOGRAPHY.land, {interactive:false, style:{color:'#b3a589', weight:1, fillColor:'#f5eed9', fillOpacity:1}}).addTo(this.map);
    L.geoJSON(window.ATLAS_GEOGRAPHY.states, {interactive:false, style:{color:'#b9ab92', weight:.8, opacity:.7}}).addTo(this.map);
    L.geoJSON(window.ATLAS_GEOGRAPHY.rivers, {pane:'water', interactive:false, style:{color:'#80afc7', weight:1.4, opacity:.8}}).addTo(this.map);
    this.layers = L.layerGroup().addTo(this.map);
    this.map.on('moveend zoomend', () => this.draw());
    new ResizeObserver(() => {
      this.map.invalidateSize();
      if (this.lastBounds) this.map.fitBounds(this.lastBounds, {padding:[24,30], animate:false});
      this.draw();
    }).observe(document.getElementById('atlas-map'));
    document.getElementById('map-views').addEventListener('click', event => {
      const button = event.target.closest('[data-view]');
      if (button) {
        const key = button.dataset.view;
        this.view(key);
        const region = {napa:'napa-valley',sonoma:'sonoma',bordeaux:'bordeaux',burgundy:'burgundy',argentina:'mendoza',australia:'barossa'}[key];
        if (region) this.onSelect(region);
      }
    });
    document.getElementById('map-reset').addEventListener('click', () => this.view(this.scene === 'other' ? 'argentina' : this.scene));
  }

  color(node) {
    const id = node.region_id, ancestors = node.ancestor_ids || [];
    if (node.color_group) {
      return {
        champagne:'#55b6cb', loire:'#62b78f', graves:'#df995f', bordeaux_right:'#9b81be',
        bordeaux:'#dc7187', burgundy:'#ac79b8', sonoma:'#63ac95', napa:'#bf7794',
        default_0:'#d1a654', default_1:'#79a7bb', default_2:'#a9ac65'
      }[node.color_group];
    }
    if (id === 'champagne') return '#55b6cb';
    if (id === 'loire') return '#62b78f';
    if (['graves','pessac-leognan','sauternes'].includes(id)) return '#df995f';
    if (id === 'bordeaux-right-bank' || ancestors.includes('bordeaux-right-bank')) return '#9b81be';
    if (id === 'bordeaux' || ancestors.includes('bordeaux')) return '#dc7187';
    if (id === 'burgundy' || ancestors.includes('burgundy')) return '#ac79b8';
    if (id === 'sonoma' || ancestors.includes('sonoma')) return '#63ac95';
    if (id === 'napa-valley' || ancestors.includes('napa-valley')) return '#bf7794';
    return ['#d1a654','#79a7bb','#a9ac65'][this.nodes.indexOf(node) % 3];
  }

  level(node) {
    if (Number.isInteger(node.display_level)) return node.display_level;
    const id = node.region_id, parents = node.ancestor_ids || [];
    if (['to-kalon','slv','romanee-conti','echezeaux','montrachet','corton-charlemagne'].includes(id)) return 12;
    if (id === 'cote-dor') return 9;
    if (parents.includes('napa-valley') || parents.includes('cote-dor')) return 10;
    if (parents.includes('bordeaux') || parents.includes('sonoma')) return 8;
    if (['salinas-valley','sacramento-valley','san-joaquin-valley','sonoma-valley','anderson-valley','carneros','rioja-alta','uco-valley','altamira','chablis-grand-cru'].includes(id)) return 7;
    if (['santa-barbara','paso-robles','lodi'].includes(id)) return 6;
    return 0;
  }

  view(key) {
    const view = MAP_VIEWS[key];
    this.scene = view.scene;
    this.viewKey = key;
    document.getElementById('map-views').innerHTML = Object.entries(MAP_VIEWS).filter(([,v]) => v.scene === this.scene).map(([id,v]) => `<button type="button" data-view="${id}" class="${id === key ? 'active' : ''}" aria-pressed="${id === key}">${v.title}</button>`).join('');
    this.lastBounds = view.bounds;
    this.map.fitBounds(view.bounds, {padding:[24,30], animate:false});
    this.draw();
  }

  focus(node) {
    const ancestors = node.ancestor_ids || [], id = node.region_id;
    const group = node.focus_view || ['bordeaux','burgundy','napa-valley','sonoma'].find(key => id === key || ancestors.includes(key));
    if (group) this.view(group === 'napa-valley' ? 'napa' : group);
    else { this.lastBounds = null; this.map.setView([node.map_point.latitude,node.map_point.longitude], Math.max(8,this.level(node)), {animate:false}); }
    if (this.level(node) >= 10) { this.lastBounds = null; this.map.setView([node.map_point.latitude,node.map_point.longitude], this.level(node)+1, {animate:false}); }
    const coord = [node.map_point.latitude,node.map_point.longitude];
    // Outlying subregions (e.g. Chablis) must not inherit a parent inset that excludes them.
    if (!this.map.getBounds().pad(-.15).contains(coord)) {
      this.lastBounds = null;
      this.map.setView(coord, Math.max(9,this.level(node)+1), {animate:false});
    }
  }

  select(node, navigate=true) {
    this.selected = node.region_id;
    const coord = [node.map_point.latitude,node.map_point.longitude];
    if (navigate && (!this.map.getBounds().pad(-.15).contains(coord) || this.map.getZoom() < this.level(node))) this.focus(node);
    this.draw();
  }

  draw() {
    if (!this.map._loaded) return;
    this.layers.clearLayers();
    const zoom = this.map.getZoom(), size = this.map.getSize();
    const eligible = this.nodes.filter(n => sceneOf(n) === this.scene && (this.level(n) <= zoom || n.region_id === this.selected));
    const visible = eligible.filter(n => {
      const p = this.map.latLngToContainerPoint([n.map_point.latitude,n.map_point.longitude]);
      return p.x > 18 && p.x < size.x-18 && p.y > 25 && p.y < size.y-50;
    });
    // Broad parents recede on detailed views; child positions never move to avoid overlaps.
    const broadParents = ['bordeaux','burgundy','napa-valley','sonoma','bordeaux-left-bank','bordeaux-right-bank','cote-dor','central-valley'];
    const shown = visible.filter(n => n.region_id === this.selected || !broadParents.includes(n.region_id) || !visible.some(child => (child.display_parent_ids ?? child.ancestor_ids ?? []).includes(n.region_id)));
    const areaMaxZoom = {'bordeaux':8,'burgundy':9,'napa-valley':10,'sonoma':8,'cote-dor':11,'central-coast':8,'central-valley':8};
    for (const node of eligible) {
      const swath = WINE_SWATHS[node.region_id];
      if (swath && zoom < (areaMaxZoom[node.region_id] || 16)) L.polygon(smoothSwath(swath), {pane:'areas', color:this.color(node), weight:1, fillColor:this.color(node), fillOpacity:.6, interactive:false}).addTo(this.layers);
    }
    const occupied = [];
    const context = zoom < 7
      ? [['프랑스',46.4,2.3],['이탈리아',42.3,12.5],['스페인',40,-4],['태평양',40,-126],['캘리포니아',37.7,-119],['대서양',46,-6]]
      : zoom < 11
        ? [['지롱드 하구',45.3,-.66],['가론강',44.63,-.23],['도르도뉴강',44.88,.12],['대서양',45.05,-1.3],['산 파블로만',38.11,-122.39]] : [];
    for (const [name,lat,lng] of context) {
      const p = this.map.latLngToContainerPoint([lat,lng]);
      if (p.x < 45 || p.x > size.x-55 || p.y < 20 || p.y > size.y-50) continue;
      L.marker([lat,lng],{interactive:false,keyboard:false,icon:L.divIcon({className:'geography-label',iconSize:[100,20],iconAnchor:[50,10],html:esc(name)})}).addTo(this.layers);
      occupied.push({x:p.x-50,y:p.y-10,w:100,h:20});
    }
    shown.sort((a,b) => Number(b.region_id === this.selected)-Number(a.region_id === this.selected));
    for (const node of shown) {
      const coord = [node.map_point.latitude,node.map_point.longitude], p = this.map.latLngToContainerPoint(coord);
      const active = node.region_id === this.selected, color = this.color(node);
      L.circleMarker(coord,{radius:active?7:4.5, color:'#fffdf7', weight:2, fillColor:active?'#243e51':color, fillOpacity:1}).on('click',()=>this.onSelect(node.region_id)).addTo(this.layers);
      const width = Math.min(155, Math.max(83,node.name_ko.length*11+12)), height = 37;
      let box;
      for (const dy of [-20,24,-62,66,-104,108,-146,150]) {
        for (const dx of [18,-width-18]) {
          const x = Math.max(8,Math.min(size.x-width-8,p.x+dx)), y = Math.max(8,Math.min(size.y-height-48,p.y+dy));
          const candidate = {x,y,w:width,h:height};
          if (!occupied.some(b => x < b.x+b.w+5 && x+width+5 > b.x && y < b.y+b.h+5 && y+height+5 > b.y)) {box=candidate;break;}
        }
        if (box) break;
      }
      // At very dense zooms, all points remain; additional names appear on hover.
      if (!box) {
        L.circleMarker(coord,{radius:7,opacity:0,fillOpacity:0}).bindTooltip(node.name_ko).on('click',()=>this.onSelect(node.region_id)).addTo(this.layers);
        continue;
      }
      occupied.push(box);
      const anchor = this.map.containerPointToLatLng([box.x,box.y]);
      const edge = this.map.containerPointToLatLng([Math.max(box.x,Math.min(box.x+box.w,p.x)),box.y+16]);
      L.polyline([coord,edge],{color:'#596773',weight:1,opacity:.7,interactive:false}).addTo(this.layers);
      const icon = L.divIcon({className:'region-callout',iconSize:[box.w,box.h],iconAnchor:[0,0],html:`<button type="button" class="${active?'selected':''}" aria-label="${esc(node.name_ko)} 선택" style="--region-color:${color}"><b>${esc(node.name_ko)}</b><small>${esc(node.canonical_name)}</small></button>`});
      L.marker(anchor,{icon,keyboard:false,zIndexOffset:active?1000:0}).on('click',()=>this.onSelect(node.region_id)).addTo(this.layers);
    }
    document.getElementById('map-caption').textContent = zoom < 7 ? '큰 산지를 선택하고 확대해 보세요.' : zoom < 11 ? '강과 주변 산지를 함께 살펴보세요.' : '세부 산지와 포도밭의 대표 위치입니다.';
    document.getElementById('map-level').textContent = zoom < 7 ? '전체 산지' : zoom < 11 ? '산지 확대' : '세부 산지';
  }
}
