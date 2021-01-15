

var trip_tracker_zoom = 800;

var trip_tracker_container;
var trip_viewport;
var day_columns_container;
var routes_row_container;
var time_bar;

var selectedTripsConainer;

var timetable_container;

var trip_map = {}

function fade_between(c1, c2, ratio){
  ratio = Math.min(ratio, 1)
  ratio = Math.max(ratio, 0)
  c3 = c1.map((c, i) => c + (c2[i]-c1[i]) * ratio )
  let rgb_string = "hsla(" + c3[0] + "," + c3[1] + "%," + c3[2] + "%," + c3[3] + ")"
  return rgb_string
}

function delay_to_colour(delay){
  if (delay < -30){
    // Early Green
    return fade_between( [150, 100, 85, 1], [160, 100, 20, 1], delay/-200)
  }else if (delay > 30){
    // Late Red
    return fade_between([10, 100, 85, 1], [0, 100, 20, 1], delay/800)
  }else{
    return fade_between( [150, 100, 85, 0.5], [10, 100, 85, 0.5], (delay+30)/60)
  }
}

function select_trip(trip_id, ctrl_pressed){
  
  if (selected_trips.has(trip_id)){
    selected_trips.delete(trip_id)
    if (!ctrl_pressed){
      selected_trips.clear();
    }
  }else{
    if (!ctrl_pressed){
      selected_trips.clear();
    }
    selected_trips.add(trip_id);
    
  }
  
  update_trip_selector();
  update_trip_tracker();
  update_moments();
}

function initialise_trip_selector(){
  let routes = GTFS_DATA[selected_city]["routes"]
  let colours = GTFS_DATA[selected_city]["colours"]
  let stop_times = GTFS_DATA[selected_city]["stop_times"]
  let trips = GTFS_DATA[selected_city]["trips"]

  trip_ids = Object.keys(trips);
  trip_packets = {}

  trip_ids = trip_ids.sort( (a, b) => stop_times[a][0]["arrival_time"] - stop_times[b][0]["arrival_time"]);
  relevant_routes = new Set(Object.keys(colours))

  for (trip_id of trip_ids){
    routeId = trips[trip_id]["route_id"]
    route = routes[routeId];
    routeShortId = route["route_short_name"]
    if (relevant_routes.has(routeShortId)){
      let packet = {};
      let direction_id = trips[trip_id]["direction_id"]
      let route_long_name = route["route_long_name"]
      let stops = stop_times[trip_id];
      packet["route_short_name"] = routeShortId;
      packet["direction"] = direction_id;
      packet["route_long_name"] = format_long_name(route_long_name, direction_id);
      packet["tripId"] = trip_id
      packet["start_time"] = seconds_as_time(stops[0]["arrival_time"]);
      packet["colour"] = colours[routeShortId];

      trip_map[trip_id] = packet

      if (routeShortId in trip_packets){
        trip_packets[routeShortId].push(packet);
      }else{
        trip_packets[routeShortId] = [packet]
      }
    }
  }

  /** Update the display with the data**/
  tripSelectContainer = d3.select("#trip-selector__container");

  selectedTripsConainer = tripSelectContainer.append("span").attr('class', 'tripRouteContainer')

  selectedTripsConainer.append("h2")
    .attr('class', 'tripRouteHeader')
    .text("Selected")
    .style('background', "black")
    .style("color", "white")

  tripRouteContainers = tripSelectContainer.selectAll("div").data(Object.keys(trip_packets)).enter()
    .append("div")
      .attr('class', 'tripRouteContainer')



  tripRouteContainers.append("h2")
    .attr('class', 'tripRouteHeader')
    .text((d) => d)
    .style('background', (d) => GTFS_DATA[selected_city]["colours"][d])

  trip_divs = tripRouteContainers.append("div")
    .attr('class', 'widgetDrawer')
    .selectAll('div')
      .data((d) => trip_packets[d]).enter()
      //.filter(d => (new Set(Object.keys(tracked_trips))).has(d["tripId"]))
      .append("div")
        .attr('id', (d)=> {return d; })
        .attr('class', 'tripContainer')
        //.style('background', (d) => {return d["colour"];})

  trip_divs.append("div")
    .attr("class", 'tripDateContainer')
    .text((d) => `${d["start_time"]}` )

  trip_divs.append("div")
    .attr("class", 'tripNameContainer')
    .text((d) => `${d["route_long_name"]}`)
    .on('click', (d) => select_trip(d['tripId'], d3.event.ctrlKey))
}

