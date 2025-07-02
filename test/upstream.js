const crypto = require('crypto')
const assert = require('assert')
const http = require('http')
const Socket = require('net').Socket

const req = new http.IncomingMessage(new Socket())
const res = new http.ServerResponse(req)

function getFunctionHash (fn) {
  const src = fn.toString().replace(/\s+/g, '') // normalize whitespace
  return crypto.createHash('sha256').update(src).digest('hex')
}

const knownWriteHeadHash = '281e0d02084a69893b8c3b8692e3c7c4de2ce22a626217fcf597fa6ddf6955a9'
const knownSetHeaderHash = '2d4f95e92586d28bfd4d3137a8eaacb82b255967d8c26413015c6b56daf0afe7'
const knownAppendHeaderHash = '0deb9f70c3bba63993321cca9281fb4607e2567bed1436b8574c5b86698125a8'
const knownRemoveHeaderHash = '3ad5ccb0a858beb6268f281492bd8d42c9815f5316cc3c4f7f735e142fcd29d9'

describe('function verification', function () {
  it('should match the known function hash of writeHead', function () {
    const currentHash = getFunctionHash(res.writeHead)
    assert.strictEqual(currentHash, knownWriteHeadHash, 'writeHead hash has changed')
  })

  it('should match the known function hash of setHeader', function () {
    const currentHash = getFunctionHash(res.setHeader)
    assert.strictEqual(currentHash, knownSetHeaderHash, 'setHeader hash has changed')
  })

  it('should match the known function hash of appendHeader', function () {
    const currentHash = getFunctionHash(res.appendHeader)
    assert.strictEqual(currentHash, knownAppendHeaderHash, 'appendHeader hash has changed')
  })

  it('should match the known function hash of removeHeader', function () {
    const currentHash = getFunctionHash(res.removeHeader)
    assert.strictEqual(currentHash, knownRemoveHeaderHash, 'removeHeader hash has changed')
  })
})
