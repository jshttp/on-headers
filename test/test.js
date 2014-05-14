
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

    function handler(req, res) {
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

    function handler(req, res) {}

    function listener(req, res) {
      this.setHeader('X-Headers', Object.keys(this._headers || {}).join(','))
    }

    request(server)
    .get('/')
    .expect('X-Headers', '')
    .expect(200, done)
  })

  it('should fire only once', function (done) {
    var count = 0
    var server = createServer(listener, handler)

    function handler(req, res) {
      res.writeHead(200)

      try { res.writeHead(200) } catch (e) {}
    }

    function listener(req, res) {
      count++
    }

    request(server)
    .get('/')
    .expect(200, function (err) {
      if (err) return done(err)
      assert.equal(count, 1)
      done()
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

  describe('writeHead(status, obj)', function () {
    it('should be available in listener', function (done) {
      var server = createServer(listener, handler)

      function handler(req, res) {
        res.writeHead(201, {'X-Outgoing': 'test'})
      }

      function listener(req, res) {
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

      function handler(req, res) {
        res.writeHead(201, [['X-Outgoing', 'test']])
      }

      function listener(req, res) {
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

function createServer(listener, handler) {
  handler = handler || echoHandler

  return http.createServer(function (req, res) {
    onHeaders(res, listener)
    handler(req, res)
    res.end()
  })
}

function echoHandler(req, res) {
  res.setHeader('X-Outgoing', 'test')
}

function echoListener() {
  this.setHeader('X-Outgoing-Echo', this.getHeader('X-Outgoing'))
}
