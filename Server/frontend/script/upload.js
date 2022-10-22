window.upload_file = function(file, url, on_progress = function(){}, then = function(){}){
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function () {
	    if (xhr.readyState === 4 && xhr.status === 200) {
	        var json = JSON.parse(xhr.responseText);
	        if(json.status == 401){
				season = false;
				document.getElementById("start_menu_window").style.display = "block";
				setTimeout(function(){
				    document.getElementById("start_menu_window").style.opacity = 1;	
				}, 20);
				document.getElementById("logged_in_menu_window").style.opacity = 0;
				setTimeout(function(){
					document.getElementById("logged_in_menu_window").style.display = "none";
				}, 1000);
				close_popup();
				return;
			};
			console.log(json);
	        then(json.response);
	    }
	};
	xhr.upload.onprogress = function(event){
		if (event.lengthComputable){
		     on_progress(event.loaded / event.total);
		} 
	};
	xhr.send(file);
};
