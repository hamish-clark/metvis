/**
Class for LineGraph which shows the median lateness of a bus route at a
given time of day, as well as the rnage of values at that time.
@author Amy Wilson
*/

function RangeGraph(){

}

RangeGraph.prototype = {
	baseLine: 0,
	inBounds: false,
	currentMouse: 0,
	startingMouse: 0,
	minDistance: 20,
	medianSize: 6,
	elementID: "chart1",
	
	updateGraph: function(p){
		p.values = [];
		let days = getDays(selected_day);
		for(day of days){
			for(t in dataByWeek[day]){
				if(!(t >= p.minMins && t <= p.maxMins))
					continue;
				if(p.values[t] == undefined){
					p.values[t] = [];
					p.values[t]["Count"] = [];
					p.values[t]["Median"] = [];
					p.values[t]["Min"] = Math.min();
					p.values[t]["Max"] = Math.max();
				}
				for(selectedRoute in dataByWeek[day][t]){
					if(!selected_routes.has(selectedRoute))
						continue;
					var currentTimeArray = [];
					for(date in dataByWeek[day][t][selectedRoute]){
						if(!dateOverwrite||(dateOverwrite&&selected_date=="Invalid Date"||date==(dateToKey(selected_date)))){
							for(direction in dataByWeek[day][t][selectedRoute][date]){
								for(d in dataByWeek[day][t][selectedRoute][date][direction]){
									currentTimeArray.push(dataByWeek[day][t][selectedRoute][date][direction][d]);
								}
							}
						}
					}
					if(p.values[t]["Count"][selectedRoute]==undefined){
						let m = getMedian(currentTimeArray);
						if(m!=-500){
							p.values[t]["Median"][selectedRoute] = m;
							p.values[t]["Count"][selectedRoute] = 1;
						}

					}
					else{
						let newMedian = getMedian(currentTimeArray);
						if(newMedian!=-500){
							p.values[t]["Count"][selectedRoute] += 1;
							p.values[t]["Median"][selectedRoute] += newMedian;
						}
					}
					p.values[t]["Min"] = p.min(p.values[t]["Min"], Math.min.apply(Math, currentTimeArray));
					p.values[t]["Max"] = p.max(p.values[t]["Max"], Math.max.apply(Math, currentTimeArray));
					if(p.values[t]["Max"] == Math.max()){
						p.values[t]["Min"] = 0;
						p.values[t]["Max"] = 0;
					}
				}
			}
		}
	},
	
	drawGraph: function(p){
		//values for bounds of graph where data goes not the bordering rectangle
		let graphLeft = p.border*2;
		let graphRight = p.canvasWidth-p.border-10;
		let graphTop = p.border*2;
		let graphBottom = p.canvasHeight-p.border*3;
		this.baseLine = graphTop+((graphBottom-graphTop)/12)*10;
		p.spacing = (graphRight-graphLeft)/((p.maxMins-p.minMins)/roundedMin);
		p.colorMode(p.HSL, 360, 100, 100, 100);
		p.noFill();
		p.strokeWeight(1);
		//draw outer rectangle
		p.stroke(0, 0, 40);
		p.rect(graphLeft, p.border, graphRight-graphLeft, p.canvasHeight-p.border*3);
		//draw lines for each 1 minute segment;
		for(i = 0; i <= 12; i++){
			let yPos = graphTop+((graphBottom-graphTop)/12)*i;
			drawText(p, [p.border, p.border], ""+(10-i), p.border, yPos, 105);
			p.stroke(200);
			p.line(graphLeft, yPos, graphRight,yPos);
		}
		p.stroke(0, 100, 50);
		p.line(graphLeft, this.baseLine, graphRight, this.baseLine);
		//draw range shape
		p.beginShape();
		p.noStroke();
		p.fill(200, 0, 50, 40);
		let count = 0;
		let backwards = [];
		for(t in p.values){
			let yPos = p.map(p.values[t]["Max"], -120, 600, graphBottom, graphTop);
			p.vertex(graphLeft+p.spacing*count, yPos);
			backwards.push(t);
			count++;
		}
		while(backwards.length>0){
			let val = p.values[backwards.pop()]["Min"];
			count--;
			let yPos = p.map(val, -120, 600, graphBottom, graphTop);
			p.vertex(graphLeft+p.spacing*count, yPos);
		}
		p.endShape();
		//draw medians
		count = 0;
		for(t in p.values){
			p.stroke(0, 0, 40, 30);
			p.strokeWeight(1);
			if(t%60==0){
				let timeText = "0" + t/60 + ":00";
				timeText = timeText.slice(-5, timeText.length);
				drawText(p, [p.graphSize[0]/20, p.graphSize[1]/20], timeText,
					graphLeft+count*p.spacing,p.canvasHeight-p.border*2+15, 105);
					 p.stroke(0, 0, 60, 50);
			}
			p.line(graphLeft+count*p.spacing, graphTop,
				graphLeft+count*p.spacing, p.canvasHeight-p.border*2+5);
			for(route in p.values[t]["Median"]){
				p.fill(GTFS_DATA[selected_city]["colours"][route]);
				p.stroke(GTFS_DATA[selected_city]["colours"][route]);
				if(p.values[t]["Median"][route]!=undefined){
					let yPos = p.map(p.values[t]["Median"][route]/p.values[t]["Count"][route],
					-120, 600, graphBottom, graphTop);
					p.ellipse(graphLeft+p.spacing*count, yPos, this.medianSize, this.medianSize);
					if(p.values[t-roundedMin]!=null && p.values[t-roundedMin]["Median"][route]!=null){
						//draw line
						p.line(graphLeft+p.spacing*(count -1),
						p.map(p.values[t-roundedMin]["Median"][route]/p.values[t-roundedMin]["Count"][route],
						-120, 600, graphBottom, graphTop), graphLeft+p.spacing*count,
						 yPos);
					}
				}

			}
			count++;
		}
	},
	drawKey: function(p){
		drawText(p, [p.canvasWidth/5, p.border*1], "<< Drag to Adjust Lower Bounds >>", p.border+p.canvasWidth/4, p.canvasHeight-p.border/2, 105);
		drawText(p, [p.canvasWidth/5, p.border*1], "<< Drag to Adjust Upper Bounds >>", p.border+p.canvasWidth*3/4, p.canvasHeight-p.border/2, 105);
	},
	drawHeading: function(){
    document.getElementById("headingText").innerHTML =
		"Range and Median of Delay in Minutes for Given Bus Route(s) Between Given Times";
  },
	mousePressed: function(p){
		if(p.mouseX>=0&&p.mouseX<p.canvasWidth&&p.mouseY>=0&&p.mouseY<p.canvasHeight){
			this.inBounds = true;
		}
		this.currentMouse = p.mouseX;
		this.startingMouse = p.mouseX;
	},

	mouseDragged: function(p){
		let distanceMoved = (this.currentMouse-p.mouseX);
		if(this.inBounds){
			if(p.abs(distanceMoved)>=this.minDistance){
				if(this.startingMouse>=p.canvasWidth/2&&this.startingMouse<p.canvasWidth){
					//update max value
					p.maxMins = p.min(p.max(p.minMins+60, p.maxMins+60*
						p.floor(distanceMoved/this.minDistance)), 1380);
				}
				else if(this.startingMouse>=0&&this.startingMouse<p.canvasWidth/2){
					//update min value
					p.minMins = p.min(p.max(360, p.minMins+60*
						p.floor(distanceMoved/this.minDistance)), p.maxMins-60);
				}
				this.currentMouse = p.mouseX;
				p.updateGraph();
				p.draw();
			}
		}
	},

	mouseReleased: function(p){
		this.inBounds = false;
	}
}
