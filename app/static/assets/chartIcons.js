let colours = [[255, 100, 200],
							[50, 220, 180],
							[50, 200, 50],
							[250, 150, 50],
							[200, 140, 255],
							[255, 255, 140],
							[200, 250, 90],
							[100, 200, 250],
							[250, 150, 150]];

//line
let line1 = [[0, 0], [20, 10], [30, -10], [40, 0]];
let line2 = [[0, -10], [20, 0], [30, -5], [40, 10]];
let lines = [line1, line2];

function setup() {
  createCanvas(200, 200);
}

function draw() {
	noLoop();
	translate(20, 100);
  background([255, 100, 200]);
	scale(4);
	for(l in lines){
		let c = [random(0, 255), random(200, 255), random(100, 255)];
		fill(c);
		stroke(c);
		for(p = 0; p < lines[l].length-1; p++){
			line(lines[l][p][0], lines[l][p][1],
					 lines[l][p+1][0], lines[l][p+1][1]);
			ellipse(lines[l][p][0], lines[l][p][1], 2, 2);
			ellipse(lines[l][p+1][0], lines[l][p+1][1], 2, 2);
		}
	}
}

//variability

function setup() {
  createCanvas(200, 200);
}

function draw() {
	noLoop();
	colorMode(HSL, 360, 100, 100, 100);
	angleMode(DEGREES);
	strokeCap(SQUARE);
  background([30, 95, 59]);
	drawGlyph(100, 100, 150, 150/4);
}

function drawGlyph(xPos, yPos, maxSize, minSize){
		noFill();
		stroke(255, 30);
		strokeWeight(maxSize/10);
		let median = 150;
		//only draw if data
		if(median!=-500){
			arc(xPos, yPos, maxSize*0.8, maxSize*0.8, -129, 99);
			arc(xPos, yPos, maxSize*0.8, maxSize*0.8, -129, -53);
			arc(xPos, yPos, maxSize*0.8, maxSize*0.8, -102, -53);
			//draw labels
			push();
			translate(xPos, yPos);
			rotate(-129);
			for(let m = -2; m <= 10; m++){
				strokeWeight(2);
				stroke(255, 30);
				line(maxSize*0.4-maxSize/20, 0, maxSize*0.4+maxSize/20, 0);
				rotate(19);
			}
			pop();
			noFill();
			stroke(255);
			strokeWeight(5);
			let handAngle = map(median, -120, 600, -129, 99);
			push();
			translate(xPos, yPos);
			rotate(handAngle);
			line(minSize/2, 0, maxSize/2, 0);
			pop();
			let variance = 10;
			//draw coloured circle
			let lightness = map(abs(variance), 0, 300, 100, 50);
			noStroke();
			fill(0, 100, lightness);
			ellipse(xPos, yPos, maxSize*0.6, maxSize*0.6);
			fill([30, 95, 59]);
			ellipse(xPos, yPos, minSize*1.1, minSize*1.1);
			noFill();
			strokeWeight(maxSize/10);
			stroke(random(0, 360), 100,random(50, 100));
			arc(xPos, yPos, maxSize*0.8, maxSize*0.8, 110, 220);
		}

	}

//median
function setup() {
	createCanvas(200, 200);
}

function draw() {
	noLoop();
	colorMode(HSL, 360, 100, 100, 100);
	angleMode(DEGREES);
	background([79, 94, 67]);
	translate(100, 100);
	let r = 150;
	let minSize = r/4;
	let maxRings = 20;
	let ringWidth = (r - minSize) / maxRings / 2;
	let ringSize = (r - ringWidth - minSize) / maxRings;
	let count = 1;
	while(count <= maxRings) {
		let delay = -120+30*count;
		let col = getColour(delay);
		stroke(col);
		strokeWeight(ringWidth + 2);
		noFill();
		ellipse(0, 0, minSize + (count * ringSize), minSize + (count * ringSize));
		count++;
	}
}

function getColour(value){
	//if early, set hue to blue
	//if on time, set hue to light green
	//if late, set hue to red
	value = min(600, max(value, -120));
	let hueValue = 100;
	let maxValue = 600;
	let minValue = 0;
	let satValue = 0;
	let lightValue = 0;
	if(value<-30){
		maxValue = -30;
		minValue = -120;
		hueValue = map(value, minValue, maxValue, 200, 180);
		satValue = map(value, minValue, maxValue, 100, 100);
		lightValue = map(value, minValue, maxValue, 20, 50);
	}
	else if(value>120){
		minValue = 120;
		maxValue = 600;
		hueValue = map(value, minValue, maxValue, 10, 0);
		satValue = map(value, minValue, maxValue, 100, 100);
		lightValue = map(value, minValue, maxValue, 85, 20);
	}
	else{
		maxValue = 120;
		minValue = -30;
		hueValue = map(value, minValue, maxValue, 180, 75);
		satValue = map(value, minValue, maxValue, 100, 100);
		lightValue = map(value, minValue, maxValue, 50, 80);
	}
	//returns HSL colour
	return [hueValue,satValue,lightValue];

}
//pie
let col = [];

function setup() {
	createCanvas(200, 200);
}

function draw() {
	noLoop();
	colorMode(HSL, 360, 100, 100, 100);
	angleMode(DEGREES);
	background(166, 71, 53);
	translate(100, 100);
	strokeCap(SQUARE);
	col = [random(0, 360), 100, random(50, 100)];
	wedgeSize = 320/(1080/60);
	drawGlyph(0, 0, 150, 150/4, wedgeSize, 5);
}


function drawGlyph(xPos, yPos, maxSize, minSize, wedgeSize, route) {
	push();
	rotate(108);
	fill(col);
	noStroke();
	ellipse(xPos, yPos, maxSize, maxSize);
	//do one hour at a time
	for (m = 360; m <= 1380; m += 60) {
		//layer is every 3 minute portion or roundedMin
		push();
		for (newM = 0; newM < 60; newM += 60) {
			drawVarianceLine(minSize, maxSize, 4, wedgeSize);
			rotate(wedgeSize);
		}
		pop();
		strokeWeight(2);
		stroke(col);
		line(0, 0, maxSize / 2, 0);
		stroke(166, 71, 53, 10);
		line(0, 0, maxSize / 2, 0);
		rotate(18);
	}
	pop();
	fill(166, 71, 53);
	stroke(166, 71, 53);
	ellipse(xPos, yPos, minSize + minSize / 8, minSize + minSize / 8);
	arc(xPos, yPos, maxSize, maxSize, 78, 102);
	stroke(col);
	strokeWeight(minSize / 8);
	arc(xPos, yPos, minSize + minSize / 8, minSize + minSize / 8, 102, 78);
}

function drawVarianceLine(minSize, maxSize, pos, wedgeSize) {
	strokeWeight(1);
	stroke(166, 71, 53);
	//fill colour of arc is variance from median at a point
	let lightness = map(random(0, 200), 0, 300, 100, 50);
	fill(0, 100, lightness);
	stroke(0, 100, lightness);
	arc(0, 0, maxSize * 0.8, maxSize * 0.8, 0, wedgeSize + 1);
}
