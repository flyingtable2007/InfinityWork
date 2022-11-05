window.start_support_panel = function(){
	open_app('support');
	request("get_all_support_requests", {"start": 0}, function(response){
		document.getElementById("app_support_list").innerHTML = "";
		response.messages.reverse().forEach(function(m){
			var e = document.createElement("li");
			e.style = "cursor: grab; ";
			e.style.color = m.closed ? "green" : "black";
			e.innerText = m.author + ": "+m.subject;
			e.onclick = function(){
				document.getElementById("popup_support_panel_header").innerText = m.author + ": "+m.subject;
				document.getElementById("popup_support_panel_info").innerHTML = "";
				
				document.getElementById("popup_support_panel_subject").value = m.subject;
				document.getElementById("popup_support_panel_author").value = m.author;
				document.getElementById("popup_support_panel_email").value = m.email;
				document.getElementById("popup_support_panel_text").value = m.text;
				document.getElementById("popup_support_panel_answers").value = "";
				document.getElementById("popup_support_panel_answer_count").innerText = m.answers ? m.answers.length : 0;
				if(m.answers){
				    m.answers.forEach(function(d){
						document.getElementById("popup_support_panel_answers").value += d.user+" ("+d.time+"): \n"+d.text+"\n \n";
					});	
				}
				Object.keys(m).forEach(function(key){
					var e_info = document.createElement("li");
					e_info.innerText = key + ": "+(typeof user === 'string' ? m[key] : JSON.stringify(m[key]));
				    document.getElementById("popup_support_panel_info").appendChild(e_info);	
				});
				document.getElementById("popup_support_panel_close").innerText = m.closed ? "Dieses Thema Wiedereröffnen" : "Dieses Thema abschließen";
				document.getElementById("popup_support_panel_close").onclick = function(){
					close_popup();
					m.closed = !m.closed;
					e.style.color = m.closed ? "green" : "black";
					request("support_request_change_status", {"id": m.id, "reason": m.closed ? "Von Supporter geschlossen" : "Von Supporter wiedereröffnet", "closed": m.closed}, function(response){
						start_support_panel();
					});
				};
				document.getElementById("popup_support_panel_answer").onclick = function(){
					document.getElementById("popup_support_answer_editor_answers").value = "";
					if(m.answers){
						m.answers.forEach(function(d){
							document.getElementById("popup_support_answer_editor_answers").value += d.user+" ("+d.time+"): \n"+d.text+"\n \n";
						});
					}
					document.getElementById("popup_support_answer_editor_text").value = "";
					document.getElementById("popup_support_answer_editor_button").onclick = function(){
						close_popup();
						request("answer_support_request", {"id": m.id, "text": document.getElementById("popup_support_answer_editor_text").value}, function(response){
							open_popup("popup_support_answer_success");
							start_support_panel();
						});
					};
					open_popup("popup_support_answer_editor");
				};
				open_popup("popup_support_panel");
			};
			document.getElementById("app_support_list").appendChild(e);
		});
	});
};
window.admin_open_user_profile = function(){
	var username = document.getElementById("popup_admin_user_control_username").value;
	request("get_user_info", {"username": username}, async function(response){
		document.getElementById("popup_admin_user_control_profile_username").innerText = username;
		document.getElementById("popup_admin_user_control_profile_emails").innerText = "";
		response.data.email_addresses.forEach(function(email){
			var e = document.createElement("li");
			e.innerText = email;
			document.getElementById("popup_admin_user_control_profile_emails").appendChild(e);
		});
		document.getElementById("popup_admin_user_control_profile_permissions").innerText = "";
		Object.keys(response.data.permissions).forEach(function(p){
			if(!response.data.permissions[p]) return;
			var e = document.createElement("li");
			e.innerText = p;
			document.getElementById("popup_admin_user_control_profile_permissions").appendChild(e);
		});
		document.getElementById("popup_admin_user_control_profile_status").innerText = "";
		var status_list = await get_user_profile_data("status", username);
		if(!status_list || status_list == "") status_list = {};
		var all = {
			"Premium Mitglied": "/images/diamond.png",
			"Verifiziert": "/images/check.png",
			"Mitarbeiter": "/images/wrench.png"
		};
		Object.keys(all).forEach(function(s){
			var e = document.createElement("li");
			var f = document.createElement("div");
			var g = document.createElement("input");
			g.type = "checkbox";
			g.checked = status_list[s] ? true : false;
			g.onclick = function(){
				request("change_user_status", {"username": username, "text": s, "url": g.checked ? all[s] : false});
			};
			f.appendChild(g);
			var h = document.createElement("span");
			h.innerText = s;
			f.appendChild(h);
			e.appendChild(f);
			document.getElementById("popup_admin_user_control_profile_status").appendChild(e);
		});
		
		document.getElementById("popup_admin_user_control_profile_login").style.display = season_user_data.permissions["update_user"] ? "block" : "none";
		document.getElementById("popup_admin_user_control_profile_login").onclick = function(){
			request("admin_login_with_other_user_account", {"username": username}, function(response){
				if(response.success) {
					window.open("https://"+window.location.host+"#season_"+response.season, '_blank');
				}
			});
		};
		document.getElementById("popup_admin_user_control_profile_open_profile").style.display = season_user_data.permissions["update_user"] ? "block" : "none";
		document.getElementById("popup_admin_user_control_profile_open_profile").onclick = function(){
			open_user_profile(username);
		};
		document.getElementById("popup_admin_user_control_profile_change_permissions").style.display = season_user_data.permissions["change_admin_permission"] ? "block" : "none";
		document.getElementById("popup_admin_user_control_profile_change_permissions").onclick = function(){
			document.getElementById("popup_admin_user_control_change_profile_permissions_username").innerText = username;
			document.getElementById("popup_admin_user_control_change_profile_permissions_div").innerText = "";
			window.popup_admin_user_control_profile_change_permissions_checkboxes_list = {};
			Object.keys(response.data.permissions).forEach(function(p){
				popup_admin_user_control_profile_change_permissions_checkboxes_list[p] = response.data.permissions[p];
				var label= document.createElement("label");
				var description = document.createTextNode(p);
				var checkbox = document.createElement("input");
				checkbox.type = "checkbox";
				checkbox.value = p;
				checkbox.checked = response.data.permissions[p];
				checkbox.onchange = function(){
					popup_admin_user_control_profile_change_permissions_checkboxes_list[p] = checkbox.checked;
					console.log(username);
					request("change_permissions_of_user", {"username": username, "permissions": popup_admin_user_control_profile_change_permissions_checkboxes_list}, function(response){
						console.log("ok");
						console.log(response);
					});
				};
				label.appendChild(checkbox);
				label.appendChild(description);
				document.getElementById("popup_admin_user_control_change_profile_permissions_div").appendChild(label);
			});
			open_popup("popup_admin_user_control_change_profile_permissions");
		};
		open_popup("popup_admin_user_control_profile");
	});
};
window.start_server_info_panel = function(){
	request("servers", {}, function(response){
		console.log(response);
		document.getElementById("popup_admin_server_info_list").innerText = "";
		response.servers.forEach(function(s){
			var e = document.createElement("li");
			e.innerText = JSON.stringify(s);
			document.getElementById("popup_admin_server_info_list").appendChild(e);
		});
	    open_popup('popup_admin_server_info');
	});
};
