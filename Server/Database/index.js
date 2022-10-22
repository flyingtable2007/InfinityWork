const http = require('http');
const fs = require('fs');
const SocketIO = require("socket.io");
const SocketIOClient = require("socket.io-client");
const { JsonStreamStringify } = require('json-stream-stringify');

module.exports = class {
    constructor(){
		this.path = process.cwd()+"/data/database/current.json";
		this.sync_connections = {};
		this.sended_questions = {};
    }
    send_to_user_socket_connection(username, data){
		var sockets = await app.database.get_data("user_sockets", username);
		if(!sockets) return;
		var servers = {};
		Object.values(sockets).forEach(function(socket_data){
			if(data.app) if(!socket_data.abbos[data.app]) return;
			if(data.socket_id) if(data.socket_id != socket_data.id) return;
			servers[socket_data.server] = true;
		});
		Object.keys(servers).forEach(function(ip){
			app.database.send_to_specific_server(ip, {"text": "send_to_user_socket_connection", "username": username, "data": date});
		});
	}
    send_to_specific_server(ip, data, answer = false){
		function send(ip){
			var id = Object.keys(app.database.sended_questions).length;
		    if(answer) app.database.sended_questions[id] = {"answers": [], "end_function": answer, "needed_answer_count": 1};
		    data.id = answer ? id : false;
		    if(ip == app.config.own_server_ip){
				app.database.action(data);
			} else {
			    app.database.sync_connections[ip].emit("message", data);
			}
			if(answer){
				if(app.database.sended_questions[id].needed_answer_count || Object.values(app.database.sync_connections).length == app.database.sended_questions[id].answers.length){
					answer(app.database.sended_questions[id].answers);
				}
			}
		}
		if(Array.isArray(ip)){
		    ip.forEach(function(ip){
                if((ip in app.database.sync_connections) || (ip == app.config.own_server_ip)){
					send(ip);
			    }
			});
		} else {
		    if(ip in this.sync_connections) send(ip);
		}
	}
    save_data(database, key, value){
		if(!(database in this.data)) this.data[database] = {};
	    var data = this.data[database][key] || {};
	    data.value = value;
	    data.verified = true;
	    data.time = (new Date()).toString();
	    this.data[database][key] = data;
	    this.send_to_all_backend_servers("new_data", {"database": database, "key": key, "data": data});
	}
	remove(database, key){
		if(!(database in this.data)) this.data[database] = {};
		if(key in this.data[database]) delete this.data[database][key];
		this.send_to_all_backend_servers("delete_data", {"database": database, "key": key});
	}
	async save_data_to_list(database, key, value){
		if(!(database in this.data)) this.data[database] = {};
	    var data = this.data[database][key] || (await this.get_data(database, key)) || {"value": {}};
	    var id = Object.keys(data.value).length;
	    data.value[id] = value;
	    data.verified = true;
	    data.time = (new Date()).toString();
	    this.data[database][key] = data;
	    this.send_to_all_backend_servers("new_data_to_list", {"database": database, "key": key, "value": value, "id": id});
	}
	async get_data(database, key){
	    return new Promise(function(resolve, reject){
			if(!(database in app.database.data)) app.database.data[database] = {};
	        var data = app.database.data[database][key] || {"value": "", "verified": false, "time": 0};
			if(data.verified == true) resolve(data.value);
			app.database.send_to_all_backend_servers("compare_data", {"database": database, "key": key}, function(answers){
				var current_version = data;
				answers.forEach(function(d){
					if((d.time != 0 ? new Date(d.time) : 0) > (current_version.time != 0 ? new Date(current_version.time) : 0)) current_version = d;
				});
				current_version.verified = true;
				if(current_version.time != 0) app.database.data[database][key] = current_version;
				answers.forEach(function(d){
					if((d.time != 0 ? new Date(d.time) : 0) < (current_version.time != 0 ? new Date(current_version.time) : 0)){
						d.socket.emit("message", {"text": "new_data", "value": current_version, "id": false});
					}
				});
				resolve(current_version.value != "" ? current_version.value : false);
			});
	    });
	}
	send_to_all_backend_servers(text, value = false, answer = false){
		var id = Object.keys(this.sended_questions).length;
		if(answer) this.sended_questions[id] = {"answers": [], "end_function": answer};
		Object.values(this.sync_connections).forEach(function(socket){
		     socket.emit("message", {"text": text, "value": value, "id": answer ? id : false});	
		});
		if(answer){
			if(Object.values(this.sync_connections).length == this.sended_questions[id].answers.length){
				answer(this.sended_questions[id].answers);
			}
		}
	}
	async action(data){
		if(data.text == "new_data"){
			if(!(data.database in app.database.data)) app.database.data[data.database] = {};
			app.database.data[data.database][key] = data;
		} else if(data.text == "compare_data"){
			if(!(data.database in app.database.data)) app.database.data[data.database] = {};
			var d = app.database.data[data.database][data.key] || {"value": 0, "time": 0, "verified": false}
			socket.emit("answer", {"id": data.id, "value": d});
		} else if(data.text == "new_data_to_list"){
			if(!(data.database in app.database.data)) app.database.data[data.database] = {};
		    var d = await app.database.get_data(data.database, data.key) || {"value": {}};
		    var id = Object.keys[d.value].length;
		    if(id > data.id) return;
		    d.value[id] = value;
		    d.verified = true;
		    d.time = (new Date()).toString();
		    app.database.data[database][key] = d;
		} else if(data.text == "delete_data"){
			if(!(data.database in app.database.data)) app.database.data[data.database] = {};
			if(data.key in app.database.data[data.database]) delete app.database.data[data.database][data.key];
		} else if(data.text == "email"){
			app.email.action(data.action, data.data);
		} else if(data.text == "send_to_user_socket_connection"){
			app.controller.send_to_user_socket_connection(data.username, data.data)
		} else {
			app.logger.log("Error: Unknown Message from other Backend Server: "+text);
		}
	}
    init(){
		this.http_server = http.createServer(function(request, response){
			response.end();
		});
		this.http_server.listen(app.config.backend_server_sync_port, () => {
		    app.logger.log("Bachend Sync Server running at "+app.config.backend_server_sync_port);
		});
		function init_backend_sync_connection(ip, socket){
			app.logger.log("Bachend Sync Server connected. Ip: "+ip);
			this.sync_connections[ip] = socket;
			socket.on('message', async function(data){
				app.database.action(data);
			});
			socket.on('answer', function(data){
				data.socket = socket;
				if(data.id in this.sended_questions) this.sended_questions[data.id].answers.push(data.value);
				if(this.sended_questions[data.id].needed_answer_count || Object.values(this.sync_connections).length == this.sended_questions[data.id].answers.length){
				    this.sended_questions[data.id].end_function(this.sended_questions[data.id].answers);
				    delete this.sended_questions[data.id];
				}
			});
			socket.on('disconnect', () => {
				if(ip in this.sync_connections) delete this.outgoing_sync_connections[ip];
				sync_to_all_backend_servers();
		    });
		}
		function sync_to_all_backend_servers(){
			app.config.backend_server_list.forEach(function(server_data){
				if(!(server_data.ip in this.sync_connections)){
					var new_socket = SocketIOClient("http://"+server_data.ip+":"+app.config.backend_server_sync_port);
					new_socket.open((error) => {
						if (error) {
						    app.logger.log("Error: Syncronisation to Backend Server "+server_data.ip+" failed: "+error);
						} else {
						    init_backend_sync_connection(server_data.ip, new_socket);
						}
					});
				}
		    });
		}
		this.io = new SocketIO.Server(this.http_server);
		this.io.on('connection', (socket) => {
			var ip = socket.handshake.address;
			var is_backend_server = false;
			app.backend_server_list.forEach(function(server_data){
				if(server_data.ip == ip){
					is_backend_server = true;
				}
			});
			if(!is_backend_server || ip in this.sync_connections) return socket.disconnect();
		    
		    init_backend_sync_connection(ip, socket);
		});
		sync_to_all_backend_servers();
		try {
			var new_data = JSON.parse(fs.readFileSync(this.path, "utf-8"));
			this.data = {};
			Object.keys(new_data).forEach(function(database){
				if(!(database in app.database.data)) app.database.data[database] = {};
				Object.keys(new_data[database]).forEach(function(key){
					if(key in app.database.data[database]) return;
					 app.database.data[database][key] = {"value": new_data[database][key].value, "verified": false};
				});
			});
		} catch(e){
			app.logger.log("Error: Loading Database: "+e);
			this.data = {};
		}
		setInterval(this.save, 0.01*60*60*1000);
	}
    save(){
	    var stream = new JsonStreamStringify(app.database.data);
	    var text = "";
	    stream.on("data", function(chunk){
			text += chunk;
		});
		stream.on("end", function(){
			fs.writeFile(app.database.path, text, function (error) {
			    if (error) return app.logger.log("Error: Saving Database: "+error);
			});
		});
	}
}
