window.close_popup = function(){
  var el = document.getElementsByClassName("popup");
  for(var i = 0; i < el.length; i++){
	  el[i].style.height = "0px";  
  }
  document.getElementById("popups_container").style.pointerEvents = "none";
};
window.open_popup = function(id, h = "90%"){
  close_popup();
  document.getElementById(id).style.height = h;
  document.getElementById("popups_container").style.pointerEvents = "auto";
};
window.season = window.localStorage.getItem("season") || false;
window.on_logged_in_init_application = function(){
	if(!season) return;
	request("info", {}, function(data){
		if(!data.username) return;
		var function_permissions = {
			"menu_item_email": ["DEFAULT"],
			"menu_item_cloud": ["DEFAULT"],
			"menu_item_chats": ["DEFAULT"],
			"menu_item_support": ["DEFAULT"],
			"menu_item_game": ["DEFAULT", "game"],
			"menu_item_admin_supporter": ["DEFAULT", "support"],
			"menu_item_admin_users": ["DEFAULT", "info_user"],
			"menu_item_admin_servers": ["DEFAULT", "server_info"]
		};
		document.getElementById("menu_items_admin_container").style.display = (data.permissions["support"] || data.permissions["info_user"] || data.permissions["server_info"]) ? "block" : "none";
		Object.keys(function_permissions).forEach(function(key){
			has_permission = true;
			function_permissions[key].forEach(function(p){
				if(!data.permissions[p]) has_permission = false;
			});
			document.getElementById(key).style.display = has_permission ? "block" : "none";
		});
		document.getElementById("logged_in_menu_window").style.display = "block";
		setTimeout(function(){
		    document.getElementById("logged_in_menu_window").style.opacity = 1;
		}, 20);
		document.getElementById("start_menu_window").style.opacity = 0;
		setTimeout(function(){
			document.getElementById("start_menu_window").style.display = "none";
		}, 1000);
		show_dicussion_chats([
		    {"name": "Allgemeines", "text": "Smaltalk über Allgemeines"},
		    {"name": "Python", "text": "Alles über die Programmiersprache Python"},
		    {"name": "Minecraft", "text": "Das beliebteste Spiel ever?"}
		]);
	});
};
window.request = function(action, options, then){
	var xhr = new XMLHttpRequest();
	var url = "/api/";
	xhr.open("POST", season ? "/api/user" : "/api/main", true);
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
	        then(json.response);
	    }
	};
	var data = JSON.stringify({"season": season, "action": action, "options": options});
	xhr.send(data);
}
window.login = function(name, password, then){
	request("login", {"name": name, "password": password}, function(data){
		if(data.success) {
			season = data.season;
			window.localStorage.setItem("season", season)
		}
		then(data);
	});
};
window.register = function(name, password, then){
	request("register", {"name": name, "password": password}, function(data){
		if(data.success) {
			season = data.season;
			window.localStorage.setItem("season", season)
		}
		then(data);
	});
};
window.support = function(){
	var subject = document.getElementById("popup_support_subject").value;
	var text = document.getElementById("popup_support_email").value;
	var email = document.getElementById("popup_support_text").value;
	
	request("support", {"subject": subject, "text": text, "email": email}, function(data){
		if(data.success){
			document.getElementById("popup_support_subject").value = "";
			document.getElementById("popup_support_email").value = "";
			document.getElementById("popup_support_text").value = "";
			open_popup("popup_support_success");
		}
	});
};
window.on_login = function(){
	var name = document.getElementById("popup_login_name").value;
	var password = document.getElementById("popup_login_password").value;
	document.getElementById("popup_login_button").innerText = "Bitte warten..";
	document.getElementById("popup_login_button").disabled = true;
	login(name, password, function(response){
		document.getElementById("popup_login_button").innerText = "Anmelden";
		document.getElementById("popup_login_button").disabled = false;
	    if(response.success){
			close_popup();
			on_logged_in_init_application();
		} else {
			document.getElementById("popup_login_info").innerText = "Ungültige Anmeldedaten";
		}
	});
};
window.on_register = function(){
	var name = document.getElementById("popup_register_name").value;
	var password = document.getElementById("popup_register_password").value;
	document.getElementById("popup_register_button").innerText = "Bitte warten..";
	document.getElementById("popup_register_button").disabled = true;
	register(name, password, function(response){
		document.getElementById("popup_register_button").innerText = "Konto erstellen";
		document.getElementById("popup_register_button").disabled = false;
	    if(response.success){
			close_popup();
			on_logged_in_init_application();
		} else {
			document.getElementById("popup_register_info").innerHTML = "";
			response.errors.forEach(function(e){
				document.getElementById("popup_register_info").innerHTML += e+"<br>";
			});
		}
	});
};
window.onload = function(){
	document.body.style.display = "block";
	if(season){
		on_logged_in_init_application();
	}
};
window.open_app = function(name){
	var el = document.getElementsByClassName("app");
	for(var i = 0; i < el.length; i++){
	    if(el[i].id != "app_"+name) el[i].style.opacity = 0;	
	}
	document.getElementById("app_"+name).style.display = "block";
	setTimeout(function(){
		document.getElementById("app_"+name).style.opacity = 1;
	}, 20);
	
	setTimeout(function(){
		for(var i = 0; i < el.length; i++){
		    if(el[i].id != "app_"+name) el[i].style.display = "none";
		}
	}, 1000);
};
window.close_app = function(){
	var el = document.getElementsByClassName("app");
	for(var i = 0; i < el.length; i++){
	    el[i].style.opacity = 0;	
	}
	setTimeout(function(){
		for(var i = 0; i < el.length; i++){
		    el[i].style.display = "none";
		}
	}, 1000);
};
window.logout = function(){
	request("logout", {"season": season}, function(data){
		season = false;
		window.localStorage.setItem("season", "");
		document.getElementById("start_menu_window").style.display = "block";
		setTimeout(function(){
		    document.getElementById("start_menu_window").style.opacity = 1;	
		}, 20);
		document.getElementById("logged_in_menu_window").style.opacity = 0;
		setTimeout(function(){
			document.getElementById("logged_in_menu_window").style.display = "none";
		}, 1000);
		close_popup();
	});
};
