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
		if(await app.database.get_data("users", username)) errors.push("Benutzername bereits vergeben");
		if(errors.length > 0){
			return callback({"success": false, "errors": errors});	
		}
	    bcrypt.hash(password, 15, async function(error, hashed_password){
			app.database.save_data("users", username, hashed_password);
			var new_season = (Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*10000000).toString();
			app.database.save_data("seasons", new_season, JSON.stringify({"username": username, "time": (new Date()).toString()}));
			callback({"success": true, "season": new_season});	
	    });
	});
	app.routes.main_action("login", async function(options, callback){
	    var username = options.name || "";
	    var password = options.password || "";
	    
	    var saved_password = await app.database.get_data("users", username);
	    if(!saved_password) return callback({"success": false});	
		
		bcrypt.compare(password, saved_password, function(error, response) {
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
};
