const make_request = require('request');

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
	app.routes.user_action("connect_to_discord", async function(options, callback, username){
		try {
			var code = options.code || "";
			const tokenResponseData = await fetch('https://discord.com/api/oauth2/token', {
				method: 'POST',
				body: new URLSearchParams({
					client_id: app.config.discord.clientId,
					client_secret: app.config.discord.clientSecret,
					code: code,
					grant_type: 'authorization_code',
					redirect_uri: `https://nxlc.de/`,
					scope: 'identify',
				}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});
			const oauthData = await tokenResponseData.json();
			if(oauthData.error) return callback({"success": false});
			var access_token = oauthData.access_token;
			
			const raw_user_data = await fetch('https://discord.com/api/users/@me', {
				headers: {
		          "authorization": `Bearer ${access_token}`
		        }
		    });
		    var user_data = await raw_user_data.json();
		    var discord_tag = user_data.username+"#"+user_data.discriminator;
		    if(!discord_tag) return callback({"success": false});
		    var check_if_is_connected_to_other_discord = await app.database.get_data("dicord_login", user_data.id);
		    if(check_if_is_connected_to_other_discord) return callback({"success": false, "connected_to_other_account": true});
			var user_has_already_connected_discord = await app.database.get_data("user_profile_"+username, "discord");
			if(user_has_already_connected_discord){
				app.database.save_data("dicord_login", user_has_already_connected_discord.id, false);
			}
		    app.database.save_data("user_profile_"+username, "discord", {"tag": discord_tag, "id": user_data.id});
		    app.database.save_data("dicord_login", user_data.id, username);
		    callback({"true": true, "tag": discord_tag});
			
	    } catch(e){
		    console.log(e);
		    callback({"success": false});
		}
	});
	app.routes.user_action("update_user_profile", async function(options, callback, username){
		if(!options.username) options.username = username;
		if(options.username != username){
			var permissions = await app.permissions.check_permissions_of_user(season.username);
			if(!permissionsupdate_user) return;
		}
		var needs_verifycation = {"discord": true};
		if(options.key in needs_verifycation) return;
		app.database.save_data("user_profile_"+options.username, options.key, options.value);
		callback({"success": true});
	});
	app.routes.user_action("get_user_profile_info", async function(options, callback, username){
		if(!options.username) options.username = username;
		var value = await app.database.get_data("user_profile_"+options.username, options.key);
		callback({"success": true, "value": value || ""});
	});
	app.routes.user_action("write_chat_message", async function(options, callback, username){
		if((options.text || "").trim().length > 0) app.database.save_data_to_list("chats", options.chat, {"author": username, "subject": options.subject, "text": options.text, "time": (new Date()).toString()});
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
