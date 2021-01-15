
var show_moments_delay = true;
var show_delay_change = false;
var show_snapper_trips = false;
var show_bus_capacity = false;
var show_boarding_markers = false;

document.getElementById('show_moments_delay_toggle').addEventListener('change', function() {
  show_moments_delay = this.checked; update_moments();
});
document.getElementById('show_delay_change_toggle').addEventListener('change', function() {
  show_delay_change = this.checked; update_moments();
});
document.getElementById('show_snapper_trips_toggle').addEventListener('change', function() {
  show_snapper_trips = this.checked; update_moments();
});
document.getElementById('show_bus_capacity_toggle').addEventListener('change', function() {
  show_bus_capacity = this.checked; update_moments();
});

// document.getElementById('show_boarding_markers_toggle').addEventListener('change', function() {
//   show_boarding_markers = this.checked; update_moments();
// });


var snapper = [];
var boarding_markers = [];
var arc_markers = [];
var polygons = [];

var snapper_cache = {};
var trip_cache = {};

/*
{ "_id" : 1,
 "duty_date" : "2019-03-01", 
 "day_type" : "Sat",
  "agency_id" : "NBM", 
  "agency_name" : "NZ Bus",
  "contract_code" : "Unit_02",
  "route_id" : "9912",
  "route_code" : "N2", 
  "route_name" : "After Midnight (Wellington - Miramar - Strathmore Park - Seatoun)", 
  "route_type" : "3", 
  "direction_id" : "0", 
  "trip_id" : "1010", 
  "trip_depart_time" : "03:00:00",
   "trip_arrive_time" : "03:40:00",
   "travel_period" : "Offpeak",
    "boarding_type" : "First boarding", 
    "passenger_type" : "Adult", 
    "payment_type" : "Card", 
    "ticket_type" : "Single",
     "ticket_name" : "Card Single", 
     "snapper_route_id" : "9912",
      "snapper_trip_id" : "1010", 
      "zones_travelled" : "03",
       "board_zone_id" : "001", 
       "alight_zone_id" : "003", 
       "board_stop_id" : "5516", 
       "board_stop_name" : "Courtenay Place at Blair Street", 
       "board_stop_lat" : "-41.29375246", 
       "board_stop_lon" : "174.7827796", 
       "board_area_unit_2013" : "Willis Street-Cambridge Terrace", 
       "board_statistical_area_2_2019" : "Courtenay", 
       "board_territorial_authority_2019" : "Wellington City",
        "alight_stop_id" : "6041", 
        "alight_stop_name" : "Dundas Street at Monro Street (near 55)", 
        "alight_stop_lat" : "-41.32312724", 
        "alight_stop_lon" : "174.833643", 
        "alight_area_unit_2013" : "Seatoun",
         "alight_statistical_area_2_2019" : "Seatoun",
          "alight_territorial_authority_2019" : "Wellington City", 
          "number_of_legs" : "1.0", 
          "passenger_boardings" : "1.0", 
          "fare_revenue" : "7.0" }
*/

var trips;
var stop_times;
var routes;
var colours;

