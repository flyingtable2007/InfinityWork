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
window.get_user_profile_data = async function(key, username = null){
	return new Promise(function(resolve, reject){
		request("get_user_profile_info", {username: username, key: key}, function(data){
			resolve(data.value);
	    });
    });
};
window.open_user_profile = async function(username = null){
	document.getElementById("popup_user_profile_header_username").innerText = username;
	document.getElementById("popup_user_profile_table_username").value = username;
	document.getElementById("popup_user_profile_table_email").value = await get_user_profile_data("email", username);
	document.getElementById("popup_user_profile_table_email").onchange = function(){
		request("update_user_profile", {username: username, key: "email", "value": document.getElementById("popup_user_profile_table_email").value});
	};
	document.getElementById("popup_user_profile_table_call").value = await get_user_profile_data("call_numer", username);
	document.getElementById("popup_user_profile_table_call").onchange = function(){
		request("update_user_profile", {username: username, key: "call_numer", "value": document.getElementById("popup_user_profile_table_call").value});
	};
	var discord_acc = await get_user_profile_data("discord", username);
	document.getElementById("popup_user_profile_table_connect_discord").innerText = discord_acc ? discord_acc.tag : "Konto verbinden";
	document.getElementById("popup_user_profile_table_connect_discord").onclick = function(){
		connect_discord_app();
	};
    open_popup("popup_user_profile");
};
window.season = window.localStorage.getItem("season") || false;
window.on_logged_in_init_application = function(){
	if(!season) return;
	request("info", {}, function(data){
		if(!data.username) return;
		window.season_user_data = data;
		window.socket = io();
		var function_permissions = {
			"menu_item_email": ["DEFAULT"],
			"menu_item_cloud": ["DEFAULT"],
			"menu_item_chats": ["DEFAULT"],
			"menu_item_support": ["DEFAULT"],
			"menu_item_game": ["DEFAULT"],
			"menu_item_admin_supporter": ["DEFAULT", "support"],
			"menu_item_admin_users": ["DEFAULT", "info_user"],
			"menu_item_admin_servers": ["DEFAULT", "server_info"]
		};
		Object.keys(function_permissions).forEach(function(key){
			has_permission = true;
			function_permissions[key].forEach(function(p){
				if(!data.permissions[p]) has_permission = false;
			});
			document.getElementById(key).style.display = has_permission ? "block" : "none";
		});
		setTimeout(async function(){
			var discord_acc = await get_user_profile_data("discord");
			document.getElementById("main_menu_discord_tag").innerText = discord_acc.tag ? discord_acc.tag : "";
		}, 0);
		document.getElementById("main_menu_username").innerText = data.username;
		document.getElementById("Tweetin_profile_button_username").innerText = data.username;
		document.getElementById("main_menu_profile_button").onclick = function(){
	        open_user_profile(data.username);
		};
		document.getElementById("main_menu_settings_button").onclick = function(){
		    open_popup("popup_user_settings");	
		};
		document.getElementById("Tweetin_profile_button").style.display = "flex";
		setTimeout(function(){
		    document.getElementById("Tweetin_profile_button").style.opacity = 1;
		}, 1000);
		document.getElementById("Tweetin_login_button").style.opacity = 0;
		setTimeout(function(){
		    document.getElementById("Tweetin_login_button").style.display = "none";
		}, 1000);
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
window.request = function(action, options, then = false){
	var xhr = new XMLHttpRequest();
	var url = "/api/";
	xhr.open("POST", season ? "/api/user" : "/api/main", true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function () {
	    if (xhr.readyState === 4 && xhr.status === 200) {
	        var json = JSON.parse(xhr.responseText);
	        if(json.status == 401) return logout_hide_elements();
	        if(then) then(json.response);
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
	var text = document.getElementById("popup_support_text").value;
	var email = document.getElementById("popup_support_email").value;
	
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
function generateRandomString() {
	let randomString = '';
	const randomNumber = Math.floor(Math.random() * 10);
	for (let i = 0; i < 20 + randomNumber; i++) {
		randomString += String.fromCharCode(33 + Math.floor(Math.random() * 94));
	}
	return randomString;
}
window.connect_discord_app = function(){
	const randomString = generateRandomString();
    localStorage.setItem('oauth-state', randomString);
    var url = "https://discord.com/api/oauth2/authorize?client_id=1034478574025060373&redirect_uri=https%3A%2F%2Fnxlc.de%2F&response_type=code&scope=identify%20guilds.members.read%20guilds%20connections";
    url += `&state=${btoa(randomString)}`;
    window.location = url;
};
window.url_season = false;
window.onload = async function(){
	document.body.style.display = "block";
	if(window.location.hash.startsWith("#season_")){
		url_season = true;
		season = window.location.hash.split("_")[1];
		open_popup("popup_login_with_other_season");
	}
	
	if(season){
		on_logged_in_init_application();
	}

	const fragment = new URLSearchParams(window.location.search);
	const [code, state] = [fragment.get('code') || false, fragment.get('state') || ""];
    if(!code) return;
    if(!localStorage.getItem('oauth-state')) return;
	if (localStorage.getItem('oauth-state') !== atob(decodeURIComponent(state))) return;
	
	if(season) {
		request("connect_to_discord", {"code": code}, function(data){
			if(data.connected_to_other_account){
				open_popup("popup_discord_account_already_connected");
			} else {
			    document.getElementById("main_menu_discord_tag").innerText = data.tag ? data.tag : "";
			}
		});
	} else {
		request("login_with_discord", {"code": code}, function(data){
			if(data.success){
				season = data.season;
				window.localStorage.setItem("season", season);
				on_logged_in_init_application();
			} else {
				if(data.no_account){
					open_popup("popup_register");
				}
			}
		});
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
window.logout_hide_elements = function(){
	season = false;
	if(!url_season) window.localStorage.setItem("season", "");
	document.getElementById("Tweetin_login_button").style.display = "flex";
	setTimeout(function(){
	    document.getElementById("Tweetin_login_button").style.opacity = 1;
	}, 20);
	document.getElementById('Tweetin_profile_button_dropdown').style.height = "0px";
	document.getElementById("Tweetin_profile_button").style.opacity = 0;
	setTimeout(function(){
	    document.getElementById("Tweetin_profile_button").style.display = "none";
	}, 1000);
	document.getElementById("start_menu_window").style.display = "block";
	setTimeout(function(){
	    document.getElementById("start_menu_window").style.opacity = 1;	
	}, 20);
	document.getElementById("logged_in_menu_window").style.opacity = 0;
	setTimeout(function(){
		document.getElementById("logged_in_menu_window").style.display = "none";
	}, 1000);
	close_popup();
	if(url_season) window.close();
};
window.logout = function(){
	request("logout", {"season": season}, function(data){
		logout_hide_elements();
	});
};
