/**
The heat map output has a layer to show the Relative lateness at each point.
The value toggle enables Actual lateness instead of Relative. The Proportion
toggle enables raw numbers instead of Proportion
HeatMap uses PLAYBACK_DATA & GTFS_DATA.
@author Amy Wilson
*/

let numLabels = 2;
let heatmap;
let valueType = "Relative";
let numberType = "Frequency";
let tripData = {'0':[], '1':[], '2':[], '3':[], '4':[], '5':[], '6':[]};
//assign gradient
let g = ['rgba(255, 100, 0, 0)', 'rgba(255, 50, 0, 0.25)', 'rgba(255, 0, 0, 0.5)',
'rgba(255, 0, 0, 0.75)', 'rgba(255, 0, 0, 1)', 'rgba(205, 0, 0, 1)', 'rgba(155, 0, 0, 1)'];

function HeatMap(){
  //assign radius
  let r = 50;
  //assign opacity
  let o = 0.8;
  //create new heatmap
  heatmap = new google.maps.visualization.HeatmapLayer(
    {data: this.values[valueType][numberType], map: hmap, opacity: o,
      gradient: g, radius: r});
  //update data used
  this.setData(3);
}

HeatMap.prototype = {
  textValues: {"Relative":
  {"Frequency": "Amount of Buses Running Later than the Previous Stop"},
  "Actual": {"Frequency": "Amount of Buses Running Late"}},
  values: {"Relative": {"Frequency": []},
  "Actual": {"Frequency": []}},
  numLabelValues: {"Frequency": 2},
  densityValues: [],
  setData: function(rounding){
    let lastDelay = 0;
      for(date in PLAYBACK_DATA[selected_city]){
        for(mins in PLAYBACK_DATA[selected_city][date]["times"]){
          for(trip in PLAYBACK_DATA[selected_city][date]["times"][mins]){
            let delay = PLAYBACK_DATA[selected_city][date]["times"][mins][trip]["DelaySeconds"];
            let lat = PLAYBACK_DATA[selected_city][date]["times"][mins][trip]["Lat"];
            let long = PLAYBACK_DATA[selected_city][date]["times"][mins][trip]["Long"];
            let routeID = PLAYBACK_DATA[selected_city][date]["times"][mins][trip]["routeId"];
            let tripID = PLAYBACK_DATA[selected_city][date]["times"][mins][trip]["tripId"];
            let stopID = PLAYBACK_DATA[selected_city][date]["times"][mins][trip]["nearestStop"];
            if(stopID=="null")
              continue;
            let time = new Date(PLAYBACK_DATA[selected_city][date]["times"][mins][trip]["RecordedAtTime"]);
            let dir = PLAYBACK_DATA[selected_city][date]["times"][mins][trip]["Direction"];
            let day = time.getDay();
            if(tripData[day][date]==undefined){
              tripData[day][date] = [];
            }
            if(tripData[day][date][routeID]==undefined){
              tripData[day][date][routeID] = [];
            }
            if(tripData[day][date][routeID][tripID]==undefined){
              tripData[day][date][routeID][tripID] = [];
            }
            let ActualDelay = Math.min(600, Math.max(delay, -120));
            let RelativeDelay = ActualDelay-lastDelay;
            //only include if not early getting less early
            if(ActualDelay<0){
              RelativeDelay = 0;
            }
            lastDelay = ActualDelay;
            let h = mins.slice(0, 2);
      			let m = mins.slice(2, 4);
      			h *=60;
      			m = Math.floor(m/rounding)*rounding;

      			let newTime = h + m;
            tripData[day][date][routeID][tripID].push(
              [time, ActualDelay, RelativeDelay, stopID, newTime, dir]);
          }
      }
    }
    this.updateData();
  },
  updateData: function(){
    //update which routes are being shown
    //update days being shown
    //tripData[day][date][routeID][tripID].push([time, ActualDelay,
    //RelativeDelay, lat, long, stopID, newTime]);
    this.values= {"Relative": {"Frequency": []},
    "Actual": {"Frequency": []}};
    this.totalValues = {};
		let days = getDays(selected_day);
		for(var today of days){
      for(d in tripData[today]){
        if(dateOverwrite&&selected_date!="Invalid Date"&&d!=(dateToKey(selected_date)))
          continue;
        for(selectedRoute in tripData[today][d]){
					if(!selected_routes.has(selectedRoute))
						continue;
          for(var trip in tripData[today][d][selectedRoute]){
						for(var circle in tripData[today][d][selectedRoute][trip]){
              let current = tripData[today][d][selectedRoute][trip][circle];
              let absDelay = current[1];
              let relDelay = current[2];
              let mins = current[4];
              let stop = current[3];
              if(mins==selectedMin){
                let lat = GTFS_DATA[selected_city]["stops"][stop]["stop_lat"];
                let lon = GTFS_DATA[selected_city]["stops"][stop]["stop_lon"];
                let latLon = new google.maps.LatLng(lat, lon);
                let absDelayWeight = Math.max(0, testp5.map(absDelay, 119, 601, 0, 481));
                let relDelayWeight = Math.max(0, relDelay);
                if(this.totalValues[stop]==undefined){
                  this.totalValues[stop] = {"Relative": [], "Actual": []};
                }
                //add weight as zero if no delay or no Relative delay
                this.totalValues[stop]["Actual"].push({location: latLon,
                  weight: absDelayWeight});
                this.totalValues[stop]["Relative"].push({location: latLon,
                  weight: relDelayWeight});
              }
						}
          }
				}
      }
		}
    //average out data
    for(var stop in this.totalValues){
      for(var valType in this.totalValues[stop]){
        let stopCount = 0;
        for(var delay in this.totalValues[stop][valType]){
          if(this.totalValues[stop][valType][delay]["weight"]>0){
            this.totalValues[stop][valType][delay]["weight"] = 1;
            this.values[valType]["Frequency"].push(
              this.totalValues[stop][valType][delay]);
            stopCount++;
          }
        }
      }
    }
    heatmap.setData(this.values[valueType][numberType]);
    // this.drawHeading();
    this.drawKey();
  },
  drawHeading: function(){
    document.getElementById("headingText").innerHTML = this.textValues[valueType][numberType];
  },
  drawKey: function(){
    //draw gradient
    var w = document.getElementById("heatmapKey").offsetWidth/3,
    h = document.getElementById("heatmapKey").offsetHeight,
    z = 1,
    y = h / z,
    g = [[255, 100, 0, 0], [255, 50, 0, 0.25], [255, 0, 0, 0.5],
    [255, 0, 0, 0.75], [255, 0, 0, 1], [205, 0, 0, 1], [155, 0, 0, 1]];
    d3.select("svg").remove()
    d3.select("svg").remove()
    var svg = d3.select("#heatmapKey").append("svg")
    .attr("width", w)
    .attr("height", h);

    svg.append("rect")
    .attr("width", w)
    .attr("height", h)
    .style("fill", "rgb(255, 255, 255)");

    svg.selectAll("rect")
    .data(d3.range(h*1))
    .enter().append("rect")
    .attr("transform", function(d){
      return "translate(0," + (d % y) * z + ")";
    })
    .attr("width", w)
    .attr("height", z)
    .style("fill", function(d) {
      var index = testp5.map(d, 0, h, 0, g.length-1);
      var r = testp5.map(index, Math.floor(index), Math.ceil(index), g[Math.floor(index)][0], g[Math.ceil(index)][0]);
      var green = testp5.map(index, Math.floor(index), Math.ceil(index), g[Math.floor(index)][1], g[Math.ceil(index)][1]);
      var b = testp5.map(index, Math.floor(index), Math.ceil(index), g[Math.floor(index)][2], g[Math.ceil(index)][2]);
      if(index%1==0){
        r = g[index][0];
        green = g[index][1];
        b = g[index][2];
      }
      return d3.rgb(r, green, b);
    })
    .style("opacity", function(d) {
      var index = testp5.map(d, 0, h, 0, g.length-1);
      var o = testp5.map(index, Math.floor(index), Math.ceil(index), g[Math.floor(index)][3], g[Math.ceil(index)][3]);
      if(index%1==0){
        o = g[index][3];
      }
      return o;
    })

    //add lines
    var labelsvg = d3.select("#heatmapKey").append("svg")
    .attr("width", w)
    .attr("height", h+20)
    .attr("transform", "translate(0, 10)")

    labelsvg.selectAll("rect")
    .data(d3.range(numLabels*1))
    .enter().append("rect")
    .attr("transform", function(d){
      return "translate(" + 0 + "," + (10+testp5.map(d, 0, numLabels-1, 0, h)) + ")";
    })
    .attr("width", w/4)
    .attr("height", 1)
    .style("fill", "rgb(0, 0, 0)")
    .style("opacity", 1.0)

    //add labels
    labelsvg.selectAll("text")
    .data(d3.range(numLabels*1))
    .enter().append("text")
    .attr("x", w/3)
    .attr("y", function(d) { return 15+testp5.map(d, 0, numLabels-1, 0, h); })
    .text(this.getLabel)
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px")
    .attr("fill", "black");


  },
  getLabel: function(d){
    if(numberType=="Proportion"){
      //11 labels every 10 percent
      return d*10;
    }
    if(d==0){
      return "Low";
    }
    return "High";
  },
  toggleValue: function(){
    if(valueType=="Relative"){
      valueType = "Actual";
    }
    else{
      valueType = "Relative";
    }
    heatmap.setData(this.values[valueType][numberType]);
    this.drawKey();
    this.drawHeading();
  },
  toggleNumber: function(newType){
    numberType = newType;
    heatmap.setData(this.values[valueType][numberType]);
    numLabels = this.numLabelValues[numberType];
    this.drawKey();
    // this.drawHeading();
  },
}
