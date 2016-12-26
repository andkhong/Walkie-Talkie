// Import Dependencies
const fs = require('fs');
const async = require('async');

// Import Helper Files/Functions
const get_file_line_count = require('./get_file_line_count.js');
const config = require('./line-count.json');

const get_dir_line_count = (dir) => {
  let total = 0, files = 0;
  let limiter = 0;
  fs.readdir(dir, (err, dir_contents) => {

    async.each(dir_contents, (file, next) => {
      const file_path = dir + '/' + file;
      new Promise( (resolve, reject) => {
        fs.stat(file_path, (err, stat) => {
          if(err || file[0] === '.') return next(err);

          if(stat.isDirectory()){
            if(file !== 'node_modules') get_dir_line_count(file_path);
          }
          else if(stat.isFile()){
            limiter++;
            get_file_line_count(file_path)
              .then( (result) => {
                total += result;
                files += 1;
                if(files === limiter) console.log(dir + '/', '=', files, 'files,', total,'lines');
            });
          };
        });
      })
    });

  });
};

module.exports = get_dir_line_count;
