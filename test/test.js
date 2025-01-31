
var assert = require('assert')
var http = require('http')
var http2
var onHeaders = require('..')
var request = require('supertest')
var server = require('./support/servers')

try {
  http2 = require('http2')
} catch (e) {}

var createHTTPServer = server.createHTTPServer
var createHTTP2Server = server.createHTTP2Server

var topDescribe = function (type, createServer) {
  var options

  if (type === 'http2') {
    options = { http2: true }
  }

  describe('onHeaders(res, listener)', function () {
    it('should fire after setHeader', function (done) {
      request(createServer(echoListener), options)
        .get('/')
        .expect('X-Outgoing-Echo', 'test')
        .expect(200, done)
    })
  })

  it('should fire after setHeader', function (done) {
    request(createServer(echoListener), options)
      .get('/')
      .expect('X-Outgoing-Echo', 'test')
      .expect(200, done)
  })

  it('should fire before write', function (done) {
    var server = createServer(echoListener, handler)

    function handler (req, res) {
      res.setHeader('X-Outgoing', 'test')
      res.write('1')
    }

    request(server, options)
      .get('/')
      .expect('X-Outgoing-Echo', 'test')
      .expect(200, '1', done)
  })

  it('should fire with no headers', function (done) {
    var server = createServer(listener, handler)

    function handler (req, res) {}

    function listener (req, res) {
      this.setHeader('X-Headers', getAllHeaderNames(this).join(','))
    }

    request(server, options)
      .get('/')
      .expect('X-Headers', '')
      .expect(200, done)
  })

  it('should fire only once', function (done) {
    var count = 0
    var server = createServer(listener, handler)

    function handler (req, res) {
      res.writeHead(200)

      try { res.writeHead(200) } catch (e) {}
    }

    function listener (req, res) {
      count++
    }

    request(server, options)
      .get('/')
      .expect(200, function (err) {
        if (err) return done(err)
        assert.strictEqual(count, 1)
        done()
      })
  })

  it('should fire in reverse order', function (done) {
    var server = createServer(echoListener, handler)

    function handler (req, res) {
      onHeaders(res, appendHeader(1))
      onHeaders(res, appendHeader(2))
      onHeaders(res, appendHeader(3))
      res.setHeader('X-Outgoing', 'test')
    }

    request(server, options)
      .get('/')
      .expect('X-Outgoing-Echo', 'test,3,2,1')
      .expect(200, done)
  })

  describe('arguments', function () {
    describe('res', function () {
      it('should be required', function () {
        assert.throws(onHeaders.bind(), /res.*required/)
      })
    })

    describe('listener', function () {
      it('should be required', function (done) {
        var server = createServer()

        request(server, options)
          .get('/')
          .expect(500, /listener.*function/, done)
      })

      it('should only accept function', function (done) {
        var server = createServer(42)

        request(server, options)
          .get('/')
          .expect(500, /listener.*function/, done)
      })
    })
  })

  describe('setHeader', function () {
    it('should be available in listener', function (done) {
      var server = createServer(echoListener)

      request(server, options)
        .get('/')
        .expect('X-Outgoing-Echo', 'test')
        .expect(200, done)
    })
  })

  describe('writeHead(status)', function () {
    it('should make status available in listener', function (done) {
      var server = createServer(listener, handler)

      function handler (req, res) {
        res.writeHead(201)
      }

      function listener (req, res) {
        this.setHeader('X-Status', this.statusCode)
      }

      request(server, options)
        .get('/')
        .expect('X-Status', '201')
        .expect(201, done)
    })

    it('should allow manipulation of status in listener', function (done) {
      var server = createServer(listener, handler)

      function handler (req, res) {
        res.writeHead(201)
      }

      function listener (req, res) {
        this.setHeader('X-Status', this.statusCode)
        this.statusCode = 202
      }

      request(server, options)
        .get('/')
        .expect('X-Status', '201')
        .expect(202, done)
    })

    it('should pass-through core error', function (done) {
      var server = createServer(appendHeader(1), handler)

      function handler (req, res) {
        res.writeHead() // error
      }

      request(server, options)
        .get('/')
        .expect(500, done)
    })

    it('should retain return value', function (done) {
      function callbackServer (req, res) {
        if (req.url === '/attach') {
          onHeaders(res, appendHeader(1))
        }

        res.end(typeof res.writeHead(200))
      }

      var server
      if (type === 'http') {
        server = http.createServer(callbackServer)
      } else {
        server = http2.createServer(callbackServer)
      }

      request(server, options)
        .get('/')
        .expect(200, function (err, res) {
          if (err) return done(err)

          request(server, options)
            .get('/attach')
            .expect(200, res.text, done)
        })
    })
  })

  describe('writeHead(status, reason)', function () {
    it('should be available in listener', function (done) {
      var server = createServer(echoListener, handler)

      function handler (req, res) {
        res.setHeader('X-Outgoing', 'test')
        res.writeHead(200, 'OK')
      }

      request(server, options)
        .get('/')
        .expect('X-Outgoing-Echo', 'test')
        .expect(200, done)
    })
  })

  describe('writeHead(status, reason, obj)', function () {
    it('should be available in listener', function (done) {
      var server = createServer(echoListener, handler)

      function handler (req, res) {
        res.writeHead(200, 'OK', { 'X-Outgoing': 'test' })
      }

      request(server, options)
        .get('/')
        .expect('X-Outgoing-Echo', 'test')
        .expect(200, done)
    })
  })

  describe('writeHead(status, obj)', function () {
    it('should be available in listener', function (done) {
      var server = createServer(listener, handler)

      function handler (req, res) {
        res.writeHead(201, { 'X-Outgoing': 'test' })
      }

      function listener (req, res) {
        this.setHeader('X-Status', this.statusCode)
        this.setHeader('X-Outgoing-Echo', this.getHeader('X-Outgoing'))
      }

      request(server, options)
        .get('/')
        .expect('X-Status', '201')
        .expect('X-Outgoing-Echo', 'test')
        .expect(201, done)
    })

    it('should handle falsy keys', function (done) {
      var server = createServer(listener, handler)

      function handler (req, res) {
        res.writeHead(201, { 'X-Outgoing': 'test', '': 'test' })
      }

      function listener (req, res) {
        this.setHeader('X-Status', this.statusCode)
        this.setHeader('X-Outgoing-Echo', this.getHeader('X-Outgoing'))
      }

      request(server, options)
        .get('/')
        .expect('X-Status', '201')
        .expect('X-Outgoing-Echo', 'test')
        .expect(201, done)
    })
  })

  describe('writeHead(status, arr)', function () {
    it('should be available in listener', function (done) {
      var server = createServer(listener, handler)

      function handler (req, res) {
        res.writeHead(201, [['X-Outgoing', 'test']])
      }

      function listener (req, res) {
        this.setHeader('X-Status', this.statusCode)
        this.setHeader('X-Outgoing-Echo', this.getHeader('X-Outgoing'))
      }

      request(server, options)
        .get('/')
        .expect('X-Status', '201')
        .expect('X-Outgoing-Echo', 'test')
        .expect(201, done)
    })
  })
}

function appendHeader (num) {
  return function onHeaders () {
    this.setHeader('X-Outgoing', this.getHeader('X-Outgoing') + ',' + num)
  }
}

function echoListener () {
  this.setHeader('X-Outgoing-Echo', this.getHeader('X-Outgoing'))
}

function getAllHeaderNames (res) {
  return typeof res.getHeaderNames !== 'function'
    ? Object.keys(this._headers || {})
    : res.getHeaderNames()
}

var servers = [
  ['http', createHTTPServer]
]

var nodeVersion = process.versions.node.split('.').map(Number)

// `superagent` only supports `http2` since Node.js@10
if (http2 && nodeVersion[0] >= 10) {
  servers.push(['http2', createHTTP2Server])
}

for (var i = 0; i < servers.length; i++) {
  var tests = topDescribe.bind(undefined, servers[i][0], servers[i][1])

  describe(servers[i][0], tests)
}
