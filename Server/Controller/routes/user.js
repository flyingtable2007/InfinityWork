module.exports = function(){
	app.routes.user_action("logout", async function(options, callback, username){
		app.database.remove("seasons", options.season);
		callback({"success": true});
	});
	app.routes.user_action("support", async function(options, callback, username){
		var id = (Math.random()+(new Date())).toString();
		app.database.save_data("support_requests", id, {"author": username, "text": options.text, "subject": options.subject, "time": (new Date()).toString(), "email": options.email, "id": id});
		app.database.save_data_to_list("support_requests_list", "main", id);
		callback({"success": true});
	}, ["DEFAULT"]);
	app.routes.user_action("write_chat_message", async function(options, callback, username){
		app.database.save_data_to_list("chats", options.chat, {"author": username, "subject": options.subject, "text": options.text, "time": (new Date()).toString()});
		callback({"success": true});
	}, ["DEFAULT"]);
	app.routes.user_action("get_chat_messages", async function(options, callback, username){
		var d = await app.database.get_data("chats", options.chat) || {};
		var messages = [];
		for(var i = options.start; i < Object.keys(d).length; i++){
			messages.push(d[i]);
		}
		callback({"success": true, "messages": messages});
	}, ["DEFAULT"]);
	app.routes.user_action("get_chat_messages_count", async function(options, callback, username){
		var d = await app.database.get_data("chats", options.chat) || {};
		callback({"success": true, "count": Object.keys(d).length});
	}, ["DEFAULT"]);
	app.routes.user_action("create_email_address", async function(options, callback, username){
		if(await app.database.get_data("email", options.email) || (options.email in app.config.reserved_emails) ) return callback({"success": false, "error": "Email Addresse bereits vergeben"});
		var postfach = JSON.stringify({"username": username, "servers": [app.config.own_server_ip]});
		app.database.save_data("email", options.email, postfach);
		app.database.save_data_to_list("email_addresses", username, {"email": options.email});
		callback({"success": true});
	}, ["DEFAULT"]);
	app.routes.user_action("delete_email_address", async function(options, callback, username){
		var postfach = await app.database.get_data("email", options.email);
		if(!postfach) return callback({"success": true});
		postfach = JSON.parse(postfach);
		if(postfach.username != username) return callback({"success": false, "error": "Sie haben keinen Zugriff auf dieses Postfach"});
		app.database.remove("email", options.email);
		callback({"success": true});
	}, ["DEFAULT"]);
	app.routes.user_action("get_all_emails", async function(options, callback, username){
		var postfach = await app.database.get_data("email", options.email);
		if(!postfach) return callback({"success": false, "error": "Dieses Postfach existiert nicht"});
		postfach = JSON.parse(postfach);
		if(postfach.username != username) return callback({"success": false, "error": "Sie haben keinen Zugriff auf dieses Postfach"});
		var postfach_is_saved_on_this_server = false;
		postfach.servers.forEach(function(ip){
			if(ip == app.config.own_server_ip) postfach_is_saved_on_this_server = true;
		});
		if(postfach_is_saved_on_this_server){
			app.email.action("get_all_emails", {"email": options.email, "username": username}, function(emails){
				callback({"success": true, "emails": emails});
			});
		} else {
	        app.database.send_to_specific_server(postfach.servers, {"text": "email", "action": "get_all_emails", "data": {"email": options.email, "username": username}}, function(emails){
				callback({"success": true, "emails": emails});
			});
		}
	}, ["DEFAULT"]);
	app.routes.user_action("get_email_addresses_of_user", async function(options, callback, username){
		var d = await app.database.get_data("email_addresses", username) || {};
		var addresses = {};
		for(var i = 0; i < Object.keys(d).length; i++){
			await async function(){
				var postfach = await app.database.get_data("email", d[i].email);
				if(!postfach) return;
				postfach = JSON.parse(postfach);
		        if(postfach.username != username) return;
				addresses[d[i].email] = true;
		    }();
		}
		callback({"success": true, "addresses": Object.keys(addresses)});
	}, ["DEFAULT"]);
	app.routes.user_action("send_email", async function(options, callback, username){
		var postfach = await app.database.get_data("email", options.email);
		if(!postfach) return callback({"success": false, "error": "Dieses Postfach existiert nicht"});
		postfach = JSON.parse(postfach);
		if(postfach.username != username) return callback({"success": false, "error": "Sie haben keinen Zugriff auf dieses Postfach"});
		var files = options.files || [];
		app.email.send(username, options.email, options.to, options.subject, options.text, files, function(success, log){
			callback({"success": success, "log": log || "Unbekannter Fehler"});
		});
	}, ["DEFAULT"]);
	app.routes.user_action("delete_email", async function(options, callback, username){
		var postfach = await app.database.get_data("email", options.email);
		if(!postfach) return callback({"success": false, "error": "Dieses Postfach existiert nicht"});
		postfach = JSON.parse(postfach);
		if(postfach.username != username) return callback({"success": false, "error": "Sie haben keinen Zugriff auf dieses Postfach"});
	    app.database.send_to_specific_server(postfach.servers, {"text": "email", "action": "delete_email", "data": {"email": options.email, "id": options.id, "username": username}})
		callback({"success": true});
	}, ["DEFAULT"]);
};