function initialise_trip_tracker(){
  trip_tracker_container = d3.select("#trip_tracker_container");
  trip_viewport = trip_tracker_container.append("div").attr("id", "trip_viewport")

  routes_row_container   = trip_viewport.append("div").attr("id", "routes_row_container");

  /** Timetable **/

  timetable_container = trip_tracker_container.append("div").attr("id", "timetable_container");

  update_trip_tracker()

}

function updateScrollLabels(){
  //let elem = document.getElementById("trip_viewport");
  //d3.selectAll(".historical_row_day_text").style("left", elem.scrollLeft/elem.scrollWidth * 100 + "%")
}

function dragstart() {
	console.log('dragstart');
}
function dragmove() {
	if (!d3.event) return;
	console.log(d3.select("."))
}
function dragend() {
	console.log('dragend');
}

function update_trip_selector(){

  // prepare all data for displaying
  let routes = GTFS_DATA[selected_city]["routes"]
  let colours = GTFS_DATA[selected_city]["colours"]
  let stop_times = GTFS_DATA[selected_city]["stop_times"]
  let trips = GTFS_DATA[selected_city]["trips"]


  trip_ids = Object.keys(trips);
  trip_packets = {}

  let active_trips_sorted = new Set([...active_trips].sort( (a, b) => { return stop_times[a][0]["arrival_time"] - stop_times[b][0]["arrival_time"] }));

  // Update the display with the data
  tripSelectContainer = d3.select("#trip-selector__container");
  tripRouteContainers = tripSelectContainer.selectAll(".tripRouteContainer");

  /** Update if no trip selected **/
  tripSelectContainer.selectAll(".error-message").remove()
  if (selected_routes.size<=0){
    tripSelectContainer.append("div").attr("class", "error-message").text("No Route Selected.");
  }


  tripRouteContainers.filter(d=> !selected_routes.has(d)).style("display", "none")
  tripRouteContainers.filter(d=> selected_routes.has(d)).style("display", null)

  selectedTripsConainer.style("display", "none");

  tripRouteContainers.selectAll(".tripContainer").style("display", d=> {
    if (show_active_trips){
      if (!active_trips_sorted.has(d["tripId"])){ return "none" }
    }
    let direction = {"inbound" : 1, "outbound" : 0, "both" : null}[selected_direction]

    if (direction != null){
      if (direction != d["direction"]){ return "none"; }
    }
    return null
  });

  tripRouteContainers.selectAll(".tripContainer")
    .filter( d=>selected_trips.has(d["tripId"]))
      .style("display", null)
      .style("background", "black");


  tripRouteContainers.selectAll(".tripContainer")
    .style('background', d=> selected_trips.has(d['tripId']) ? d["colour"] : null)
}


