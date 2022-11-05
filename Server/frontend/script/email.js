window.added_files_to_email = {};

window.create_email = function(){
	var email = document.getElementById("popup_create_email_postfach_email").value;
	if(!(/^[a-zA-Z1-9]/.test(email))){
		document.getElementById("popup_create_email_postfach_info").innerText = "Die Email darf nur Zeichen von A-Z und Ziffern von 0-1 enthalten";
		return;
	}
	if(!email.endsWith("@nxlc.de")) email += "@nxlc.de";
	request("create_email_address", {"email": email}, function(data){
		document.getElementById("popup_create_email_postfach_info").innerText = data.success ? "" : data.error;
		if(!data.success) return;
		close_popup();
		start_email_app();
	});
};
function get_emails_of_address(address){
	return new Promise(function(resolve, reject){
		request("get_all_emails", {"email": address}, function(data){
			resolve(data.emails || []);
		});
	});
}
window.show_email = function(box, email, d){
	var c = document.createElement("div");
	c.style = "width: 100%; margin-top: 10px; margin-left: 20px; border-left: 3px solid black; position: relative; overflow: hidden; ";
	c.classList.add("on_hover_right");
	function delete_email(event){
		if(box == "deleted") return;
		event.stopPropagation();
		setTimeout(function(){
			c.style.height = "0px";
			c.style.marginTop = "0px";
			setTimeout(function(){
		        c.style.display = "none";
		        if(email_box_divs[box][email].count == 0){
					email_box_divs[box][email].container.innerText = "Leer";
					email_box_divs[box][email].container.style = "width: 100%; text-align: center; height: 30px; margin-top: 20px; ";
				}
		    }, 1000);
		}, 20);
		if(email_box_divs.deleted[email].count == 0){
			email_box_divs.deleted[email].container.innerHTML = "";
            email_box_divs.deleted[email].container.style = "width: 100%; text-align: center; ";
        }
		show_email("deleted", email, d);
		email_box_divs[box][email].count--;
		email_boxes_counts[box]--;
		update_emails_count();
		if(opened_email_subject == d.subject) document.getElementById("app_email_email_preview_"+(last_email_preview_used_div ? 1 : 2)).style.opacity = 0;	
		request("delete_email", {"email": email, "id": d.id});
	};
	function restore_email(event){
		console.log(d);
		if(box != "deleted") return;
		event.stopPropagation();
		var new_box = "posteingang";
		setTimeout(function(){
			c.style.height = "0px";
			c.style.marginTop = "0px";
			setTimeout(function(){
		        c.style.display = "none";
		        if(email_box_divs[box][email].count == 0){
					email_box_divs[box][email].container.innerText = "Leer";
					email_box_divs[box][email].container.style = "width: 100%; text-align: center; height: 30px; margin-top: 20px; ";
				}
		    }, 1000);
		}, 20);
		if(email_box_divs[new_box][email].count == 0){
			email_box_divs[new_box][email].container.innerHTML = "";
            email_box_divs[new_box][email].container.style = "width: 100%; text-align: center; ";
        }
		show_email(new_box, email, d);
		email_box_divs[box][email].count--;
		email_boxes_counts[new_box]++;
		update_emails_count();
		if(opened_email_subject == d.subject) document.getElementById("app_email_email_preview_"+(last_email_preview_used_div ? 1 : 2)).style.opacity = 0;	
		request("restore_email", {"email": email, "id": d.id});
	}
	c.onclick = function(){
		opened_email_subject = d.subject;
		last_email_preview_used_div = !last_email_preview_used_div;
		var old_id = last_email_preview_used_div ? 2 : 1;
		var id = last_email_preview_used_div ? 1 : 2;
		document.getElementById("app_email_email_preview_"+old_id).style.opacity = 0;
		document.getElementById("app_email_email_preview_"+id).style.display = "block";
		setTimeout(function(){
		    document.getElementById("app_email_email_preview_"+id).style.opacity = 1;
		}, 20);
		setTimeout(function(){
			document.getElementById("app_email_email_preview_"+old_id).style.display = "none";
		}, 250);
		
		document.getElementById("app_email_email_preview_"+id+"_subject").innerText = d.subject;
		document.getElementById("app_email_email_preview_"+id+"_from").innerText = d.from+" ("+d.sender+")";
		document.getElementById("app_email_email_preview_"+id+"_from").style.backgroundColor = d.warning ? "red" : "";
		document.getElementById("app_email_email_preview_"+id+"_to").innerText = d.to;
		
		document.getElementById("app_email_email_preview_"+id+"_answer_button").onclick = function(){
			open_popup("popup_write_email");
			document.getElementById("popup_write_email_select_sender_email").value = d.to;
			document.getElementById("popup_write_email_to").value = d.from;
			document.getElementById("popup_write_email_subject").value = "RE: "+d.subject;
		};
		document.getElementById("app_email_email_preview_"+id+"_weiterleiten_button").onclick = function(){
			open_popup("popup_write_email");
			document.getElementById("popup_write_email_select_sender_email").value = d.to;
			document.getElementById("popup_write_email_subject").value = "FW: "+d.subject;
		};
		document.getElementById("app_email_email_preview_"+id+"_delete_button").innerHTML = box == "deleted" ? "&larr; Wiederherstellen" : "&#215; Löschen";
		document.getElementById("app_email_email_preview_"+id+"_delete_button").onclick = box == "deleted" ? restore_email : delete_email;

		document.getElementById("app_email_email_preview_"+id+"_content").innerHTML = "";
		var e = document.createElement("iframe");
		e.designMode="On";
		e.sandBox = true;
		e.style = "width: 100%; height: 100%; background-color: lightgray; ";
		e.onload = function(){
			var domdoc = e.contentDocument || e.contentWindow.document;
			domdoc.body.innerHTML = d.content.html || "Kein Inhalt";
			e.sandbox = "";
		}
		document.getElementById("app_email_email_preview_"+id+"_content").appendChild(e);
		
		document.getElementById("app_email_email_preview_"+id+"_attachments").innerText = d.files.length == 0 ? "Keine Anhänge" : "";
		d.files.forEach(function(a){
			var f = document.createElement("div");
			f.style = "height: 25px; border-radius: 10px; margin-left: 10px; background-color: darkgray; color: white; display: flex; justify-content: center; align-items: center; padding-left: 10px; padding-right: 10px; cursor: grab; ";
			f.classList.add("on_hover_down");
			f.innerText = a.filename.length < 20 ? a.filename : a.filename.slice(0,20) + "..";
			f.onclick = function(){
				open_popup("popup_email_attachment");
				document.getElementById("popup_email_attachment_email").innerText = d.from;
				document.getElementById("popup_email_attachment_mailserver").innerText = d.sender;
				document.getElementById("popup_email_attachment_preview").innerHTML = "";
				if(a.filename.endsWith(".png") || a.filename.endsWith(".jpg") || a.filename.endsWith(".jpeg") || a.filename.endsWith(".gif")){
				     var preview = document.createElement("img");
				     preview.style = "height: 300px; ";
				     preview.src = "/attachment/"+a.id;
				     document.getElementById("popup_email_attachment_preview").appendChild(preview);
				} else if(a.filename.endsWith(".mp3")){
				     var preview = document.createElement("audio");
				     preview.src = "/attachment/"+a.id;
				     document.getElementById("popup_email_attachment_preview").appendChild(preview);
				} else if(a.filename.endsWith(".mp4")){
				     var preview = document.createElement("video");
				     preview.style = "height: 300px; ";
				     preview.src = "/attachment/"+a.id;
				     document.getElementById("popup_email_attachment_preview").appendChild(preview);
				}
				document.getElementById("popup_email_attachment_download_button").onclick = function(){
					window.open("/attachment/"+a.id+"/"+a.filename, "_blank");
				};
			};
			document.getElementById("app_email_email_preview_"+id+"_attachments").appendChild(f);
		});
	};
	var f = document.createElement("div");
	f.style = "width: 100%; text-align: left; margin-top: 5px; word-wrap: break-word; ";
	f.innerText = d.subject;
	c.appendChild(f);
	var g = document.createElement("div");
	g.style = "width: 100%; text-align: left; margin-top: 10px; word-wrap: break-word; ";
	g.innerText = d.from;
	c.appendChild(g);
	var h = document.createElement("div");
	h.style = "width: 100%; text-align: left; margin-top: 10px; font-weight: lighter; font-size: 10px; text-align: center; word-wrap: break-word; ";
	h.innerText = (new Date(d.date)).toLocaleString('de-DE');
	c.appendChild(h);
	var i = document.createElement("div");
	i.style = "position: absolute; right: 40px; top: 0px; width: 14px; height: 14px; display: flex; flex-direction: row; justify-content: space-around; align-items: center; ";
	if(box != "deleted"){
		var j = document.createElement("img");
		j.style = "height: 14px; width: 14px; opacity: 0.8; ";
		i.classList.add("on_hover_down");
	    j.src = "/images/delete.png";
	    j.onclick = delete_email;
	    i.appendChild(j);
	}
	c.appendChild(i);
	email_box_divs[box][email].container.prepend(c);
}

