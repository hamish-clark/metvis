/**
Basic graph class, line graph by default.
@author Amy Wilson
*/

function Graph(p){
	p.graphSize= [10, 10];
	p.canvasWidth= 10;
	p.canvasHeight= 10;
	p.border= 10;
	p.keySize= [10, 10];
	p.values= {};
	p.minMins= 360;
	p.maxMins= 1440;
	p.spacing= 10;

	gr = RangeGraph.prototype;

	p.setup = function(){
		p.colorMode(p.HSL, 360, 100, 100, 100);
		p.angleMode(p.DEGREES);
		p.createCanvas(p.canvasWidth, p.canvasHeight);
	}

	p.draw = function () {
		p.noLoop();
		p.background(backgroundColour);
		gr.drawGraph(p);
		gr.drawKey(p);
	}

	p.updateGraph = function(){
		gr.updateGraph(p);
	}

	p.windowResized = function () {
		p.canvasWidth = document.getElementById(gr.elementID).offsetWidth;
		p.canvasHeight = document.getElementById(gr.elementID).offsetHeight;
		p.resizeCanvas(p.canvasWidth, p.canvasHeight);
		p.border = p.canvasHeight/30;
		p.graphSize = [(p.canvasWidth-(p.border*2.5))*0.85, p.canvasHeight-(p.border*2)];
		p.keySize = [(p.canvasWidth-(p.border*2.5))*0.15, p.canvasHeight-(p.border*2)];
		p.spacing = (p.canvasWidth-(p.border*2))/(p.maxMins-p.minMins/3);
	}

	p.addRoute = function(value1, value2, set){
		p.values[value1] = [];
	}

	p.setG = function(g){
		gr = g;
		p.createCanvas(p.canvasWidth, p.canvasHeight).parent(gr.elementID);
		p.updateGraph();
		p.redraw();
		gr.drawHeading(p);
	}

	p.getG = function(){
		return gr;
	}

	p.mousePressed = function(){
		if(gr!=undefined&&gr.hasOwnProperty('mousePressed')){
			gr.mousePressed(p);
		}
	}

	p.mouseReleased = function(){
		if(gr!=undefined&&gr.hasOwnProperty('mouseReleased')){
			gr.mouseReleased(p);
		}
	}

	p.mouseMoved = function(){
		if(gr!=undefined&&gr.hasOwnProperty('mouseMoved')){
			gr.mouseMoved(p);
		}
	}

	p.mouseDragged = function(){
		if(gr!=undefined&&gr.hasOwnProperty('mouseDragged')){
			gr.mouseDragged(p);
		}
	}
	p.mouseWheel = function(event){
		if(gr!=undefined&&gr.hasOwnProperty('mouseWheel')){
			gr.mouseWheel(event, p);
		}
	}
}
