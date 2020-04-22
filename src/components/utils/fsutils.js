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
