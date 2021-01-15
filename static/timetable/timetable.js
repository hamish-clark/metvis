
var timetable_table_container;
var timetable_table;
var timetable_head;
var timetable_body;

var timetable__info_header;
var timetable__table_outer

var timetable__route_header;
var timetable__name_header;
var timetable__direction_header;
var timetable__daterange_header;
var timetable__aggregate_header;

var header_text_limit = 30; //Text characters

function initialise_timetable(){
  console.log("timetable initialised");

  timetable_table_container = d3.select("#timetable_table_container");

  timetable__info_header = timetable_table_container.append("div").attr("id", "timetable__info-header")
  timetable__table_outer = timetable_table_container.append("div").attr("id", "timetable__table-outer")

  timetable__route_header = timetable__info_header.append("h3").attr("id", "timetable__route-header")
  timetable__name_header = timetable__info_header.append("h3").attr("id", "timetable__name-header")
  timetable__direction_header = timetable__info_header.append("h3").attr("id", "timetable__direction-header")
  timetable__daterange_header = timetable__info_header.append("h3").attr("id", "timetable__daterange-header")
  timetable__aggregate_header = timetable__info_header.append("h3").attr("id", "timetable__aggregate-header")

  timetable__table_outer.append("div").attr('class', "sticky_header")
  timetable_table = timetable__table_outer.append("table").attr("class", "table-resize").attr("class", "sticky-header")
  timetable_head = timetable_table.append("thead")
  timetable_body = timetable_table.append("tbody")

  /*
  timetable_labels = timetable_table_container.append("table").attr("class", "table-resize")
  timetable_labels.append("thead")
  timetable_labels_body = timetable_labels.append("tbody")
  */
}

function update_timetable(){
  if (selected_tab!=6){ return }

  console.log("Update timetable")

  timetable_body.selectAll("tr").remove();
  timetable_head.selectAll("tr").remove();
  timetable_table_container.selectAll(".error-message").remove();

  if (selected_routes.size != 1){
    timetable_table_container.append("div").attr("class", "error-message").text("No Timetable Selected.");
    timetable__route_header.text("")
    timetable__name_header.text("")
    timetable__direction_header.text("")
    timetable__daterange_header.text("")
    timetable__aggregate_header.text("")
    return;
  }

  stops =  GTFS_DATA[selected_city]["stops"]
  routes = GTFS_DATA[selected_city]["routes"]
  trips = GTFS_DATA[selected_city]["trips"]
  stop_times = GTFS_DATA[selected_city]["stop_times"]

  let direction_state = get_switch_state("timetable-direction-switch")
  let aggregate_mode = get_switch_state("timetable-aggregate-switch")

  trip_ids = []
  for (trip_id in stop_times){
    let route_id = trips[trip_id]["route_id"]
    let direction = trips[trip_id]["direction_id"]
    let dir = {"inbound" : 1, "outbound" : 0}[direction_state]
    if (trip_id in tracked_trips && direction==dir && selected_routes.has(routes[route_id]["route_short_name"])){

      for (date in tracked_trips[trip_id]){
        if (filter_by_date(date)){
          trip_ids.push(trip_id)
          break;
        }
      }
    }
  }

  var it = selected_routes.values();
  //get first entry:
  var first = it.next();
  //get value out of the iterator entry:
  var route_name = first.value;

  let route_short_name_to_id = {}
  for (entry of Object.entries(routes)){

    route_short_name_to_id[entry[1]["route_short_name"]] = entry[0]
  }

  var route_id = route_short_name_to_id[route_name]

  trip_ids = trip_ids.sort( (a, b) => stop_times[a][0]["arrival_time"] - stop_times[b][0]["arrival_time"]);

  let longest_trip = trip_ids[0]
  for (i in trip_ids){ let tripId = trip_ids[i]
    if (stop_times[tripId].length > stop_times[longest_trip]){ longest_trip = tripId }
  }

  let trip = longest_trip
  let name = routes[route_id]["route_long_name"]
  let id = routes[route_id]["route_short_name"]

  let timetable_stops = stop_times[longest_trip]

  if (show_stops_state=="major"){
    timetable_stops = timetable_stops.filter((d, i) => i==0 || i==stops.length || i % 5 == 0)
  }

  timetable__route_header.text("Route " + id).style("color", GTFS_DATA[selected_city]["colours"][id])
  timetable__name_header.text(format_long_name(name, {"inbound" : 1, "outbound" : 0}[direction_state])) //  + " (" + direction_state + ")"
  timetable__direction_header.text()
  timetable__daterange_header.text(as_nice_date(selected_date))
  //timetable__aggregate_header.text(selected_day)


  timetable_head.append("tr").selectAll("th").data(timetable_stops).enter()
    .append("th").attr("class", "rotate").append("div").attr("class", "rotate__div").append("span").attr("class", "rotate__div__span").text(stop => {
      let str = stops[stop["stop_id"]]["stop_name"]
      return str.slice(0, header_text_limit) + (str.length>header_text_limit?'...':"")
    })

  table_entries = timetable_body.selectAll("tr").data(trip_ids).enter()
      .append("tr").classed("tr-resize", true).attr("class", function(d, i) { return d3.select(this).attr("class") + " timetable_row_" + i } )
      .on("mouseover",  function(d, i) { d3.selectAll(".timetable_row_" + i).selectAll(".td-time").classed("td-time--hover", true) })
      .on("mouseout",  function(d, i) { d3.selectAll(".timetable_row_" + i).selectAll(".td-time").classed("td-time--hover", false) })
      .selectAll("td").data(tripId => {

        let aggregate = aggregate_trip(tripId, aggregate_mode)
        let stops = stop_times[tripId]

        if (show_stops_state=="major"){
          stops = stops.filter((d, i) => i==0 || i==stops.length || i % 5 == 0)
        }

        return stops.map((stop, i) => {stop.delay = aggregate[i].delay; stop.aggregate = aggregate[i].agg;  return stop})

      }).enter()
        .filter(stop=>{return stop.delay!=null})
        .append("td")
          .classed("td-time", true)
          .attr("class", function(d, i) { return d3.select(this).attr("class") + " timetable_col_" + i } )
          .style("background", stop=> {
            if (show_reliability_colours){
              return "rgba(255, 0, 60, " + Math.min(1, getVariance(stop.aggregate, stop.delay)/400) + ")"
            }else if (show_delay_colours){
              return getColour(stop.delay)
            }else{
              return null;
            }
          })
          .on("mouseover",  function(d, i) { d3.selectAll(".timetable_col_" + i).classed("td-time--hover", true) })
          .on("mouseout",  function(d, i) { d3.selectAll(".timetable_col_" + i).classed("td-time--hover", false) })
          .append("p").attr("class", "td-time__text")
          .text(stop => seconds_as_time( (stop.delay ? stop.delay : 0) + stop["arrival_time"]))
          .style("color", stop=> stop.delay>60?getColour(350):stop.delay<-60?getColour(-100):'black' )
          .style("font-weight", stop=> stop.delay<60&&stop.delay>-60?null:'1000')

}
