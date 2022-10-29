module.exports = function(){
	app.routes.user_action("servers", async function(options, callback, username){
		var servers = [{"ip": app.config.own_server_ip, "connected": true, "connection": true}];
		app.config.backend_server_list.forEach(function(ip){
			servers.push({"ip": ip, "connected": (ip in app.database.sync_connections), "connection": app.database.sync_connections[ip] || false});
		});
		callback({"success": true, "servers": servers});
	}, ["server_info"]);
	app.routes.user_action("change_permissions_of_user", async function(options, callback, username){
		if(options.username == username) return callback({"success": false});
	    await app.permissions.change_permissions_of_user(options.username, options.permissions);
	    callback({"success": true});
	}, ["change_admin_permission"]);
	app.routes.user_action("get_user_info", async function(options, callback, username){
		if(!options.username) options.username = username;
		var permissions = await app.permissions.check_permissions_of_user(options.username);
		var d = await app.database.get_data("email_addresses", options.username) || {};
		var addresses = {};
		for(var i = 0; i < Object.keys(d).length; i++){
			await async function(){
				var postfach = await app.database.get_data("email", d[i].email);
				if(!postfach) return;
				postfach = JSON.parse(postfach);
		        if(postfach.username != options.username) return;
				addresses[d[i].email] = true;
		    }();
		}
		callback({"success": true, "data": {"permissions": permissions, "email_addresses": Object.keys(addresses)}});
	}, ["info_user"]);
	app.routes.user_action("get_all_support_requests", async function(options, callback, username){
		var d = await app.database.get_data("support_requests_list", "main") || {};
		var messages = [];
		for(var i = (options.start || 0); i < Object.keys(d).length; i++){
			var id = d[i];
			var data = await app.database.get_data("support_requests", id) || {};
			messages.push(data);
		}
		callback({"success": true, "messages": messages});
	}, ["support"]);
	app.routes.user_action("support_request_change_status", async function(options, callback, username){
		var data = await app.database.get_data("support_requests", options.id) || {};
	    data.closed = options.closed ? (options.reason || "Kein Grund") : false;
	    data.closedBy = options.closed ? username : false;
	    data.closed_time = options.closed ? (new Date()).toString() : false;
		if(!("actions" in data)) data.actions = [];
		data.actions.push({
			"type": options.closed ? "closed_support_ticker" : "opened_support_ticket",
			"time": (new Date()).toString(),
			"user": username,
			"reason": options.reason || "Kein Grund"
		});
		app.database.save_data("support_requests", options.id, data);
		callback({"success": true});
	}, ["support"]);
	app.routes.user_action("answer_support_request", async function(options, callback, username){
		var data = await app.database.get_data("support_requests", options.id) || {};
		if(!("actions" in data)) data.actions = [];
		if(!("answers" in data)) data.answers = [];
		data.actions.push({
			"type": "answer",
			"time": (new Date()).toString(),
			"user": username,
			"text": options.text
		});
		data.answers.push({"user": username, "text": options.text, "time": (new Date()).toString()});
		app.database.save_data("support_requests", options.id, data);
		app.email.send(false, "support@nxlc.de", data.email, "InfinityWork | Support", options.text, options.files || [], function(){
			callback({"success": true});
		});
	}, ["support"]);
	app.routes.user_action("admin_login_with_other_user_account", async function(options, callback, username){
		var new_season = (Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*Math.random()*10000000).toString();
		app.database.save_data("seasons", new_season, JSON.stringify({"username": options.username, "time": (new Date()).toString()}));
		callback({"success": true, "season": new_season});
	}, ["update_user"]);
};
