/*!
 * on-headers
 * Copyright(c) 2014 Douglas Christopher Wilson
 * MIT Licensed
 */


/**
 * Execute a listener when a response is about to write headers.
 *
 * @param {Object} res
 * @return {Function} listener
 * @api public
 */

module.exports = function onHeaders(res, listener) {
  if (!res) {
    throw new TypeError('argument res is required')
  }

  if (typeof listener !== 'function') {
    throw new TypeError('argument listener must be a function')
  }

  /* if onHeaders already injected, only add listener */
  if(res._onHeadWriteHead){
    res._onHeadListeners = res._onHeadListeners || [];
    res._onHeadListeners.push(listener);
    return;
  }
  res._onHeadWriteHead = res.writeHead;
  res._onHeadFiredHead = false;
  res._onHeadListeners = [listener];

  // return function with core name and argument list
  res.writeHead = function(statusCode) {
    // set headers from arguments
    var args = setWriteHeadHeaders.apply(this, arguments);

    // fire listeners
    if (!this._onHeadFiredHead) {
      this._onHeadFiredHead = true;
      while(listener = this._onHeadListeners.pop()){
        listener.call(this);
        listener = null;
      }
      // pass-along an updated status code
      if (typeof args[0] === 'number' && this.statusCode !== args[0]) {
        args[0] = this.statusCode
        args.length = 1
      }
    }
    this._onHeadWriteHead.apply(this, args);
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
