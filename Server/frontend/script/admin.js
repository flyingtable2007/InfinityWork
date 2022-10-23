window.start_support_panel = function(){
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
						document.getElementById("popup_support_panel_answers").value += d.user+" ("+d.time+"): \n"+d.text;
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
							document.getElementById("popup_support_answer_editor_answers").value += d.user+" ("+d.time+"): \n"+d.text;
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
		open_app('support');
	});
};
window.admin_open_user_profile = function(){
	var username = document.getElementById("popup_admin_user_control_username").value;
	request("get_user_info", {"username": username}, function(response){
		document.getElementById("popup_admin_user_control_profile_username").innerText = username;
		document.getElementById("popup_admin_user_control_profile_emails").innerText = "";
		response.data.email_addresses.forEach(function(email){
			var e = document.createElement("li");
			e.innerText = email;
			document.getElementById("popup_admin_user_control_profile_emails").appendChild(e);
		});
		document.getElementById("popup_admin_user_control_profile_permissions").innerText = "";
		response.data.permissions.forEach(function(p){
			var e = document.createElement("li");
			e.innerText = p;
			document.getElementById("popup_admin_user_control_profile_permissions").appendChild(e);
		});
		open_popup("popup_admin_user_control_profile");
	});
};
