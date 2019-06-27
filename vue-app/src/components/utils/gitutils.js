/* eslint-disable no-console */

/**
 * Format the git statusinto graph data in json format
 * @param {} status
 */
async function formatStatus(repo_path, status) {
    // vertices and edges
    let data = {
        "nodes": [],
        "links": []
    };
    let nodes = new Array();
    let temp = new Array();

    temp = await formatEntries(repo_path, status.modified, 'M');
    Array.prototype.push.apply(nodes, temp);
    temp = await formatEntries(repo_path, status.not_added, 'A');
    Array.prototype.push.apply(nodes, temp);
    temp = await formatEntries(repo_path, status.conflicted, 'C');
    Array.prototype.push.apply(nodes, temp);
    temp = await formatEntries(repo_path, status.deleted, 'D');
    Array.prototype.push.apply(nodes, temp);
    temp = await formatEntries(repo_path, status.renamed, 'R');
    Array.prototype.push.apply(nodes, temp);


    data.nodes = nodes;
    return data;
}

/**
 * Format entries of diff files
 * @param {Array} file_list 
 * @param {string} operation 
 */
async function formatEntries(repo_path, file_list, operation) {
    let nodes = new Array();
    for (let path of file_list) {
        let node = await generateNode(repo_path, path, operation);
        nodes.push(node);
    }
    return nodes;
}

/**
 * Generate one single node for each file
 * @param {} repo_path 
 * @param {*} path 
 * @param {*} operation 
 */
function generateNode(repo_path, path, operation) {
    const langDetector = require('language-detect');
    const langMapper = require('language-map');
    return new Promise((resolve, reject) => {
        let lang = 'unknown'; // unknown files will not be diff
        let abs_path = repo_path + path;
        langDetector(abs_path, (err, language) => {
            // suppose the path is relative to the curren folder
            if (err) {
                console.log(err);
                lang = 'plaintext';
            } else {
                lang = langMapper[language].aceMode;
            }

            let node = {
                "operation": operation,
                "type": "text", // TODO: the file type (text, binary, link, etc)
                "lang": lang,
                "name": getFileName(path),
                "path": path,
                "abs_path": abs_path // relative path
            };
            resolve(node);
        });
    })
}

/**
 * Get the file name from absolute path
 * @param {} path
 */
function getFileName(path) {
    return path.replace(/^.*[\\\/]/, '');
}

/**
 * Get the parent dir for a file/dir
 * @param {} path 
 */
function getParentDir(path) {
    return path.substring(0, path.lastIndexOf("\\") + 1);
}


/**
 * Analyze the status of a git repo to get changed files sets
 * promise way
 * @param {} repo_path empty means the cu working directory
 */
export const analyzeStatus = (repo_path) => {
    var git = require('simple-git');
    git = git(repo_path)
    repo_path = getParentDir(git._baseDir);
    // repo_path = git._baseDir + '/';
    console.log("Repo: " + repo_path)
    return new Promise((resolve, reject) => {
        git.status(async (err, status) => {
            try {
                if (err) throw err;
                var data = await formatStatus(repo_path, status);
                // get the latest commit hash (uncessary since we can use HEAD instead)
                // git.log((err, res) => {
                // });
                resolve(data);
            } catch (err) {
                reject(err);
            }
        });
    })
}

// callback way (deprecated)
export const analyzeStatus2 = (repo_path, callback) => {
    var git = require('simple-git');
    git = git(repo_path)
    repo_path = getParentDir(git._baseDir);
    // repo_path = git._baseDir + '/';
    console.log("Repo: " + repo_path)
    git.status(async (err, status) => {
        try {
            if (err) throw err;
            var data = await formatStatus(repo_path, status);
            // get the latest commit hash (uncessary since we can use HEAD instead)
            // git.log((err, res) => {
            // });
            return callback(data);
        } catch (err) {
            console.log(err);
        }
    })
}