// Returns an array of numbers that are the delays at each stop for a Given
// Promise: for a valid tripId will always return an array of numbers.
// All zeros if there is no recorded data for a trip on a given date/dates.
function aggregate_trip(tripId, aggregate_mode){

  let stop_times = GTFS_DATA[selected_city]["stop_times"][tripId]

  let tracked_trip = (tripId in tracked_trips ? tracked_trips[tripId] : null)


  if (tracked_trip==null){
    return stop_times.map(stop => null);
  }

  let aggregated_trips = []

  for (date in tracked_trip){
    if (filter_by_date(date)){
      for (stop_index in tracked_trip[date]){
        let stop = tracked_trip[date][stop_index]
        let delay = stop[1];

        if (aggregated_trips[stop_index]){
          aggregated_trips[stop_index].push(delay)
        }else{
          aggregated_trips[stop_index] = [delay]
        }

      }
    }
  }

  if (aggregate_mode=="current"){
    if (dateToKey(selected_date) in tracked_trip){
      return tracked_trip[dateToKey(selected_date)].map(x => { return {"delay" : x[1], "agg": [x[1]] } })
    }else{
      return stop_times.map(stop => null);
    }

  }else if (aggregate_mode=="average"){
    return aggregated_trips.map(x => { let l = x.length; let delay = x.reduce((a, b) => a + b, 0)/l; return {"delay" : delay, "agg" : x}})

  }else if (aggregate_mode=="median"){
    return aggregated_trips.map(x => {
      let l = Math.floor(x.length/2);
      let sx = sortArray(x)
      return {"delay" : getMedian(x), "agg" : x}
    })
  }
}

function hover_stop(stopId){
  d3.selectAll(".busLocation").classed("stop_hover", d => d[0]==stopId)
  d3.selectAll(".busLocation").classed("stop_hidden", d => d[0]!=stopId)
}

function unhover(){
  d3.selectAll(".busLocation").classed("stop_hover", false)
  d3.selectAll(".busLocation").classed("stop_hidden", false)
}

// element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});

function update_trip_tracker(){

  let zoom_scale = 0.1

  let stop_times = GTFS_DATA[selected_city]["stop_times"]

  routes_row_container.selectAll("div").remove();

  routes_rows = routes_row_container.selectAll("div").data([...selected_trips]).enter()
    .filter((d) => d!='Unnasigned')
      .append("div")
        .attr('class', 'route_row')
        .attr('tripId', (d) => d)

  /*
  routes_rows.append("div").attr("class", "trip_title").append("p").attr("class", "trip_title_text").text(tripId => {
    let p = trip_map[tripId];
    return "Route " +  p["route_short_name"] +  ": " + p["route_long_name"] +  " [ " + p["start_time"] + " ]";
  }).style("left", tripId => stop_times[tripId][0]["arrival_time"] / (24 * 60 * 60) * 100 + "%")
  */

  /** Regular Trip Stops **/
  trip_stops_rows  = routes_rows.append("div").attr('class', 'trip_stops_row')

  var tooltip = d3.select("body")
    .append("div")
    .style("position", "fixed")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .attr("class", "stop_tooltip")
    .text("a simple tooltip");

  trip_stops_rows.selectAll("div").data( (d) => stop_times[d].map((x) => { x.stops = stop_times[d]; return x;}) ).enter()
  .filter((d, i) => i < d.stops.length-1)
    .append("div")
    .classed("busLocation", true)
    .classed("trip", true)
    .style('left', (d)=>{ return (d["arrival_time"] - d.stops[0]["arrival_time"]) * zoom_scale + 'px' })
    //.style('width', '10px')
    .style('height', '10px')
    .style('width', (d, i) => {return (d.stops[i+1]["arrival_time"] - d["arrival_time"]) * zoom_scale + 'px' } )
    .classed('tracked_stop', (d)=> tracked_stops.has(d.stop_id))
    .on('click', ()=>{
      d3.selectAll(".busLocation")
    })
    /*
    .on('mouseover', (d)=>{
      hover_stop(d.stop_id);
    })
    */
    .on("mouseover", function(d){
      hover_stop(d.stop_id);
      tooltip.text(d.stop_id);
      return tooltip.style("visibility", "visible");})
    .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
    .on("mouseout", function(){unhover(); return tooltip.style("visibility", "hidden"); });

  /** Historical Trip Stops **/
  historical_rows = routes_rows.append("div").attr('class', 'historical_row_container').selectAll("div").data((trip_id) => {
    if (trip_id in tracked_trips){
      return Object.keys(tracked_trips[trip_id]).map(date=> [trip_id, date])
    }else{
      return [];
    }
  }).enter()
    .append("div")
      .attr('class', 'historical_row')
      .classed("disabled_row", d => !filter_by_date(d[1]))

  /*
  historical_rows.append("p")
    .attr("class", "historical_row_day_text")
    .text(d=> as_nice_date(new Date(d[1])) + " " + DAYS[(new Date(d[1])).getDay()])
    .style("left", d => stop_times[d[0]][0]["arrival_time"] / (24 * 60 * 60) * 100 + "%")
    .on("click", d=> selected_date = new Date(d[1]))
  */
 
  historical_rows.selectAll("div").data((d) => tracked_trips[d[0]][d[1]].map(x=>{x.tripId = d[0]; x.date = d[1]; return x})).enter()
    .append("div")
      .attr('class', 'busLocation')
        .style('left', (d, i)=>{
          let seconds = stop_times[d.tripId][i]["arrival_time"] - stop_times[d.tripId][0]["arrival_time"]
          let offset = d[1]
          let l = (seconds+offset) * zoom_scale +  'px'
          return l;
        })
        .style('width', (d, i)=>{

          let offset = d[1]

          let duration = 0;
          if (i+1 < stop_times[d.tripId].length){
            let second_offset = tracked_trips[d.tripId][d.date][i+1][1]
            duration = (stop_times[d.tripId][i+1]["arrival_time"] + second_offset) - (stop_times[d.tripId][i]["arrival_time"] + offset)
          }
          d.width = duration * zoom_scale + 'px'
          return duration * zoom_scale + 'px'
        })
        //.style('border-radius', (d) => {return d.width})
        .style("background", d=> getColour(d[1]))

  updateScrollLabels()
  update_trip_timetable();

}

