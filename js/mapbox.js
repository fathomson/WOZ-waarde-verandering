// mapbox init
mapboxgl.accessToken = 'pk.eyJ1IjoiZmF0aG9tc29uIiwiYSI6ImNqcWk3eDk2NDBidHkzeG55cnM4bzk2aHEifQ.MjyUQwX9Yk9lJPM4UtQHMA';


var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/fathomson/cjqi36oqw017a2smt6tkpho2l',
  center: [6.6, 53.2],
  zoom: 13.0
});


map.addControl(new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true
}));

var geocoder = new MapboxGeocoder({
  country: 'nl',
  accessToken: mapboxgl.accessToken
});
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
  closeButton: false
});

function propertyValue(p) {
  return p ? " - " + p : "";
}

function showOne(p1, p2) {
  return p2 ? propertyValue(p2) : propertyValue(p1);
}

function getFinestAggregation(p, als) {
  for (var al of als) {
    if (p[al]) {
      return {
        'al': al,
        'v': p[al]
      }
    }
  }
}

function formatPrice(p) { //€
  return "€" + Math.round(p).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")
}

function formatPct(p) {
  return (p * 100).toFixed(2) + "%";
}

function getPopupText(p) {
  var als = ['Postcode_6', 'Postcode_4', 'Wijk', 'Plaats', 'Gemeente', 'Provincie'];
  var res = getFinestAggregation(p, als);
  var popupText = "<strong>" + res.al + ": </strong>" + res.v + "<br>"

  if (p.huizen > 0) {
    popupText += "<center><h2>" + formatPct(p.verandering) + "</h2></center>" +
      "<strong>2017: </strong>" + formatPrice(p.mean2017) + "<br>" +
      "<strong>2016: </strong>" + formatPrice(p.mean2016) + "<br>" +
      "<strong>2015: </strong>" + formatPrice(p.mean2015) + "<br>" +
      "<strong>Oppervlakte: </strong>" + Math.round(p.oppa) + "<br>" +
      "<strong>Bouwjaar: </strong>" + Math.round(p.bja) + "<br>"
  } else {
    popupText += "Onvoldoende data beschikbaar"
  }

  return popupText
}

function getHouseObjSelected(p) {
  return 'Huizen / WOZobjs [' + p.huizen + "\/" + p.wozobjs + ']'

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
    'fill-opacity': [
      "case",
      [
        "==",
        ["get", "huizen"],
        0
      ],
      0,
      0.4
    ]
  }

  var layers = [];
  layers.push({
    'name': 'Provincie',
    'minzoom': 0,
    'maxzoom': 8
  });
  layers.push({
    'name': 'Gemeente',
    'minzoom': 8,
    'maxzoom': 9
  });
  layers.push({
    'name': 'Plaats',
    'minzoom': 9,
    'maxzoom': 10.5
  });
  layers.push({
    'name': 'Wijk',
    'minzoom': 10.5,
    'maxzoom': 12
  });
  layers.push({
    'name': 'Postcode_4',
    'minzoom': 12,
    'maxzoom': 13
  });
  layers.push({
    'name': 'Postcode_6',
    'minzoom': 13,
    'maxzoom': 23
  });

  for (var layer of layers) {
    map.addSource(layer.name, {
      'type': 'vector',
      'url': 'mapbox://fathomson.' + layer.name
    });

    // Hightlight effect on hover requires 2 almost identical layers?
    for (var hl of ["", "hl"]) {
      var layerProp = {
        'id': 'wozw-' + layer.name + hl,
        'source': layer.name,
        'source-layer': layer.name,
        'minzoom': layer.minzoom,
        'maxzoom': layer.maxzoom,
        'type': 'fill',
        'paint': fillColor
      }
      if (hl === "hl") {
        layerProp['filter'] = ["==", "mean2017", 0]
      }

      map.addLayer(layerProp, 'waterway');
    }
  }

  //change info window on hover
  map.on('mousemove', function(e) {

    var searchLayer = null;
    var zoom = map.getZoom();
    for (var layer of layers) {
      if (layer.minzoom < zoom && layer.maxzoom > zoom) {
        searchLayer = ['wozw-' + layer.name]
      }
    }
    var mouseOnObj = map.queryRenderedFeatures(e.point, {
      layers: searchLayer
    });


    if (mouseOnObj.length > 0) {
      map.setFilter(searchLayer + 'hl', ["all", ['==', "mean2016", mouseOnObj[0].properties.mean2016],
        ['==', "mean2017", mouseOnObj[0].properties.mean2017]
      ]);
      document.getElementById('stat').innerHTML = getHouseObjSelected(mouseOnObj[0].properties)
      popup.setLngLat(e.lngLat)
        .setHTML(getPopupText(mouseOnObj[0].properties))
        .addTo(map);
    }
  });

  // Has t
  for (var layer of layers) {
    map.on('mouseleave', 'wozw-' + layer.name, function() {
      popup.remove();
    });
  }


});
