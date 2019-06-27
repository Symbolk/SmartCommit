const gitutils = require('./gitutils');

gitutils.getDiffFiles("").then(res => {
    console.log(res);
});


