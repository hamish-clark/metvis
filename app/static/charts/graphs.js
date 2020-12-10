/**
The main file for getting the JSON data and converting to a visualisation.
@author Amy Wilson
*/

let rawData = {};
let dataByWeek = {'1':[], '2':[], '3':[], '4':[], '5':[], '6':[], '0':[]};
let selectedMin = 720;
let backgroundColour = [0, 0, 20];
let heatMapOn = false;
var rg = RangeGraph.prototype;
var qr = QuantityGraph.prototype;
var bg = ReliabilityGraph.prototype;
var pg = PieGraph.prototype;
let testp5 = new p5();
let graphArray = [rg, qr, bg, pg];
let dateOverwrite = true;
let routeOrder = ['1', '2', '3', '3a', '7', '12',
				'13', '14', '17e', '18e', '19e', '21', '22', "23e",
				'24', '25', '26', "29e", "30x", "31x",
				"32x", '33', '34','35', '36', "36a",
				'37', '52', '56', '57', '58', '85x'];

var currentGraph = new p5(Graph);

function reload_chart_data(d){
	rawData = d;
	convertToMinutes();
	currentGraph.updateGraph();
	currentGraph.redraw();
}

function resizeWindows(){
	currentGraph.windowResized();
	currentGraph.redraw();
}

function updateTimeDrawn(){
	if(currentGraph.getG()==qr || currentGraph.getG()==bg){
		currentGraph.updateGraph();
		currentGraph.redraw();
	}
	if(currentGraph.mouseReleased&&heatMapOn){
		heatMap.updateData();
	}
}

function updateDatesDrawn(dateChanged){
	dateOverwrite = dateChanged;
	currentGraph.updateGraph();
	if(currentGraph.getG()!=undefined){
		currentGraph.redraw();
	}
	if(heatMapOn){
		heatMap.updateData();
	}
}

function updateRoutesDrawn(){
	currentGraph.updateGraph();
	if(currentGraph.getG()!=undefined){
		currentGraph.redraw();
	}
	if(heatMapOn){
		heatMap.updateData();
	}
}

function updateRounding(mins){
	convertToMinutes();
	currentGraph.updateGraph();
	currentGraph.redraw();
}

/**
Sorts data into new data structure
*/
function convertToMinutes(){
	for(day in dataByWeek){
		dataByWeek[day] = [];
	}
	let totalCount = 0;
	//fix data so stored as minutes between 0 and 1440
	//extract date
	for(dateD in rawData[selected_city]){
		//extract data originally in format
		//rawData[currentCity][dateD]["times"][time][vehicle][Direction, routeId, delaySeconds]
		let dow = rawData[selected_city][dateD]["day"];
		for(time in rawData[selected_city][dateD]["times"]){
			let h = time.slice(0, 2);
			let m = time.slice(2, 4);
			h *=60;
			m = Math.floor(m/roundedMin)*roundedMin;

			let newTime = h + m;
			if(dataByWeek[dow][newTime] == undefined){
				//adding current time to data array
				dataByWeek[dow][newTime] = [];
			}
			for(vehicle in rawData[selected_city][dateD]["times"][time]){
				let route = rawData[selected_city][dateD]["times"][time][vehicle]["routeId"];
				let direction = rawData[selected_city][dateD]["times"][time][vehicle]["Direction"];
				let delay = rawData[selected_city][dateD]["times"][time][vehicle]["DelaySeconds"];
				//GTFS_DATA["wellington"]["colours"][route]
				if(dataByWeek[dow][newTime][route] == undefined){
					//adding current route to data array
					dataByWeek[dow][newTime][route] = [];
				}
				if(dataByWeek[dow][newTime][route][dateD] == undefined){
					//adding current route to data array
					dataByWeek[dow][newTime][route][dateD] = [];
				}
				//adding to list of delay times
				//constrain value before adding to list
				let roundedDelay = Math.min(600, Math.max(-120, delay));
				if(dataByWeek[dow][newTime][route][dateD][direction]==undefined){
					dataByWeek[dow][newTime][route][dateD][direction] = [];
				}
				dataByWeek[dow][newTime][route][dateD][direction].push(roundedDelay);

			}
		}
	}
}

////

/**
Returns the correct assortment of days based on the drop down code.
@return int[] selected
@param int selected
*/
function getDays(selected){
	let days = [selected];
	if(selected==-1){
		days = Object.keys(dataByWeek);
	}
	else if(selected<=-4){
		if(selected_date!="Invalid Date"){
			let currentDate = new Date(selected_date);
			days = [currentDate.getDay()];
		}
		else{
			days = [1];
		}
	}
	else if(selected==-3){
		days = ['0', '6'];
	}
	else if(selected==-2){
		days = ['1', '2', '3', '4', '5'];
	}
	return days;
}

