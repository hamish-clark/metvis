
// ISO YYYY-MM-DDTHH:MM:SS

var PLAYBACK_DATA = {"wellington" : {}};
var GTFS_DATA = {};
var tracked_trips = {};

var DAYS    = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
var MONTHS  = ["January","February","March","April","May","June","July", "August","September","October","November","December"];

var selected_routes = new Set([]);
var selected_trips  = new Set([]);
var active_trips    = new Set([]);
var trip_window = new Set([]);

var show_realtime =   true
var latest_data_date = new Date(Date.UTC(96, 1, 2, 3, 4, 5));

var selected_date   = new Date("2019-06-17");
var selected_city   = "wellington";
var selected_day    = "-5";
var selected_tab    = 0;
var tracked_stops   = new Set(["5015", "5502"]);

update_date_text();

var show_live_buses     = true;
var show_route_lines    = true;
var show_stop_markers   = false
var show_active_trips   = true;
var show_delay_colours  = false;
var show_reliability_colours = false;

var show_stops_state = "all";
var selected_direction = "inbound"
var selected_aggregation = "current"

let bigBus;
let roundedMin = 15;
let loadingGraph = false;
var starting_chart = 1;

var server_url = config["server_path"]

var chartButtonArray = ["chartButton0", "chartButton1", "chartButton2", "chartButton3", "chartButton7", "chartButton8", "chartButton9"];

var socket = io();

socket.on("new data", function() {
  console.log("New data processed at the server")
  load_date(new Date(), new Date());
});

function initialise_metvis(){
  console.log("Initialising Metvis")
  fetch_data();
}

/* Called once all fetches have completed */
function on_gtfs_loaded(){
  d3.selectAll(".loadingDiv").attr('class', 'hidden');
  console.log("Loaded GTFS data", GTFS_DATA)
  load_historical_data();
  initialise_trip_selector();
  initialise_trip_tracker();
  initialise_timetable();
  initialise_moments();
  on_city_change();
  addResizeListener(document.getElementById('chartContainer'), resizeWindows)
  set_chart_tab(1);
}


function on_city_change(){
  update_active_trips()
  updateRouteButtons();
  updateMap();
  drawAdheranceMarkers(gmap);
  update_trip_selector();
  update_timetable();
}

/* A route has been clicked so changes to visualisations need to be made */
function on_route_change(){
  update_active_trips()
  updateMap();

  if(currentGraph.getG()!=undefined){
    updateRoutesDrawn();
  }

  update_trip_selector();
  update_timetable();
  update_moments();

}

/* When the time slider has been moved or updated */
function on_date_change(){
  valid_date = false;
  try{
    console.log("date changed to " + as_nice_date(selected_date))
    valid_date = true;
  }catch(e){
    console.log("Invalid date")
  }

  if (valid_date){
    update_moments();
    on_time_change();
  }
  
  
}

function debounce(callback, wait, immediate = false) {
  let timeout = null 
  
  return function() {
    const callNow = immediate && !timeout
    const next = () => callback.apply(this, arguments)
    
    clearTimeout(timeout)
    timeout = setTimeout(next, wait)

    if (callNow) {
      next()
    }
  }
}

function on_time_change(){
  console.log("time changed to " + selected_time)
  drawAdheranceMarkers(gmap);
  update_active_trips();
  update_trip_selector();
  updateTimeDrawn();

  debounce(update_moments, 1000)();
  
}

