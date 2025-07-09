/*!
 * on-headers
 * Copyright(c) 2014 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module exports.
 * @public
 */

module.exports = onHeaders

var http = require('http')

// older node versions don't have appendHeader
var isAppendHeaderSupported = typeof http.ServerResponse.prototype.appendHeader === 'function'

/**
 * Create a replacement writeHead method.
 *
 * @param {function} prevWriteHead
 * @param {function} listener
 * @private
 */

function createWriteHead (prevWriteHead, listener) {
  var fired = false

  // return function with core name and argument list
  return function writeHead (statusCode) {
    // set headers from arguments
    var args = setWriteHeadHeaders.apply(this, arguments)

    // fire listener
    if (!fired) {
      fired = true
      listener.call(this)

      // pass-along an updated status code
      if (typeof args[0] === 'number' && this.statusCode !== args[0]) {
        args[0] = this.statusCode
        args.length = 1
      }
    }

    return prevWriteHead.apply(this, args)
  }
}

/**
 * Execute a listener when a response is about to write headers.
 *
 * @param {object} res
 * @return {function} listener
 * @public
 */

function onHeaders (res, listener) {
  if (!res) {
    throw new TypeError('argument res is required')
  }

  if (typeof listener !== 'function') {
    throw new TypeError('argument listener must be a function')
  }

  res.writeHead = createWriteHead(res.writeHead, listener)
}

/**
 * Set headers contained in array on the response object.
 *
 * @param {object} res
 * @param {array} headers
 * @private
 */

function setHeadersFromArray (res, headers) {
  var key

  if (headers.length && Array.isArray(headers[0])) {
    // 2D
    for (var i = 0; i < headers.length; i++) {
      key = headers[i][0]
      if (key) {
        res.setHeader(key, headers[i][1])
      }
    }
  } else {
    // 1D
    if (headers.length % 2 !== 0) {
      throw new TypeError('headers array is malformed')
    }

    if (isAppendHeaderSupported) {
      for (var j = 0; j < headers.length; j += 2) {
        res.removeHeader(headers[j])
      }

      for (var k = 0; k < headers.length; k += 2) {
        key = headers[k]
        if (key) {
          res.appendHeader(key, headers[k + 1])
        }
      }
    } else {
      for (var l = 0; l < headers.length; l += 2) {
        key = headers[l]
        if (key) {
          res.setHeader(key, headers[l + 1])
        }
      }
    }
  }
}

/**
 * Set headers contained in object on the response object.
 *
 * @param {object} res
 * @param {object} headers
 * @private
 */

function setHeadersFromObject (res, headers) {
  var keys = Object.keys(headers)
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i]
    if (k) res.setHeader(k, headers[k])
  }
}

/**
 * Set headers and other properties on the response object.
 *
 * @param {number} statusCode
 * @private
 */

function setWriteHeadHeaders (statusCode) {
  var length = arguments.length
  var headerIndex = length > 1 && typeof arguments[1] === 'string'
    ? 2
    : 1

  var headers = length >= headerIndex + 1
    ? arguments[headerIndex]
    : undefined

  this.statusCode = statusCode

  if (Array.isArray(headers)) {
    // handle array case
    setHeadersFromArray(this, headers)
  } else if (headers) {
    // handle object case
    setHeadersFromObject(this, headers)
  }

  // copy leading arguments
  var args = new Array(Math.min(length, headerIndex))
  for (var i = 0; i < args.length; i++) {
    args[i] = arguments[i]
  }

  return args
}
