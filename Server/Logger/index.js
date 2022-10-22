const fs = require("fs");
const os = require("os");

function generate_data_stirng(date){
	return date.getDate()+"."+date.getMonth()+"."+date.getFullYear()+"_"+date.getHours()+"."+date.getMinutes()+"."+date.getSeconds()+"."+date.getMilliseconds();
}

module.exports = class {
  constructor(){
	  this.start_time = new Date();
	  var log_name = generate_data_stirng(this.start_time)+".txt";
      var log_path = process.cwd()+"/data/logs/"+log_name;
	  this.file_stream = fs.createWriteStream(log_path);
	  this.file_stream.write("----- "+JSON.stringify(os.userInfo())+": "+this.start_time.toString()+" -----\n");
  }
  log(text){
	  var new_entry = "["+generate_data_stirng(new Date())+"] "+text;
      this.file_stream.write(new_entry+"\n");
      if(app.config.log.console_output) console.log(new_entry);
  }
}