function initialise_moments(){

    trips = GTFS_DATA[selected_city]["trips"];
    stop_times = GTFS_DATA[selected_city]["stop_times"];
    routes = GTFS_DATA[selected_city]["routes"]
    colours = GTFS_DATA[selected_city]["colours"]

    mmap = new google.maps.Map(document.getElementById('moments__map'), {
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

    google.maps.event.addListener(mmap, 'projection_changed', updateCurveMarkers);
    google.maps.event.addListener(mmap, 'zoom_changed', updateCurveMarkers);

    var overlay = new google.maps.OverlayView();

    /*
    // Add the container when the overlay is added to the map.
    overlay.onAdd = function() {
      var layer = d3.select(this.getPanes().overlayLayer)
        .append("div").attr("class", "snaps");

    // Draw each marker as a separate SVG element.
    // We could use a single SVG, but what size would it have?
    overlay.draw = function() {
      var projection = this.getProjection(),
          padding = 10;

        
        layer.selectAll("svg")
            .data(snapper)
            .each(transform) // update existing markers
            .enter()
            .append("div")
            .each(transform)
            .attr("class", "snaps_marker");

        function transform(d) {
          d = new google.maps.LatLng(parseFloat(d.board_stop_lat), parseFloat(d.board_stop_lon));
          d = projection.fromLatLngToDivPixel(d);
          return d3.select(this)
              .style("left", (d.x - padding) + "px")
              .style("top", (d.y - padding) + "px");
        }
      };
    };

    // Bind our overlay to the map…
    overlay.setMap(mmap);
    */

}  

function update_moments(){

    if (selected_tab!=7){ return }

    console.log("Updating Moments");

    date_string = as_nice_date(translate_date(selected_date, -105));

    for (poly of polygons){
      poly.setMap(null);
    }
    
    let trips_to_draw = new Set([]);
    if (selected_trips.size > 0){
      trips_to_draw = selected_trips;      
      
    } else if (show_active_trips){
      let routes_with_trips = new Set([]);

      trips_to_draw = new Set([...active_trips].filter(f => {
        let trip = trips[f];
        let route_id = trip["route_id"];

        let dir_value = selected_direction=="inbound"? 1 : 0;
        
        if (selected_direction==="both" || dir_value == trip.direction_id){
          if (!routes_with_trips.has(route_id)){
            routes_with_trips.add(route_id);
            return true;
          }
        }
        return false;
      }));
    }

    let promises = [];

    let previous_trips_to_draw = new Set(trips_to_draw.values())
    //let previous_trips_to_draw = new Set(trips_to_draw.values())

    for (trip_id of trips_to_draw.values()){

      //let trip_id = selected_trips.next().value;
      
      let trip_info = trips[trip_id]

      direction_id = trip_info["direction_id"];
      SECONDS = stop_times[trip_id][0]["departure_time"]
      depart_time = new Date(SECONDS * 1000).toISOString().substr(11, 8);
      route_id = trip_info["route_id"];

      if (draw_snapper_boards){
      let f = (trip_id, direction_id, depart_time, route_id) => {

        //let url = `${server_url}/data/snapper/${date_string}/${depart_time}/${direction_id}/${route_id}`;
        let url = `${server_url}/data/snapper/${date_string}/${route_id}`;

        let row_check = (row) => row.trip_depart_time == depart_time && row.direction_id == direction_id;

        if (url in snapper_cache){
          draw_snapper_boards(snapper_cache[url].filter(row_check), trip_id, 0)
          return new Promise((resolve, reject) => {resolve("wee")})
        }else{
          return fetch(url, {cache: "no-cache"})
          .then(function(response) {
            return response.json();
          }).then(function(myJson){
              snapper_cache[url] = myJson;
              draw_snapper_boards(myJson.filter(row_check), trip_id, 0)
          });
        }
      }

      promises.push(f(trip_id, direction_id, depart_time, route_id));

    }

      if (show_moments_delay){
        draw_trip_lateness(mmap, trip_id, 0);
      }
      
    }

    Promise.all(promises).then(function() {
      clear_markers(trips_to_draw);  
    });

}

function draw_snapper_boards(myJson, selected_trip_id, offset){

  let stops = GTFS_DATA[selected_city]["stops"];
  
  board_count = {}
  depart_count = {}

  // Populate the board_count and depart_count map with <stop_id : n_passengers>
  i = 0;
  for (row of myJson){ 
    i++;
    if (selected_routes.has(row["route_code"])){
      let snapper_trip_id = row["snapper_trip_id"];
      if (true){
        let board_stop_id = row["board_stop_id"];
        let alight_stop_id = row["alight_stop_id"];
      
        if (board_stop_id in board_count){
          board_count[board_stop_id] += 1;
        }else{
          board_count[board_stop_id] = 1;
        }
        if (alight_stop_id in depart_count){
          depart_count[alight_stop_id] += 1;
        }else{
          depart_count[alight_stop_id] = 1;
        }
      }
    }
  }

  p_amount = 0;
  let trip_stops = stop_times[selected_trip_id]


  // Generate Polygon shapes based on board/depart locations
  let pathCoords = [];
  let departPathCoords = [];
  let originalCoords = [];
  for (i=2; i<trip_stops.length-1; i++){

    let current_stop_id = trip_stops[i-2]["stop_id"];
    let next_stop_id = trip_stops[i-1]["stop_id"];
    let third_stop_id = trip_stops[i]["stop_id"];

    let current_stop = stops[current_stop_id];
    let next_stop = stops[next_stop_id];
    let third_stop = stops[third_stop_id];

    let n_boards = (current_stop_id in board_count) ? board_count[current_stop_id] : 0;
    let n_departs = (current_stop_id in depart_count) ? depart_count[current_stop_id] : 0;
    p_amount = p_amount + n_boards;
    p_amount = p_amount - n_departs;
    
    let thickness = 5 + p_amount/2;

    var pos1 = new google.maps.LatLng(current_stop['stop_lat'], current_stop['stop_lon'] + offset);
    var pos2 = new google.maps.LatLng(next_stop['stop_lat'], next_stop['stop_lon'] + offset);
    var pos3 = new google.maps.LatLng(third_stop['stop_lat'], third_stop['stop_lon'] + offset);
  
    let angle1 = angleFromCoordinate(pos2, pos1);
    let angle2 = angleFromCoordinate(pos2, pos3);
    
    if (angle1 > 360){
      angle1 -= 360
    }
    if (angle2 > 360){
      angle2 -= 360
    }

    if (angle1 < 0){
       angle1 += 360;
    }

    if (angle2 < 0){
       angle2 += 360;
    }

    let delta_angle = anticlockwise_angle(angle1, angle2)


    let av_angle;
    av_angle = angle1 + delta_angle/2

    if (av_angle < 0){
      av_angle += 360;
    }

    if (av_angle > 360){
      av_angle -= 360;
    }

    let opposite_angle = av_angle + 180;

    if (opposite_angle > 360){
      opposite_angle -= 360;
    }

    let projected_point = pos2.destinationPoint(av_angle, n_boards/30);
    let projected_point2 = pos2.destinationPoint(opposite_angle, n_departs/30);

    originalCoords.push(pos2); 
    pathCoords.push(projected_point);
    departPathCoords.push(projected_point2);

    var markerP1 = new google.maps.Marker({
        position: pos2,
        id:"markerP1"
    });

    var markerP2 = new google.maps.Marker({
        position: pos1,
        id:"markerP2"
    });

    let c = "rgb(88, 113, 199)";

    if (p_amount > 20){
      c = lerpColor(color(88, 113, 199), color(216, 62, 62), max(0, min(1, (p_amount-10)/40))).toString();
    }
    
    if (p_amount > 40){
      c = "rgb(216, 62, 62)";
    }

    let stop_name = stops[next_stop_id].stop_name

    let tripInfo = trips[selected_trip_id];
    let direction_id = tripInfo.direction_id
    let route_id = tripInfo.route_id
    let route_name = routes[route_id].route_short_name
    let _id = `patrionage_${direction_id}_${route_id}_${i}`;

    let seconds = stop_times[selected_trip_id][0]
    let start_time = seconds_as_time(seconds.departure_time);
  

    let info = `

    <div style = "display: flex; flex-flow: column nowrap;">
      <div class="--flex-row" style="background: ${colours[route_name]}; justify-content:space-evenly; align-items: center;">
        <p> ${route_name} </p> 
        <p> ${["Outbound", "Inbound"][direction_id]} </p> 
        <p> ${start_time} </p> 
      </div>
      <div class="--flex-row" style="justify-content:center; align-items: center;"> <p style="max-width: 200px"> ${stop_name} </p> </div>
      <div class="--flex-row" style="justify-content:center; align-items: center;"> <i class="material-icons"> person </i> <p> ${p_amount} </p> </div>
      <div class="--flex-row" style="justify-content:center; align-items: center;"> <i class="material-icons"> transfer_within_a_station </i> <p> +${n_boards}/-${n_departs}</p> </div>
    </div>

    `
    
    if (show_bus_capacity){
      create_arc(markerP1, markerP2, {"tripId" : selected_trip_id, "curvature" : 0, "color" : c, "thickness": thickness, "info" : info, "_id": _id})
    }
  }

  if (show_snapper_trips){
    originalCoords.reverse();
    // Construct the polygon.
    let bermudaTriangle = new google.maps.Polygon({
      paths: pathCoords.concat(originalCoords),
      strokeColor: '#3460cf',
      strokeWeight: 0,
      fillColor: "#3460cf",
      fillOpacity: 0.7
    });

    // Construct the polygon.
    let departsPolygon = new google.maps.Polygon({
      paths: departPathCoords.concat(originalCoords),
      strokeColor: '#ff6d1f',
      strokeWeight: 0,
      fillColor: "#ff6d1f",
      fillOpacity: 0.7
    });

    polygons.push(bermudaTriangle)
    polygons.push(departsPolygon);

    bermudaTriangle.setMap(mmap);
    departsPolygon.setMap(mmap);
  }

  if (show_boarding_markers){
    // Place the board icons
    for (board_stop_id in board_count){
      let board_stop = stops[board_stop_id]
      let b_count = board_count[board_stop_id];

      var pos1 = new google.maps.LatLng(board_stop["stop_lat"] + 0.0001 , board_stop["stop_lon"]);

      board_icon = {
        path: "M0,10a10,10 0 1,0 20,0a10,10 0 1,0 -20,0",
        fillColor: "#7642a1",
        fillOpacity: 0.8,
        strokeWeight: 0,
        anchor: new google.maps.Point(10,10),
        scale: 0.4 + min(b_count/10,1)
      }

      var markerP1 = new google.maps.Marker({
          position: pos1,
          draggable: true,
          icon: board_icon,
          id:"markerP1",
          map: mmap
      });

      boarding_markers.push(markerP1);
    }

      // Place the DEPART icons
      for (board_stop_id in depart_count){
        let board_stop = stops[board_stop_id]
        let b_count = depart_count[board_stop_id];
        var pos1 = new google.maps.LatLng(board_stop["stop_lat"] -0.0001, board_stop["stop_lon"]);

        board_icon = {
          path: "M0,10a10,10 0 1,0 20,0a10,10 0 1,0 -20,0",
          fillColor: "#2472bf",
          fillOpacity: 0.8,
          strokeWeight: 0,
          anchor: new google.maps.Point(10,10),
          scale: 0.4 + min(b_count/10,1)
        }

        var markerP1 = new google.maps.Marker({
            position: pos1,
            draggable: true,
            icon: board_icon,
            id:"markerP1",
            map: mmap
        });

        boarding_markers.push(markerP1);

        var markerP1 = new google.maps.Marker({
            position: pos1,
            draggable: true,
            icon: board_icon,
            id:"markerP1",
            map: mmap
        });

        boarding_markers.push(markerP1);
    }
  }

  updateCurveMarkers();

}

function on_trip_data_recieved(myJson, offset, tripId){

  let stops = GTFS_DATA[selected_city]["stops"];

  let shift = 0;

  for (tripDate in myJson){
    let trip = myJson[tripDate];

    for (i=0; i<trip.length-1; i++){
      d1 = trip[i]
      d2 = trip[i+1]

      let current_stop = stops[d1[0]]
      let next_stop = stops[d2[0]]

      var pos1 = new google.maps.LatLng(current_stop['stop_lat'] + shift, current_stop['stop_lon'] + offset);
      var pos2 = new google.maps.LatLng(next_stop['stop_lat'] + shift, next_stop['stop_lon'] + offset);
      
      let curvature = shift

      let color = "rgb(0,0,0)";
      let thickness = 2;

      let change_in_delay = d2[1] - d1[1];

      // If the trip part of the day selection aggregate
      if (filter_by_date(tripDate)){
        color = getColour (d1[1]);
        thickness = 5;
        if (show_delay_change){
          thickness = min(20  , max(5, 5 + (change_in_delay/4)));
        }
        
        var markerP1 = new google.maps.Marker({
            position: pos2,
            id:"markerP1"
        });
    
        var markerP2 = new google.maps.Marker({
            position: pos1,
            id:"markerP2"
        });

        google.maps.event.addListener(markerP1, 'position_changed', updateCurveMarkers);
        google.maps.event.addListener(markerP2, 'position_changed', updateCurveMarkers);

        let tripInfo = trips[tripId];
        let direction_id = tripInfo.direction_id
        let route_id = tripInfo.route_id
        let route_name = routes[route_id].route_short_name
    
        let seconds = stop_times[tripId][0]
        let start_time = seconds_as_time(seconds.departure_time);

        let stop_name = next_stop.stop_name;

        change_in_delay = Math.round(change_in_delay)
        let change_string = "No Change"
        if (change_in_delay > 0){
          change_string = `<p> +${change_in_delay}s </p>`;
        }else if (change_in_delay < 0){
          change_string = `<p> ${change_in_delay}s </p>`;
        }


        let dll = d1[1];
        let delay_string = dll > 0 ? `${dll} seconds late.` : `${dll} seconds early.`;
        if (dll == 0)
          delay_string = "On time."
    
        let info = `
    
        <div style = "display: flex; flex-flow: column nowrap;">
          <div class="--flex-row" style="background: ${colours[route_name]}; justify-content:space-evenly; align-items: center;">
            <p> ${route_name} </p> 
            <p> ${["Outbound", "Inbound"][direction_id]} </p> 
            <p> ${start_time} </p> 
          </div>
          <div class="--flex-row" style="justify-content:center; align-items: center;"> <p style="max-width: 200px"> ${stop_name} </p> </div>
          <div class="--flex-row" style="justify-content:space-evenly; align-items: center;"> <p> ${delay_string} </p> <p> (${change_string}) </p> </div>
        </div>
    
        `
    
        let _id = `lateness_${direction_id}_${route_id}_${i}`;

        if (pos1.lng() > pos2.lng()){
          create_arc(markerP1, markerP2, {"tripId" : tripId, "z":2, "curvature" : curvature, "color" : color, "thickness": thickness, "info" : info, "_id":_id})
        }else{
          create_arc(markerP2, markerP1, {"tripId" : tripId, "z":2, "curvature" : curvature, "color" : color, "thickness": thickness, "info" : info, "_id": _id})
        }
      }
    }
    
    if (filter_by_date(tripDate)){
      shift += 0.001
    }
    
  }

  updateCurveMarkers();

}

function draw_trip_lateness(map, trip_id, offset){
    console.log("Drawing Trip Lateness ", trip_id)

    if (trip_id==undefined){ return }

    on_trip_data_recieved(tracked_trips[trip_id], offset, trip_id);

    //let date = as_nice_date(translate_date(selected_date, -122));

    // let url = `${server_url}/data/trip/${trip_id}/${date}`
    // console.log(url)

    // if (url in trip_cache){
    //   on_trip_data_recieved(trip_cache[url], offset, trip_id);
    // }else{
    //   var p = fetch(url)
    //     .then(function(response) {
    //       return response.json();
    //     }).then(function(myJson){
    //       trip_cache[url] = myJson;
    //       on_trip_data_recieved(myJson, offset, trip_id)
    //     });
    // }
    
}

function create_arc(markerP1, markerP2, info) {

  let _id = info._id;
    //@medmunds
    if (_id in arc_markers){
      arc_markers[_id].info = info;
      arc_markers[_id]["curveMarker"].setMap(mmap)
    }else{
      arc_markers[_id] = ({"m1":markerP1, "m2":markerP2, "info":info})
    }
}

function clear_markers(trips_to_draw){
  for (arc_id in arc_markers){
    let m = arc_markers[arc_id];
    let tripInfo = trips[m.info.tripId];

    if (!trips_to_draw.has(m.info.tripId)){
      m["m1"].setMap(null);
      m["m2"].setMap(null);
      m["curveMarker"].setMap(null);
    }
    else{
      let _id = m.info._id
      if (_id.startsWith("lateness") && show_moments_delay == true){
        m["curveMarker"].setMap(mmap);
      }else if  (_id.startsWith("patrionage") && show_bus_capacity == true){
        m["curveMarker"].setMap(mmap);
      }else{
        m["curveMarker"].setMap(null);
      }
    }
      
  }
  
  for (m of boarding_markers){
    m.setMap(null);
  }

  //arc_markers = [];
  //boarding_markers = []
}

function updateCurveMarkers() {
    for (arc_id in arc_markers){
        let arc = arc_markers[arc_id];
        var curvature = arc.info["curvature"]; // how curvy to make the arc
        var thickness = arc.info["thickness"]; // how thic
        var color = arc.info["color"]
        var z = arc.info.z ? arc.info.z : 0;

        var pos1 = arc["m1"].getPosition(), // latlng
            pos2 = arc["m2"].getPosition(),
            projection = mmap.getProjection(),
            p1 = projection.fromLatLngToPoint(pos1), // xy
            p2 = projection.fromLatLngToPoint(pos2);

    // Calculate the arc.
    // To simplify the math, these points 
    // are all relative to p1:
    var e = new google.maps.Point(p2.x - p1.x, p2.y - p1.y), // endpoint (p2 relative to p1)
        m = new google.maps.Point(e.x / 2, e.y / 2), // midpoint
        o = new google.maps.Point(e.y, -e.x), // orthogonal
        c = new google.maps.Point( // curve control point
            m.x + curvature * o.x,
            m.y + curvature * o.y);

    var pathDef = 'M 0,0 ' +
        'q ' + c.x + ',' + c.y + ' ' + e.x + ',' + e.y;

    var zoom = mmap.getZoom(),
        scale = 1 / (Math.pow(2, -zoom));

    var symbol = {
        path: pathDef,
        scale: scale,
        strokeWeight: thickness,
        fillColor: 'none',
        strokeColor: color,
        strokeOpacity: 0.9
    };  

    if (!("curveMarker" in arc)){
        let marker = new google.maps.Marker({
            position: pos1,
            clickable: true,
            icon: symbol,
            zIndex: z, // behind the other markers
            map: mmap,
            infoWindow : new google.maps.InfoWindow({})
        });
        arc["curveMarker"] = marker
        if ("info" in arc.info){
          attachSecretMessage(marker, arc.info["info"]);
        }
        
    } else {

        arc["curveMarker"].setOptions({
          position: pos1,
          icon: symbol,
        });

      attachSecretMessage(arc["curveMarker"], arc.info["info"]);
    }
  }
}

function angleFromCoordinate(pos1, pos2) {

  let lat1 = pos1.lat()
  let long1 = pos1.lng()
  
  let lat2 = pos2.lat()
  let long2 = pos2.lng();

  let dLon = (long2 - long1);

  let y = Math.sin(dLon) * Math.cos(lat2);
  let  x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1)
          * Math.cos(lat2) * Math.cos(dLon);

  let brng = Math.atan2(y, x);

  brng = radians_to_degrees(brng);
  brng = (brng + 360) % 360;
  brng = 360 - brng; // count degrees counter-clockwise - remove to make clockwise
  
  return brng;
}

function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (degrees/360) * 2 * pi;
}

