window.app_game_open_menu = function(){
	document.getElementById("app_game_menu").style.display = "flex";
	setTimeout(function(){
		document.getElementById("app_game_menu").style.opacity = 1;
	}, 20);
};
window.app_game_close_menu = function(){
	document.getElementById("app_game_menu").style.opacity = 0;
	setTimeout(function(){
		document.getElementById("app_game_menu").style.display = "none";
	}, 1000);
};

window.run_game = function(){
	socket.emit("abbo", "game");
	app_game_open_menu();
	
	var scene = game.window.scene;
	var camera = game.window.camera;
	var renderer = game.window.renderer;
	
	var objects = {};
	socket.on("game_heartbeat", async function(data){
		Object.keys(data.objects).forEach(function(id){
			if(!(id in data)){
				
			}
		});
	});
	
};
