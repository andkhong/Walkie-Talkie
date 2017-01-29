const fs = require('fs');
const path = require('path');

let config = require('./lineCount.config.js');

// resolves with the file names within the given directory
const getFileNames = (dir) => {
  return new Promise( (resolve, reject) => {
    fs.readdir(dir, (err, fileNames) => {
      if (err) return reject(err);
      resolve(fileNames);
    });
  });
};

// resolves with an object containing the type ('file' or 'dir') for the given file path and the file path itself: { file_path, type }
const getPathAndType = (filePath) => {
  return new Promise( (resolve, reject) => {
    fs.stat(filePath, (err, stat) => {
      if (err) return reject(err);
      if (!stat.isDirectory() && !stat.isFile()) reject('Invalid Type');
      const type = stat.isDirectory() ? 'dir' : 'file';
      resolve({
        filePath,
        type
      });
    });
  });
};

// same as before, counts lines for the given file path
const countFileLines = (filePath) => {
  return new Promise( (resolve, reject) => {
    let lineCount = 0;
    fs.createReadStream(filePath)
      .on("data", (buffer) => {
        let idx = -1;
        lineCount--; // Because the loop will run once for idx=-1
        do {
          idx = buffer.indexOf(10, idx+1);
          lineCount++;
        } while (idx !== -1);
      }).on("end", () => {
        resolve(lineCount);
      }).on("error", reject);
  });
};

const getDirLineCount = (dir) => {
  const output = {
    file_count: 0,
    file_lines: 0,
    path: dir,
    children: []
  };
  // get all filenames in the given directory
  return getFileNames(dir)
    // filter out hidden files/directory
    .then( (names) =>
      names.filter((name) =>
        !name.startsWith('.')
      )
    ).catch(console.error)
    // map every file name into a promise that resolves with the type for that file name within the given dir
    .then( (names) =>
      names.map((name) =>
        getPathAndType(path.join(dir, name))
          .catch(console.warn) // log invalid typed files if necessary
      )
    ).then( (pathsAndTypesPromises) =>
      Promise.all(pathsAndTypesPromises.map( (promise) =>
        promise.then(({
          filePath,
          type
        }) => {
          if (type === 'dir') {
            // if current file path corresponds to a directory
            // recursive count its files and lines and add it to the overall output
            for(let i = 0; i < config.exclude.length; i++){
              if (filePath.endsWith(config.exclude[i])) return;
            };
            return getDirLineCount(filePath)
              .then( (recursive_output) => {
                output.file_count += recursive_output.file_count;
                output.file_lines += recursive_output.file_lines;
                output.children.push(recursive_output);
              }).catch(console.error);
          } else {
            // count the lines for the current file path and then update the overall output
            let filePathExt = path.extname(filePath);
            for(let i = 0; i < config.extensions.length; i++){
              if (filePathExt === config.extensions[i]){
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
    return output;
  }).catch(console.error);
};

module.exports = { getDirLineCount };
