const fs = require("fs");
const http = require("http");
const https = require("https");
const SocketIO = require("socket.io");
const zlib = require('zlib');
const { JsonStreamStringify } = require('json-stream-stringify');
const JSONStream = require('JSONStream');
const mime = require('mime-types')
const make_request = require('request');

https.globalAgent.maxSockets = Infinity;

function encoded_response(request, response, stream, mime_type, headers = {}, statuscode = 200, is_br_file = false){
	var acceptsEncoding = request.headers['accept-encoding'] || "";
	var headers = headers;
	if(mime_type) headers["Content-Type"] = mime_type;
	headers["X-Content-Type-Options"] = "nosniff";
	let encoder = {
	    hasEncoder : false,
	    createEncoder : () => {}
	}
	if(is_br_file) {
		headers['content-encoding'] = 'br';
	} else if (acceptsEncoding.match(/\bgzip\b/)) {
		headers['content-encoding'] = 'gzip';
	    encoder = {
	      hasEncoder     : true,
	      createEncoder  : zlib.createGzip
	    }
	} else if (acceptsEncoding.match(/\bdeflate\b/)) {
		headers['content-encoding'] = 'deflate';
	    encoder = {
	        hasEncoder     : true,
	        createEncoder  : zlib.createDeflate
	    }
	}
	response.writeHead(statuscode, headers)
	if (encoder.hasEncoder == true) {
	    stream = stream.pipe(encoder.createEncoder())
	}
	stream.pipe(response)
}

