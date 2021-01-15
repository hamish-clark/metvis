/**
Class for SpatialGraph which shows the distance a bus stop is from the city
centre and plots all of the early and late values.
@author Amy Wilson
*/

let testP = new p5();
let exactCentre = [-41.280298, 174.775900];
let show_early = true;
let show_late = true;
let overlay = false;

function SpatialGraph(){
	for(var trips in GTFS_DATA[selected_city]["tracked_trips"]){
		//use trip in first date as they are all the same
		let defaultTrip = GTFS_DATA[selected_city]["tracked_trips"][trips][Object.keys(GTFS_DATA[selected_city]["tracked_trips"][trips])[0]];
		//get centre point
		let centrePoint = GTFS_DATA[selected_city]["stop_times"][trips][0];
		let centreStop = GTFS_DATA[selected_city]["stops"][GTFS_DATA[selected_city]["stop_times"][trips][0]["stop_id"]];
		let centreDistance = 10000;
		for(var points in GTFS_DATA[selected_city]["stop_times"][trips]){
			let currentPoint = GTFS_DATA[selected_city]["stop_times"][trips][points];
			let currentStop = GTFS_DATA[selected_city]["stops"][GTFS_DATA[selected_city]["stop_times"][trips][points]["stop_id"]];
			let newDistance = Math.abs(testP.dist(exactCentre[0], exactCentre[1], currentStop["stop_lat"], currentStop["stop_lon"]));
			if(newDistance<centreDistance){
				centreDistance = newDistance;
				centreStop = currentStop;
				centrePoint = currentPoint;
			}
		}
		let centreArrival = centrePoint["arrival_time"]/60;
		//compare to centre point
		for(var points in defaultTrip){
			let currentPoint = GTFS_DATA[selected_city]["stop_times"][trips][points];
			let routeCode = GTFS_DATA[selected_city]["trips"][trips]["route_id"];
			let route = GTFS_DATA[selected_city]["routes"][routeCode]["route_short_name"];
			let stop = currentPoint["stop_id"];
			//calculate in minutes
			let mins = currentPoint["arrival_time"]/60;
			let difference = centreArrival - mins;
			if(this.stopList[route] == undefined){
				this.stopList[route] = [];
			}
			this.stopList[route][stop] = difference;
		}
	}
}


