// Import Dependencies
const fs = require('fs');
const path = require('path');
const async = require('async');

// Import Helper Files/Functions
const get_file_line_count = require('./get_file_line_count.js');
const config = require('./line-count.config.js');

const get_dir_line_count = (dir) => {
  let total = 0;
  let file_count = 0, async_ext_file_count = 0;
  fs.readdir(dir, (err, dir_contents) => {

    async.each(dir_contents, (file, next) => {
      const file_path = dir + '/' + file;
      fs.stat(file_path, (err, stat) => {
        // Avoids hidden files and heavily optimizes performance
        if(err || file[0] === '.') return next(err);

        if(stat.isDirectory()){
          // Fix to allow Config
          if(file !== config.exclude[0]) get_dir_line_count(file_path);
        }

        else if(stat.isFile()){
          let extension = path.extname(file_path);
          for(var i = 0; i < config.extensions.length; i++){
            if(config.extensions[i] === extension){
              async_ext_file_count++;
              return get_file_line_count(file_path)
                .then( (result) => {
                  total += result;
                  file_count += 1;
                  if(async_ext_file_count === file_count) output_log(dir, file_count, total);
              });
            }
          }
        };
      });
    });

  });
};

const output_log = (dir, file_count, total) => {
  console.log(dir + '/', '=', file_count, 'files,', total,'lines');
}

module.exports = get_dir_line_count;
