if(process.argv.length <= 2){
  console.log("Type in directory relative to node command's path");
  process.exit();
}
const directory = process.argv[2];

const get_dir_line_count = require('./get_dir_line_count');

get_dir_line_count('./../' + directory);