SpatialGraph.prototype = {
	stopList: {},
	elementID: "chart5",
	data: [],
	updateGraph: function(p){
		//tripData[day][date][routeID][tripID].push([time, absoluteDelay, relativeDelay, lat, long, stopID, newTime]);
		this.data = tripData;
		p.values = {};
		let days = getDays(selected_day);
		for(day of days){
			for(date in this.data[day]){
				if(dateOverwrite&&!(selected_date=="Invalid Date"||date==(dateToKey(selected_date))))
					continue;
				for(route in this.data[day][date]){
					if(!selected_routes.has(route))
						continue;
					if(p.values[route]==undefined){
						p.values[route]=[];
					}
					for(trip in this.data[day][date][route]){
						p.values[route].push(this.data[day][date][route][trip]);
					}
				}
			}
		}
	},

	drawGraph: function(p) {
		let ySpread = p.graphSize[1]/Object.keys(p.values).length;
		let yCount = 0;
		let stopHeight = p.min(ySpread/3, p.graphSize[1]/4);
		let ellipseSize = p.map(Object.keys(p.values).length, 1, 33, p.graphSize[1]/30, p.graphSize[1]/80);
		if(overlay){
			stopHeight = p.graphSize[1]/3;
		}
		for(var route in p.values){
			if(!selected_routes.has(route))
				continue;
			let min = p.border+p.graphSize[0];
			let max = p.border;
			let yPos = (p.border+p.graphSize[1]/2)-(ySpread*(Object.keys(p.values).length-1)/2)+yCount*ySpread;
			if(overlay){
				yPos = p.border+p.graphSize[1]/2;
			}
			//get colour
			p.strokeWeight(1);
			for(var stop in this.stopList[route]){
				let currentMins = this.stopList[route][stop];
				let xPos = p.map(Math.max(-50, Math.min(currentMins, 50)), -50, 50, p.border+p.graphSize[0], p.border);
				p.stroke(100, 100, 100);
				if(!overlay||currentMins==0){
					p.stroke(GTFS_DATA[selected_city]["colours"][route]);
					//line for both directions
					if(currentMins==0){
						p.stroke(100);
						p.strokeWeight(5);
					}
					p.line(xPos, yPos-stopHeight, xPos, yPos+stopHeight);
				}
				min = p.min(min, xPos);
				max = p.max(max, xPos);
				p.strokeWeight(2);
				p.line(min, yPos, max, yPos);
			}
			yCount++;
			p.noStroke();
			//go through tracked trips and draw trips corresponding to that route
			for(var trip in p.values[route]){
				for(var d in p.values[route][trip]){
					//if inbound, draw on top.
					//if outbound, draw below
					let delay = p.values[route][trip][d][1];
					let timeMins = p.values[route][trip][d][4];
					let direction = p.values[route][trip][d][5];
					if(((delay<-30&&show_early)||(delay>120&&show_late))){
						let colour = getColour(delay, true);
						p.fill(colour[0], colour[1], colour[2], 30);
						let newYPos = yPos+stopHeight/2;
						if(direction=="Inbound"){
							newYPos-=stopHeight;
						}
						let currentStop = this.stopList[route][p.values[route][trip][d][3]];
						let currentStopIndex = Object.keys(this.stopList[route]).indexOf(p.values[route][trip][d][3]);
						let previousStop = this.stopList[route][Object.keys(this.stopList[route])[p.max(0, currentStopIndex-1)]];
						let nextStop = this.stopList[route][Object.keys(this.stopList[route])[p.min(currentStopIndex+1, this.stopList[route].length-1)]];
						let prevX = p.map(Math.max(-50, Math.min(previousStop, 50)), -50, 50, p.border+p.graphSize[0], p.border);
						let nextX = p.map(Math.max(-50, Math.min(nextStop, 50)), -50, 50, p.border+p.graphSize[0], p.border);
						let delayX = p.map(Math.max(-50, Math.min(currentStop, 50)), -50, 50, p.border+p.graphSize[0], p.border);
						//jitter the x and y to show everything
						let jitterY = stopHeight/2;
						let jitterLeft = Math.abs((prevX-delayX)/2);
						let jitterRight = Math.abs((nextX-delayX)/2);
						if(prevX <= delayX && delayX <= nextX){
								delayX += p.random(-jitterLeft, jitterRight);
						}
						newYPos += p.random(-jitterY, jitterY);
						p.ellipse(delayX, newYPos, ellipseSize, ellipseSize);
					}

				}
			}
		}
	},
	drawHeading: function(){
    document.getElementById("headingText").innerHTML =
		"Location of Buses Not to Schedule in Relation to the City Centre";
  },
	drawKey: function(p){
		let centreX = p.border*2+p.graphSize[0]+p.keySize[0]/2;
		let yPos = p.border+p.graphSize[1]/10;
		//Inbound
		p.stroke(0, 0, 100);
		p.strokeWeight(5);
		p.line(centreX-p.keySize[0]/3, yPos, centreX+p.keySize[0]/3, yPos);
		p.fill(0, 0, 100);
		for(i = 0; i < 10; i++){
			p.ellipse(centreX+Math.sin(i*10)*p.keySize[0]/3, yPos-Math.abs(Math.sin(i)*p.keySize[0]/5), 5, 5);
		}
		yPos+=p.keySize[1]/10;
		drawText(p, [p.keySize[0], p.keySize[1]/4], "Inbound Trips", centreX, yPos-p.keySize[1]/20, 100);
		//outbound
		p.stroke(0, 0, 100);
		p.strokeWeight(5);
		yPos+=p.keySize[1]/15;
		p.line(centreX-p.keySize[0]/3, yPos, centreX+p.keySize[0]/3, yPos);
		p.fill(0, 0, 100);
		for(i = 0; i < 10; i++){
			p.ellipse(centreX+Math.sin(i*10)*p.keySize[0]/3, yPos+Math.abs(Math.sin(i)*p.keySize[0]/5), 5, 5);
		}
		yPos+=p.keySize[1]/15;
		drawText(p, [p.keySize[0], p.keySize[1]/4], "Outbound Trips", centreX, yPos, 100);
		//early
		p.fill(getColour(-60, true));
		p.noStroke();
		yPos+=p.keySize[1]*3/20;
		p.ellipse(centreX, yPos, p.keySize[0]/5, p.keySize[0]/5);
		yPos+=p.keySize[1]/15;
		drawText(p, [p.keySize[0], p.keySize[1]/4], "Early Trips", centreX, yPos, 100);
		//late
		yPos+=p.keySize[1]/7;
		p.fill(getColour(300, true));
		p.noStroke();
		p.ellipse(centreX, yPos, p.keySize[0]/5, p.keySize[0]/5);
		yPos+=p.keySize[1]/15;
		drawText(p, [p.keySize[0], p.keySize[1]/4], "Late Trips", centreX, yPos, 100);
		yPos+=p.keySize[1]/10;
		p.stroke(100);
		p.strokeWeight(5);
		p.line(centreX, yPos-p.keySize[1]/30, centreX, yPos+p.keySize[1]/30);
		yPos+=p.keySize[1]/10;
		drawText(p, [p.keySize[0], p.keySize[1]/4], "City Centre", centreX, yPos, 100);
	}
}
