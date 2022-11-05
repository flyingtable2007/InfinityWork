var js_files_to_load = {
    "start": [
        "https://unpkg.com/three@0.126.0/build/three.js"
    ],
    "additional": [
        "https://unpkg.com/three@0.126.0/examples/js/loaders/GLTFLoader.js",
        "https://unpkg.com/three@0.126.0/examples/jsm/controls/OrbitControls.js",
        "game/scripts/main.js"
    ]
};
var modles_to_load = [
    {"name": "BoomBox", "url": "game/models/BoomBox.glb"}
];

window.game = {"status": false, "models": {}, "window": false};

window.start_game_app = function(){
    open_app('game');
    load_game();
};

class Loader {
    constructor() {
        this.GLTFLoader = new THREE.GLTFLoader();
    }
    async load_models(list, on_progress = false){
        for(var i = 0; i < list.length; i++){
            await new Promise(function(resolve, reject){
                if(list[i].name in game.models) if(game.models[list[i].name].status) return resolve();
                game.models[list[i].name] = {"object": false, "status": "loading"};
	            game.loader.GLTFLoader.load( list[i].url, function ( gltf ) {
	                game.models[list[i].name] = {"object": gltf, "status": "loaded"};
	                resolve();
				}, function ( xhr ) {
				    var coarse = (1/list.length)*i;
				    var fine = xhr.total > 0 ? (xhr.loaded/xhr.total) : 0;
                    if(on_progress) on_progress(coarse + fine/list.length);
				}, function ( error ) {
				    game.models[list[i].name] = {"object": false, "status": false};
					console.error( error );
					resolve();
				});
            });
        }
    }
}

class Game_Window {
    constructor() {}
    create_game_scene(){
        var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		var renderer = new THREE.WebGLRenderer();
		renderer.outputEncoding = THREE.sRGBEncoding;
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.getElementById("app_game_canvas").appendChild( renderer.domElement );
		document.getElementById("app_game_canvas").style.opacity = 1;
		document.getElementById("app_game_loading_canvas").style.opacity = 0;
		function animate() {
			requestAnimationFrame( animate );
			renderer.render( scene, camera );
		}
		animate();
		setTimeout(function(){
	        game.status = "running";
	    }, 1000);
		return {"scene": scene, "camera": camera};
    }
    make_loading_scene(){
        var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		var renderer = new THREE.WebGLRenderer();
		renderer.outputEncoding = THREE.sRGBEncoding;
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.getElementById("app_game_loading_canvas").appendChild( renderer.domElement );
		document.getElementById("app_game_loading_canvas").style.opacity = 1;
		const geometry = new THREE.BoxGeometry( 1, 1, 1 );
		const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		const cube = new THREE.Mesh( geometry, material );
		scene.add( cube );
		camera.position.z = 5;
		function animate() {
		    if(game.status == "running") return;
			requestAnimationFrame( animate );
			cube.rotation.x += 0.01;
			cube.rotation.y += 0.01;
			renderer.render( scene, camera );
		}
		animate();
    }
}

window.game_is_running = false;
window.load_game = async function(){
    if(game_is_running) return;
    game_is_running = true;
    game.status == "loading"
 
    function loading_error(){
        document.getElementById("app_game_loading_text").innerText = "Fehler beim Laden! Leider konnte das Spiel nicht geladen werden. Probieren Sie es erneut oder melden Sie das Problem unserem Support. Wir Entschuldigen uns für die Unannehmlichkeiten. ";
    }
    
    for(var i = 0; i < js_files_to_load.start.length; i++){
         await load_js_file(js_files_to_load.start[i]);
    }
    game.game_window = new Game_Window();
    game.game_window.make_loading_scene();
    
    document.getElementById("app_game_loading_canvas_text").innerText = "Ladeprogramm wird gestartet..";
    
    for(var i = 0; i < js_files_to_load.additional.length; i++){
         await load_js_file(js_files_to_load.additional[i]);
    }
    
    document.getElementById("app_game_loading_canvas_text").innerText = "Das Herunterladen wird vorbereitet";
    
    game.loader = new Loader();
    
    document.getElementById("app_game_loading_canvas_text").innerText = "Dateien werden heruntergeladen (0%)";
    
    await game.loader.load_models(modles_to_load, function(progress){
        document.getElementById("app_game_loading_canvas_text").innerText = "Dateien werden heruntergeladen ("+(progress*100)+"%)";
    });
    
    document.getElementById("app_game_loading_canvas_text").innerText = "Dateien werden verarbeitet";
    
    game.window = game.game_window.create_game_scene();
    
    run_game();
};
