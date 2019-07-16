/* eslint-disable no-console */

/**
 * Format the git statusinto graph data in json format
 * @param {} status
 */
async function formatStatus(repo_path, status) {
  // data parsed from status summary
  let data = {
    Modified: new Array(),
    Untracked: new Array(),
    Created: new Array(),
    Conflicted: new Array(),
    Deleted: new Array(),
    Renamed: new Array()
  }

  data.Modified = await formatEntries(repo_path, status.modified, 'Modified')
  data.Untracked = await formatEntries(repo_path, status.not_added, 'Untracked')
  data.Created = await formatEntries(repo_path, status.created, 'Created')
  data.Conflicted = await formatEntries(
    repo_path,
    status.conflicted,
    'Conflicted'
  )
  data.Deleted = await formatEntries(repo_path, status.deleted, 'Deleted')
  data.Renamed = await formatEntries(repo_path, status.renamed, 'Renamed')
  // temp = await formatEntries(repo_path, status.staged, 'Staged')
  // Array.prototype.push.apply(nodes, temp)

  return data
}

/**
 * Format entries of diff files
 * @param {Array} file_list
 * @param {string} operation
 */
async function formatEntries(repo_path, file_list, operation) {
  let nodes = new Array()
  for (let path of file_list) {
    let node = await generateNode(repo_path, path, operation)
    nodes.push(node)
  }
  return nodes
}

/**
 * Generate one single node for each file
 * @param {} repo_path
 * @param {*} path
 * @param {*} operation
 */
function generateNode(repo_path, path, operation) {
  const langDetector = require('language-detect')
  const langMapper = require('language-map')
  const isBinaryFileSync = require('isbinaryfile').isBinaryFileSync
  return new Promise((resolve, reject) => {
    let lang = 'plaintext'
    let abs_path = repo_path + path
    if (operation == 'Deleted') {
      // deleted, the file does not exist on the disk, so detect binary with indexed content,
      // and detect lang with file name only if the file type is text
      showAtHEAD(repo_path, path)
        .then(res => {
          let buf = Buffer.from(res, 'utf8')
          let isBinary = isBinaryFileSync(buf)
          let fileType = isBinary ? 'binary' : 'text'
          if (isBinary) {
            let node = {
              operation: 'Deleted',
              type: 'binary',
              lang: 'binary',
              name: getFileName(path),
              path: path, // relative path by git
              abs_path: abs_path
            }
            resolve(node)
          } else {
            lang = langMapper[langDetector.filename(abs_path)].aceMode
            let node = {
              operation: operation,
              type: fileType,
              lang: lang,
              name: getFileName(path),
              path: path, // relative path by git
              abs_path: abs_path
            }
            resolve(node)
          }
        })
        .catch(err => {
          reject(err)
        })
    } else {
      // check if the file is binary first
      let isBinary = isBinaryFileSync(abs_path)
      let fileType = isBinary ? 'binary' : 'text'
      if (isBinary) {
        let node = {
          operation: operation,
          type: 'binary',
          lang: 'binary',
          name: getFileName(path),
          path: path, // relative path by git
          abs_path: abs_path
        }
        resolve(node)
      } else {
        // only detect lang for text file
        // async way
        langDetector(abs_path, (err, language) => {
          // suppose the path is relative to the curren folder
          if (err) {
            console.log(err)
            lang = 'plaintext'
          } else {
            lang = langMapper[language].aceMode
          }

          let node = {
            operation: operation,
            type: fileType,
            lang: lang,
            name: getFileName(path),
            path: path, // relative path by git
            abs_path: abs_path
          }
          resolve(node)
        })
        // sync way
        // lang = langMapper[langDetector.sync(abs_path)].aceMode
        // let node = {
        //   operation: operation,
        //   type: fileType,
        //   lang: lang,
        //   name: getFileName(path),
        //   path: path, // relative path by git
        //   abs_path: abs_path
        // }
        // resolve(node)
      }
    }
  })
}

