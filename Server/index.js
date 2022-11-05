const process = require('process');

global.app = require("./startup/load").init();
app.logger.log("Inited Base Modules");

app.logger.log("Loading Database..");
app.database.init();
app.logger.log("Loaded Database");

app.logger.log("Starting Server..");
app.controller.init();
app.logger.log("Started Server");

app.logger.log("Loading Routes");
app.routes.init();
app.logger.log("Loaded Routes");

app.logger.log("Init Email Server..");
app.email.init();
app.logger.log("Inited Email Server");

app.logger.log("Init TweetIn Messages..");
app.tweetin.init();
app.logger.log("Inited TweetIn Messages");

if(false){
	process.on('uncaughtException', (error, source) => {
	    app.logger.log("Error: "+source+": "+error);
	});
}
