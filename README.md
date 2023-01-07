# msgpack-nodejs

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/artyomliou/msgpack-nodejs/node.js.yml)
![node-current](https://img.shields.io/node/v/msgpack-nodejs)
![GitHub top language](https://img.shields.io/github/languages/top/artyomliou/msgpack-nodejs)
![Lines of code](https://img.shields.io/tokei/lines/github/artyomliou/msgpack-nodejs)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/msgpack-nodejs)

Yet another javascript/nodejs implementation of [MsgPack Spec](https://github.com/msgpack/msgpack/blob/master/spec.md).  
The purpose behind is learning by doing, which focuses on modern tools/techniques of nodejs/typescript ecosystem.

# Contents

- [Usage](#usage)
  - [Installation](#installation)
  - [API](#api)
  - [Examples](#examples)
- [Implementation detail](#implementation-detail)
  - [Encode](#encode)
  - [Decode](#decode)
  - [Lesson learned](#lessons-learned)
- [Project status](#project-status)
  - [Compability](#compability)
  - [Benchmark](#benchmark)
  - [Limitation](#limitation)
  - [TODO](#todo)
- [References](#references)

---

# Usage

## Installation

```
npm i msgpack-nodejs
```

You may run `npm test` if you are cloning this project.

## API

There are 4 APIs:

1. [encode()](src/encoder/encoder.ts): `any` => `Uint8Array`
2. [decode()](src/decoder/decoder.ts): `Uint8Array` => `Exclude<any, Map>`
3. [EncodeStream class](src/streams/encode-stream.ts): `Exclude<any, null>` => `Buffer`
4. [DecodeStream class](src/streams/decode-stream.ts): `Buffer` => `Exclude<any, null>` <br> _Sometimes you may encounter error after you attached another stream that does not expect a object as its input._
5. [CustomExtension type](src/extensions/interface.ts): These format helps you to fill out anything `registerExtension()` wants.
6. [registerExtension()](src/extensions/registry.ts)
7. [getExtension()](src/extensions/registry.ts): Get extension with type (number) or class constructor (function)

## Examples

### Encode / Decode

```javascript
import { encode } from "msgpack-nodejs"
console.log(encode({ compact: true, schema: 0 }))
// return
// ArrayBuffer {
//  [Uint8Contents]: <82 a7 63 6f 6d 70 61 63 74 c3 a6 73 63 68 65 6d 61 00>,
//  byteLength: 18
//}
```

```javascript
import { decode } from "msgpack-nodejs"
console.log(
  decode(
    new Uint8Array([
      0x82, 0xa7, 0x63, 0x6f, 0x6d, 0x70, 0x61, 0x63, 0x74, 0xc3, 0xa6, 0x73,
      0x63, 0x68, 0x65, 0x6d, 0x61, 0x00,
    ]).buffer
  )
)
// return { compact: true, schema: 0 }
```

### Stream

Example below demostrates how to put these stream together.
You can find separate usage at [EncodeStream.spec.ts](test/encode-stream.spec.ts) or [DecodeStream.spec.ts](test/decode-stream.spec.ts)

```javascript
import { EncodeStream, DecodeStream } from "msgpack-nodejs"
import { Writable } from "node:stream"

// Declare streams
const encodeStream = new EncodeStream()
const decodeStream = new DecodeStream()
const outStream = new Writable({
  objectMode: true,
  write(chunk, encoding, callback) {
    console.log(chunk)
    callback()
  },
})
encodeStream.pipe(decodeStream).pipe(outStream)

// Write data into first encodeStream
encodeStream.write({ compact: true, schema: 0 })
```

### Custom extension

You can register extension, with a number (0 ~ 127) as its type, and a object constructor that encoder and decoder will use.

- [Example](test/extension.spec.ts)
- [Built-in Date() extension](src/extensions/timestamp-extension.ts)

---

# Implementation detail

## Encode

[Encoder](src/encoder/encoder.ts) uses a recursive function `match()` to match JSON structure (primitive value, object, array or nested), and pushes anything encoded into [ByteArray](src/encoder/byte-array.ts).

There are 2 optimization strategies:

- [ByteArray](src/encoder/byte-array.ts) starts will a small buffer (1K), when it's not enough, it will create another bigger buffer, and copy into it. To avoid too many copy operation (because it wastes CPU & time), it remember the average of previous encoded size, and adjust size of next allocated buffer.
- Since the key of JSON object is string, and the object structure usually has pattern, which means most of these keys are cachable. [Encoder](src/encoder/encoder.ts) deploys [LruCache](src/cache.ts) for this. If these keys are too dynamic to cache, this LruCache still could handle this by using a Set() to block any rare keys.

## Decode

There's 2 files handling with different concerns.

- [Decoder](src/decoder/decoder.ts) uses [StructBuilder](src/decoder/struct-builder.ts) to handle every result of [TypedValueResolver](src/decoder/typed-value-resolver.ts).
- [StructBuilder](src/decoder/struct-builder.ts) takes anything as argument. It uses stack to keep track of every array/map in which it is pushing any subsequent value. For every array/map, it it gets every thing it could have, then we will pop previous array/map from stack.
- [TypedValueResolver](src/decoder/typed-value-resolver.ts) will get the first byte and resolve remaining bytes.

## Lessons learned

- The difference between [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) and the node.js API [Buffer](https://nodejs.org/api/buffer.html)
- The limitation of JS [left shift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Left_shift) and [right shift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift)
- [BigInt operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#operators)
- The performance benefit of better buffer allocation strategy
- [Private class features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)
- [Typescript](https://www.typescriptlang.org/cheatsheets)
  - Testing - [ts-jest](https://kulshekhar.github.io/ts-jest/docs/guides/esm-support)
  - Linter - [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) & [lint-staged](https://github.com/okonet/lint-staged)
  - Packaging for ESModule & CommonJS
- CI & CD - [Github Actions](https://github.com/artyomliou/msgpack-nodejs/actions)

---

# Project status

## Compability

| Env        | Executable? |
| ---------- | ----------- |
| Node.js 16 | ✅          |
| Node.js 14 | ✅          |
| Node.js 12 | ❌          |

## Benchmark

By utlizing the great [benchmark tool by msgpack-lite](https://github.com/kawanet/msgpack-lite/blob/master/lib/benchmark.js),
we can say the encoder (of this project) is fast enough,
but the decoder is still too slow.

Runs on node.js 16 & R5-5625U.

| operation                                    |      op |   ms |   op/s |
| -------------------------------------------- | ------: | ---: | -----: |
| buf = Buffer(JSON.stringify(obj));           | 1017600 | 5000 | 203520 |
| obj = JSON.parse(buf);                       | 1283400 | 5000 | 256680 |
| buf = require("msgpack-lite").encode(obj);   |  659700 | 5000 | 131940 |
| obj = require("msgpack-lite").decode(buf);   |  375900 | 5000 |  75180 |
| buf = require("msgpack-nodejs").encode(obj); |  572500 | 5000 | 114500 |
| obj = require("msgpack-nodejs").decode(buf); |  137000 | 5001 |  27394 |

## Limitation

1. Ext family does not have complete test cases for now.
2. Does not support float 32, because Javascript float is always 64-bit.

## TODO

1. Ext family fully tested
2. Cache

---

# References

- [[JS] TypedArray, ArrayBuffer 和 DataView](https://pjchender.dev/javascript/js-typedarray-buffer-dataview/)
- [使用 ESLint, Prettier, Husky, Lint-staged 以及 Commitizen 提升專案品質及一致性](https://medium.com/@danielhu95/set-up-eslint-pipeline-zh-tw-990d7d9eb68e)
- [samerbuna/efficient-node](https://github.com/samerbuna/efficient-node/blob/main/400-node-streams.adoc)
- [Best practices for creating a modern npm package](https://snyk.io/blog/best-practices-create-modern-npm-package/)
- [kriszyp/msgpackr](https://github.com/kriszyp/msgpackr/blob/master/pack.js#L636-L657) - For better buffer allocation strategy
- [How to improve MessagePack JavaScript decoder speed by 2.6 times.](https://appspector.com/blog/how-to-improve-messagepack-javascript-parsing-speed-by-2-6-times) - For pre-allocated array
