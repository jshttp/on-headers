// NOTE: this is a temporary solution to tell us if future changes to the monkey-patched methods
// could impact this package. Recognizing this is not an ideal solution, we plan to address this when
// we can drop the monkey-patching entirely.
const assert = require('assert')
const knownHashes = require('./known-upstream-hashes.json')
const { getFunctionHash, httpServerResponsePrototype: res } = require('../scripts/upstream-common')

const { knownAppendHeaderHash, knownRemoveHeaderHash, knownSetHeaderHash, knownWriteHeadHash } = knownHashes

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
