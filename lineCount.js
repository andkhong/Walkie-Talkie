const fs = require('fs');
const path = require('path');

// resolves with the file names within the given directory
const getFileNames = (dir) => {
  return new Promise( (resolve, reject) => {
    fs.readdir(dir, (err, fileNames) => {
      if (err) reject("Unable to read directory:", dir);
      resolve(fileNames);
    });
  });
};

// resolves with an object containing the type ('file' or 'dir') for the given file path and the file path itself: { file_path, type }
const getPathAndType = (filePath) => {
  return new Promise( (resolve, reject) => {
    fs.stat(filePath, (err, stat) => {
      if (err) reject("Unable to get path type!");
      if (!stat.isDirectory() && !stat.isFile()) return reject('Not file or directory! Invalid Path:', filePath);
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
      }).on("end", () =>
        resolve(lineCount)
      ).on("error", () => {
        return reject("Unable to read file:", filePath)
      });
  });
};

const getDirLineCount = (dir, config) => {
  const output = {
    path: dir,
    file_count: 0,
    file_lines: 0,
    children: []
  };
  // get all filenames in the given directory
  return getFileNames(dir)
    // filter out hidden files/directory
    .then( (names) =>
      names.filter((name) =>
        !name.startsWith('.')
      )
    )
    // map every file name into a promise that resolves with the type for that file name within the given dir
    .then( (names) =>
      names.map((name) =>
        getPathAndType(path.join(dir, name))
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
            return getDirLineCount(filePath, config)
              .then( (recursive_output) => {
                output.file_count += recursive_output.file_count;
                output.file_lines += recursive_output.file_lines;
                output.children.push(recursive_output);
              });
          } else {
            // count the lines for the current file path and then update the overall output
            let filePathExt = path.extname(filePath);
            for(let i = 0; i < config.extensions.length; i++){
              if (filePathExt === config.extensions[i]){
                return countFileLines(filePath)
                  .then((fileLines) => {
                    output.file_lines += fileLines;
                    output.file_count += 1;
                  });
              };
            };
          };
        })
      ))
    // this last chain makes sure we wait for the promise to resolve
    // and populate the output object before resolving with it
  ).then( () => {
    return output;
  });
};

module.exports = { getDirLineCount };
