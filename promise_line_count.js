const fs = require('fs');

const promise_line_count = (pathToFile) => {
  let line_count = 0;
  return new Promise( (resolve, reject) => {
    fs.createReadStream(pathToFile)
      .on("data", (buffer) => {
        buffer.forEach( (chunk) => {
          if(chunk === 10) line_count++;
        });
      }).on("end", () => {
        resolve(line_count);
      });
  });
};

module.exports = promise_line_count;
