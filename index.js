// index.js
(function() {
  // dscc es el namespace de Community Viz
  const dscc = globalThis.dscc;

  // Nos suscribimos a cambios de datos y de opciones
  dscc.subscribeToData(drawMap, {transform: dscc.identity});
  dscc.onOptionsChanged(drawMap);

  let map, comunaLayer, corregLayer;

  function drawMap(data, options) {
    // Primera vez: inicializar el contenedor
    if (!map) {
      const container = document.createElement('div');
      container.id = 'map';
      container.style.width = '100%';
      container.style.height = '100%';
      document.body.appendChild(container);

      map = L.map('map').setView([3.45, -76.53], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);
    }

    // Eliminar capas anteriores
    if (comunaLayer)     { map.removeLayer(comunaLayer);     comunaLayer = null; }
    if (corregLayer)     { map.removeLayer(corregLayer);     corregLayer = null; }

    // Si el usuario pidió mostrar comunas:
    if (options.showComunas && options.comunasUrl) {
      fetch(options.comunasUrl)
        .then(r => r.json())
        .then(geojson => {
          comunaLayer = L.geoJson(geojson, {
            style: { color: '#2a9df4', weight: 2, fillOpacity: 0.1 },
            onEachFeature: (feature, layer) => {
              // Supongamos propiedad "comuna" coincide con campo de tu fuente
              const key = feature.properties.comuna;
              // Buscamos en los datos la fila donde "Comuna" == key
              const row = data.tables.DEFAULT.find(r => r['Comuna'] === key);
              const val = row ? row['Beneficiarios'] : '–';
              layer.bindPopup(`Comuna ${key}: ${val}`);
            }
          }).addTo(map);
        });
    }

    // Si pidió mostrar corregimientos:
    if (options.showCorregimientos && options.corregimientosUrl) {
      fetch(options.corregimientosUrl)
        .then(r => r.json())
        .then(geojson => {
          corregLayer = L.geoJson(geojson, {
            style: { color: '#f45242', weight: 2, fillOpacity: 0.1 },
            onEachFeature: (feature, layer) => {
              const key = feature.properties.corregimien;
              const row = data.tables.DEFAULT.find(r => r['Corregimiento'] === key);
              const val = row ? row['Beneficiarios'] : '–';
              layer.bindPopup(`Corregimiento ${key}: ${val}`);
            }
          }).addTo(map);
        });
    }
  }
})();
