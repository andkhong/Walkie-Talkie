#! /usr/bin/env node
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const lineCount = require('./lineCount.js');
let config = require('./lineCount.config.js');

if(argv._.length <= 0){
  const directory = process.env.PWD;
  lineCount.getFileNames(directory)
    .then( (contents) =>
      setConfig(contents, directory)
        .then( (config) => {
          lineCount.getDirLineCount(directory, config)
            .then( (result) =>
              displayTreeDFS(result, print)
            ).catch(console.error);
        })
    );
} else {
  for(let i = 0; i < argv._.length; i++){
    const directory = path.resolve('', argv._[i]);
    lineCount.getFileNames(directory)
      .then( (contents) =>
        setConfig(contents, directory)
          .then( (config) => {
            lineCount.getDirLineCount(directory, config)
              .then( (result) =>
                displayTreeDFS(result, print)
              ).catch(console.error);
          })
      );
  }
}

const setConfig = (array, directory) => {
  return new Promise( (resolve, reject) => {
    if (array.includes('lineCount.config.js')){
      const config = require(path.resolve(directory, 'lineCount.config.js'));
      resolve(config);
    } else {
      const config = require('./lineCount.config.js');
      resolve(config);
    }
  })
}

const displayTreeDFS = (tree, callback) => {
  let stack = [tree];
  while(stack.length > 0){
    let item = stack.pop();
    callback(item);
    if (item.children){
      for(let i = 0; i < item.children.length; i++){
        stack.push(item.children[i]);
      }
    } else continue;
  }
}

// Optimize performance?
const print = (object) => {
  const data = object.path.split('/');
  if(data.length < 5) return;
  else console.log('\t'.repeat(data.length-5), data.pop() + '/', object.file_count, 'files,', object.file_lines, 'lines');
}