/**
 * Get the file name from absolute path
 * @param {} path
 */
function getFileName(path) {
  return path.replace(/^.*[\\\/]/, '')
}

/**
 * Get the parent dir for a file/dir
 * @param {} path
 */
function getParentDir(path) {
  return path.substring(0, path.lastIndexOf('\\') + 1)
}

var git = require('simple-git')

/**
 * Get the absolute path of the root directory of the git repo
 */
export const getRootPath = repo_path => {
  const gitt = git(repo_path)
  return new Promise((resolve, reject) => {
    gitt.revparse(['--show-toplevel'], function(err, topLevel) {
      if (err) {
        reject(err)
      }
      resolve(topLevel)
    })
  })
}

/**
 * Analyze the status of a git repo to get changed files sets
 * promise way
 * @param {} repo_path empty means the cu working directory
 */
export const analyzeStatus = repo_path => {
  const gitt = git(repo_path)
  return new Promise((resolve, reject) => {
    gitt.status(async (err, status) => {
      // const topLevel = await getRootPath(repo_path)
      // let workingDir = topLevel + '/'
      try {
        if (err) reject(err)
        let diffs = await formatStatus(repo_path, status)
        let res = {
          current: status.current,
          tracking: status.tracking,
          diffs: diffs
        }
        resolve(res)
      } catch (err) {
        reject(err)
      }
    })
  })
}

// callback way (deprecated)
export const analyzeStatus2 = (repo_path, callback) => {
  const gitt = git(repo_path)
  gitt.status(async (err, status) => {
    try {
      if (err) throw err
      var data = await formatStatus(repo_path, status)
      // get the latest commit hash (uncessary since we can use HEAD instead)
      // git.log((err, res) => {
      // });
      return callback(data)
    } catch (err) {
      console.log(err)
    }
  })
}

/**
 * Actually perform the commit action
 * @param {*} commit_message
 * @param {*} file_list
 */
export const doCommit = (repo_path, commit_message, file_list) => {
  // the optional options object can contain any other parameters to pass to the commit command,
  // setting the value of the property to be a string will add name=value to the command string,
  // setting any other type of value will result in just the key from the object being passed (ie: just name)
  const gitt = git(repo_path)
  // let workingDir = git._baseDir + '/'
  console.log('Working dir: ' + repo_path)
  return new Promise((resolve, reject) => {
    gitt.add(file_list, (err, result) => {
      if (err) {
        reject(err)
      } else {
        console.log('Add ' + file_list.length + ' files to stage.')
        console.log(result)
        gitt.commit(commit_message, (err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res)
          }
        })
      }
    })
  })
}

/**
 * Actually perform the push action
 * @param {*} currentBranch
 * @param {*} trackingBranch
 */
export const doPush = (repo_path, currentBranch, trackingBranch) => {
  const gitt = git(repo_path)
  console.log('Working dir: ' + repo_path)
  var options = {}
  return new Promise((resolve, reject) => {
    // simply push with the default config, equivalent to 'git push'
    gitt.push([], (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
    // gitt.listRemote(['--get-url'], (err, res) => {
    //   if (err) {
    //     reject(err)
    //   } else {
    //   console.log('Remote: ' + repo_path)
    //     gitt
    //       .addRemote('origin', res)
    //       .push(trackingBranch, currentBranch, options, (err, res) => {
    //         if (err) {
    //           reject(err)
    //         } else {
    //           resolve(res)
    //         }
    //       })
    //   }
    // })
  })
}

/**
 * Show file content at the HEAD
 * @param {*} repo_path
 * @param {*} file_path
 */
export const showAtHEAD = (repo_path, file_path) => {
  const gitt = git(repo_path)
  console.log('Working dir: ' + repo_path)
  let arg = 'HEAD:' + file_path
  return new Promise((resolve, reject) => {
    gitt.show([arg], (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
