module.exports = function(){
	app.routes.user_action("servers", async function(options, callback, username){
		var servers = [];
		app.config.backend_server_list.forEach(function(ip){
			servers.push({"ip": ip, "connected": (ip in app.database.sync_connections), "connection": app.database.sync_connections[ip] || false});
		});
		callback({"success": true, "servers": servers});
	}, ["server_info"]);
	app.routes.user_action("change_permission_of_user", async function(options, callback, username){
		if(options.username == options.username) callback({"success": false});
	    await app.permissions.change_permissions_of_user(options.username, options.permissions);
	    callback({"success": true});
	}, ["change_admin_permission"]);
};