function send_file(file_path, request, response, is_attachment_filename){
	fs.exists(file_path, (exists) => {
		if(!exists) return response.writeHead(404).end();
		var l_file_path = file_path;
		if(l_file_path.endsWith(".br")) l_file_path = l_file_path.substring(0, l_file_path.lastIndexOf('.')) || l_file_path;
		var mime_type = mime.lookup(l_file_path);
		fs.stat(file_path, (error, stats) => {
			if(error){
				console.log(error);
			    return response.writeHead(500).end();	
			}
			if (request.headers.range) {
				const parts = request.headers.range.replace(/bytes=/, "").split("-");
				const start = parseInt(parts[0], 10);
				const end = parts[1] ? parseInt(parts[1], 10) : stats.size-1;
				const chunksize = (end-start) + 1;
				const file = fs.createReadStream(file_path, {start, end});
				file.onerror = function(){
					response.writeHead(500).end();
				}
				const header = {
					'Content-Range': `bytes ${start}-${end}/${stats.size}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': chunksize,
					'Content-Type': mime_type || "",
					'Content-Disposition': is_attachment_filename ? 'attachment; filename="'+is_attachment_filename+'"' : 'inline'
			    };
				encoded_response(request, response, file, mime_type, header, 206, file_path.endsWith(".br"))
			} else {
				const head = {
				    'Content-Length': stats.size,	
				    'Content-Type': mime_type || "",
				    'Content-Disposition': is_attachment_filename ? 'attachment; filename="'+is_attachment_filename+'"' : 'inline'
				};
				encoded_response(request, response, fs.createReadStream(file_path), mime_type, head, 200, file_path.endsWith(".br"))
			}
		});
	});
}

module.exports = class {
    constructor(){
		this.routes = {};
		this.cache = {};
		this.user_socket_connections = {};
    }
    init(){
		this.http_server = http.createServer(function(request, response){
			response.writeHead(302, {location: "https://" + request.headers.host + request.url}).end();
		});
		this.http_server.on("error", function(error){
			app.logger.log("Error: HTTP Server: "+error);
		});
		this.http_server.listen(app.config.server.http.port);
	    this.server_options = {key: fs.readFileSync(process.cwd()+'/config/ssl/key.pem'), cert: fs.readFileSync(process.cwd()+'/config/ssl/cert.pem')};
	    this.https_server = https.createServer(this.server_options, this.on_request);
	    this.https_server.on("error", function(error){
			app.logger.log("Error: HTTPS Server: "+error);
		});
		this.io = new SocketIO.Server(this.https_server);
		this.io.on('connection', (socket) => {
			var ip = socket.handshake.address;
			var socket_id = Math.random();
			var season = false;
			socket.on("auth", async function(data){
				var raw_season_data = await app.database.get_data("seasons", data.season);
				if(!raw_season_data) return socket.emit("error", {"status": 401});
				season = JSON.parse(raw_season_data);
				if(!(season.username in app.controller.user_socket_connections)) app.controller.user_socket_connections[season.username] = {};
				app.controller.user_socket_connections[season.username][socket_id] = {"socket": socket, "abbos": {}, "id": socket_id};
				var new_socket_list = await app.database.get_data("user_sockets", season.username);
				new_socket_list[socket_id] = {"server": app.config.own_server_ip, "abbos": {}, "id": socket_id};
				app.database.save_data("user_sockets", season.username, new_socket_list);
				app.socket_handler.new_socket(socket, season.username, socket_id);
			});
			socket.on("abbo", function(app_name){
				if(!(season.username in app.controller.user_socket_connections)) return;
				if(!(socket_id in app.controller.user_socket_connections[season.username])) return;
				app.controller.user_socket_connections[season.username][socket_id].abbos[app_name] = true;
		    });
		    socket.on("dis_abbo", function(app_name){
				if(!(season.username in app.controller.user_socket_connections)) return;
				if(!(socket_id in app.controller.user_socket_connections[season.username])) return;
				if(app_name){
				    app.controller.user_socket_connections[season.username][socket_id].abbos[app_name] = false;
				} else {
					app.controller.user_socket_connections[season.username][socket_id].abbos = {};
				}
		    });
			socket.on("disconnect", async function(){
				if(!(season.username in app.controller.user_socket_connections)) return;
				if(!(socket_id in app.controller.user_socket_connections[season.username])) return;
			    delete app.controller.user_socket_connections[season.username][socket_id];
			    var new_socket_list = await app.database.get_data("user_sockets", season.username);
			    if(!(socket_id in new_socket_list)) return;
				delete new_socket_list[socket_id];
				app.database.save_data("user_sockets", season.username, new_socket_list);
			});
		});
     	this.https_server.listen(app.config.server.https.port);
	}
	send_to_user_socket_connection(username, data){
		if(username in app.controller.user_socket_connections){
			Object.values(app.controller.user_socket_connections[username]).forEach(function(socket){
				if(data.app) if(!socket.abbos[data.app]) return;
				if(data.socket_id) if(data.socket_id != socket.id) return;
				socket.socket.emit(data.action, data.data);
			});
		}
    }
	on_request(request, response){
		var path = decodeURI(request.url.split("?")[0]);
		if(path.startsWith("/attachment/")){
			var ip = path.split("/")[2];
			var id = path.split("/").length > 3 ? path.split("/")[3] : "";
			var filename = path.split("/").length > 4 ? path.split("/")[4] : ("Anhang."+(id.split(".").length > 2 ? id.split(".")[id.split(".").length-1] : "file"));
			if(ip == app.config.own_server_ip){
				var chachePath = process.cwd()+"/data/email_attachments/"+id;
				send_file(chachePath, request, response, filename);
				return;
		    }
		    var is_ip_of_valid_server = false;
		    app.config.backend_server_list.forEach(function(serverip){
			    if(serverip == ip) is_ip_of_valid_server = true;
			});
			if(!is_ip_of_valid_server) return response.writeHead(400).end();
		    make_request("https://"+ip+"/attachment/"+ip+"/"+id).pipe(response);
		    return;
		} else if(path.startsWith("/upload_attachment/")){
			var name = path.split("/")[2];
			var cacheId = Math.random().toString()+Math.random().toString()+Math.random().toString()+Math.random().toString()+Math.random().toString()+Math.random().toString()+Math.random().toString();
			var richtige_endung = name.split(".")[name.split(".").length-1];
			var endung = richtige_endung.length > 8 ? ".file" : richtige_endung;
			var chachePath = process.cwd()+"/data/email_attachments/"+cacheId+"."+endung+"/"+name;
			var writeStream = fs.createWriteStream(chachePath);
			var id = app.config.own_server_ip+"/"+cacheId+"."+endung;
	        request.pipe(writeStream);
			writeStream.on('close', () => {
				response.writeHead(200).end(JSON.stringify({"satus": 200, "response": {"success": true, "id": id}}));
			});
			return;
	    } else if(path in app.controller.routes){
			if(request.method == "GET") return response.writeHead(400).end();
            var text = "";
            request.on("data", function(chunk){
			    text += chunk;	
			});
			request.on("end", function(){
				try {
					var body = JSON.parse(text);
					app.controller.routes[path](body, function(data){
						encoded_response(request, response, new JsonStreamStringify(data), "application/json");
					});
				} catch(e){
					response.writeHead(400).end();
				}
			});
			return;
		}
		var host = (request.headers.host || app.config.domain) == app.config.domain ? false : request.headers.host;
		if(path.endsWith("/")) path += "index.html";
		path = process.cwd()+ app.config.frontend + (host ? "/"+host : "") + path;
		send_file(path, request, response);
	}
	on(path, then){
		path = path.split("?")[0];
		this.routes[path] = then;
	}
}