window.last_email_preview_used_div = true;
window.opened_email_subject = false;
window.email_box_divs = {};
window.own_email_addresses_count = 0;
window.email_boxes_counts = {"posteingang": 0, "postausgang": 0, "spam": 0};
window.update_emails_count = function(){
	document.getElementById("posteingang_count").innerText = email_boxes_counts.posteingang.toString();
	document.getElementById("postausgang_count").innerText = email_boxes_counts.postausgang .toString();
	document.getElementById("spam_count").innerText = email_boxes_counts.spam.toString();
};
window.show_all_email_address_boxes = function(){
	Object.values(email_box_divs).forEach(function(box){
		Object.keys(box).forEach(function(key){
			box[key].box_container.style.display = "block";
		});
	});
};
window.show_only_emails_of_one_address = function(email){
	Object.values(email_box_divs).forEach(function(box){
		Object.keys(box).forEach(function(key){
			box[key].box_container.style.display = key != email ? "none" : "block";
		});
	});
};
window.start_email_app = function(after_delting_email = false){
	open_app('email');
	email_boxes_counts = {"posteingang": 0, "postausgang": 0, "spam": 0};
	socket.emit("abbo", "email");
	socket.on("new_email", function(data){
		show_email(data.box, data.email, data.data);
	});
	request("get_email_addresses_of_user", {}, function(data){
		if(data.addresses.length == 0 && !after_delting_email) return open_popup('popup_create_email_postfach');
		//if(data.addresses.length == 0 && after_delting_email) return close_app();
		own_email_addresses_count = data.addresses.length;
		document.getElementById("app_email_addresses").innerHTML = "";
		document.getElementById("popup_write_email_select_sender_email").innerHTML = "";
		data.addresses.forEach(function(email){
			var e = document.createElement("li");
			e.style = "cursor: grab; ";
			e.innerText = email;
			e.oncontextmenu = function(event){
				event.preventDefault();
				document.getElementById("popup_email_address_info_email").innerText = email;
				document.getElementById("popup_email_address_info_delete_button").onclick = function(){
					document.getElementById("popup_delete_email_confirm_email").innerText = email;
				    document.getElementById("popup_delete_email_confirm_button").onclick = function(){
						request("delete_email_address", {"email": email}, function(data){
							if(data.success) {
								close_popup();
								start_email_app(true);
							}
						});
					};
				    open_popup("popup_delete_email_confirm");
				};
				open_popup("popup_email_address_info");
			};
			e.onclick = function(){
				show_only_emails_of_one_address(email);
			};
			document.getElementById("app_email_addresses").appendChild(e);
			var e2 = document.createElement("option");
			e2.value = email;
			e2.innerText = email;
			document.getElementById("popup_write_email_select_sender_email").appendChild(e2);
		});
		document.getElementById("app_email_posteingang").innerHTML = "";
		document.getElementById("app_email_postausgang").innerHTML = "";
		document.getElementById("app_email_spam").innerHTML = "";
		document.getElementById("app_email_deleted").innerHTML = "";
		["posteingang", "postausgang", "spam", "deleted"].forEach(function(box){
			document.getElementById("app_email_"+box).innerHTML = "";
			email_box_divs[box] = {};
			data.addresses.forEach(function(email){
				var el = document.createElement("div");
				el.style = "margin-top: 20px; ";
				var a = document.createElement("strong");
				a.style = "text-align: left; margin-left: 5px; "
				a.innerText = email;
				el.appendChild(a);
				var b = document.createElement("div");
				b.style = "width: 100%; text-align: center; height: 30px; margin-top: 20px; ";
				b.innerText = "Wird geladen..";
				el.appendChild(b);
				document.getElementById("app_email_"+box).appendChild(el);
				email_box_divs[box][email] = {"container": b, "count": false, "box_container": el};
			});
		});
		data.addresses.forEach(async function(email){
			var emails = await get_emails_of_address(email);
			email_boxes_counts.posteingang += emails.posteingang ? emails.posteingang.length : 0;
			email_boxes_counts.postausgang += emails.postausgang ? emails.postausgang.length : 0;
			email_boxes_counts.spam += emails.spam ? emails.spam.length : 0;
			update_emails_count();
			["posteingang", "postausgang", "spam", "deleted"].forEach(function(box){
				var b = email_box_divs[box][email].container;
				email_box_divs[box][email].count = (box in emails) ? emails[box].length : 0;
				b.innerHTML = "";
				b.style = "width: 100%; text-align: center; ";
				if(!(box in emails) || (emails[box].length == 0)){
					b.innerText = "Leer";
					b.style = "width: 100%; text-align: center; height: 30px; margin-top: 20px; ";
				} else {
					var email_count = emails[box].length;
					emails[box].forEach(function(d){
						show_email(box, email, d);
					});
				}
			});
	    });
	});
};
window.send_email = function(){
	if(Object.keys(added_files_to_email).length > 0){
		for(var i = 0; i < Object.keys(added_files_to_email).length; i++){
			var file_data = added_files_to_email[Object.keys(added_files_to_email)[i]];
			if(file_data.upload == 2) return;
			if(!file_data.upload){
				added_files_to_email[Object.keys(added_files_to_email)[i]].uploaded = 2;
				open_popup("popup_uploading_files");
				function update_upload_progress(){
					var uploaded_size = 0;
					var all_size = 0;
					Object.values(added_files_to_email).forEach(function(f){
						all_size += f.file.size;
						uploaded_size += f.file.size*f.progress;
					});
					document.getElementById("popup_uploading_files_div").innerText = (uploaded_size/all_size*100).toFixed(2)+"%";
				}
				update_upload_progress();
				upload_file(file_data.file, "/upload_attachment/"+file_data.file.name, function(progress){
					added_files_to_email[Object.keys(added_files_to_email)[i]].progress = progress;
					update_upload_progress();
				}, function(data){
					if(!data || !data.success){
						added_files_to_email[Object.keys(added_files_to_email)[i]].upload = false;
						send_email();
					    return;	
					}
					added_files_to_email[Object.keys(added_files_to_email)[i]].upload = true;
					added_files_to_email[Object.keys(added_files_to_email)[i]].id = data.id;
					update_upload_progress();
					send_email();
				});
				return;
			}
		}
		close_popup();
	}
	var from = document.getElementById("popup_write_email_select_sender_email").value;
    var to = document.getElementById("popup_write_email_to").value;
    var subject = document.getElementById("popup_write_email_subject").value;
	var text = document.getElementById("popup_write_email_text").innerHTML;
    document.getElementById("popup_write_email_button").disabled = true;
    document.getElementById("popup_write_email_button").innerText = "...";
    var files = [];
    Object.values(added_files_to_email).forEach(function(f){
		files.push({"filename": f.file.name, "id": f.id});
	});
	request("send_email", {"email": from, "to": to, "subject": subject, "text": text, files: files}, function(data){
		document.getElementById("popup_write_email_button").disabled = false;
        document.getElementById("popup_write_email_button").innerText = "Senden";
		if(data.success){
			close_popup();
			document.getElementById("popup_write_email_to").value = "";
			document.getElementById("popup_write_email_subject").value = "";
			document.getElementById("popup_write_email_text").innerHTML = "";
			added_files_to_email = {};
			setTimeout(function(){
				open_popup("popup_email_success", "170px");
				try {
					if(email_box_divs.postausgang[from].count == 0){
						email_box_divs.postausgang[from].container.innerHTML = "";
			            email_box_divs.postausgang[from].container.style = "width: 100%; text-align: center; ";
			        }
					show_email("postausgang", from, {
						"from": from,
						"to": to,
						"subject": subject,
						"content": {"html": text, "text": text},
						"date": (new Date()).toString(),
						"files": files
					});
					email_box_divs.postausgang[from].count++;
					email_boxes_counts.postausgang++;
					update_emails_count();
				} catch(e){
					console.log("Error: "+e);
				}
			}, 1000);
		} else {
			open_popup("popup_email_error");
			document.getElementById("popup_email_error_info").innerText = data.log;
		}
    });
};