function radians_to_degrees(radians)
{
  var pi = Math.PI;
  return radians * (180/pi);
}

// Anti-clockwise amount of degrees to rotate angle1 by to get angle2
function anticlockwise_angle(angle1, angle2){
    if (angle1 > angle2){
      delta = -(angle1 - angle2)
    }else{
      delta = -(360 - (angle2-angle1))
    }
    return delta
}

function clockwise_angle(angle1, angle2){
  if (angle1 <= angle2){
      return angle2 - angle1
  }else{
      return (360 - (angle1 - angle2))
  }

  
}

function sphere_distance(lat1, lat2, lon1, lon2){
  var R = 6371e3; // metres
  var φ1 = lat1.toRadians();
  var φ2 = lat2.toRadians();
  var Δφ = (lat2-lat1).toRadians();
  var Δλ = (lon2-lon1).toRadians();

  var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  var d = R * c;

  return d;
}

function lineInterpolate( point1, point2, distance )
{
  var xabs = Math.abs( point1.x - point2.x );
  var yabs = Math.abs( point1.y - point2.y );
  var xdiff = point2.x - point1.x;
  var ydiff = point2.y - point1.y;
 
  var length = Math.sqrt( ( Math.pow( xabs, 2 ) + Math.pow( yabs, 2 ) ) );
  var steps = length / distance;
  var xstep = xdiff / steps;
  var ystep = ydiff / steps;
 
  var newx = 0;
  var newy = 0;
  var result = new Array();
 
  for( var s = 0; s < steps; s++ )
  {
    newx = point1.x + ( xstep * s );
    newy = point1.y + ( ystep * s );
 
    result.push( {
      x: newx,
      y: newy
    } );
  }
 
  return result;
}