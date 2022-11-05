window.tweetin_start = function(){
	tweetin_init();
	document.getElementById("Tweetin_mainpage_wellcome_window").style.opacity = 0;
	setTimeout(function(){
		document.getElementById("Tweetin_mainpage_wellcome_window").style.display = "none";
	}, 1000);
	
	document.getElementById("Tweetin_mainpage_main").style.display = "block";
	setTimeout(function(){
		document.getElementById("Tweetin_mainpage_main").style.opacity = 1;
	}, 20);
};

window.create_post_element = function(post_data){
	try {
		var a = document.createElement("div");
		a.style = "width: 100%; ";
		var b = document.createElement("div");
		b.classList.add("Tweetin_post_container");
		var c = document.createElement("div");
		c.style = "width: 100%; height: 50px; border-bottom: 1px solid lightblue;  display: flex; justify-content: center; align-items: center; ";
		var d = document.createElement("div");
		if(post_data.author.username){
			d.onclick = function(){
				open_user_profile(post_data.author.username);
			};
		}
		d.style = "width: 100%; height: 40px; position: relative; ";
		var e1 = document.createElement("div");
		e1.style = "position: absolute; top: 0px; bottom: 0px; left: 20px; width: 40px; ";
		var f = document.createElement("img");
		f.style = "width: 100%; height: 100%; ";
		f.src = post_data.author.profile_url;
		e1.appendChild(f);
		d.appendChild(e1);
		var e2 = document.createElement("div");
		e2.style = "position: absolute; top: 0px; bottom: 0px; left: 70px; right: 150px; ";
		var f0 = document.createElement("div");
		f0.style = "height: 100%; float: left; ";
		var f2 = document.createElement("div");
		f2.style = "width: 100%; height: 18px; font-weight: bold; display: flex; justify-content: center; align-items: center;";
		f2.innerText = post_data.author.username || "Anonymer gast";
		f0.appendChild(f2);
		if(post_data.author.username){
			var f3 = document.createElement("div");
			f3.style = "width: 100%; height: 22px; font-weight: small; font-size: 11px; display: flex; justify-content: center; align-items: center;";
			var ff1 = document.createElement("span");
			ff1.innerText = post_data.author.abbo_count;
			ff1.classList.add("abbo_count_"+post_data.author.username);
			f3.appendChild(ff1);
			var ff2 = document.createElement("span");
			ff2.style = "margin-left: 5px; ";
			ff2.innerText = " Abonenten";
			f3.appendChild(ff2);
			f0.appendChild(f3);
		}
		e2.appendChild(f0);
		post_data.author.symbols.forEach(function(url){
			var n1 = document.createElement("div");
			n1.style = "height: 100%; float: left; margin-left: 10px; display: flex; justify-content: center; align-items: center; ";
			var n2 = document.createElement("img");
			n2.style = "height: 80%; ";
			n2.src = url;
			n1.appendChild(n2);
			e2.appendChild(n1);
		});
		d.appendChild(e2);
		var e3 = document.createElement("div");
		e3.style = "position: absolute; top: 0px; bottom: 0px; right: 0px; width: 150px; display: flex; justify-content: center; align-items: center; ";
		if(post_data.author.username){
			var f4 = document.createElement("button");
			f4.style = "height: 40px; width: 130px; background-color: red; color: white; font-size: 20px; ";
			f4.innerText = post_data.author.has_abbo ? "Entfolgen" : "Folgen";
			f4.style.background = post_data.author.has_abbo ? "lightgray" : "red";
			f4.classList.add("abbo_button_"+post_data.author.username);
			f4.onclick = function(e){
				e.stopPropagation();
				if(season_user_data){
					post_data.author.has_abbo = f4.style.background == "red";
					var els = document.getElementsByClassName("abbo_button_"+post_data.author.username);
					for(var i = 0; i < els.length; i++){
						els[i].style.background = post_data.author.has_abbo ? "lightgray" : "red";
						els[i].innerText = post_data.author.has_abbo ? "Entfolgen" : "Folgen";
					}
					var els2 = document.getElementsByClassName("abbo_count_"+post_data.author.username);
					var new_count = Number(els2[els2.length-1].innerText);
					new_count += (post_data.author.has_abbo ? 1 : -1);
					for(var i = 0; i < els2.length; i++){
						els2[i].innerText = new_count;
					}
					request(post_data.author.has_abbo ? "tweetin_abbo" : "tweetin_disabbo", {"name": post_data.author.username});
				} else {
					open_popup("popup_login");
				}
			};
			e3.appendChild(f4);
		}
		d.appendChild(e3);
		c.appendChild(d);
		b.appendChild(c);
		if(post_data.files.length > 0){
			var o = document.createElement("div");
			o.style = "width: 100%; min-height: 30px; height: auto; max-height: 200px; border-bottom: 1px solid lightblue; overflow-x: hidden; overflow-y: auto; ";
			var p = document.createElement("div");
			p.style = "width: 100%; height: auto; min-height: 0px; ";
			post_data.files.forEach(function(file){
				var f = document.createElement("div");
			    f.style="position: relative; height: 100px; width: auto; min-width: 50px; max-width: 200px; float: left; padding: 10px; text-align: center; ";
			    if(file.type == "image"){
					var g = document.createElement("img");
					g.style = "height: 100%; ";
					g.src = "/attachment/"+file.url;
					f.appendChild(g);
				} else if(file.type == "video"){
					var g = document.createElement("video");
					g.style = "height: 100%; ";
					g.controls = true;
					g.src = "/attachment/"+file.url;
					f.appendChild(g);
				}
			    p.appendChild(f);
			});
			o.appendChild(p);
			b.appendChild(o);
	    }
		var g = document.createElement("div");
		g.style = "max-height: 450px; height: auto; min-height: 50px; width: calc( 100% - 5px ); margin-top: 20px; overflow-x: hidden; overflow-y: auto; margin-left: 5px; ";
		g.innerText = post_data.text;
		b.appendChild(g);
		var h = document.createElement("div");
		h.style = "width: 100%; height: 27px; border-top: 1px solid lightblue; display: flex; justify-content: space-around; align-items: center;";
		[{"name": "love", "url": "/images/heart.png"}, {"name": "like", "url": "/images/like.png"}, {"name": "dislike", "url": "/images/dislike.png"}].forEach(function(data){
			var i = document.createElement("div");
			i.classList.add("tweetin_post_reaction_"+post_data.id+"_"+data.name);
			i.style = "height: 19px; width: 65px; border: 1px solid blue; border-radius: 5px; position: relative; cursor: grab; ";
			i.style.background = post_data.own_reactions[data.name] ? "lightblue" : "white";
			var j1 = document.createElement("div");
			j1.style = "position: absolute; top: 2px; left: 3px; bottom: 2px; width: 15px;"
			var k = document.createElement("img");
			k.style = "width: 100%; height: 100%; ";
			k.src = data.url;
			j1.appendChild(k);
			i.appendChild(j1);
			var j2 = document.createElement("div");
			j2.classList.add("tweetin_post_reaction_"+post_data.id+"_"+data.name+"_text")
			j2.style = "position: absolute; top: 0px; left: 18px; bottom: 0px; right: 0px; display: flex; justify-content: center; align-items: center; ";
			j2.innerText = post_data.reactions[data.name] || 0;
			i.appendChild(j2);
			i.onclick = function(){
				if(season_user_data){
					var els = document.getElementsByClassName("tweetin_post_reaction_"+post_data.id+"_"+data.name);
					var elsb = document.getElementsByClassName("tweetin_post_reaction_"+post_data.id+"_"+data.name+"_text");
					post_data.own_reactions[data.name] = els[els.length-1].style.background == "white";
					post_data.reactions[data.name] = Number(elsb[elsb.length-1].innerText) + (post_data.own_reactions[data.name] ? 1 : -1);
					for(var ii = 0; ii < els.length; ii++){
						els[ii].style.background = post_data.own_reactions[data.name] ? "lightblue" : "white";
					}
					for(var ii = 0; ii < elsb.length; ii++){
						elsb[ii].innerText = post_data.reactions[data.name] || 0;
					}
					request("tweetin_reaction", {"reaction": data.name, "post": post_data.id, "status": post_data.own_reactions[data.name]}, function(response){});
				} else {
					open_popup("popup_login");
				}
			};
			h.appendChild(i);
		});
		b.appendChild(h);
		a.appendChild(b);
		var l = document.createElement("div");
		l.style = "width: 100%; height: 29px; display: flex; justify-content: center; align-items: center; ";
		var m = document.createElement("a");
		m.style = "font-size: 10px; ";
		m.innerText = "Kommentare anzeigen";
		m.onclick = function(){
			chats_open_discussion_popup({"header": post_data.author.username ? (post_data.author.username + " | Kommentare") : "Kommentare", "subheader": "Wie hat Ihnen Dieser Post gefallen? Tauschen Sie sich mit anderen Lesern aus.", "chats": post_data.chats});
		};
		m.href = "#";
		l.appendChild(m);
		a.appendChild(l);
		return a;
	} catch(e){
		console.log(e);
	}
};
window.tweet_in_files_of_post = {};
window.tweetin_send = function(){
	var text = document.getElementById("Tweetin_write_container_text").value.trim();
	if(text == "") return;
	if(text.length > 10000) return;
	if(Object.keys(tweet_in_files_of_post).length > 0){
		for(var i = 0; i < Object.keys(tweet_in_files_of_post).length; i++){
			var file_data = tweet_in_files_of_post[Object.keys(tweet_in_files_of_post)[i]];
			if(file_data.upload == 2) return;
			if(!file_data.upload){
				tweet_in_files_of_post[Object.keys(tweet_in_files_of_post)[i]].uploaded = 2;
				open_popup("popup_uploading_files");
				function update_upload_progress(){
					var uploaded_size = 0;
					var all_size = 0;
					Object.values(tweet_in_files_of_post).forEach(function(f){
						all_size += f.file.size;
						uploaded_size += f.file.size*f.progress;
					});
					document.getElementById("popup_uploading_files_div").innerText = (uploaded_size/all_size*100).toFixed(2)+"%";
				}
				update_upload_progress();
				upload_file(file_data.file, "/upload_attachment/"+file_data.file.name, function(progress){
					tweet_in_files_of_post[Object.keys(tweet_in_files_of_post)[i]].progress = progress;
					update_upload_progress();
				}, function(data){
					if(!data || !data.success){
						tweet_in_files_of_post[Object.keys(tweet_in_files_of_post)[i]].upload = false;
						tweetin_send();
					    return;	
					}
					tweet_in_files_of_post[Object.keys(tweet_in_files_of_post)[i]].upload = true;
					tweet_in_files_of_post[Object.keys(tweet_in_files_of_post)[i]].id = data.id;
					update_upload_progress();
					tweetin_send();
				});
				return;
			}
		}
		close_popup();
	}
	var files = [];
	Object.values(tweet_in_files_of_post).forEach(function(f){
		files.push({"type": f.file['type'].split('/')[0], "url": f.id});
	});
	request("tweedin_write", {"text": text, "files": files}, function(response){
		if(response.success){
			document.getElementById('Tweetin_write_container').style.display = 'none';
			document.getElementById("Tweetin_write_container_text").value = "";
			document.getElementById("Tweetin_write_container_files_preview").innerHTML = "";
			tweet_in_files_of_post = {};
			tweetin_add_post_to_feed();
		}
	});
};
window.tweetin_add_files_to_post = function(){
	var files = document.getElementById('Tweetin_add_files_to_post_input').files;
	for(var i = 0; i < files.length; i++){
		var file = files[i];
		var new_file_id = Math.random();
	    tweet_in_files_of_post[new_file_id] = {file: file, upload: false, id: false, progress: 0};
	    var f = document.createElement("div");
	    f.style="position: relative; height: 100px; width: auto; min-width: 50px; max-width: 200px; float: left; padding: 10px; text-align: center; ";
	    if(file['type'].split('/')[0] === 'image'){
			var g = document.createElement("img");
			g.style = "height: 100%; ";
			g.src = URL.createObjectURL(file);
			f.appendChild(g);
		} else if(file['type'].split('/')[0] === 'video'){
			var g = document.createElement("video");
			g.style = "height: 100%; ";
			g.controls = true;
			g.src = URL.createObjectURL(file);
			f.appendChild(g);
		}
		var h = document.createElement("img");
		h.style = "position: absolute; top: 0px; right: 0px; height: 20px; width: 20px; ";
		h.src = "/images/delete.png";
		h.classList.add("on_hover_press");
		h.onclick = function(){
			f.style.display = "none";
			delete tweet_in_files_of_post[new_file_id];
			try {
			    document.getElementById("Tweetin_write_container_files_preview").removeChild(f);
			} catch(e){
				console.log(e);
			}
		};
		f.appendChild(h);
	    document.getElementById("Tweetin_write_container_files_preview").appendChild(f);
	};
};

