const git = require("simple-git");
git().status((err, status) => {
    console.log(status);
});

// git().log((err, data) => {
//     console.log(data.latest.hash);
//     git().show(['HEAD:electron-app/changes.js'], (err, res)=>{
//         console.log(res)
//     })
// });