/* On page DOCUMENT loaded */
document.addEventListener("DOMContentLoaded", function(event) {
  
  console.log("DOM fully loaded");
  initialise_time_range_slider()
  

  //day-selector
  document.getElementById("daySelector").addEventListener("change", function(){
    selected_day = this.value;

    if (selected_day!=-5){
      d3.select(".centered_row").style("opacity", "0.3")
      d3.select("#date-text").style("opacity", "0.3")
    }else{
      d3.select(".centered_row").style("opacity", "1")
      d3.select("#date-text").style("opacity", "1")
    }

    update_timetable();
    update_trip_tracker();
    update_moments();
    updateDatesDrawn(false);
  })

  document.getElementById("citySelector").addEventListener("change", function(){
    selected_city = this.value;
    //{'wellington': center_welly,'christchurch': center_chch, 'auckland': center_auck}[]
    on_city_change();
    if (selected_city==='wellington') { center_welly() }
    else if (selected_city==='christchurch') { center_chch() }
    else { center_auck() }
  })


  d3.selectAll(".roundedTimeSelector").on("change", function(){
    let elem = d3.select(this).node();
    roundedMin = elem.value;
    updateRounding(elem.value);
  })

  // SUUUN
  updateSliderStyle()

  document.getElementById("chartHeader").style.display="flex";
  document.getElementById("row2").style.display="flex";
  document.getElementById("live-map").style.display="flex";

  // Set the default date to selected_date.
  document.getElementById("dateSelector").value = dateToKey(selected_date);

  document.getElementById("dateSelector").addEventListener("change", function() {
      selected_date = new Date(this.value);
      update_timetable();
      update_date_text()
      on_date_change();
      update_trip_tracker();
      updateDatesDrawn(true);
  });

  document.getElementById('colour_delays_toggle').addEventListener('change', function() {
    show_delay_colours = this.checked; update_timetable();
  });
  document.getElementById('colour_reliability_toggle').addEventListener('change', function() {
    show_reliability_colours = this.checked; update_timetable();
  });
  document.getElementById('live_bus_toggle').addEventListener('change', function() {
    show_live_buses = this.checked; drawAdheranceMarkers(gmap);
  });
  document.getElementById('route_lines_toggle').addEventListener('change', function() {
    show_route_lines = this.checked; updateMap();
  });
  document.getElementById('stop_markers_toggle').addEventListener('change', function() {
    show_stop_markers = this.checked; updateMap();
  });
  document.getElementById('active_trips_toggle').addEventListener('change', function() {
    show_active_trips = this.checked; update_trip_selector();
  });
  d3.selectAll(".no_display").on("change", () => {
    starting_chart = document.querySelector('input[name="no_display"]:checked').value;
  })

  d3.selectAll(".switch_3").on("change", () => {
    selected_direction = document.querySelector('input[name="switch_3"]:checked').value;
    updateMap();
    update_trip_selector();
    update_timetable();
  })

  d3.selectAll(".aggregate_mode").on("change", ()=>{
    selected_aggregation = document.querySelector('input[name="aggregate_mode"]:checked').value;
    update_trip_tracker();
    update_timetable();
  })

  d3.select("#timetable-stop-switch").selectAll("input").on("change", ()=>{
    show_stops_state = get_switch_state("timetable-stop-switch");
    update_timetable();
  })

  d3.select("#timetable-direction-switch").selectAll("input").on("change", ()=>{
    update_timetable();
  })

  d3.select("#timetable-aggregate-switch").selectAll("input").on("change", ()=>{
    update_timetable();
  })

  initialise_metvis();

});

function filter_by_date(d){
  let date = new Date(d);
  let day = date.getDay();

  if (selected_day==-1){
    return true;
  }else if (selected_day==-2){
    return (day>0 && day<= 5)
  }else if (selected_day==-3){
    return (day == 6 || day == 0)
  }else if (selected_day==-5){
    return d==dateToKey(selected_date)
  }else if (selected_day==-4){
    return day==selected_date.getDay();
  }else{
    return (day==selected_day)
  }
}

function changeSelectorValue(id, value){
  let elem = document.getElementById(id);
  elem.value = value;
  elem.dispatchEvent(new Event('change'));
}

function update_date_text(){
  let dateText = document.getElementById("date-text")
  let day   = DAYS[selected_date.getDay()];
  let date  = selected_date.getDate();
  let month = MONTHS[selected_date.getMonth()]
  if(selected_date == "Invalid Date"){
    dateText.innerHTML = "No Date Selected";
  }else{
    dateText.innerHTML = `${day} ${date} ${month}`;
  }
}

function load_date(date, end){
  if (date.toISOString().slice(0, 10) <= end.toISOString().slice(0, 10)){
    date_string = date.toISOString().slice(0, 10);
    console.log("Loading Historical data for ", date_string);
    write_task(`historical_${date_string}`, `  ${date_string}`)
    fetch(`${server_url}/data/historical/${date_string  }`, {cache: "no-cache"})
    .then(function(response) {
      let json = response.json()
      return json;
    }).then(function(myJson){ 
      
      for (d in myJson){
        let blob = myJson[d];
        let times = Object.keys(blob["times"]);
        console.log(as_nice_date(date), blob)
        
        complete_task(`historical_${as_nice_date(date)}`)
        PLAYBACK_DATA["wellington"][d] = blob;
      }
      
      date.setDate(date.getDate() + 1)
      reload_chart_data(PLAYBACK_DATA);
      load_date(date, end)

    });
  }else{
    document.getElementsByClassName("loading_over")[0].classList.toggle("loading_over--hidden");
    return;
  }
}

function load_historical_data(){
    minimize_loading_screen();
    load_date(new Date("2019-06-17"), new Date("2019-08-17"))
    /*
    if (show_realtime){
      slide(timeToNum());
    }
    */
}


function Loop(func, timeout) {
  this.interval =setInterval( (function(){//wrap the function as object
      //after bind, "this" is loop refference
      append_task("gtfs", ".")
      if (false) clearInterval(this.interval)
  }).bind(this), 1000 );// bind the object to this (this is Loop refference)
}

