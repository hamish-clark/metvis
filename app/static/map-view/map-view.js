
var stopMarkers = {};
var busMarkers = {};
var polylines = [];
var gmap;
var mmap;
var bus_stop_icon;

/*
Upon obtaining the google maps api endpoint this callback method is run initialising
the map and
*/

function stop_clicked(stop_id){
  console.log("Clicked stop " + stop_id + " on the map")
}

function route_clicked(route_id){
  console.log("Clicked route " + route_id + " on the map")
}

function bus_clicked(trip_id){
  console.log("Clicked a bus with trip_id " +  trip_id)
  draw_trip_lateness(mmap, trip_id);
}

function initGoogleApi() {
  console.log("Map initialise")
  
  google.maps.LatLng.prototype.destinationPoint = function(brng, dist) {
    dist = dist / 6371;  
    brng = brng.toRad();  

    var lat1 = this.lat().toRad(), lon1 = this.lng().toRad();

    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) + 
                        Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));

    var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) *
                                Math.cos(lat1), 
                                Math.cos(dist) - Math.sin(lat1) *
                                Math.sin(lat2));

    if (isNaN(lat2) || isNaN(lon2)) return null;

    return new google.maps.LatLng(lat2.toDeg(), lon2.toDeg());
  }

  gmap = new google.maps.Map(document.getElementById('live-map__map'), {
    zoom: 11,
    center: {lat: -41.2792895, lng: 174.7773055},
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    styles: [
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#a7a7a7"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#737373"
      },
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#efefef"
      },
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#696969"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#d6d6d6"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#b3b3b3"
      },
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#ffffff"
      },
      {
        "visibility": "on"
      },
      {
        "weight": 1.8
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#d7d7d7"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "saturation": -100
      },
      {
        "lightness": -30
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "saturation": -10
      }
    ]
  }
]
  });

  document.getElementById("live-map__collapser").addEventListener('click', () => {
    document.getElementById("live-map").classList.toggle("live-map--minimised");
  })
}

function center_welly(){ gmap.setZoom(11); gmap.setCenter({lat: -41.2792895, lng: 174.7773055}) }
function center_chch(){ gmap.setZoom(11); gmap.setCenter({lat: -43.533142, lng :172.641605}) }
function center_auck(){ gmap.setZoom(11); gmap.setCenter({lat: -36.8479037, lng: 174.7635159}) }

function updateMap(){
  drawRoutePaths(gmap);
  drawStopMarkers(gmap);
  drawAdheranceMarkers(gmap);
  //drawAdheranceMarkers(mmap);
}

function drawAdheranceMarkers(map){

  let colours = GTFS_DATA[selected_city]["colours"]
  if (!show_live_buses) {
    for (markId in busMarkers) { busMarkers[markId].setMap(null) }
    busMarkers = {}
    return
  };

  let data = {}
  try{
    data = PLAYBACK_DATA[selected_city][dateToKey(selected_date)]["times"][numToTime(selected_time)];
  }catch{
    return;
  }


  let activeVehicles = new Set([]);
  for (vehicleRef in data){

    let vehicle = data[vehicleRef];
    let routeId = vehicle['routeId']

    let valid_direction = false;
    if (selected_direction == "both"){
      valid_direction = true;
    }else{
      valid_direction = vehicle["Direction"].toLowerCase()===selected_direction
    }

  
    if (selected_routes.has(routeId) && valid_direction){
      activeVehicles.add(vehicleRef)
      let delay = Math.abs(vehicle['DelaySeconds']);
      let d = Math.min(delay, 600);

      /*
      bus_stop_icon = {
          path: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",
          fillColor: GTFS_DATA[selected_city]["colours"][routeId],
          fillOpacity: 1,
          anchor: new google.maps.Point(12,12),
          strokeWeight: 2,
          scale: 0.8 + d/600
      }
      */

      let fill = GTFS_DATA[selected_city]["colours"][routeId]
      //console.log(fill)

      bus_stop_icon = {
          path: "M0,10a10,10 0 1,0 20,0a10,10 0 1,0 -20,0 m4.585468,2.501316c0,-1.755149 3.078696,-7.985621 5.34408,-7.983083c2.265384,0.002538 5.484983,6.283536 5.484983,8.011036c0,1.7275 -0.816211,-2.450703 -5.284433,-2.658665c-4.468222,-0.207962 -5.544631,4.385861 -5.544631,2.630712z",
          //path: "M0,10a10,10 0 1,0 20,0a10,10 0 1,0 -20,0",
          fillColor: fill,
          fillOpacity: 0.9,
          anchor: new google.maps.Point(10,10),
          strokeWeight: 1.5,
          rotation: parseFloat(vehicle["Bearing"]),
          scale: 1.1
      }

      let nearestStop = vehicle['nearestStop'];

      let date = new Date(vehicle["DepartureTime"])
      let d_str = date.getHours() + ":" + date.getMinutes()

      let tripId = vehicle['tripId'];
      let info = `
      <p class="hover-label" style="background :${colours[routeId]}"> Route: ${routeId} </p>
      <p class="hover-label"> Trip: ${d_str}</P>
      <p class="hover-label"> Nearest Stop: <b> ${nearestStop}</b> </p>
      <p class="hover-label"> Vehicle ID: <b>${vehicleRef}</b> </p>
      <p class="hover-label"> Delay: <b> ${delay} seconds </b> </p>
      `;

      let stopId = vehicle['nearestStop'];
      let stop = GTFS_DATA[selected_city]["stops"][stopId];

      let marker = busMarkers[vehicleRef];
      if (marker==undefined){
        marker = createMarker({'lat' : parseFloat(vehicle['Lat']), 'lng' : parseFloat(vehicle['Long'])}, info, map);
        marker.addListener("click", () => bus_clicked(tripId))
      }
      marker.setPosition({'lat' : parseFloat(vehicle['Lat']), 'lng' : parseFloat(vehicle['Long'])});
      marker.infoWindow.setContent(info);
      marker.setIcon(bus_stop_icon);
      busMarkers[vehicleRef] = marker;
    }

  }

  for (markId in busMarkers){
    if (!activeVehicles.has(markId)){
      busMarkers[markId].setMap(null);
      delete busMarkers[markId];
    }
  }

}

