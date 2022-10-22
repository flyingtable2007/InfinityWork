module.exports = class {
    constructor(){
		this.actions = {};
    }
    init(){
		app.controller.on("/api/main", async function(request, callback){
			app.routes.perform_action(request, callback);
		});
		app.controller.on("/api/user", async function(request, callback){
			if(!request.season) return callback({"status": 401});
			var raw_season_data = await app.database.get_data("seasons", request.season);
			if(!raw_season_data) return callback({"status": 401});
			var season = JSON.parse(raw_season_data);
			var permissions = await app.permissions.check_permissions_of_user(season.username);
			app.routes.perform_action(request, callback, season.username, permissions);
		});
		app.logger.log("Initing Routes..");
		require("./main")();
		require("./user")();
		require("./admin")();
		app.logger.log("Inited Routes");
	}
	perform_action(request, callback, username = false, permissions = {}){
		var action = request.action || "info";
		if(!(action in app.routes.actions)) return callback({"status": 404});
		if(app.routes.actions[action].login_required) if(username == false) return callback({"status": 401});
		if(app.routes.actions[action].admin_required) if(admin == false) return callback({"status": 401});
		for(var i = 0; i < app.routes.actions[action].permissions.length; i++){
			if(!(app.routes.actions[action].permissions[i] in permissions)){
				return callback({"status": 401});
			}
		}
		app.routes.actions[action].run(request.options || {}, function(data){
			callback({"status": 200, "response": data});
		}, username);
	}
	main_action(action, then){
		this.actions[action] = {"login_required": false, "permissions": [], "run": then};
	}
	user_action(action, then, permissions = []){
		this.actions[action] = {"login_required": true, "permissions": permissions, "run": then};
	}
}
