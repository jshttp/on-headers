var server = require('./support/servers')

var createServer = server.createHTTP2Server

var request = require('supertest')

describe('http2', function () {
  describe('onHeaders(stream, listener)', function () {
    it('should fire after respond', function (done) {
      request(createServer(echoListener), { http2: true })
        .get('/')
        .expect('x-outgoing-echo', 'test')
        .expect(200, done)
    })
  })
})

function echoListener () {
  this.respond({ 'x-Outgoing-echo': 'test' })
}
