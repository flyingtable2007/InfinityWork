const make_request = require('request');
const bcrypt       = require('bcrypt');   

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
		    var bit_id = await get_bit_id_of_user(username);
		    var user_data = await raw_user_data.json();
		    var discord_tag = user_data.username+"#"+user_data.discriminator;
		    if(!discord_tag) return callback({"success": false});
		    var check_if_is_connected_to_other_discord = await app.database.get_data("dicord_login", user_data.id);
		    if(check_if_is_connected_to_other_discord) return callback({"success": false, "connected_to_other_account": true});
			var user_has_already_connected_discord = await app.database.get_data("user_profile_"+bit_id, "discord");
			if(user_has_already_connected_discord){
				app.database.save_data("dicord_login", user_has_already_connected_discord.id, false);
			}
		    app.database.save_data("user_profile_"+bit_id, "discord", {"tag": discord_tag, "id": user_data.id});
		    app.database.save_data("dicord_login", user_data.id, username);
		    callback({"true": true, "tag": discord_tag});
			
	    } catch(e){
		    console.log(e);
		    callback({"success": false});
		}
	});
	app.routes.user_action("change_username", async function(options, callback, username){
		var bit_id = await get_bit_id_of_user(username);
		var new_username = options.username || "";
		if(new_username.length < 4){
			return callback({"success": false, "error": "Der Benutzername muss mindestens 4 Zeichen lang sein"});
		} else if(new_username.length > 26){
			return callback({"success": false, "error": "Der Benutzername darf maximal 26 Zeichen lang sein"});
		}
		if(await app.database.get_data("bit_user_id", new_username)) {
			var bit_id_of_new_name = await get_bit_id_of_user(username);
			if(bit_id_of_new_name != bit_id) return callback({"success": false, "error": "Dieser benutzername ist bereits vergeben"});
		}
		app.database.save_data("bit_user_id", new_username, bit_id);
		app.database.save_data("used_username_of_user", bit_id, new_username);
		callback({"success": true});
	});
	app.routes.user_action("change_password", async function(options, callback, username){
		var bit_id = await get_bit_id_of_user(username || "0");
		var password = options.password || "";
		if(password.length < 8){
			return callback({"success": false, "error": "Passwort muss mindestens 8 Zeichen lang sein"});
		} else if(password.length > 64){
			return callback({"success": false, "error": "Passwort darf maximal 64 Zeichen lang sein"});
		}
	    bcrypt.hash(password, 12, async function(error, hashed_password){
		    app.database.save_data("user_password", bit_id, hashed_password);
		    callback({"success": true});
		});
	});
	app.routes.user_action("update_user_profile", async function(options, callback, username){
		if(!options.username) options.username = username;
		if(options.username != username){
			var permissions = await app.permissions.check_permissions_of_user(username);
			if(!permissions.update_user) return;
		}
		var bit_id = await get_bit_id_of_user(options.username);
		var needs_verifycation = {"discord": true, "status": true};
		if(options.key in needs_verifycation) return;
		app.database.save_data("user_profile_"+bit_id, options.key, options.value);
		callback({"success": true});
	});
	app.routes.user_action("write_chat_message", async function(options, callback, username){
		var bit_id = await get_bit_id_of_user(username);
		if((options.text || "").trim().length > 0) app.database.save_data_to_list("chats", options.chat, {"author": username, "author_id": bit_id, "text": options.text, "time": (new Date()).toString()});
		callback({"success": true});
	}, ["DEFAULT"]);
	app.routes.user_action("create_email_address", async function(options, callback, username){
		var bit_id = await get_bit_id_of_user(username);
		if(await app.database.get_data("email", options.email) || (options.email in app.config.reserved_emails) ) return callback({"success": false, "error": "Email Addresse bereits vergeben"});
		var postfach = JSON.stringify({"bit_id": bit_id, "username": username, "servers": [app.config.own_server_ip]});
		app.database.save_data("email", options.email, postfach);
		app.database.save_data_to_list("email_addresses", bit_id, {"email": options.email});
		callback({"success": true});
	}, ["DEFAULT"]);
	app.routes.user_action("delete_email_address", async function(options, callback, username){
		var bit_id = await get_bit_id_of_user(username);
		var postfach = await app.database.get_data("email", options.email);
		if(!postfach) return callback({"success": true});
		postfach = JSON.parse(postfach);
		if(postfach.bit_id != bit_id) return callback({"success": false, "error": "Sie haben keinen Zugriff auf dieses Postfach"});
		app.database.remove("email", options.email);
		callback({"success": true});
	}, ["DEFAULT"]);
	app.routes.user_action("get_all_emails", async function(options, callback, username){
		var bit_id = await get_bit_id_of_user(username);
		var postfach = await app.database.get_data("email", options.email);
		if(!postfach) return callback({"success": false, "error": "Dieses Postfach existiert nicht"});
		postfach = JSON.parse(postfach);
		if(postfach.bit_id != bit_id) return callback({"success": false, "error": "Sie haben keinen Zugriff auf dieses Postfach"});
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
		var bit_id = await get_bit_id_of_user(username);
		var d = await app.database.get_data("email_addresses", bit_id) || {};
		var addresses = {};
		for(var i = 0; i < Object.keys(d).length; i++){
			await async function(){
				var postfach = await app.database.get_data("email", d[i].email);
				if(!postfach) return;
				postfach = JSON.parse(postfach);
		        if(postfach.bit_id != bit_id) return;
				addresses[d[i].email] = true;
		    }();
		}
		callback({"success": true, "addresses": Object.keys(addresses)});
	}, ["DEFAULT"]);
	app.routes.user_action("send_email", async function(options, callback, username){
		var bit_id = await get_bit_id_of_user(username);
		var postfach = await app.database.get_data("email", options.email);
		if(!postfach) return callback({"success": false, "error": "Dieses Postfach existiert nicht"});
		postfach = JSON.parse(postfach);
		if(postfach.bit_id != bit_id) return callback({"success": false, "error": "Sie haben keinen Zugriff auf dieses Postfach"});
		var files = options.files || [];
		app.email.send(username, options.email, options.to, options.subject, options.text, files, function(success, log){
			callback({"success": success, "log": log || "Unbekannter Fehler"});
		});
	}, ["DEFAULT"]);
	app.routes.user_action("delete_email", async function(options, callback, username){
		var bit_id = await get_bit_id_of_user(username);
		var postfach = await app.database.get_data("email", options.email);
		if(!postfach) return callback({"success": false, "error": "Dieses Postfach existiert nicht"});
		postfach = JSON.parse(postfach);
		if(postfach.bit_id != bit_id) return callback({"success": false, "error": "Sie haben keinen Zugriff auf dieses Postfach"});
	    app.database.send_to_specific_server(postfach.servers, {"text": "email", "action": "delete_email", "data": {"email": options.email, "id": options.id, "username": username}})
		callback({"success": true});
	}, ["DEFAULT"]);
	app.routes.user_action("restore_email", async function(options, callback, username){
		var bit_id = await get_bit_id_of_user(username);
		var postfach = await app.database.get_data("email", options.email);
		if(!postfach) return callback({"success": false, "error": "Dieses Postfach existiert nicht"});
		postfach = JSON.parse(postfach);
		if(postfach.bit_id != bit_id) return callback({"success": false, "error": "Sie haben keinen Zugriff auf dieses Postfach"});
	    app.database.send_to_specific_server(postfach.servers, {"text": "email", "action": "restore_email", "data": {"email": options.email, "id": options.id, "username": username}})
		callback({"success": true});
	}, ["DEFAULT"]);
	app.routes.user_action("tweetin_abbo", async function(options, callback, username){
		app.tweetin.abbo(username, options.name || "");
		callback({"success": true});
	});
	app.routes.user_action("tweetin_disabbo", async function(options, callback, username){
		app.tweetin.dis_abbo(username, options.name || "");
		callback({"success": true});
	});
	app.routes.user_action("tweetin_reaction", async function(options, callback, username){
		var new_count = await app.tweetin.react(username, options.reaction || "", options.post || "", options.status || false);
		callback({"success": true, "new_count": new_count});
	});
};
