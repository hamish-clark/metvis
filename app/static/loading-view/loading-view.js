

tasks = {}

var output_element = document.getElementById("loading_output")

function write_task(task_name, text){
    let p = document.createElement("p");
    p.className = "loading_text"
    p.innerHTML = text

    tasks[task_name] = p
    output_element.append(p)
}
    
function update_task(task_name, new_text){
    if (task_name in tasks){
        tasks[task_name].innerHTML = new_text
    }
}

function append_task(task_name, append_text){
    if (task_name in tasks){
        tasks[task_name].innerHTML = tasks[task_name].innerHTML + append_text
    }
}

function complete_task(task_name){
    append_task(task_name, " Done")
}

function minimize_loading_screen(){
    document.getElementsByClassName("loading_over")[0].classList.toggle("loading_over--minimised")
}

function close_loading_over(){
    document.getElementsByClassName("loading_over")[0].classList.toggle("loading_over--minimised")
}

/*
<p class ="loading_text">  </p>
<p class ="loading_text"> Loading Done </p>
<p class ="loading_text"> Loading Tracked Trips... </p>
<p class ="loading_text"> Loading Done </p>

<p class ="loading_text"> ↵ </p>
<p class ="loading_text"> Loading Historical↵ </p>
<p class ="loading_text"> .... 2019-07-11  </p>
<p class ="loading_text"> .... 2019-07-11  </p>
<p class ="loading_text"> .... 2019-07-11  </p>
<p class ="loading_text"> .... 2019-07-11  </p>
<p class ="loading_text"> .... 2019-07-11  </p>
<p class ="loading_text"> .... 2019-07-11  </p>
<p class ="loading_text"> .... 2019-07-11  </p>
<p class ="loading_text"> Done  </p>
*/