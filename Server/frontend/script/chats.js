window.chats = {};
window.open_chat = function(data, on_message_count_change = function(){}){
   var el = document.getElementsByClassName("popup_chat_chat_inner");
   for(var i = 0; i < el.length; i++){
	   el[i].style.display = "none";
   }
   if(!document.getElementById("chat_"+data.name)){
	   var a = document.createElement("div");
	   a.id = "chat_"+data.name;
	   a.classList.add("popup_chat_chat_inner");
	   var b = document.createElement("div");
	   b.style = "width: 100%; height: 75px; margin-top: 20px; text-align: center; border-bottom: 1px solid black;";
	   var c = document.createElement("div");
	   c.style = "width: 100%; height: 40px; font-size: 24px; font-weight: bold; display: flex; justify-content: center; align-items: center;";
	   c.innerText = data.name;
	   b.appendChild(c);
	   var d = document.createElement("div");
	   d.style = "width: 100%; height: 35px; font-size: 14px; display: flex; justify-content: center; align-items: center;";
	   d.innerText = data.text + " ("+data.contributions_count.toString()+" Beiträge)";
	   d.id = "chat_"+data.name+"_contributions_count";
	   b.appendChild(d);
	   a.appendChild(b);
	   var g = document.createElement("div");
	   g.style = "position: absolute; left: 0px; right: 0px; bottom: 60px; top: 95px; overflow-x: hidden; overflow-y: auto; ";
	   g.classList.add("no_scrollbar");
	   chats[data.name] = {
		   "messages_div": g,
		   "actually_message": 0,
		   "load_new_messages": function(){
			   request("get_chat_messages", {"chat": data.name, "start": chats[data.name].actually_message}, function(response){
				   response.messages.forEach(function(m){
					   chats[data.name].actually_message++;
					   var a = document.createElement("div");
					   a.style = "width: 100%; margin-top: 10px; box-sizing: border-box; border-radius: 20px; padding: 10px; background-color: lightgray; overflow: hidden; ";
					   var b = document.createElement("strong");
					   b.innerText = m.author+": ";
					   a.appendChild(b);
					   var c = document.createElement("p");
					   c.innerText = m.text;
					   a.appendChild(c);
					   chats[data.name].messages_div.appendChild(a);
					   //i.scrollIntoView({behavior: 'smooth' });
				       chats[data.name].messages_div.scrollTop = chats[data.name].messages_div.scrollHeight;
				   });
				   document.getElementById("chat_"+data.name+"_contributions_count").innerText = data.text + " ("+chats[data.name].actually_message.toString()+" Beiträge)";
				   on_message_count_change(chats[data.name].actually_message);
				   setTimeout(chats[data.name].load_new_messages, 500);
			   });
		   }
	   };
	   chats[data.name].load_new_messages();
	   a.appendChild(g);
	   var e = document.createElement("div");
	   e.style="position: absolute; left: 0px; right: 0px; bottom: 0px; height: 60px; ";
	   var f = document.createElement("input");
	   f.style = "width: 100%; height: 40px; font-size: 18px; ";
	   f.type = "text";
	   f.placeholder = "Dein Beitrag..";
	   f.onkeypress = function(event){
		   if (event.keyCode == 13) {
			   var text = f.value;
			   f.value = "";
			   request("write_chat_message", {"chat": data.name, "text": text}, function(response){
		       });
		   }
	   };
	   e.appendChild(f);
	   var g = document.createElement("div");
	   g.style = "width: 100%; height: 20px; display: flex; justify-content: center; align-items: center; ";
	   g.innerText = "Wird mit Ihrem Benuzernamen veröffentlicht.";
	   e.appendChild(g);
	   a.appendChild(e);
	   document.getElementById("chats_container").appendChild(a);
   }
   document.getElementById("chat_"+data.name).style.display = "block";
   document.getElementById("popup_chat_chats").style.transform = "translate(-100%, 0px)";
   document.getElementById("popup_chat_chat").style.transform = "translate(0px, 0px)";
};
window.close_chat = function(){
   document.getElementById("popup_chat_chats").style.transform = "translate(0px, 0px)";
   document.getElementById("popup_chat_chat").style.transform = "translate(100%, 0px)";
};
window.show_dicussion_chats = function(data){
	data.forEach(function(chat){
		request("get_chat_messages_count", {"chat": chat.name}, function(response){
			chat.contributions_count = response.count;
		    var a = document.createElement("div");
		    a.classList.add("popup_chat_menu");
		    a.onclick = function(){
		        open_chat(chat);		
			};
		    var b = document.createElement("div");
		    b.style = "height: 25px; width: 100%; font-size: 14px; font-weight: bold; display: flex; align-items: center; ";
		    b.innerText = chat.name;
		    a.appendChild(b);
		    var c = document.createElement("div");
		    c.style = "height: 25px; width: 100%; font-size: 12px; display: flex; align-items: center;";
		    c.innerText = chat.text;
		    a.appendChild(c);
		    
		    function update_message_count_info(count){
			    var info_text = false;
			    if(count > 10000) info_text = "10.000+ Beiträge";
			    else if(count > 9000) info_text = "9000+ Beiträge";
			    else if(count > 8000) info_text = "8000+ Beiträge";
			    else if(count > 7000) info_text = "7000+ Beiträge";
			    else if(count > 6000) info_text = "6000+ Beiträge";
			    else if(count > 5000) info_text = "5000+ Beiträge";
			    else if(count > 4000) info_text = "4000+ Beiträge";
			    else if(count > 3000) info_text = "3000+ Beiträge";
			    else if(count > 2000) info_text = "2000+ Beiträge";
			    else if(count > 1000) info_text = "1000+ Beiträge";
			    else if(count > 100) info_text = "100+ Beiträge";
			    else if(count > 50) info_text = "50+ Beiträge";
			    
			    if(info_text){
					if(!document.getElementById(chat.name+"_messages_count_info_list")){
						var d = document.createElement("div");
					    d.style = "position: absolute; top: 0px; right: 0px; bottom: 0px; width: 200px; display: flex; justify-content: center; align-items: center; float: right; ";
					    var e = document.createElement("div");
					    e.style = "height: 30px; width: 160px; background-color: blue; border-radius: 15px; display: flex; justify-content: center; align-items: center; color: white; font-size: 14px; ";
					    e.id = chat.name+"_messages_count_info_list";
					    d.appendChild(e);
					    a.appendChild(d);
					};
					document.getElementById(chat.name+"_messages_count_info_list").innerText = info_text;
				}
			}
			document.getElementById("popup_chat_list").appendChild(a);
			update_message_count_info(chat.contributions_count);
		});
	});
};
