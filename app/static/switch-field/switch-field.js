
function get_switch_state(id){
  return document.querySelector('input[name="' + id + '"]:checked').value;
}
