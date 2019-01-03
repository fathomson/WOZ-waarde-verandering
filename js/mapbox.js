// mapbox init
mapboxgl.accessToken = 'pk.eyJ1IjoiZmF0aG9tc29uIiwiYSI6ImNqbnBzMGxvcDA4dHQzbGxrazZoMnY4a28ifQ.uH6tllpY9iBEowQOKaQWgA';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/fathomson/cjqdphovkfsb42sn110ofe9fa',
  center: [6.6, 53.2],
  zoom: 13.0
});

function propertyValue(p) {
  return p ? " - " + p : "";
}

function showOne(p1,p2){
  return p2 ? propertyValue(p2) : propertyValue(p1) ;
}

function formatPrice(p){ //€
  return  "€" + Math.round(p).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")
}

function formatPct(p){
  return (p*100).toFixed(2) + "%";
}

map.on('load', function() {
  // modifu cursor and zoom to NL
  map.getCanvas().style.cursor = 'default';
  map.fitBounds([
    [4.7, 50.8],
    [6.3, 53.7]
  ]);

  // define layer names
  var layers = ['20%+', '10%', '5%', '0%', '-5%+'];
  var colors = ['#BD362F', '#F89406', '#51A351', '#0088CC', '#0044CC'];

  // create legend
  for (i = 0; i < layers.length; i++) {
    var layer = layers[i];
    var color = colors[i];
    var item = document.createElement('div');
    var key = document.createElement('span');
    key.className = 'legend-key';
    key.style.backgroundColor = color;

    var value = document.createElement('span');
    value.innerHTML = layer;
    item.appendChild(key);
    item.appendChild(value);
    legend.appendChild(item);
  }


  var fillColor = {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'verandering'],
      -0.05, '#0044CC',
      0, '#0088CC',
      0.05, '#51A351',
      0.1, '#F89406',
      0.20, '#BD362F'
    ],
    'fill-opacity': 0.4
  }

  var layers = [];
  layers.push({
    'name': 'Provincie-sim',
    'minzoom': 0,
    'maxzoom': 9
  });
  layers.push({
    'name': 'Gemeente',
    'minzoom': 9,
    'maxzoom': 10
  });
  layers.push({
    'name': 'Plaats',
    'minzoom': 10,
    'maxzoom': 11
  });
  layers.push({
    'name': 'Wijk',
    'minzoom': 11,
    'maxzoom': 13
  });
  layers.push({
    'name': 'Postcode_4',
    'minzoom': 13,
    'maxzoom': 15
  });
  layers.push({
    'name': 'Postcode_6',
    'minzoom': 15,
    'maxzoom': 23
  });

  for (var layer of layers) {
    map.addSource(layer.name, {
      'type': 'vector',
      'url': 'mapbox://fathomson.' + layer.name
    });

    map.addLayer({
      'id': 'wozw-' + layer.name,
      'source': layer.name,
      'source-layer': layer.name,
      'minzoom': layer.minzoom,
      'maxzoom': layer.maxzoom,
      'type': 'fill',
      'paint': fillColor
    }, 'waterway');

  }

  //change info window on hover
  map.on('mousemove', function(e) {
    var featureQuery = [];
    var zoom = map.getZoom();
    for (var layer of layers) {
      if (layer.minzoom < zoom && layer.maxzoom > zoom) {
        featureQuery.push(
          'wozw-' + layer.name
        )
      }
    }
    var mouseOnObj = map.queryRenderedFeatures(e.point, {
      layers: featureQuery
    });


    if (mouseOnObj.length > 0) {

      document.getElementById('pd').innerHTML =
        "<h3>" + mouseOnObj[0].properties.Provincie +
        propertyValue(mouseOnObj[0].properties.Gemeente) +
        propertyValue(mouseOnObj[0].properties.Plaats) +
        propertyValue(mouseOnObj[0].properties.Wijk) +
        showOne(mouseOnObj[0].properties.Postcode_4, mouseOnObj[0].properties.Postcode_6) + "</h3>" +
        "<p>" + formatPct(mouseOnObj[0].properties.verandering) + "</p>" +
        "<p>2017: <strong>" + formatPrice(mouseOnObj[0].properties.mean2017) + "</strong><br>" +
        "2016: <strong>" + formatPrice(mouseOnObj[0].properties.mean2016) + "</strong><br>" +
        "2015: <strong>" + formatPrice(mouseOnObj[0].properties.mean2015) + "</strong><br>" +
        "Oppervlakte: <strong>" + Math.round(mouseOnObj[0].properties.oppa) + "m2</strong><br>" +
        "Bouwjaar: <strong>" + Math.round(mouseOnObj[0].properties.bja) + "</strong></p>" +
        "Huizen/WOZobj: [" + mouseOnObj[0].properties.huizen + "\/" + mouseOnObj[0].properties.wozobjs  + "]";
    } else {
      document.getElementById('pd').innerHTML = '<p>Beweeg over de kaart</p>';
    }
  });
});
