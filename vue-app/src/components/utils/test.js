/* eslint-disable no-console */
// const gitutils = require('./gitutils');
var git = require('simple-git')

git = git('')
var commit_message = 'Testing commit function.'
var file_list = ['src/components/utils/test.js']
var options = {
  // '--author': '"Symbolk <symbolk@outlook.com>"'
}
// git.commit(commit_message, file_list, options, (err, res) => {
//     if (err) {
//         console.log(err);
//     }
//     console.log(res);
// })

const getRootPath = async repo_path => {
  const gitP = require('simple-git/promise')

  let topLevel = ''
  try {
    topLevel = await gitP(repo_path).revparse(['---show-toplevel'])
  } catch (e) {
    // handle the error
  }
  return topLevel
}

const getRootPath2 = repo_path => {
  return new Promise((resolve, reject) => {
    git.revparse(['--show-toplevel'], function(err, topLevel) {
      if (err) {
        reject(err)
      }
      resolve(topLevel)
    })
  })
}
console.log('1' + git._baseDir)
git.revparse(['--show-toplevel'], function(err, topLevel) {
  if (err) {
    console.log(err)
  }
  console.log('2' + topLevel)
})
getRootPath('').then(rootPath => {
  console.log('3' + rootPath)
})
getRootPath2('').then(rootPath => {
  console.log('4' + rootPath)
})

// git.status((err, res) => {
//   if (err) {
//     console.log(err)
//   }
//   console.log(res)
// })

// git reset HEAD^
// git reset --soft HEAD^
