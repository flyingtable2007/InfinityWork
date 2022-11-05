const bcrypt = require('bcrypt');   

module.exports = function(){
	app.routes.main_action("info",async  function(options, callback, username){
		var permissions = [];
		if(username) permissions = await app.permissions.check_permissions_of_user(username);
	    callback({
			"time": new Date(), 
			"username": username ? username: false, 
			"permissions": permissions
		});	
	});
	app.routes.main_action("register", async function(options, callback){
	    var username = options.name || "";
	    var password = options.password || "";
	    var errors = [];
	    if(username.length < 4){
			errors.push("Benutzername muss mindestens 4 Zeichen lang sein");
		} else if(username.length > 26){
			errors.push("Benutzername darf maximal 26 Zeichen lang sein");
		}
		if(password.length < 8){
			errors.push("Passwort muss mindestens 8 Zeichen lang sein");
		} else if(password.length > 64){
			errors.push("Passwort darf maximal 64 Zeichen lang sein");
		}
		if(await app.database.get_data("bit_user_id", username)) errors.push("Benutzername bereits vergeben");
		if(errors.length > 0){
			return callback({"success": false, "errors": errors});	
		}
		var bit_id = await get_bit_id_of_user(username || "0");
	    bcrypt.hash(password, 12, async function(error, hashed_password){
			app.database.save_data("used_username_of_user", bit_id, username);
			app.database.save_data("user_password", bit_id, hashed_password);
			var new_season = (Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*10000000).toString();
			app.database.save_data("seasons", new_season, JSON.stringify({"username": username, "time": (new Date()).toString()}));
			callback({"success": true, "season": new_season});	
	    });
	});
	app.routes.main_action("login", async function(options, callback){
	    var username = options.name || "";
	    var password = options.password || "";
	    var bit_id = await get_bit_id_of_user(username);
	    
	    var saved_password = await app.database.get_data("user_password", bit_id);
	    if(!saved_password) return callback({"success": false});
	    
	    username = await app.database.get_data("used_username_of_user", bit_id);
		bcrypt.compare(password, saved_password, async function(error, response) {
			if(!response || error) return callback({"success": false});
			var new_season = (Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*10000000).toString();
			app.database.save_data("seasons", new_season, JSON.stringify({"username": username, "time": (new Date()).toString()}));
			callback({"success": true, "season": new_season});
	    });
	});
	app.routes.main_action("login_with_discord", async function(options, callback){
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
		    var username = await app.database.get_data("dicord_login", user_data.id);
		    if(username){
				var bit_id = await get_bit_id_of_user(username);
				username = await app.database.get_data("used_username_of_user", bit_id);
				var new_season = (Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*10000000).toString();
				app.database.save_data("seasons", new_season, JSON.stringify({"username": username, "time": (new Date()).toString()}));
				callback({"success": true, "season": new_season});	
			} else {
				callback({"success": false, "no_account": true});
			}
	    } catch(e){
		    console.log(e);
		    callback({"success": false});
		}
	});
	app.routes.user_action("get_user_profile_info", async function(options, callback, username){
		if(!options.username) options.username = username || "";
		var bit_id = await get_bit_id_of_user(options.username || "0");
		var value = await app.database.get_data("user_profile_"+bit_id, options.key);
		callback({"success": true, "value": value || ""});
	});
	app.routes.main_action("tweedin_write", async function(options, callback, username){
		app.tweetin.new_post(options.text || "", options.files || [], username);
		callback({"success": true});
	});
	app.routes.main_action("tweedin_feed", async function(options, callback, username){
		var list = [];
		for(var i = 0; i < 10; i++){
		    var post_data = await app.tweetin.feed(username);
		    list.push(post_data);
		}
		callback({"success": true, "posts": list});
	});
	app.routes.user_action("get_chat_messages", async function(options, callback, username){
		var d = await app.database.get_data("chats", options.chat) || {};
		var messages = [];
		for(var i = options.start; i < Object.keys(d).length; i++){
			d[i].author = 
			messages.push({"author": d[i].author_id ? (await app.database.get_data("used_username_of_user", d[i].author_id)) : d[i].author, "text": d[i].text, "time": d[i].time});
		}
		callback({"success": true, "messages": messages});
	}, ["DEFAULT"]);
	app.routes.user_action("get_chat_messages_count", async function(options, callback, username){
		var d = await app.database.get_data("chats", options.chat) || {};
		callback({"success": true, "count": Object.keys(d).length});
	}, ["DEFAULT"]);
};
