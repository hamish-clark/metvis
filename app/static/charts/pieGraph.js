/**
Class for PieGraph which shows the lateness variance of a bus route across the
whole day.
@author Amy Wilson
*/

function PieGraph(){

}

PieGraph.prototype = {
	elementID: "chart4",
	hovered: null,
	selected: null,
	dataArray: [],
	updateGraph: function(p){
		//values stores median for appropriate range of days/dates
		p.values = [];
		this.dataArray = [];
		selected_routes.forEach(p.addRoute);
		let days = getDays(selected_day);
		for(day of days){
			for(m in dataByWeek[day]){
				if(m >= 360){
					for(route in dataByWeek[day][m]){
						if(!selected_routes.has(route))
							continue;
						if(p.values[route]==undefined){
							p.values[route]=[];
						}
						if(p.values[route][m]==undefined){
							p.values[route][m]=[];
						}
						for(date in dataByWeek[day][m][route]){
							if(dateOverwrite&&!(selected_date=="Invalid Date"||date==(dateToKey(selected_date))))
								continue;
							for(direction in dataByWeek[day][m][route][date]){
								for(d in dataByWeek[day][m][route][date][direction]){
									p.values[route][m].push(p.max(-120, p.min(dataByWeek[day][m][route][date][direction][d], 600)));
								}
							}
						}
					}
				}
			}
		}
		for(var r in p.values){
			let n = p.values[r];
			let countNum = 0;
			for(var t in p.values[r]){
				countNum = p.max(countNum, p.values[r][t].length);
			}
			if(n.length==0){
				countNum=1;
			}
			//add to data array
			this.dataArray.push({"name": r, "value": countNum});
		}
	},
	drawVarianceLine: function(p, vArray, median, minSize, maxSize, pos, wedgeSize){
		p.strokeWeight(1);
		p.stroke(backgroundColour);
		if(median!=-500){
			//fill colour of arc is variance from median at a point
			let lightness = p.map(p.abs(getVariance(vArray, median)), 0, 300, 100, 50);
			p.fill(0, 100, lightness);
			p.stroke(0, 100, lightness);
			p.arc(0, 0, maxSize*0.9, maxSize*0.9, 0, wedgeSize+1);
		}

	},
	drawGlyph: function(p, xPos, yPos, maxSize, minSize, wedgeSize, route, drawLabels){
		if(p.values[route].length>0){
			p.push();
			p.rotate(108);
			p.fill(GTFS_DATA[selected_city]["colours"][route]);
			p.noStroke();
			p.ellipse(xPos, yPos, maxSize, maxSize);
			//do one hour at a time
			for(m = 360; m <= 1380; m+=60){
				//layer is every 3 minute portion or roundedMin
				p.push();
				for(newM = 0; newM<60;newM+=p.floor(roundedMin)){
					this.drawVarianceLine(p, p.values[route][newM+m], getMedian(p.values[route][newM+m]),
					minSize, maxSize, 4, wedgeSize);
					p.rotate(wedgeSize);
				}
				p.pop();
				p.strokeWeight(1);
				//draw labels for clock
				if(this.hovered==route||drawLabels){
					if((this.selected!=null&&this.selected.data.name==route)||m==360||m==720||m==1200||m==1380){
						//draw label
						let stringText = (m/60);
						if(m/60>12){
							stringText = (m/60)-12;
						}
						if(m/60>11){
							stringText+="pm";
						}
						else{
							stringText+="am";
						}
						if(stringText.length==3){
							stringText+=" ";
						}
						p.push();
						p.rotate(9);
						p.translate(maxSize/2.1, 0);
						p.rotate(90);
						if(m/60<=9||m/60>=20){
							p.rotate(180);
						}
						p.textStyle(BOLD);
						drawText(p, [maxSize/9, maxSize/9], stringText, 0, 0, 105, backgroundColour);
						p.textStyle(NORMAL);
						p.pop();
					}
				}
				p.strokeWeight(2);
				p.stroke(GTFS_DATA[selected_city]["colours"][route]);
				p.line(0, 0, maxSize/2, 0);
				p.stroke(backgroundColour[0], backgroundColour[1], backgroundColour[2], 10);
				p.line(0, 0, maxSize/2, 0);
				p.rotate(18);
			}
			p.pop();
			p.fill(backgroundColour);
			p.stroke(backgroundColour);
			p.ellipse(xPos, yPos, minSize+minSize/8, minSize+minSize/8);
			p.arc(xPos, yPos, maxSize, maxSize, 78, 102);
			p.stroke(GTFS_DATA[selected_city]["colours"][route]);
			p.strokeWeight(minSize/8);
			p.arc(xPos, yPos, minSize+minSize/8, minSize+minSize/8, 102, 78);
		}
		else{
			let col = GTFS_DATA[selected_city]["colours"][route];
			p.stroke(col);
			p.strokeWeight(2);
			p.noFill();
			p.ellipse(xPos, yPos, maxSize, maxSize);
		}
		drawText(p, [minSize*0.8, minSize*0.8], route, xPos, yPos, 105);
	},
	drawGraph: function(p) {
		p.strokeCap(p.SQUARE);
		let wedgeSize = 320/(1080/roundedMin);
		minInnerRadius = p.graphSize[0]/25;
		pack = function(data){
			return(data = d3.pack()
    .size([p.graphSize[0], p.graphSize[1]])
		.padding(20)
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
			this.drawGlyph(p, 0, 0, r, minSize, wedgeSize, route, l);
			p.noStroke();
			p.fill(backgroundColour[0], backgroundColour[1], backgroundColour[2], transparency);
			p.ellipse(0, 0, r+10, r+10);
			p.pop();
		}
		p.pop();
		if(this.selected!=null){
			yPos = p.border+p.graphSize[1]/2;
			xPos = p.border+p.graphSize[0]/2;
			p.push();
			p.translate(xPos, yPos);
			maxSize = p.graphSize[1]*0.9;
			minSize = maxSize/4;
			this.drawGlyph(p, 0, 0, maxSize, minSize, wedgeSize, this.selected.data.name, true);
			p.pop();
		}
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
			if((h==null&&this.hovered!=null)||(this.hovered==null&&h!=null)||(h!=null&&h.data.name!=this.hovered.data.name)){
				this.hovered = h;
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
    document.getElementById("headingText").innerHTML =
		"Absolute Deviation from Delay Median for Given Bus Route(s) Between 6am & 11pm";
  },
	drawKey: function(p){
		let centreX = p.canvasWidth-p.border-p.keySize[0]/2;
		//draw colour chart for variance colours
		yPos = p.border+p.keySize[1]/4;
		p.strokeWeight(1);
		let size = p.max(p.keySize[1]/2, 1);
		let startPos = yPos;
		for(v = startPos; v < startPos+size; v++){
			let sat = p.map(v, startPos, startPos+size, 100, 50);
			p.stroke(0, 100, sat);
			p.line(centreX-p.keySize[0]/9, v, centreX+p.keySize[0]/9, v);
		}
		//add labels
		p.stroke(200);
		p.strokeWeight(1);
		let t = drawText(p, [p.keySize[0], p.keySize[1]/10], "Deviation of 5 Minutes", centreX, startPos+size+p.keySize[1]/30, 105);
		drawText(p, [p.keySize[0], p.keySize[1]/10], "No Deviation", centreX, startPos-p.keySize[1]/30, t);
		yPos = p.border+p.keySize[1]-p.keySize[1]/10;
		t = drawText(p, [p.keySize[0], p.keySize[1]/10], "Median Absolute", centreX, yPos, 105);
		drawText(p, [p.keySize[0], p.keySize[1]/10], "Deviation", centreX, yPos+t, t);
	}
}
