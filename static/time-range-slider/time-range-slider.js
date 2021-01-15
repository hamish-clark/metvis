
/* ----------------- Slider Functions ---------------------- */

var incSize = 5;
var selected_time = 0900;
var playing = false;

// #playButton
// #timeSlider

function initialise_time_range_slider(){
	d3.selectAll(".time-range-container").append("div")
		.style("position", "absolute")
		.style("width", "100%")
		.style("height", "100%")
		.style("display", "flex")
		.style("pointer-events", "none")
			.selectAll("div").data(d=>d3.range(18)).enter()
				.append("div")
					.style("height", "100%")
					.style("flex", "1")
					.style("border-right", "1px solid rgba(255, 255, 255, 0.3)")
          .text(d => d+5).style("color", "white").style("opacity", "0.3").style("padding", "5px")
          
}

function update_time(){
  let slider = document.getElementById("timeSlider");
  let clock = document.getElementById('timeText')
  slider.value = selected_time;

  let time_string =  numToTime(selected_time);
  clock.innerHTML = time_string.substring(0,2) + ":" + time_string.substring(2,5);
  
  getMinutes(numToTime(selected_time));
  updateSliderStyle();
  on_time_change()
}

function slide(value){
  selected_time = parseInt(value);
	update_time();
}


function playBack(){
  document.getElementById("playButton").classList.toggle("playing");
  if (playing==false){
    playing = setInterval(play, 100);
  }else{
    clearInterval(playing);
    playing=false;
  }
}

function play(){
  let slider = document.getElementById("timeSlider");
  selected_time += incSize;
  if (selected_time> parseInt(slider.max)){
    selected_time = parseInt(slider.min)
  }
  update_time();
}


function stepForward(){
  let slider = document.getElementById("timeSlider");
  selected_time = (selected_time+incSize<= parseInt(slider.max)) ? selected_time+incSize :  parseInt(slider.max);
  update_time();
}


function stepBack(){
  let slider = document.getElementById("timeSlider");
  selected_time = (selected_time-incSize>=  parseInt(slider.min)) ? selected_time-incSize : parseInt(slider.min);
  update_time();
}

// Validates that the input string is a valid date formatted as "mm/dd/yyyy"
function isValidDate(year, month, day)
{
    // Check the ranges of month and year
    if(year < 1000 || year > 3000 || month == 0 || month > 12)
        return false;

    var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
};

function getMinutes(value){
	let h = value.slice(0, 2);
	let m = value.slice(2, 4);
	h *=60;
	m = Math.floor(m/3)*3;
  selectedMin = h+m;
  selectedMin = Math.floor(selectedMin/roundedMin)*roundedMin;
}

function seconds_as_minutes(seconds){
  let m = Math.floor(seconds/60)
  let s = seconds - m * 60
  m = (m==0 ? "" : m+"m")
  return m + " " + s+"s"
}

function seconds_as_time(seconds){
  return new Date(seconds * 1000).toISOString().substr(11, 5)
}

function numToTime(num){
  let timeInt = parseInt(num);
  let hourValue = Math.floor(timeInt/100)
  let minuteValue = (timeInt - hourValue*100)/100 * 60
  let time = ("00" + hourValue).slice(-2) + ("00" + minuteValue).slice(-2)
  return time;
}

function timeToNum(value){
  value = value.toString();
	let h = value.slice(0, 2);
	let m = value.slice(2, 4);
  m = Math.floor(parseInt(m)/60 * 100).toString()
  m = m.length==1 ? "0"+m : m
  let str = h + m
 	return str
}

function updateSliderStyle(){
  let slider = document.getElementById("timeSlider");
  let range = 100;
  let x = slider.value;
  let c = -1
  let y = c*(x-500) * (x-2200) / 722500 // parabola with height 1 and intercepts 500 and 2200
  let skyColor = "rgba(" + (96 + 150 * (1-y)) + "," + 178*y + "," + 255*y + ")"
  let skyScale = 100 + (500 * y) + 'px ';
  let glowScale = 100 * y + 'px ';
  var sliderStyle = document.querySelector('[data="test"]');
  sliderStyle.innerHTML = ".slider::-webkit-slider-thumb { transform: translateY(" + ((-y * range*1.5) + range+1.5)  + "px);" +
    "box-shadow: 0px 0px 30px 7px #FFF4B5,  0px 0px 200px " + glowScale +" #beAD86, 0px 0px 700px " + skyScale + skyColor + " !important; }";
}
