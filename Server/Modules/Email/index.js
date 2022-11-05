const fs = require('fs');
const SMTPServer = require("smtp-server").SMTPServer;
const MailParser = require("mailparser").MailParser;
const readline = require('readline');
const sendmail = require('sendmail')({silent: false});
const emailValidator = require('deep-email-validator');
const dns = require('dns');
const spf = require('spf-check');

module.exports = class {
    constructor(){
    }
    init(){
		this.server = new SMTPServer({
			//secure: true,
		    //key: fs.readFileSync(process.cwd()+"/config/ssl/key.pem"),
		    //cert: fs.readFileSync(process.cwd()+"/config/ssl/cert.pem"),
		    async onRcptTo(address, session, callback) {
				if(address.address in app.config.reserved_emails) return callback();
				let expectedSize = Number(session.envelope.mailFrom.args.SIZE) || 0;
				let postfach = await app.database.get_data("email", address.address);
			    if(!postfach){
					var err =  new Error("Email does not exists");
					err.responseCode = 450;
			        return callback(err);
			    } else if(expectedSize > 1048576000){
					var err =  new Error("Insufficient channel storage: " + address.address);
					err.responseCode = 452;
			        return callback(err);
				}
			    return callback();
		    },
		    onData(stream, session, callback) {
				var email_date = (new Date()).toString();
				var headers = false;
				var attachments = {};
				var content = false;
				var has_saved = false;
				
				var on_completed = async function(){
					if(has_saved) return;
					var is_completed = true;
					Object.values(attachments).forEach(function(d){
						if(!d.completed) is_completed = false;
					});
					if(!content) is_completed = false;
					if(!is_completed) return;
					has_saved = true;
					var email_object = {
						"id": Math.random().toString()+Math.random().toString()+Math.random().toString(),
						"username": "",
						"date": email_date,
						"subject": headers.subject,
					    "from": headers.from.text,
					    "to": headers.to.text,
					    "content": {"text": content.text, "html": content.html || content.textAsHtml || content.text},
					    "files": []
					};
					Object.values(attachments).forEach(function(d){
						email_object.files.push({"filename": d.filename, "id": d.id});
				    });
				    if(email_object.to in app.config.reserved_emails){
						if(email_object.to == "support@nxlc.de"){
						    var id = (Math.random()+(new Date())).toString();
							app.database.save_data("support_requests", id, {"author": email_object.from, "text": email_object.content.text, "subject": email_object.subject, "time": (new Date()).toString(), "email": email_object.from, "id": id, "files": email_object.files});
							app.database.save_data_to_list("support_requests_list", "main", id);	
						}
					    return;
					}
				    
				    let postfach = await app.database.get_data("email", email_object.to);
				    if(!postfach){
						Object.values(attachments).forEach(function(d){
							fs.unlink(d.path);
						});
						var err =  new Error("Email does not exists");
						err.responseCode = 450;
				        return callback(err);
					}
					postfach = JSON.parse(postfach);
					email_object.username = postfach.username;
					email_object.bit_id = postfach.bit_id;
					
					var is_spam = false;
				    var warning = false;
				    
				    var email_check = await emailValidator.validate(email_object.from);
				    if(email_check.valid == false) warning = true;
					var result = await new Promise(function(resolve, reject){
						dns.lookupService(session.remoteAddress, session.remotePort, async function(err, hostname, service) {
							if(err) return resolve({warning: true, sender: false});
						    var real_hostname = hostname.split(".").length <= 2 ? hostname : hostname.replace(/^[^.]+\./g, "");
						    const result = await spf(session.remoteAddress, real_hostname, email_object.from);
						    resolve({
								warning: !(result === spf.Pass),
								sender: hostname
							});
						});
                    });
                    email_object.sender = result.sender || "Unbekannter Absender";
                    warning = result.warning || warning;
                    if(warning) {
						email_object.spam = true;
						email_object.warning = true;
					}
                    
					postfach.servers.forEach(function(ip){
						if(ip == app.config.own_server_ip){
							app.email.action("new_email", email_object);
						} else {
						    app.database.send_to_specific_server(ip, {"text": "email", "action": "new_email", "data": email_object});
						}
					});
				    callback();
				};
				
				let parser = new MailParser({});
				parser.on('headers', new_headers => {
					headers = {subject: new_headers.get('subject'), to: new_headers.get('to'), from: new_headers.get('from')};
					on_completed();
				});
				parser.on('data', data => {
				    if (data.type === 'attachment') {
						var cacheId = Math.random().toString()+Math.random().toString()+Math.random().toString()+Math.random().toString()+Math.random().toString()+Math.random().toString()+Math.random().toString();
						var richtige_endung = data.filename ? data.filename.split(".")[data.filename.split(".").length-1] : "";
						var endung = richtige_endung.length > 8 ? ".file" : richtige_endung;
						var chachePath = process.cwd()+"/data/email_attachments/"+cacheId+"."+endung;
						var writeStream = fs.createWriteStream(chachePath);
						attachments[cacheId] = {filename: (data.filename || ""), stream: data.content, completed: false, id: app.config.own_server_ip+"/"+cacheId+"."+endung+"/"+data.filename, path: chachePath};
				        data.content.pipe(writeStream);
						writeStream.on('close', () => {
							data.release();
							attachments[cacheId].completed = true;
							on_completed();
						});
				    } else  if (data.type === 'text') {
						content = {text: data.text, html: data.html, textAsHtml: data.textAsHtml};
						on_completed();
				    }
				});
				parser.on("end", on_completed);
				stream.pipe(parser);
		    },
		    disabledCommands: ['AUTH']
		});
		this.server.on("error", err => {
		  console.log("Error %s", err.message);
		});
		this.server.listen(25, "0.0.0.0")
	}
	async action(action, data, callback = async function(){}){
	    if(action == "new_email"){
			var bit_id = await get_bit_id_of_user(data.username);
			var postfachPath = process.cwd()+"/data/emails/"+data.to+"_"+bit_id+"."+(data.spam ? "spam" : "posteingang");
		    fs.appendFile(postfachPath, JSON.stringify(data)+"\n", error => {
			    if (error) app.logger.log("Error: Error saving email: "+error);
			});
			app.database.send_to_user_socket_connection(data.username, {"action": "new_email", "data": {"box": data.spam, "email": data.to, "data": data}, "app": "email"});
		} else if(action == "get_all_emails"){
			var bit_id = await get_bit_id_of_user(data.username);
			var deleted = {};
			var path = process.cwd()+"/data/emails/"+data.email+"_"+bit_id+".deleted";
			if(fs.existsSync(path)){
				try {
				    deleted = JSON.parse(fs.readFileSync(path, "utf-8"));
				} catch(e){
					console.log(e);
				}
			}
			var all_emails = {"deleted": []};
			for(var i = 0; i < 3; i++){
				var type = ["posteingang", "postausgang", "spam"][i]
				await new Promise(function(resolve, reject){
					var postfachPath = process.cwd()+"/data/emails/"+data.email+"_"+bit_id+"."+type;
					if(!fs.existsSync(postfachPath)){
					    all_emails[type] = [];
						return resolve();
				    }
				    const file = readline.createInterface({
					    input: fs.createReadStream(postfachPath),
					    terminal: false
					});
					var emails = [];
					file.on('line', (line) => {
						var d = JSON.parse(line);
						if(!(d.id in deleted)){
							emails.push(d);
						} else {
						    all_emails.deleted.push(d);	
						}
					});
					file.on('close', function(){
						all_emails[type] = emails;
						resolve();
					});
					file.on('error', function(error){
						app.logger.log("Error: Error reading emails: "+error);
					});
				});
			};
			callback(all_emails);
		} else if(action == "delete_email"){
			var bit_id = await get_bit_id_of_user(data.username);
			var deleted = {};
			var path = process.cwd()+"/data/emails/"+data.email+"_"+bit_id+".deleted";
			if(fs.existsSync(path)){
				try {
				    deleted = JSON.parse(fs.readFileSync(path, "utf-8"));
				} catch(e){
					console.log(e);
				}
			}
			deleted[data.id] = {"show_as_deleted": true};
			fs.writeFile(path, JSON.stringify(deleted), 'utf8', function(error) {
		        if (error) return app.logger.log("Error: Error saving Email Postfach: "+error);
		    });
		} else if(action == "restore_email"){
			var bit_id = await get_bit_id_of_user(data.username);
			var deleted = {};
			var path = process.cwd()+"/data/emails/"+data.email+"_"+bit_id+".deleted";
			if(fs.existsSync(path)){
				try {
				    deleted = JSON.parse(fs.readFileSync(path, "utf-8"));
				} catch(e){
					console.log(e);
			    }
			}
			if(data.id in deleted) {
				delete deleted[data.id];
				fs.writeFile(path, JSON.stringify(deleted), 'utf8', function(error) {
			        if (error) return app.logger.log("Error: Error saving Email Postfach: "+error);
			    });
			}
		} else {
		    app.logger.log("Error: Unknown action: "+action);	
		}
	}
	async send(username, from, to, subject, text, attachments, callback = false){
		var bit_id = await get_bit_id_of_user(username);
		var email_object = {
			"id": Math.random().toString()+Math.random().toString()+Math.random().toString(),
			"date": (new Date()).toString(),
			"subject": subject,
		    "from": from,
		    "to": to,
		    "content": {"text": text, "html":  text},
		    "files": [],
		    "sender": app.config.domain
		};
		attachments.forEach(function(d){
			email_object.files.push({"filename": d.filename, "id": d.id});
	    });
		var postfachPath = process.cwd()+"/data/emails/"+from+"_"+bit_id+".postausgang";
	    fs.appendFile(postfachPath, JSON.stringify(email_object)+"\n", error => {
		    if (error) app.logger.log("Error: Error saving email: "+error);
		});
		if(attachments.length > 0){
			text += "<br><strong>Angehängte Dateien: </strong><br>";
			attachments.forEach(function(d){
				var link = "https://"+app.config.domain+"/attachment/"+d.id;
				text += '<a href="'+link+'" download>'+(d.filename || "Unbennante Datei")+'</a><br>';
		    });
		    text += '<br><br><strong>Dateien wurden mit <a src="https://nxlc.de/">InfinityWork</a> übertragen</strong>';
	    }
		sendmail({
		  from: from,
		  to: to,
		  subject: subject,
		  html: text,
		}, function (err, reply) {
			console.log(err);
			console.log(reply);
			if(callback) callback(err ? false : true, reply);
		});
	}
};
