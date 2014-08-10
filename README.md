# on-headers

[![NPM Version](https://img.shields.io/npm/v/on-headers.svg?style=flat)](https://www.npmjs.org/package/on-headers)
[![Build Status](https://img.shields.io/travis/expressjs/on-headers.svg?style=flat)](https://travis-ci.org/expressjs/on-headers)
[![Gittip](https://img.shields.io/gittip/dougwilson.svg?style=flat)](https://www.gittip.com/dougwilson/)

Execute a listener when a response is about to write headers.

## Install

```sh
$ npm install on-headers
```

## API

```js
var onHeaders = require('on-headers')
```

### onHeaders(res, listener)

This will add the listener `listener` to fire when headers are emitted for `res`.
The listener is passed the `response` object as it's context (`this`). Headers are
considered to be emitted only once, right before they are sent to the client.

## Examples

```js
var http = require('http')
var onHeaders = require('on-headers')

http
.createServer(onRequest)
.listen(3000)

function addPoweredBy() {
  // add if not set by end of request
  if (!this.getHeader('X-Powered-By')) {
    this.addHeader('X-Powered-By', 'Node.js')
  }
}

function onRequest(req, res) {
  onHeaders(res, addPoweredBy)

  res.setHeader('Content-Type', 'text/plain')
  res.end('hello!')
}
```

## License

[MIT](LICENSE)
