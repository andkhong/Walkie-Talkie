#! /usr/bin/env node
const path = require('path');
const lineCount = require('./lineCount.js');
const argv = require('minimist')(process.argv.slice(2));

if(argv._.length <= 0){
  lineCount.getDirLineCount(process.env.PWD)
    .then( (result) =>
      displayTreeDFS(result, print)
    ).catch(console.error);
} else {
  for(let i = 0; i < argv._.length; i++){
    let directory = path.resolve('', argv._[i]);
    lineCount.getDirLineCount(directory)
      .then( (result) =>
        displayTreeDFS(result, print)
      ).catch(console.error);
  }
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
  const data = object.path.split('/');
  if(data.length < 5) return;
  else console.log('\t'.repeat(data.length-5), data.pop() + '/', object.file_count, 'files,', object.file_lines, 'lines');
}
