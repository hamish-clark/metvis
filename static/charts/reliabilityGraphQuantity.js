/**
Class for QuantityGraph which shows the median lateness of a bus route at a
given time of day.
@author Amy Wilson
*/

let minInnerRadius = 0;

function QuantityGraph(p){

}

QuantityGraph.prototype = {
	elementID: "chart2",
	hovered: null,
	selected: null,
	dataArray: [],
	updateGraph: function(p){
		p.values = [];
		this.dataArray = [];
		selected_routes.forEach(p.addRoute);
		let days = getDays(selected_day);
		for(day of days){
			for(route in dataByWeek[day][selectedMin]){
				if(!selected_routes.has(route))
					continue;
				for(date in dataByWeek[day][selectedMin][route]){
					if(dateOverwrite&&!(selected_date=="Invalid Date"||date==(dateToKey(selected_date))))
						continue;
					for(direction in dataByWeek[day][selectedMin][route][date]){
						for(d in dataByWeek[day][selectedMin][route][date][direction]){
							if(p.values[route]==undefined){
								p.values[route] = [];
							}
							p.values[route].push(dataByWeek[day][selectedMin][route][date][direction][d]);
						}
					}
				}
			}
		}
		for(var r in p.values){
			let n = p.values[r];
			let m = getMedian(n);
			let countNum = p.min(100, n.length)+5;
			if(n.length==0){
				countNum=1;
			}
			//add to data array
			this.dataArray.push({"name": r, "value": countNum,
			"median": m, "variance": getVariance(n, m)});
		}
	},

	drawGraph: function(p) {
		p.strokeCap(p.SQUARE);
		minInnerRadius = p.graphSize[0]/25;
		pack = function(data){
			return(data = d3.pack()
    .size([p.graphSize[0], p.graphSize[1]])
		.padding(30)
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
			let r = Math.max(minInnerRadius, child.r*2);
			minSize = p.max(r/4, minInnerRadius);
			let route = child.data.name;
			let transparency = 0;
			if(this.selected!=null){
					transparency = 95;
			}
			if(this.hovered!=null&&this.hovered.data.name==route&&root.children.length>1){
				r*=1.2;
			}
			let l = false;
			if(c<=2){
				l = true;
			}
			this.drawGlyph(p, 0, 0, r, minSize, child, l);
			p.noStroke();
			p.fill(backgroundColour[0], backgroundColour[1], backgroundColour[2], transparency);
			p.ellipse(0, 0, p.max(minInnerRadius, r*1.2), p.max(minInnerRadius, r*1.2));
			p.pop();
		}
		p.pop();
		if(this.selected!=null){
			yPos = p.border+p.graphSize[1]/2;
			xPos = p.border+p.graphSize[0]/2;
			maxSize = p.graphSize[1]*0.8;
			minSize = maxSize/4;
			this.drawGlyph(p, xPos, yPos, maxSize, minSize, this.selected, true);
		}
	},
	drawGlyph: function(p, xPos, yPos, maxSize, minSize, routeArray, labels){
		let median = routeArray.data.median;
		//only draw if data
		if(median!=-500){
			//draw labels
			p.noStroke();
			p.fill(255, 5);
			p.ellipse(xPos, yPos, maxSize*1.1, maxSize*1.1);
			p.push();
			p.translate(xPos, yPos);
			p.rotate(-129);
			for(let m = -2; m <= 10; m++){
				p.strokeWeight(2);
				p.stroke(255, 30);
				p.line(0, 0, maxSize*0.45, 0);
				if((m%2==0)&&(labels||this.selected==routeArray.data.name)){
					p.push();
					p.translate(maxSize*0.45+maxSize/20, 0);
					p.rotate(-19*m+90);
					drawText(p, [maxSize/10, maxSize/10], m+"", 0, 0, 105);
					p.pop();
				}
				p.rotate(19);
			}
			p.pop();
			let handAngle = p.map(median, -120, 600, -129, 99);
			p.noStroke();
			let variance = routeArray.data.variance;
			let varOpacity = p.map(Math.min(variance, 300), 0, 300, 100, 20);
			let varAngle = 19*Math.min(variance/60, 5);
			let medCol = getColour(median, true);
			p.fill(medCol[0], medCol[1], medCol[2], varOpacity);
			p.arc(xPos, yPos, maxSize*0.9, maxSize*0.9, handAngle-varAngle, handAngle+varAngle);
			p.stroke(255);
			p.strokeWeight(3);
			p.push();
			p.translate(xPos, yPos);
			p.rotate(handAngle);
			p.line(maxSize*0.55, 0, 0, 0);
			p.pop();
			if(labels||this.selected==routeArray){
				drawText(p, [maxSize/1.5, maxSize/1.5],
					"Median of " + p.floor(median/60)+" Minutes and "+ p.floor(median%60) +" Seconds Off Schedule",
					p.border+p.graphSize[0]/2,p.canvasHeight-p.border*1.5, 100);
				drawText(p, [maxSize/1.5, maxSize/1.5],
					"Median Absolute Deviation of " + p.floor(variance/60)+" Minutes and "+ p.floor(variance%60) + " Seconds",
					p.border+p.graphSize[0]/2,p.canvasHeight-p.border/2, 100);
			}
			//draw coloured circle
			p.strokeWeight(maxSize/40);
			p.stroke(GTFS_DATA[selected_city]["colours"][routeArray.data.name]);
			p.fill(backgroundColour);
			p.ellipse(xPos, yPos, minSize*1.3, minSize*1.3);
		}
		else{
			let col = GTFS_DATA[selected_city]["colours"][routeArray.data.name];
			p.stroke(col);
			p.strokeWeight(2);
			p.noFill();
			p.ellipse(xPos, yPos, maxSize, maxSize);
		}
		drawText(p, [minSize*0.8, minSize*0.8], routeArray.data.name, xPos, yPos, 100);

	},
	mouseMoved: function(p){
		if(this.selected==null){
			let h = null;
			for(var c in root.children){
				p.push();
				let child = root.children[c];
				let xPos = child.x
				let yPos = child.y;
				let r = child.r;
				if(p.mouseX<xPos+r+p.border&&p.mouseX>xPos-r+p.border&&
					p.mouseY<yPos+r+p.border&&p.mouseY>yPos-r+p.border){
						h = child;
						break;
				}
			}
			if(h!=this.hovered){
				this.hovered = h;
				this.updateGraph(p);
				p.redraw();
			}
		}
	},
	mousePressed: function(p){
		if(this.selected==this.hovered){
			this.selected=null;
		}
		else{
				this.selected = this.hovered;
		}
		this.updateGraph(p);
		p.redraw();
	},
	drawHeading: function(){
    document.getElementById("headingText").innerHTML = "Median & Absolute Deviation of Delay for Given Bus Route(s) at a Given Time";
  },
	drawKey: function(p){
		//colour gradient
		let centreX = p.canvasWidth-p.border-p.keySize[0]/2;
		let stripWidth = p.keySize[0]/4;
		//start from the bottom
		let yStart = p.keySize[1]+p.border-p.keySize[1]/2;
		let fontS = drawText(p, [p.keySize[0], p.keySize[1]/16], "Bus Delay in Minutes", p.canvasWidth-p.keySize[0]/2-p.border, yStart+ p.keySize[1]/32, 105);
		//considered late
		let yStop = yStart-((p.keySize[1]*8)/32);
		for(yStart = yStart; yStart>=yStop; yStart--){
			p.stroke(getColour(p.map(yStart, yStop+((p.keySize[1]*8)/32), yStop, 600, 120), true));
			p.line(centreX-stripWidth/2, yStart, centreX+stripWidth/2, yStart);
		}
		//draw labels for late
		for(t = 120; t <= 600; t+=60){
			let l = ""+p.floor(t/60);
			drawText(p, [p.keySize[0], p.keySize[0]/10], l, centreX+stripWidth, p.map(t, 121, 601, yStop, yStop+((p.keySize[1]*8)/32)),105);
		}
		//considered on time
		yStart -= p.keySize[1]/30;
		yStop = yStart-((p.keySize[1]*2.5)/32);
		for(yStart = yStart; yStart>=yStop; yStart--){
			p.stroke(getColour(p.map(yStart, yStop+((p.keySize[1]*5)/32), yStop, 120, -30), true));
			p.line(centreX-stripWidth/2, yStart, centreX+stripWidth/2, yStart);
		}
		//draw labels for on time
		for(t = 0; t <= 120; t+=60){
			l = ""+p.floor(t/60);
			drawText(p, [p.keySize[0]/6, p.keySize[0]/10], l, (centreX+stripWidth), p.map(t, -31, 121, yStop, yStop+((p.keySize[1]*2.5)/32)),105);
		}
		//considered early
		yStart -= p.keySize[1]/30;
		yStop = yStart-((p.keySize[1]*1.5)/32);
		for(yStart = yStart; yStart>=yStop; yStart--){
			p.stroke(getColour(p.map(yStart, yStop+((p.keySize[1]*1.5)/32), yStop, -30, -121), true));
			p.line(centreX-stripWidth/2, yStart, centreX+stripWidth/2, yStart);
		}
		//draw labels for Early
		for(t = -120; t <= -30; t+=60){
			l = ""+p.floor(t/60);
			drawText(p, [p.keySize[0]/6, p.keySize[0]/10], l, (centreX+stripWidth), p.map(t, -120, -31, yStop, yStop+((p.keySize[1]*1.5)/32)), 105);
		}
		yPos = p.border+p.graphSize[1]/1.55;
		//median /delay in minutes
		//spread = MAD
		//draw 2 glyphs
		for(let i = 0; i < 2; i ++){
			//shift yPos
			//draw ellipse
			maxSize = p.keySize[1]*1.5/11;
			minSize = maxSize/4;
			p.fill(30);
			p.ellipse(centreX, yPos, maxSize, maxSize);
			p.fill(50);
			let handAngle = p.map(300, -120, 600, -129, 99);
			if(i ==1){
				p.fill(100);
			}
			p.arc(centreX, yPos, maxSize*0.8, maxSize*0.8, handAngle-50, handAngle+50);
			p.noFill();
			//draw median
			p.stroke(50);
			if(i ==0){
				p.stroke(100);
			}
			p.strokeWeight(5);
			p.push();
			p.translate(centreX, yPos);
			p.rotate(handAngle);
			p.line(minSize/2, 0, maxSize/2, 0);
			p.pop();
			//draw inner ring
			p.noStroke();
			p.fill(0, 0, 50);
			p.ellipse(centreX, yPos, minSize*1.5, minSize*1.5);
			p.fill(backgroundColour);
			p.ellipse(centreX, yPos, minSize*1.1, minSize*1.1);
			yPos += p.keySize[1]*2/9;
		}
		//draw text
		yPos = p.border+p.keySize[1]-p.keySize[1]/30;
		t = drawText(p, [p.keySize[0], p.keySize[1]/20], "Median Punctuality", centreX, yPos, 105);
		drawText(p, [p.keySize[0], p.keySize[1]/20], "Deviation Range", centreX, yPos+t, t);
		yPos -= p.keySize[1]*2/9;
		drawText(p, [p.keySize[0], p.keySize[1]/20], "Median Punctuality", centreX, yPos, t);

	}
}
