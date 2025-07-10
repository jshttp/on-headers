const fs = require('fs')
const path = require('path')
const { getFunctionHash, httpServerResponsePrototype: res } = require('../scripts/upstream-common')

const updatedHashes = {
  knownAppendHeaderHash: getFunctionHash(res.appendHeader),
  knownRemoveHeaderHash: getFunctionHash(res.removeHeader),
  knownSetHeaderHash: getFunctionHash(res.setHeader),
  knownWriteHeadHash: getFunctionHash(res.writeHead)
}

const filename = 'known-upstream-hashes.json'

const filePath = path.join(__dirname, `../test/${filename}`)
fs.writeFileSync(filePath, JSON.stringify(updatedHashes, null, 2) + '\n', 'utf8')

console.log(`✅ updated '${filename}' with current method hashes.`)
