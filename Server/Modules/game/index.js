module.exports = class {
    constructor(){
    }
	new_user_connection(socket, username, socket_id){
		var hosting_world = false;
		socket.on("create_world", function(data){
			hosting_world = true;
			app.database.save_data("game_worlds", username, {"username": username, "socket_id": socket_id});
		});
		socket.on("game_heartbeat", function(data){
			if(!hosting_world) return;
			try {
				data.users.forEach(async function(u){
					var check_if_this_user_is_in_world = await app.database.get_data("game_user_connected_world", u);
					if(check_if_this_user_is_in_world == username){
						app.database.send_to_user_socket_connection(u, {"data": {"action": "game_heartbeat", "data": data}, "app": "game"});
					}
				});
		    } catch(e){}
		});
		socket.on("game_input", async function(data){
			var world_user = await app.database.get_data("game_user_connected_world", username);
			var world_data = await app.database.get_data("game_worlds", world_user);
			app.database.send_to_user_socket_connection(world_data.username, {"data": {"action": "game_input", "data": data}, "app": "game_world", "socket_id": world_data.socket_id});
		});
		socket.on("join_world", function(data){
			app.database.save_data("game_user_connected_world", username, data.world);
		});
	}
};
