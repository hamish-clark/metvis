/**
Cute as heck bus animation
@author Amy Wilson
*/
var busSize = 10;
var wheelRotate = 0;
var busColour = "rgb(0, 255, 50)";
var boltShape = [[0, 0], [-2, 0], [-1, 1], [-4, 1], [-2, 0.5], [-2.5, -0.5], [0, 0]];
var bolts = [{"size":10, "pos":0, "opacity": 1},{"size":6, "pos":0, "opacity": 0.6},{"size":3, "pos":0, "opacity": 0.3}];

var canvasWidth = 300;
var canvasHeight = 300;
var context;

function LoadingAnimation(canvasPlace) {
  //var canvas = document.createElement('canvas');
  context = document.getElementById(canvasPlace).getContext('2d');
  window.requestAnimationFrame(drawLoadingAnimation);
}

function drawLoadingAnimation() {
  context.globalCompositeOperation = 'destination-over';
  context.clearRect(0, 0, 300, 300); // clear canvas

  context.save();

  context.translate(150, 150);
	context.fillText("Fetching Data...", 4*busSize, 8*busSize);

  drawBus();
  drawBolts();
  wheelRotate+=0.1;

  context.restore();

  window.requestAnimationFrame(drawLoadingAnimation);
}


function drawBus(){

		//draw wheels
  	drawWheel(2 * busSize, 5 * busSize, wheelRotate + Math.PI);
		drawWheel(11 * busSize, 5 * busSize, wheelRotate);


		for (w = 3 * busSize; w < 9 * busSize; w += busSize) {
      context.beginPath();
      context.strokeStyle = "rgb(0, 0, 0)";
      context.moveTo(w, busSize);
  		context.lineTo(w, busSize * 3);
      context.stroke();
      context.closePath();
  	}

		//draw windows
  	context.fillStyle = "rgb(255, 255, 255)";
  	context.strokeStyle = "rgb(0, 0, 0)";
    context.fillRect(2 * busSize, busSize, busSize * 7, busSize * 2, 5);
  	context.fillRect(10 * busSize, busSize, busSize * 1.5, busSize * 2, 5);
  	context.strokeRect(2 * busSize, busSize, busSize * 7, busSize * 2, 5);
  	context.strokeRect(10 * busSize, busSize, busSize * 1.5, busSize * 2, 5);


  	//draw bus shape
    context.strokeRect(0, 0, 13.5 * busSize, 5 * busSize);
    context.fillStyle = "rgb(255, 255, 50)";
  	context.fillRect(12.5*busSize, 0, busSize, 5 * busSize);
  	context.fillStyle = busColour;
  	context.fillRect(0, 0, 13 * busSize, 5 * busSize);

  }


 function drawWheel(x, y, r){


  	context.translate(x, y);
    context.rotate(r);
    context.beginPath();
    context.strokeStyle = "#ffffff";
  	context.arc(0, 0, busSize * 0.75, 0, Math.PI/2);
    context.stroke();
    context.closePath();
    context.rotate(-r);

    context.beginPath();
    context.fillStyle = "#ffffff";
  	context.arc(0, 0, busSize*0.5, 0, Math.PI*2);
    context.fill();
    context.closePath();

    context.beginPath();
    context.fillStyle = "#000000";
  	context.arc(0, 0, busSize*1.1, 0, Math.PI*2);
    context.fill();
    context.closePath();





    context.translate(-x, -y);

 }


 function drawBolts(){
 	for(var bolt in bolts){
  		context.save();
  		bolts[bolt]["opacity"]-=0.02;
  		context.translate(bolts[bolt]["pos"], 4*busSize);
  		bolts[bolt]["pos"]-=1.5;
  		context.beginPath();
      var s = "rgba(0, 1, 0, " + bolts[bolt]['opacity'] + ")";
      var f = "rgba(255, 255, 50, " + bolts[bolt]['opacity'] + ")";
      context.strokeStyle = s;
  		context.fillStyle = f;
  		for(v in boltShape){
  			context.lineTo(boltShape[v][0]*bolts[bolt]["size"],
  						 boltShape[v][1]*bolts[bolt]["size"]);
  		}
  		bolts[bolt]["size"]-=0.1;
  		if(bolts[bolt]["size"]<=0){
  			bolts[bolt] = {"size":10, "pos":0, "opacity": 1};
  		}
      context.stroke();
      context.fill();
  		context.closePath();

      context.restore();
  	}

 }
