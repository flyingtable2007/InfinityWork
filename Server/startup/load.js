require("../Modules/functions/index")

var modules = {
	"logger":         require("../Logger/index"),
	"controller":     require("../Controller/index"),
	"database":       require("../Database/index"),
	"routes":         require("../Controller/routes/index"),
	"email":          require("../Modules/Email/index"),
	"permissions":    require("../Modules/Permissions/index"),
	"socket_handler": require("../Modules/socket_handler/index"),
	"game":           require("../Modules/game/index"),
	"tweetin":        require("../Modules/tweetin/index")
};

module.exports = {
	"init": function(){
		return {
			"config":         require("../config/config.json"),
			"logger":         new modules.logger(),
			"controller":     new modules.controller(),
			"database":       new modules.database(),
			"routes":         new modules.routes(),
			"email":          new modules.email(),
			"permissions":    new modules.permissions(),
			"socket_handler": new modules.socket_handler(),
			"game":           new modules.game(),
			"tweetin":        new modules.tweetin()
		}
	}
};
