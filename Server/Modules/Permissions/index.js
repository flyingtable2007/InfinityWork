module.exports = class {
    constructor(){
    }
	async check_permissions_of_user(username) {
	  var id = (await app.database.get_data("user_permissions", username)) || app.config.user_permissions.DEFAULT;
	  var permissions = {};
	  Object.keys(app.config.user_permissions).forEach(function(key){
		  permissions[key] = (id & app.config.user_permissions[key]);
	  });
	  return permissions;
	}
    async change_permissions_of_user(username, permissions){
		var old_permissions = app.permissions.check_permissions_of_user(usernme);
		permissions.forEach(function(key){
			old_permissions[key] = permissions[key];
		});
		var new_id = 0;
		old_permissions.forEach(function(key){
			if(old_permissions[key] == true) new_id += app.config.user_permissions[key];
		});
		app.database.save_data("user_permissions", username, new_id);
	}
};
