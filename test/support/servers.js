var http = require('http')
var http2

var onHeaders = require('../..')

try {
  http2 = require('http2')
} catch (e) {}

exports.createHTTPServer = createHTTPServer
exports.createHTTP2Server = createHTTP2Server

function createHTTPServer (listener, handler) {
  var fn = handler || echoHandler

  return http.createServer(function (req, res) {
    try {
      onHeaders(res, listener)
      fn(req, res)
      res.statusCode = 200
    } catch (err) {
      res.statusCode = 500
      res.write(err.message)
    } finally {
      res.end()
    }
  })
}

function createHTTP2Server (listener, handler) {
  var fn = handler || echoHandlerHTTP2

  var server =  http2.createServer()

  server.on('stream', function (stream, headers) {
    try {
      onHeaders(stream, listener)
      fn(headers, stream)
      stream.respond({
        ':status': 200
      })
    } catch (err) {
      stream.respond({
        ':status': 500
      })
      stream.write(err.message)
    } finally {
      stream.end()
    }
  })

  return server
}

function echoHandler (req, res) {
  res.setHeader('X-Outgoing', 'test')
}

function echoHandlerHTTP2 (stream) {
  stream.additionalHeaders({
    'X-Outgoing': 'test'
  })
}