function drawStopMarkers(map){
  for (markId in stopMarkers) { stopMarkers[markId].setMap(null) }
  stopMarkers = {}

  if (!show_stop_markers) { return; }

  let stop_times = GTFS_DATA[selected_city]["stop_times"];
  let trips = GTFS_DATA[selected_city]["trips"];
  let stops = GTFS_DATA[selected_city]["stops"];
  let routes = GTFS_DATA[selected_city]["routes"];

  for (tripId in trips){
    let routeId = trips[tripId]["route_id"];
    routeId = routes[routeId]["route_short_name"];
    if (selected_routes.has(routeId)){

      let trip_stops = stop_times[tripId];

      for (trip_stop of trip_stops){

        let stopId = trip_stop["stop_id"];

        if (!(stopId in stopMarkers)){

          let stop = stops[stopId];
          let stop_lat = stop["stop_lat"];
          let stop_lon = stop["stop_lon"];
          let stop_name = stop["stop_name"]
          //           path: "M0,10a10,10 0 1,0 20,0a10,10 0 1,0 -20,0 m4.585468,2.501316c0,-1.755149 3.078696,-7.985621 5.34408,-7.983083c2.265384,0.002538 5.484983,6.283536 5.484983,8.011036c0,1.7275 -0.816211,-2.450703 -5.284433,-2.658665c-4.468222,-0.207962 -5.544631,4.385861 -5.544631,2.630712z",

          /*
          bus_stop_icon = {
              path: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",
              fillColor: "#90dff4",
              fillOpacity: .6,
              anchor: new google.maps.Point(12,12),
              strokeWeight: 1,
              scale: 0.5
          }
          */

          let fill = GTFS_DATA[selected_city]["colours"][routeId]

          bus_stop_icon = {
              path: "M0,10a10,10 0 1,0 20,0a10,10 0 1,0 -20,0",
              fillColor: fill,
              fillOpacity: 0.5,
              anchor: new google.maps.Point(10,10),
              strokeWeight: 2,
              scale: 0.5
          }

          let marker = createMarker({lat: stop_lat, lng: stop_lon}, "(" + stopId + ") " + stop_name, map);
          marker.addListener("click", () => stop_clicked(stopId))
          stopMarkers[stopId] = marker

        }
      }
    }
  }
}

function drawRoutePaths(map){
  // Clear existing lines
  for (poly of polylines){ poly.setMap(null) }
  polylines = [];

  if (!show_route_lines) { return; }

  let trips = GTFS_DATA[selected_city]["trips"];
  let shapes = GTFS_DATA[selected_city]["shapes"];
  let routes = GTFS_DATA[selected_city]["routes"];
  let colours = GTFS_DATA[selected_city]["colours"];

  shapes_to_draw = {}

  for (trip_id in trips){
    let trip = trips[trip_id];
    let shape_id = trip['shape_id'];
    let route_id = routes[trip['route_id']]['route_short_name']
    if (selected_routes.has(route_id)){
      if (shapes_to_draw[route_id]){
        shapes_to_draw[route_id].add(shape_id)
      }else{
        shapes_to_draw[route_id] = new Set([shape_id]);
      }
    }
  }

  for (route_id in shapes_to_draw){
    for (shape_id of shapes_to_draw[route_id]){
      let shape = shapes[shape_id]

      var bg_line = new google.maps.Polyline({
        path: shape,
        geodesic: true,
        strokeColor: '#000',
        strokeOpacity: 0.8,
        strokeWeight: 8,
        zIndex: 100
      })

      var fg_line = new google.maps.Polyline({
          path: shape,
          geodesic: true,
          strokeColor: colours[route_id],
          strokeOpacity: 1.0,
          strokeWeight: 4,
          zIndex: 100
      })

      fg_line.addListener("click", () => route_clicked(route_id))

      bg_line.setMap(map);    
      fg_line.setMap(map);

      

      polylines.push(fg_line);
      polylines.push(bg_line);
    }
  }
}

// Adds a marker to the map and push to the array.
function createMarker(location, info, map) {
  let marker = new google.maps.Marker({
    map: map,
    icon: bus_stop_icon,
    position: location,
    infoWindow : new google.maps.InfoWindow({})
  });
  marker.setMap(map);
  attachSecretMessage(marker, info);
  return marker;
}

function attachSecretMessage(marker, info) {
  marker.infoWindow.setContent(info);
  marker.clicked = false
  marker.addListener('mouseover', function(e) {
    //console.log("The infowindow is on the map", marker.infoWindow.getMap() ? true : false);

    if (marker.infoWindow.getMap() ? false : true){ // if hovered and not on a map
      marker.infoWindow.open(marker.get('map'), marker);
      marker.clicked = false;
    }else{
      marker.infoWindow.open(marker.get('map'), marker);
    }
  
    
  });
  marker.addListener('click', function(e) {
    if (marker.clicked){
      marker.infoWindow.close();
    }else{
      marker.infoWindow.open(marker.get('map'), marker);
    }
    marker.clicked = !marker.clicked

  });
  marker.addListener('mouseout', function(e) {
    if (!marker.clicked){ // if the marker has not been cliked
      marker.infoWindow.close();
    }
  });
}
