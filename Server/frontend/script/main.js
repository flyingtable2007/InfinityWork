if (navigator.userAgent.toLowerCase().match(/mobile/i)) {
	window.location = "https://tweetin-mobile.nxlc.de";
}

window.close_popup = function(){
  var el = document.getElementsByClassName("popup");
  for(var i = 0; i < el.length; i++){
	  el[i].style.height = "0px";  
  }
  document.getElementById("popups_container").style.pointerEvents = "none";
  try {
      close_chat();
  } catch(e){
	  console.log(e);
  }
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
window.load_js_file = function(url){
    return new Promise(function(resolve, reject){
		const script = document.createElement('script');
		script.src = url;
		script.addEventListener('load', function() {
		    console.log(url + " loaded!");
		    resolve();
	    });
		document.head.appendChild(script);
	});
};
window.load_multiple_scripts = function(list){
	for(var i = 0; i < list.length; i++){
		load_js_file(list[i]);
	}
};
window.open_user_profile = async function(username = season_user_data.username){
	document.getElementById("popup_user_profile_header_username").innerText = username;
	document.getElementById("popup_user_profile_table_username").value = username;
	document.getElementById("popup_user_profile_loading_screen").style.display = "block";
	open_popup("popup_user_profile");
	document.getElementById("popup_user_profile_table_email").value = await get_user_profile_data("email", username);
	document.getElementById("popup_user_profile_table_email").disabled = (season_user_data.username != username) && !season_user_data.permissions["update_user"];
	document.getElementById("popup_user_profile_table_email").onchange = function(){
		request("update_user_profile", {username: username, key: "email", "value": document.getElementById("popup_user_profile_table_email").value});
	};
	document.getElementById("popup_user_profile_text").value = await get_user_profile_data("text", username);
	document.getElementById("popup_user_profile_text").disabled = (season_user_data.username != username) && !season_user_data.permissions["update_user"];
	document.getElementById("popup_user_profile_text").onchange = function(){
		request("update_user_profile", {username: username, key: "text", "value": document.getElementById("popup_user_profile_text").value});
	}
	document.getElementById("popup_user_profile_table_call").value = await get_user_profile_data("call_numer", username);
	document.getElementById("popup_user_profile_table_call").disabled = (season_user_data.username != username) && !season_user_data.permissions["update_user"];
	document.getElementById("popup_user_profile_table_call").onchange = function(){
		request("update_user_profile", {username: username, key: "call_numer", "value": document.getElementById("popup_user_profile_table_call").value});
	};
	var discord_acc = await get_user_profile_data("discord", username);
	document.getElementById("popup_user_profile_table_connect_discord").innerText = discord_acc ? discord_acc.tag : (season_user_data.username == username ? "Konto verbinden" : "Kein Konto");
	document.getElementById("popup_user_profile_table_connect_discord").disabled = season_user_data.username == username ? false :true;
	document.getElementById("popup_user_profile_table_connect_discord").onclick = function(){
		connect_discord_app();
	};
	document.getElementById("popup_user_profile_status").innerHTML = "";
	function create_status_element(text, url){
		var a = document.createElement("div");
		a.style = "height: 40px; width: 90%; background-color: lightblue; border-top-left-radius: 20px; position: relative; margin-top: 10px; ";
		var b = document.createElement("div");
		b.style = "position: absolute; top: 0px; left: 0px; bottom: 0px; width: 40px; display: flex; justify-content: center; align-items: center; ";
		var c = document.createElement("img");
		c.style = "height: 90%; ";
		c.src = url;
		b.appendChild(c);
		a.appendChild(b);
		var d = document.createElement("div");
		d.style = "position: absolute; top: 0px; left: 40px; bottom: 0px; right: 0px; display: flex; justify-content: center; align-items: center; ";
		var e = document.createElement("span");
		e.innerText = text;
		d.appendChild(e);
		a.appendChild(d);
		return a;
	}
	var status_list = await get_user_profile_data("status", username);
	if(status_list && status_list != ""){
		try {
			Object.keys(status_list).forEach(function(s){
				if(status_list[s]){
				    document.getElementById("popup_user_profile_status").appendChild( create_status_element(s, status_list[s]));
				}
			});
		} catch(e){
			console.log(e);
		}
	}
    document.getElementById("popup_user_profile_loading_screen").style.display = "none";
};
window.open_user_settings = function(){
	document.getElementById("popup_user_profile_username").innerText = season_user_data.username;
	document.getElementById("popup_user_profile_table_change_password").onclick = function(){
		document.getElementById("popup_user_change_password_info").innerText = "";
		document.getElementById("popup_user_change_password_password").value = "";
		document.getElementById("popup_user_change_password_button").innerText = "Password ändern";
		document.getElementById("popup_user_change_password_button").disabled = false;
		document.getElementById("popup_user_change_password_button").onclick = function(){
			request("change_password", {"password": document.getElementById("popup_user_change_password_password").value}, function(data){
				if(data.success){
					document.getElementById("popup_user_change_password_info").innerText = "";
					document.getElementById("popup_user_change_password_password").value = "";
					document.getElementById("popup_user_change_password_button").innerText = "Password erfolgreich geändert";
					document.getElementById("popup_user_change_password_button").disabled = true;
				} else {
					document.getElementById("popup_user_change_password_info").innerText = data.error;
				}
			});
		};
		open_popup("popup_user_change_password", 240);
	};
	document.getElementById("popup_user_profile_table_change_name").onclick = function(){
		document.getElementById("popup_user_change_name_info").innerText = "";
		document.getElementById("popup_user_change_name_name").value = "";
		document.getElementById("popup_user_change_name_button").innerText = "Namen ändern";
		document.getElementById("popup_user_change_name_button").disabled = false;
		document.getElementById("popup_user_change_name_button").onclick = function(){
			request("change_username", {"username": document.getElementById("popup_user_change_name_name").value}, function(data){
				if(data.success){
					document.getElementById("popup_user_change_name_info").innerText = "";
					document.getElementById("popup_user_change_name_name").value = "";
					document.getElementById("popup_user_change_name_button").innerText = "Gespeichert! ";
					document.getElementById("popup_user_change_name_button").disabled = true;
					setTimeout(logout, 1000);
				} else {
					document.getElementById("popup_user_change_name_info").innerText = data.error;
				}
			});
		};
		open_popup("popup_user_change_name", 240);
	};
	open_popup("popup_user_settings");
};
window.season_user_data = false;
window.season = window.localStorage.getItem("season") || false;
window.on_logged_in_init_application = function(){
	if(!season) return;
	request("info", {}, function(data){
		if(!data.username) {
			season_user_data = false;
			return;
		}
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
		document.getElementById("Tweetin_write_container_username").innerText = data.username;
		document.getElementById("Tweetin_feed_container").innerHTML = "";
		document.getElementById("Tweetin_feed_container_start_message").style.opacity = 1;
		document.getElementById("main_menu_profile_button").onclick = function(){
	        open_user_profile(data.username);
		};
		document.getElementById("main_menu_settings_button").onclick = function(){
		    open_user_settings();
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
	
	if(text.trim() == "") return;
	if(subject.trim() == "") return;
	if(email.trim() == "") return;
	
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
function init_seasons(){
	if(window.location.hash.startsWith("#season_")){
		url_season = true;
		season = window.location.hash.split("_")[1];
		open_popup("popup_login_with_other_season");
	}
	if(season) on_logged_in_init_application();
}
function check_for_discord_o2auth(){
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
}
function main_page_loading_screen(){
	setTimeout(function(){
	    load_multiple_scripts([
	        "script/email.js",
	        "script/tweetin.js",
	        "script/cloud.js",
	        "script/chats.js",
	        "script/upload.js",
	        "script/game.js",
	        "script/admin.js",
	        "/socket.io/socket.io.js"
	    ]);
	}, 500);
	setTimeout(init_sw, 2000);
}
document.addEventListener('DOMContentLoaded', async event => {
	main_page_loading_screen();
});
window.url_season = false;
window.onload = async function(){
	document.body.style.display = "block";
	init_seasons();
	check_for_discord_o2auth();
};
window.init_sw = function(){
	if (navigator.serviceWorker) {
		navigator.serviceWorker.register('/service_worker.js').then(reg => console.log('Service Worker Registered')).catch(swErr => console.log(`Service Worker Installation Error: ${swErr}}`));
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
	document.getElementById("Tweetin_feed_container").innerHTML = "";
	document.getElementById("Tweetin_feed_container_start_message").style.opacity = 1;
	close_popup();
	if(url_season) window.close();
};
window.logout = function(){
	request("logout", {"season": season}, function(data){
		season_user_data = false;
		logout_hide_elements();
	});
};
