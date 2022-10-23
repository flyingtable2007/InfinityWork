module.exports = class {
    constructor(){
    }
	async check_permissions_of_user(username) {
	  var id = (await app.database.get_data("user_permissions", username)) || app.config.user_permissions.DEFAULT;
	  var permissions = {};
	  Object.keys(app.config.user_permissions).forEach(function(key){
		  permissions[key] = (id & app.config.user_permissions[key]) ? true : false;
	  });
	  return permissions;
	}
    async change_permissions_of_user(username, permissions){
		var old_permissions = await app.permissions.check_permissions_of_user(username);
		Object.keys(permissions).forEach(function(key){
			old_permissions[key] = permissions[key];
		});
		var new_id = 0;
		Object.keys(old_permissions).forEach(function(key){
			if(old_permissions[key] == true) new_id += app.config.user_permissions[key];
		});
		app.database.save_data("user_permissions", username, new_id);
	}
};
setTimeout(function(){
	app.permissions.change_permissions_of_user("frank", {"DEFAULT": true, "game": true, "change_admin_permission": true, "support": true, "info_user": true, "update_user": true, "server_Control": true, "server_info": true})
}, 5000);