function update_trip_timetable(){

  /** Timetable **/

  let stops = GTFS_DATA[selected_city]["stops"]
  let stop_times = GTFS_DATA[selected_city]["stop_times"]

  timetable_container.selectAll(".timetable").remove();

  /** Update if no trip selected **/
  timetable_container.selectAll(".error-message").remove()
  if (selected_trips.size<=0){
    timetable_container.append("div").attr("class", "error-message").text("No Trip Selected.");
    return;
  }

  timetables = timetable_container.selectAll(".timetable").data([...selected_trips]).enter()
    .filter(tripId => tripId in tracked_trips)
    .filter(tripId => selected_aggregation != "current" || dateToKey(selected_date) in tracked_trips[tripId])
      .append("div").attr("class", "timetable")


  timetables.append("div").attr("class", "timetable_header")
    .text(tripId => {
      let p = trip_map[tripId];
      return "Route " +  p["route_short_name"] +  ": " + p["route_long_name"] +  " [ " + p["start_time"] + " ]";
    })

  drawer = timetables.append("div").attr("class", "timetable_stop_drawer")
  drawer.selectAll(".timetable_stop").remove();

  timetable_stops = drawer.selectAll(".timetable_stop").data(tripId => {
    let aggregate = aggregate_trip(tripId, selected_aggregation);
    return stop_times[tripId].map((stop, i)=> { stop.tripId = tripId; stop.delay = aggregate[i].delay; return stop } )
  }).enter()
    .append("div").attr("class", "timetable_stop")

  timetable_stops.append("div").attr("class", "timetable_stop_time").text((d, i)=> {
    return seconds_as_time(d["arrival_time"])
  })

  timetable_stops.append("div").attr("class", "timetable_stop_delay").text((d, i)=> {
    return (d.delay>0 ? "+" : "") + "(" +  seconds_as_minutes(Math.round(d.delay)) + ")"
  }).classed("late", d=> d.delay<0)
    .classed("early", d=> d.delay>0)
    .style("background", d=> getColour(d.delay))

  timetable_stops.append("div").attr("class", "timetable_stop_time").text((d, i) => {
    return seconds_as_time(d["arrival_time"] + d.delay)
  })

  timetable_stops.append("div").attr("class", "timetable_stop_name").text(d => stops[d["stop_id"]]["stop_name"])

}
