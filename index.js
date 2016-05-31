/*!
 * on-headers
 * Copyright(c) 2014 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Reference to Array slice.
 */

var slice = Array.prototype.slice

/**
 * Execute a listener when a response is about to write headers.
 *
 * @param {Object} res
 * @return {Function} listener
 * @api public
 */

module.exports = function onHeaders(res, listener, async) {
  if (!res) {
    throw new TypeError('argument res is required')
  }

  if (typeof listener !== 'function') {
    throw new TypeError('argument listener must be a function')
  }

  if (typeof async === 'undefined') {
    async = false
  }

  if (!res._beforeReplyListeners) {
    res._beforeReplyListeners = []
    res.writeHead = createWriteHead(res.writeHead)
    res.write = createWrite(res.write)
    res.send = createSend(res.send)
    res.end = createEnd(res.end)
  }

  if (!async) {
    res._beforeReplyListeners.push(function _syncListener(next) {
      listener.call(this)
      next.call(this)
    })
  } else {
    res._beforeReplyListeners.push(listener)
  }
}

function callbacks(res, next) {
  var listeners = res._beforeReplyListeners
  res._beforeReplyListeners = []

  var flattenedListeners = listeners.reduce(function _reduceIterator(next, listener) {
    return function() {
      listener.call(res, next)
    }
  }, next)

  flattenedListeners()
}

function createEnd(previousEnd) {
  return function _end() {
    var res = this
    var args = arguments

    callbacks(res, function() {
      previousEnd.apply(res, args)
    })
  }
}

function createSend(previousSend) {
  return function _send() {
    var res = this
    var args = arguments

    callbacks(res, function() {
      previousSend.apply(res, args)
    })
  }
}

function createWrite(previousWrite) {
  return function _write() {
    var res = this
    var args = arguments

    callbacks(res, function() {
      previousWrite.apply(res, args)
    })
  }
}

function createWriteHead(previousWriteHead) {
  return function _writeHead() {
    var res = this
    var args = setWriteHeadHeaders.apply(this, arguments)

    callbacks(res, function() {
      // pass-along an updated status code
      if (typeof args[0] === 'number' && res.statusCode !== args[0]) {
        args[0] = res.statusCode
        args.length = 1
      }

      previousWriteHead.apply(res, args)
    })
  }
}

function setWriteHeadHeaders(statusCode) {
  var length = arguments.length
  var headerIndex = length > 1 && typeof arguments[1] === 'string'
    ? 2
    : 1

  var headers = length >= headerIndex + 1
    ? arguments[headerIndex]
    : undefined

  this.statusCode = statusCode

  // the following block is from node.js core
  if (Array.isArray(headers)) {
    // handle array case
    for (var i = 0, len = headers.length; i < len; ++i) {
      this.setHeader(headers[i][0], headers[i][1])
    }
  } else if (headers) {
    // handle object case
    var keys = Object.keys(headers)
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]
      if (k) this.setHeader(k, headers[k])
    }
  }

  // copy leading arguments
  var args = new Array(Math.min(length, headerIndex))
  for (var i = 0; i < args.length; i++) {
    args[i] = arguments[i]
  }

  return args
}
