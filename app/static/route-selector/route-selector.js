/* Given an object mapping a key name to a color, generate selector buttons */
function updateRouteButtons(){
  let colours = GTFS_DATA[selected_city]["colours"]
  let names = Object.keys(colours);

  names.sort((a, b) => parseInt(a) - parseInt(b))

  console.log(names);

  // Delete all existing route selector buttons
  d3.selectAll(".route-selector")
    .selectAll('div').remove();

  // Populate the route-selector with route buttons
  d3.selectAll(".route-selector")
    .selectAll('div')
    .data(names)
    .enter()
    .append("div")
      .attr('id', (d)=> {return d; })
      .attr('class', 'selector')
      .style("background", (d) => colours[d])
      .text((d)=>d)
      .on('click', (d) => route_selector_clicked(d))

}

function deselectAllRoutesButton(){
  selected_routes = new Set([]);
  d3.selectAll('.selector').classed("selected", function (d, i, t) {
    return (selected_routes.has(t[i].id))
  })
}

function route_selector_clicked(id){
  if (selected_tab == "8"){
    multiselect = false;
  }else{
    multiselect = true;
  }

document.getElementById('deselectAllRoutesButton').style.opacity = 1;
  if (id=='all' && multiselect == true){
    selected_routes = new Set(Object.keys(GTFS_DATA[selected_city]["colours"]));
  }else if(id=='none'){
    deselectAllRoutesButton();
    document.getElementById('deselectAllRoutesButton').style.opacity = 0.5;
  }else{
    if (selected_routes.has(id)){
      selected_routes.delete(id);
    }else{
      if (multiselect==false){
        deselectAllRoutesButton();
      }
      selected_routes.add(id);
    }
  }

  d3.selectAll('.selector').classed("selected", function (d, i, t) {
    return (selected_routes.has(t[i].id))
  })

  on_route_change();
}
