const path = require('path')

export const isPathValid = obj => {
  let str = String(obj)
  if (
    typeof str == 'undefined' ||
    str == null ||
    str == '' ||
    str.endsWith('/')
  ) {
    return false
  } else {
    return true
  }
}

/**
 * Get the file name from absolute path
 * @param {} path
 */
export const getFileName = file_path => {
  return path.basename(file_path)
  // return path.replace(/^.*[\\\/]/, '')
}

/**
 * Get the parent dir for a file/dir
 * @param {} path
 */
export const getParentDir = file_path => {
  return path.dirname(file_path)
  // return path.substring(0, path.lastIndexOf('\\') + 1)
}

export const invokeAnalysis = repo_path => {
  var childProcess = require('child_process')
  var options = {
    maxBuffer: 1024 * 1024 * 100,
    encoding: 'utf8',
    timeout: 5000
  }
  return new Promise((resolve, reject) => {
    var child = childProcess.exec(
      'java -jar /Users/symbolk/coding/dev/SmartCommit/smartcommitcore-1.0.jar ' +
        '-r ' +
        repo_path,
      options,
      function(error, stdout, stderr) {
        if (error) {
          console.log(error.stack)
          console.log('Error Code: ' + error.code)
          console.log('Error Signal: ' + error.signal)
          reject(error)
        }
        console.log('Results: \n' + stdout)
        if (stderr.length) {
          console.log('Errors: ' + stderr)
        }
        // return the output path
        let output_path = stdout.substring(stdout.lastIndexOf(': ') + 1).trim()
        resolve(output_path)
      }
    )
  })
}
