module.exports = class {
    constructor(){
    }
	new_socket(socket, username, socket_id){
		socket.on("join_game", function(data){
		    app.game.new_user_connection(socket, username, socket_id);
		});
	}
};

