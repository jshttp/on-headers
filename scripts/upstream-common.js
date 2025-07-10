const crypto = require('crypto')
const http = require('http')

function getFunctionHash (fn) {
  const src = fn.toString().replace(/\s+/g, '') // normalize whitespace
  return crypto.createHash('sha256').update(src).digest('hex')
}

module.exports = {
  getFunctionHash,
  httpServerResponsePrototype: http.ServerResponse.prototype
}
