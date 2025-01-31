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
  var fn = handler || echoHandler

  return http2.createServer(function (req, res) {
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

function echoHandler (req, res) {
  res.setHeader('X-Outgoing', 'test')
}