window.tweetin_add_post_to_feed = function(){
	return new Promise(function(resolve, reject){
		request("tweedin_feed", {}, function(response){
			document.getElementById("Tweetin_feed_container_start_message").style.opacity = 0;
			response.posts.forEach(function(post_data){
				if(!post_data) return console.log("no more posts");
				var new_el = create_post_element(post_data);
				document.getElementById("Tweetin_feed_container").appendChild(new_el);
			});
			resolve();
		});
	});
};
window.tweetin_init = async function(){
	async function check(){
		const max_height = Math.max(
		  document.getElementById("Tweetin_feed_container_container").scrollHeight,
		  document.getElementById("Tweetin_feed_container_container").offsetHeight,
		  document.getElementById("Tweetin_feed_container_container").clientHeight
		);
		var current_scroll_position = Math.max(document.getElementById("Tweetin_feed_container_container").scrollTop, 2000);
		if(max_height-current_scroll_position < 1400){
			while(Math.max(
		        document.getElementById("Tweetin_feed_container_container").scrollHeight,
		        document.getElementById("Tweetin_feed_container_container").offsetHeight,
		        document.getElementById("Tweetin_feed_container_container").clientHeight
		    ) > 10000 && Math.max(document.getElementById("Tweetin_feed_container_container").scrollTop, 2000) > 5000) document.getElementById("Tweetin_feed_container").removeChild(document.getElementById("Tweetin_feed_container").firstElementChild);
			await tweetin_add_post_to_feed();
			setTimeout(check, 100);
		} else {
			setTimeout(check, 1000);
		}
	}
	check();
	setInterval(tweetin_add_post_to_feed, 5000);
};