function fetch_data() {  
  write_task("gtfs","Loading GTFS")
  var gtfs_interval = setInterval(() => append_task("gtfs", "."), 500);
  var p2 = fetch(`${server_url}/data/gtfs`)
  .then(function(response) {
    return response.json();
  }).then(function(myJson){
    clearInterval(gtfs_interval);
    complete_task("gtfs")
    GTFS_DATA = myJson;
    return GTFS_DATA;
  });


  write_task("tracked_trips", "Loading Tracked Trips")
  var tracked_trips_interval = setInterval(() => append_task("tracked_trips", "."), 500);

  var p1 = fetch(`${server_url}/data/tracked_trips`)
  .then(function(response) {
    return response.json();
  }).then(function(myJson){
    tracked_trips = myJson;
    console.log("Loaded Tracked Trips", tracked_trips)
    clearInterval(tracked_trips_interval);
    complete_task("tracked_trips")
    return tracked_trips;
  });


  
  Promise.all([p2, p1]).then(function(values) {
    on_gtfs_loaded();
  });
}


/* Takes a date object and returns a 24 hour formatted 4 digit number i.e 0400, 1330 */
function dateToKey(date){
  return "" + date.getFullYear()	+ "-" + ("00" + (date.getMonth()+1)).slice(-2)  + "-" + ("00" + date.getDate()).slice(-2) ;
}

function as_nice_date(date){
  isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
  return isoDate.substr(0, 10)
}

function format_long_name(route_long_name, direction){
  let spl = route_long_name.split(' - ')
  spl = [spl[0], spl[spl.length-1]];
  let route_fixed_name = direction==1 ? spl.join(' - ') : spl.reverse().join(' - ')
  return route_fixed_name;
}

function first_vis_created(){

}

function set_chart_tab(n){
  selected_tab = n;
  d3.selectAll('.tab').style('transform', 'translateY(-' + (selected_tab-1)*100+ '%)');
  d3.selectAll('.side-menu--item')
    .style("background", (d, i)=>{ return (n-1)==(i) ? "#333" : "none" })
    .style("color", (d, i)=>{ return (n-1)==(i) ? "white" : "#333" });

  for(var id in chartButtonArray){
      document.getElementById(chartButtonArray[id]).style.display="none";
  }

  document.getElementById(chartButtonArray[n-1]).style.display="flex";

  if(n<=4){
    currentGraph.setG(graphArray[n-1]);
    currentGraph.redraw();
  }

  if (n==5){
    document.getElementById("headingText").innerHTML = "Trip Tracker: View all recorded trips by Route and Trip Time.";
  }
  if (n==6){
    update_timetable();
    document.getElementById("headingText").innerHTML = "Timetable with adjusted time values based on historical data";
  }

  if (n==7){
    update_moments();
    document.getElementById("headingText").innerHTML = "Geo-visualisation of trip adherance and patrionage";
  }
}

function toggle_class(id, class_name){
  document.getElementById(id).classList.toggle(class_name);
}

function nextDay(){
  elem = document.getElementById("dateSelector")
  let d = new Date(elem.value)
  d.setDate(d.getDate() + 1);
  elem.value = dateToKey(d);
  elem.dispatchEvent(new Event('change'));
}

function previousDay(){
  elem = document.getElementById("dateSelector")
  let d = new Date(elem.value)
  d.setDate(d.getDate() - 1);
  elem.value = dateToKey(d);
  elem.dispatchEvent(new Event('change'));
}

function update_active_trips(){
  active_trips.clear();

  try{
    data = PLAYBACK_DATA[selected_city][dateToKey(selected_date)]["times"][numToTime(selected_time)]
    // TODO a timeframe from the current to be selected including n amount of pervious or future trips to detect longer term changes or patterns
    // window_data = PLAYBACK_DATA[selected_city][dateToKey(selected_date)]["times"][numToTime(selected_time)]
  }catch{
    data = {};
  }

  for (vehicleRef in data){
    let vehicle = data[vehicleRef];
    let routeId = vehicle['routeId']
    if (selected_routes.has(routeId)){
      if (vehicle['tripId'] != 'Unnasigned'){ 
        active_trips.add(vehicle['tripId']);
      }
    }
  }
}

function translate_date(da, shift){
  d = new Date(da);
  d.setDate(d.getDate() + shift);
  return d;
}

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRadians = function() {
    return this * Math.PI / 180;
  }
}

Number.prototype.toRad = function() {
  return this * Math.PI / 180;
}

Number.prototype.toDeg = function() {
  return this * 180 / Math.PI;
}