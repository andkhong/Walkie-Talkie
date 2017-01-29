#! /usr/bin/env node
const path = require('path');
const lineCount = require('./lineCount.js');
const argv = require('minimist')(process.argv.slice(2));

if(argv._.length <= 0){
  lineCount.getDirLineCount(process.env.PWD)
    .then( (result) =>
      displayTreeBFS(result)
    ).catch(console.error);
} else {
  for(let i = 0; i < argv._.length; i++){
    let directory = path.resolve('', argv._[i]);
    lineCount.getDirLineCount(directory)
      .then( (result) =>
        displayTreeBFS(result)
      ).catch(console.error);
  }
}

const displayTreeBFS = (tree) => {
  let stack = [tree];
  while(stack.length > 0){
    let item = stack.pop();

    let data = item.path.split('/');
    console.log('\t'.repeat(data.length-5), data.pop() + '/', item.file_count, 'files,', item.file_lines, 'lines');

    if (item.children){
      for(let i = 0; i < item.children.length; i++){
        stack.push(item.children[i]);
      }
    } else continue;
  }
}
