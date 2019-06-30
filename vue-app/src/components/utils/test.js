/* eslint-disable no-console */
// const gitutils = require('./gitutils');
var git = require('simple-git');

git = git("")
var commit_message = "Testing commit function."
var file_list = ['src/components/utils/test.js']
var options = {
    // '--author': '"Symbolk <symbolk@outlook.com>"'
}
git.commit(commit_message, file_list, options, (err, res) => {
    if (err) {
        console.log(err);
    }
    console.log(res);
})

// git reset --soft HEAD^