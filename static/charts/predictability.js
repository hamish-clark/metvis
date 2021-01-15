
function draw_predictability(){

  let stopIds = GTFS_DATA[selected_city]["routes"]['2']
  let svg = d3.select("svg");

  let stopBar = d3.select("#stopBar");

  stopBar.attr("width", "100%")
    .style("height", "100px")
    .style("width", "100%")
    .style("background", "red")
    .style("display", "flex")
    .style("flex-flow", "row nowrap")


  stopBar.selectAll("div")
  .data(stopIds).enter()
    .append("div")
      .style("flex", "1")
      .style("height", '60px')
      .style("background", 'blue')
      .style("border-right", '1px solid black')
      .on('mouseover', function(d){
        d3.select(this).style("transform", 'translateY(-10px)')
        d3.select(this).append("p").text(d)
      })
      .on('mouseout', function(d){
        d3.select(this).style("transform", 'none')
        d3.select(this).select("p").remove()

      })

  svg.selectAll("text")
  .data(stopIds).enter()
    .append('text')
      .attr('x', function(d, i){ return i*30 })
      .attr("y", '70')
      .attr("fill", 'red')
      .html(function(d) { return d; })

  svg.selectAll("circle")
  .data(stopIds).enter()
    .append("circle")
      .attr("cx", function(d, i){ return i*30 })
      .attr("cy", '60')
      .attr("r", '10')

  svg.selectAll("rectangle")
  .data(stopIds).enter()
    .append("rectangle")
      .attr("cx", function(d, i){ return i*30 })
      .attr("cy", '60')
      .attr("r", '10')
}
