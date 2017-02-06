#! /usr/bin/env node

const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const lineCount = require('./lineCount.js');

const setConfig = (dir) => {
  return new Promise( (resolve, reject) => {
    try {
      const config = require(path.join(dir, 'lineCount.config.js'));
      resolve(config);
    } catch (e) {
      const config = require('./lineCount.config.js');
      resolve(config);
    }
  });
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

const print = (object) => {
  const data = object.path.split(path.sep);
  console.log('  '.repeat(data.length), data.pop() + path.sep, object.file_count, 'files,', object.file_lines, 'lines');
}

const getContent = (dir) => {
  setConfig(dir)
    .then( (config) => {
      lineCount.getDirLineCount(dir, config)
        .then( (result) =>
          displayTreeDFS(result, print)
        ).catch( (err) => {
          // Log Error from promise chain in lineCount function
          return err;
        })
    });
}

if(argv._.length <= 0){
  const directory = process.env.PWD;
  getContent(directory)
} else {
  for(let i = 0; i < argv._.length; i++){
    const directory = path.resolve('', argv._[i]);
    getContent(directory);
  }
}
