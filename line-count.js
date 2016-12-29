const fs = require('fs');
const path = require('path');
const config = require('./line-count.config.js');

// resolves with the file names within the given directory
function get_file_names(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, fileNames) => {
      if (err) return reject(err);
      resolve(fileNames);
    });
  });
}

// resolves with an object containing the type ('file' or 'dir') for the given file path and the file path itself: { file_path, type }
function get_path_and_type(file_path) {
  return new Promise((resolve, reject) => {
    fs.stat(file_path, (err, stat) => {
      if (err) return reject(err);
      if (!stat.isDirectory() && !stat.isFile()) reject('Invalid Type');
      const type = stat.isDirectory() ? 'dir' : 'file';
      resolve({
        file_path,
        type
      });
    });
  });
}

// same as before, counts lines for the given file path
function count_lines(file_path) {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    fs.createReadStream(file_path)
      .on("data", (buffer) => {
        buffer.forEach((chunk) => {
          if (chunk === 10) lineCount++;
        });
      }).on("end", () => {
        resolve(lineCount);
      }).on("error", reject);
  });
};

function get_dir_line_count(dir) {

  const output = {
    file_count: 0,
    file_lines: 0,
    path: dir
  };

  // get all filenames in the given directory
  return get_file_names(dir)
    // filter all file names that start with a '.' or include the string 'node_modules'
    .then((names) =>
      names.filter((name) =>
        !name.startsWith('.') && !name.includes(config.exclude[0])
      )
    )
    // map every file name into a promise that resolves with the type for that file name within the given dir
    .then((names) =>
      names.map((name) =>
        get_path_and_type(path.join(dir, name))
        .catch(console.warn) // log invalid typed files if necessary
      )
    ).then((paths_and_types_promises) =>
      Promise.all(paths_and_types_promises.map((promise) =>
        promise.then(({
          file_path,
          type
        }) => {
          if (type === 'dir') {
            // if current file path corresponds to a directory
            // recursive count its files and lines and add it to the overall output
            return get_dir_line_count(file_path)
              .then((recursive_output) => {
                if(recursive_output){
                  output.file_count += recursive_output.file_count;
                  output.file_lines += recursive_output.file_lines;
                }
              })
          } else {
            // count the lines for the current file path and then update the overall output
            /// Modularize this section
            let file_path_ext = path.extname(file_path);
            for(var i = 0; i < config.extensions.length; i++){
              if(file_path_ext === config.extensions[i]){
                return count_lines(file_path)
                  .then((file_lines) => {
                    output.file_lines += file_lines;
                    output.file_count += 1;
                  })
              }
            }
            ////
          }
        })
      ))
    // this last chain makes sure we wait for the promise to resolve
    // and populate the output object before resolving with it
  ).then( () => {
    console.log(output.path, '=', output.file_count, 'files,', output.file_lines, 'lines');
    return output;
  })
}

const directory = process.argv[2];
get_dir_line_count('./../' + directory)
