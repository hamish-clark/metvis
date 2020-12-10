/**
Class for ReliabilityGraph which shows the proportional lateness of a bus route at a
given time of day.
@author Amy Wilson
*/

function ReliabilityGraph(){

}

ReliabilityGraph.prototype = {
	elementID: "chart3",
	dataArray: [],
	updateGraph: function(p){
		this.dataArray = [];
		let maxSize = p.canvasHeight/10;
		let minSize = maxSize/4;
		let ringWidth = (maxSize*0.9-minSize)/20;
		let maxRings = (maxSize*0.9-minSize)/ringWidth;
		let ringSize = (maxSize*0.9-minSize)/maxRings;
		let days = getDays(selected_day);
		for(r in routeOrder){
			let route = routeOrder[r];
			if(!selected_routes.has(route))
				continue;
			var currentRouteArray = [];
			for(day of days){
				if(dataByWeek[day][selectedMin]==undefined)
					continue;
				for(date in dataByWeek[day][selectedMin][route]){
					if(dateOverwrite&&!(selected_date=="Invalid Date"||date==(dateToKey(selected_date))))
						continue;
					for(direction in dataByWeek[day][selectedMin][route][date]){
						for(delay in dataByWeek[day][selectedMin][route][date][direction]){
							currentRouteArray.push(dataByWeek[day][selectedMin][route][date][direction][delay]);
						}
					}
				}
			}
			let count = 1;
			let countNum = p.min(currentRouteArray.length, 20)+5;
			if(currentRouteArray.length==0){
				countNum=1;
			}
			let orderedArray = [];
			while(currentRouteArray.length>0){
				let minDelay = Math.min.apply(Math, currentRouteArray);
				orderedArray.push(minDelay);
				currentRouteArray.splice(currentRouteArray.indexOf(minDelay), 1);
			}
			let removeCount = 0;
			while(orderedArray.length>maxRings){
				//merge two together
				let merged = (orderedArray[removeCount]+orderedArray[removeCount+1])/2;
				orderedArray.splice(removeCount, 1);
				orderedArray[removeCount] = merged;
				removeCount++;
				if(removeCount>=orderedArray.length-1){
					removeCount = 0;
				}
			}
			//add to data array
			this.dataArray.push({"name": route, "value": countNum, "rings": orderedArray});
		}
	},
	drawGraph: function(p) {
		let minInnerRadius = p.graphSize[0]/30;
		pack = function(data){
			return(data = d3.pack()
    .size([p.graphSize[0], p.graphSize[1]])
		.padding(10)
  (d3.hierarchy({children: data})
    .sum(d => d.value)))
		}
		root = pack(this.dataArray);
		p.push();
		p.translate(p.border, p.border);
		for(var c in root.children){
			p.push();
			let child = root.children[c];
			p.translate(child.x, child.y);
			let r = child.r*2;
			minSize = p.max(r/4, minInnerRadius);
			p.fill(200, 0, 30);
			p.noStroke();
			p.ellipse(0, 0, r, r);
			if(child.data.rings.length>0){
				let maxRings = child.data.rings.length;
				let ringWidth = (r-minSize)/maxRings/2;
				let ringSize = (r-ringWidth-minSize)/maxRings;
				let count = 1;
				for(d in child.data.rings){
					let delay = child.data.rings[d];
					let col = getColour(delay, true);
					p.stroke(col);
					p.strokeWeight(ringWidth+2);
					p.noFill();
					p.ellipse(0, 0, minSize+(count*ringSize), minSize+(count*ringSize));
					count++;
				}
				drawText(p, [(minSize-(ringWidth/2+2))*0.9, (minSize-(ringWidth/2+2))*0.9], child.data.name, 0, 0, 100);
			}
			else{
				drawText(p, [minInnerRadius, minInnerRadius], child.data.name, 0, 0, 100);
			}
			p.pop();
		}
		p.pop();
	},
	drawHeading: function(){
    document.getElementById("headingText").innerHTML =
		 "Punctuality Range & Proportion for Given Bus Route(s) at a Given Time";
  },
	drawKey: function(p){
		let centreX = p.canvasWidth-p.border-p.keySize[0]/2;
		let stripWidth = p.keySize[0]/6;
		//start from the bottom
		let yStart = p.keySize[1]+p.border-p.keySize[1]/16;
		let fontS = drawText(p, [p.keySize[0], p.keySize[1]/16], "Bus Delay in Minutes", p.canvasWidth-p.keySize[0]/2-p.border, yStart+ p.keySize[1]/32, 105);
		//considered late
		let yStop = yStart-((p.keySize[1]*16)/32);
		for(yStart = yStart; yStart>=yStop; yStart--){
			p.stroke(getColour(p.map(yStart, yStop+((p.keySize[1]*16)/32), yStop, 600, 120), true));
			p.line(centreX-stripWidth/2, yStart, centreX+stripWidth/2, yStart);
		}
		//draw labels for late
		for(t = 120; t <= 600; t+=30){
			let l = p.floor(t/60)+":"+(t%60);
			if(t%60==0){
				l+="0";
			}
			drawText(p, [p.keySize[0], p.keySize[0]/13], l, centreX+stripWidth*1.5, p.map(t, 121, 601, yStop, yStop+((p.keySize[1]*16)/32)),105);
		}
		drawText(p, [p.keySize[0], p.keySize[1]/16], "Considered Late", centreX, yStart-p.keySize[1]/32, fontS);

		//considered on time
		yStart -= p.keySize[1]/16;
		yStop = yStart-((p.keySize[1]*5)/32);
		for(yStart = yStart; yStart>=yStop; yStart--){
			p.stroke(getColour(p.map(yStart, yStop+((p.keySize[1]*5)/32), yStop, 120, -30), true));
			p.line(centreX-stripWidth/2, yStart, centreX+stripWidth/2, yStart);
		}
		//draw labels for on time
		for(t = -30; t <= 120; t+=30){
			l = p.floor(t/60)+":"+p.abs(t%60);
			if(t%60==0){
				l+="0"
			};
			drawText(p, [p.keySize[0]/6, p.keySize[0]/13], l, (centreX+stripWidth*1.5), p.map(t, -31, 121, yStop, yStop+((p.keySize[1]*5)/32)),105);
		}
		drawText(p, [p.keySize[0], p.keySize[1]/16], "Considered on Time", centreX, yStart- p.keySize[1]/32, fontS);


		//considered early
		yStart -= p.keySize[1]/16;
		yStop = yStart-((p.keySize[1]*3)/32);
		for(yStart = yStart; yStart>=yStop; yStart--){
			p.stroke(getColour(p.map(yStart, yStop+((p.keySize[1]*3)/32), yStop, -30, -121), true));
			p.line(centreX-stripWidth/2, yStart, centreX+stripWidth/2, yStart);
		}
		//draw labels for Early
		for(t = -120; t <= -30; t+=30){
			l = p.floor(t/60)+":"+p.abs(t%60);
			if(t%60==0){
				l+="0"
			};
			drawText(p, [p.keySize[0]/6, p.keySize[0]/13], l, (centreX+stripWidth*1.5), p.map(t, -120, -31, yStop, yStop+((p.keySize[1]*3)/32)), 105);
		}
		drawText(p, [p.keySize[0], p.keySize[1]/16], "Considered Early", centreX, yStart- p.keySize[1]/32, fontS);
	}

}
