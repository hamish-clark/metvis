/**
File to visually compare expected output with actual output
@author Amy Wilson
*/


function chartTest(){
  let testp5 = new p5();
  //general test


  //chart specific Test
  for(let i = 3; i < 4; i++){
    //lineGraphTest(getDays(i), ["18e"], testp5);
    //variabilityGraphTest(getDays(i), ["18e"], testp5);
    //quantityGraphTest(getDays(i), ["3"], testp5);
  }
}

function heatMapTest(){


}

function lineGraphTest(days, routes, p5){
  //dataByWeek[day][min][route][dateD][direction][delay]
  console.log('Testing Line Graph for '+ days+" and "+routes);
  testMedian(days, routes, p5);
  testRange(days, routes, p5);
}

function pieGraphTest(){

}

function pixelMapTest(){

}

function variabilityGraphTest(days, routes, p5){
  //dataByWeek[day][min][route][dateD][direction][delay]
  console.log('Testing Variability Graph for '+ days+" and "+routes);
  testMedian(days, routes, p5);
}

function quantityGraphTest(days, routes, p5){
  for(r in routes){
    let route = routes[r];
    let routeArray = [];
    for(day of days){
      if(dataByWeek[day][720]!=undefined){
        for(dateD in dataByWeek[day][720][route]){
          for(dir in dataByWeek[day][720][route][dateD]){
            let delays = dataByWeek[day][720][route][dateD][dir];
            for(delay in delays){
              routeArray.push(delays[delay]);
            }
          }
        }
      }
    }
    let earlyVal = 0;
    let onTimeVal = 0;
    let lateVal = 0;
    for(let val in routeArray){
      let currentVal = routeArray[val];
      if(currentVal<-30){
        earlyVal++;
      }
      else if(currentVal <120){
        onTimeVal ++;
      }
      else{
        lateVal++;
      }
    }
    console.log("for " +days+" and " +route);
    console.log(routeArray.length, earlyVal, onTimeVal, lateVal);
    earlyVal/=routeArray.length;
    onTimeVal/=routeArray.length;
    lateVal/=routeArray.length;
    console.log(earlyVal, onTimeVal, lateVal);
  }
}

function spatialGraphTest(){

}


function testMedian(days, routes, p5){
  for(r in routes){
    let route = routes[r];
    let medianArray = [];
    for(day of days){
      if(dataByWeek[day][720]!=undefined){
        for(dateD in dataByWeek[day][720][route]){
          for(dir in dataByWeek[day][720][route][dateD]){
            let delays = dataByWeek[day][720][route][dateD][dir];
            for(delay in delays){
              medianArray.push(delays[delay]);
            }
          }
        }
      }
    }
    console.log("Median for "+route+": "+getMedian(p5, medianArray)/60);
  }
}

function testRange(days, routes, p5){
  let minVal = 800;
  let maxVal = -800;
  for(r in routes){
    let route = routes[r];
    for(day of days){
      if(dataByWeek[day][720]!=undefined){
        for(dateD in dataByWeek[day][720][route]){
          for(dir in dataByWeek[day][720][route][dateD]){
            let delays = dataByWeek[day][720][route][dateD][dir];
            for(delay in delays){
              minVal = p5.min(minVal, delays[delay]);
              maxVal = p5.max(maxVal, delays[delay]);
            }
          }
        }
      }
    }
  }
  console.log("Min: "+minVal/60);
  console.log("Max: "+maxVal/60)
}
