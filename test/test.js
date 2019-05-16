
var assert = require('assert')
var http = require('http')
var onHeaders = require('..')
var request = require('supertest')

describe('onHeaders(res, listener)', function () {
  it('should fire after setHeader', function (done) {
    var server = createServer(echoListener)

    request(server)
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

    request(server)
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

    request(server)
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

    request(server)
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

    request(server)
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

        request(server)
          .get('/')
          .expect(500, /listener.*function/, done)
      })

      it('should only accept function', function (done) {
        var server = createServer(42)

        request(server)
          .get('/')
          .expect(500, /listener.*function/, done)
      })
    })
  })

  describe('setHeader', function () {
    it('should be available in listener', function (done) {
      var server = createServer(echoListener)

      request(server)
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

      request(server)
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

      request(server)
        .get('/')
        .expect('X-Status', '201')
        .expect(202, done)
    })

    it('should pass-through core error', function (done) {
      var server = createServer(appendHeader(1), handler)

      function handler (req, res) {
        res.writeHead() // error
      }

      request(server)
        .get('/')
        .expect(500, done)
    })

    it('should retain return value', function (done) {
      var server = http.createServer(function (req, res) {
        if (req.url === '/attach') {
          onHeaders(res, appendHeader(1))
        }

        res.end(typeof res.writeHead(200))
      })

      request(server)
        .get('/')
        .expect(200, function (err, res) {
          if (err) return done(err)
          request(server)
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

      request(server)
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

      request(server)
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

      request(server)
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

      request(server)
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

      request(server)
        .get('/')
        .expect('X-Status', '201')
        .expect('X-Outgoing-Echo', 'test')
        .expect(201, done)
    })
  })
})

function createServer (listener, handler) {
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

function appendHeader (num) {
  return function onHeaders () {
    this.setHeader('X-Outgoing', this.getHeader('X-Outgoing') + ',' + num)
  }
}

function echoHandler (req, res) {
  res.setHeader('X-Outgoing', 'test')
}

function echoListener () {
  this.setHeader('X-Outgoing-Echo', this.getHeader('X-Outgoing'))
}

function getAllHeaderNames (res) {
  return typeof res.getHeaderNames !== 'function'
    ? Object.keys(this._headers || {})
    : res.getHeaderNames()
}
