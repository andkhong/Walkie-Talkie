const fs = require('fs');
const path = require('path');

let config = require('./default.config.js');

// resolves with the file names within the given directory
function getFileNames(dir){
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, fileNames) => {
      if (err) return reject(err);
      resolve(fileNames);
    });
  });
};

// resolves with an object containing the type ('file' or 'dir') for the given file path and the file path itself: { file_path, type }
function getPathAndType(filePath){
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stat) => {
      if (err) return reject(err);
      if (!stat.isDirectory() && !stat.isFile()) reject('Invalid Type');
      // If directory has config file labled line.config.js, reassign config
      if(filePath.endsWith('lineCount.config.js')) config = require(filePath);
      const type = stat.isDirectory() ? 'dir' : 'file';
      resolve({
        filePath,
        type
      });
    });
  });
};

// same as before, counts lines for the given file path
function countFileLines(filePath){
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    fs.createReadStream(filePath)
      .on("data", (buffer) => {
        for (i = 0; i < buffer.length; ++i) {
          if (buffer[i] == 10) lineCount++;
        }
      }).on("end", () => {
        resolve(lineCount);
      }).on("error", reject);
  });
};

function getDirLineCount(dir){

  const output = {
    file_count: 0,
    file_lines: 0,
    path: dir
  };

  // get all filenames in the given directory
  return getFileNames(dir)
    // filter out hidden files/directory
    .then((names) =>
      names.filter((name) =>
        !name.startsWith('.')
      )
    ).catch(console.error)
    // map every file name into a promise that resolves with the type for that file name within the given dir
    .then((names) =>
      names.map((name) =>
        getPathAndType(path.join(dir, name))
          .catch(console.warn) // log invalid typed files if necessary
      )
    ).then((pathsAndTypesPromises) =>
      Promise.all(pathsAndTypesPromises.map((promise) =>
        promise.then(({
          filePath,
          type
        }) => {
          if (type === 'dir') {
            // if current file path corresponds to a directory
            // recursive count its files and lines and add it to the overall output
            for(let i = 0; i < config.exclude.length; i++){
              if(filePath.endsWith(config.exclude[i])) return;
            };
            return getDirLineCount(filePath)
              .then((recursive_output) => {
                // if(recursive_output){
                  output.file_count += recursive_output.file_count;
                  output.file_lines += recursive_output.file_lines;
                // }

              }).catch(console.error);
          } else {
            // count the lines for the current file path and then update the overall output
            let filePathExt = path.extname(filePath);
            for(let i = 0; i < config.extensions.length; i++){
              if(filePathExt === config.extensions[i]){
                return countFileLines(filePath)
                  .then((fileLines) => {
                    output.file_lines += fileLines;
                    output.file_count += 1;
                  }).catch(console.error);
              };
            };
          };
        })
      ))
    // this last chain makes sure we wait for the promise to resolve
    // and populate the output object before resolving with it
  ).then( () => {
    // Split & Pop performs better than Regex & is easier to maintain
    console.log('\t', output.path.split('/').pop() + '/', '=', output.file_count, 'files,', output.file_lines, 'lines');
    return output;
  }).catch(console.error);
};

const directory = path.resolve('..', process.argv[2]);
getDirLineCount(directory)
  .catch(console.error)
