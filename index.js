(function() {
  const dscc = self.dscc;
  let map, overlayMaps = {}, loaded = 0, types = ['comuna','barrio','corregimiento','vereda'];
  dscc.subscribeToData(update, {transform: dscc.objectTransform});

  function update(data, config) {
    if (!map) initMap();
    // construye lookup por capa
    const lookup = {};
    types.forEach(t => lookup[t]={});
    data.tables.DEFAULT.forEach(r => {
      types.forEach(t=>{
        let key = r[config['joinKey_'+t]].value;
        let val = +r[config.metric].value;
        if (key && !isNaN(val)) lookup[t][key] = val;
      });
    });
    // escala de color generadora
    function makeScale(vals) {
      if (!vals.length) return ()=>'#ccc';
      let mn = Math.min(...vals), mx = Math.max(...vals),
          cols = ['#FFEDA0','#FED976','#FEB24C','#FD8D3C','#FC4E2A','#E31A1C','#B10026'];
      return v=> v==null?'#ccc': cols[Math.floor((v-mn)/(mx-mn||1)*(cols.length-1))];
    }
    const scales = {};
    types.forEach(t=> scales[t]=makeScale(Object.values(lookup[t])));

    // carga cada GeoJSON
    types.forEach(t=>{
      let url = config['geoJsonUrl_'+t];
      if(!url) return;
      fetch(url).then(r=>r.json()).then(geojson=>{
        let layer = L.geoJSON(geojson, {
          style: f=>{
            let k = f.properties[config['joinKey_'+t]];
            return { fillColor: scales[t](lookup[t][k]), color:'#333', weight:1, fillOpacity:0.7 };
          },
          onEachFeature:(f,l)=>{
            let k = f.properties[config['joinKey_'+t]];
            l.bindPopup(`<b>${t}</b>: ${k}<br><b>${config.metric}</b>: ${lookup[t][k]||'N/A'}`);
          }
        }).addTo(map);
        overlayMaps[t.charAt(0).toUpperCase()+t.slice(1)] = layer;
        loaded++;
        if(loaded===types.length) L.control.layers(null, overlayMaps).addTo(map);
      }).catch(console.error);
    });
  }

  function initMap() {
    const div = document.createElement('div');
    div.id='map'; div.style='width:100%;height:500px';
    document.body.appendChild(div);
    let link = document.createElement('link');
    link.rel='stylesheet'; link.href='https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(link);
    let scr = document.createElement('script');
    scr.src='https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
    document.body.appendChild(scr);
    map = L.map('map').setView([3.44,-76.53],12);
    scr.onload = ()=> L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'© OpenStreetMap'
    }).addTo(map);
  }
})();