window.open_email_box_menu = function(id){
	show_all_email_address_boxes();
	var el = document.getElementsByClassName("email_box_menu");
	for(var i = 0; i < el.length; i++){
		if(el[i].id != id) el[i].style.opacity = 0;	
	}
	document.getElementById(id).style.display = "block";
	setTimeout(function(){
		document.getElementById(id).style.opacity = 1;
	}, 20);
	setTimeout(function(){
	    for(var i = 0; i < el.length; i++){
			if(el[i].id != id) el[i].style.display = "none";
		}	
	}, 200);
};

window.add_file_to_email = function(){
	var files = document.getElementById("popup_write_email_upload_file").files;
	if(files.length == 0) return;
	for(var i = 0; i < files.length; i++){
		var file = files[i];
		var id = Math.random();
		added_files_to_email[id] = {file: file, upload: false, id: false, progress: 0};
		var el = document.createElement("div");
		el.style = "margin: 10px; padding: 5px; background-color: gray; color: white; border-radius: 5px; font-size: 14px; ";
		el.innerText = file.name;
		el.onclick = function(){
			delete added_files_to_email[id];
			el.style.display = "none";
		}
		document.getElementById("popup_write_email_added_files").appendChild(el);
	};
};
window.open_email_write_editor = function(){
	if(own_email_addresses_count == 0) return open_popup('popup_create_email_postfach');
	open_popup('popup_write_email');
};