/**
Returns the difference in seconds between two times
@return float
@param int startTime
@param int centreTime
*/
function getRouteDistance(startTime, centreTime){
  let difference = Math.min(300, Math.max(-300, startTime - centreTime));
  return difference;
}

/**
Draws text in p5.js and returns size of text
@return int
@param p5 p
@param float[] textContent
@param float textX
@param float textY
@param int textSizeOverwrite
@param Color colour
*/
function drawText(p, textBox, textContent, textX, textY, textSizeOverwrite, colour){
	p.textAlign(p.CENTER, p.CENTER);
	//text needs to fit within the smaller of two bounds up to a maximum of size 14 font
	let textH = textBox[1];
	let textW = textBox[0]/textContent.length*2;
	let textS = Math.min(textW, textH);
	p.textSize(Math.min(textSizeOverwrite, Math.min(textS, 20)));
	p.noStroke();
	p.fill(255);
	if(colour!=undefined){
		p.fill(colour);
	}
	p.text(textContent, textX, textY);
	return Math.min(textSizeOverwrite, Math.min(textS, 20));
}

/**
Returns a blue, green or red HSL colour.
@return string hsl(100, 0%, 0%)
@param float value
*/
function getColour(value, returnArray){
	//if early, set hue to blue
	//if on time, set hue to light green
	//if late, set hue to red
	let p = testp5;
	value = p.min(600, p.max(value, -120));
	let hueValue = 100;
	let maxValue = 600;
	let minValue = 0;
	let satValue = 0;
	let lightValue = 0;
	if(value<-30){
		maxValue = -30;
		minValue = -120;
		hueValue = p.map(value, minValue, maxValue, 200, 180);
		satValue = p.map(value, minValue, maxValue, 100, 100);
		lightValue = p.map(value, minValue, maxValue, 20, 50);
	}
	else if(value>120){
		minValue = 120;
		maxValue = 600;
		hueValue = p.map(value, minValue, maxValue, 10, 0);
		satValue = p.map(value, minValue, maxValue, 100, 100);
		lightValue = p.map(value, minValue, maxValue, 85, 20);
	}
	else{
		maxValue = 120;
		minValue = -30;
		hueValue = p.map(value, minValue, maxValue, 180, 75);
		satValue = p.map(value, minValue, maxValue, 100, 100);
		lightValue = p.map(value, minValue, maxValue, 50, 80);
	}
	//returns HSL colour
	if(returnArray){
		return [hueValue,satValue,lightValue];
	}
	return ("hsl(" + hueValue + ", " + satValue + "%, " + lightValue + "%)");
}

/**
Returns the median of a list of values.
@return float -500
@param float[] n
*/
function getMedian(n){
	let median = -500;
	if(n!=undefined){
		let temp = JSON.parse(JSON.stringify( n ));
		let numsLen = temp.length;
		let numbers = sortArray(temp);
		if(numsLen>0 && numsLen % 2 === 0) {
			// average of two middle numbers
			median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
		}
		else if(numsLen>0){
			// middle number only
			median = numbers[(numsLen - 1) / 2];
		}
	}
  return median;
}

/**
Sorts array in ascending order.
@return float[] []
@param float[] numbers
*/
function sortArray(numbers){
	let unorderedArray = numbers.slice();
	let orderedArray = [];
	while(unorderedArray.length>0){
		let minValue = Math.min.apply(Math, unorderedArray)
		orderedArray.push(minValue);
		unorderedArray.splice(unorderedArray.indexOf(minValue), 1);
	}
	return orderedArray;
}

/**
Returns the median of the difference between each number and the original median.
@return float -500
@param float[] numbers
@param float median
*/
function getVariance(numbers, median){
	let temp = JSON.parse(JSON.stringify( numbers ));
	for(num in temp){
		temp[num] =  Math.abs(median-temp[num]);
	}
	let variance = getMedian(temp);
	return variance;
}

/**
Returns the ideal number of routes for the width and the height.
@return int[] [1, 1]
@param p5 p
@param float width
@param float height
@param int numRoutes
*/
function getRatio(p, width, height, numRoutes){
	let count = 1;
	let product = 1;
	let widthNum = count;
	let heightNum = count;
	while(product < numRoutes){
		let products = [];
		count++;
		//add one to width
		productA = count*(count-1);
		//add one to height
		productB = (count-1)*count;
		//add one to both
		productC = count*count;
		if(productA >= numRoutes){
			products.push(productA);
		}
		if(productB >= numRoutes){
			products.push(productB);
		}
		if(productC >= numRoutes){
			products.push(productC);
		}
		if(products.length>0){
			product = Math.min.apply(Math, products);
			widthNum = count;
			heightNum = count;
			if(product==productA){
				widthNum = count;
				heightNum = count-1;
			}
			else if(product==productB){
				widthNum = count-1;
				heightNum = count;
			}
		}
	}
	return [widthNum, heightNum];
}
