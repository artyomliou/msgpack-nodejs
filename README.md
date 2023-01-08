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

- For each encoding operation, [ByteArray](src/encoder/byte-array.ts) starts will a small buffer (2K). When it's not enough, it will create another bigger buffer, and copy into it. To avoid too many copying, it will allocate by slightly bigger size than previous allocating.
- Since the key of JSON object is string, and the object structure usually has pattern, which means most of these keys are cachable. [Encoder](src/encoder/encoder.ts) deploys [LruCache](src/cache.ts) for this. If these keys are too dynamic to cache, this LruCache still could handle this by using a `Set()` to block any rare keys.

## Decode

[Decoder](src/decoder/decoder.ts) uses [StructBuilder](src/decoder/struct-builder.ts) to handle every result of [TypedValueResolver](src/decoder/typed-value-resolver.ts).

There are 2 optimization strategies:

- [Pre-allocated array](src/decoder/decoder.ts#L11-L12)
- [Object/array descriptor caching](src/decoder/typed-value-resolver.ts#L38-L43)
- [Manually decode UTF-8 when less than 200 characters](src/decoder/typed-value-resolver.ts#L208-L223)
- [Generator function](src/decoder/typed-value-resolver.ts#L47-L206)

## Lessons learned

- Javascript
  - The difference between [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) and the node.js API [Buffer](https://nodejs.org/api/buffer.html)
  - [BigInt operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#operators)
  - The limitation of JS [left shift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Left_shift) and [right shift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift)
  - [Private class features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)
  - The performance benefit of better buffer allocation strategy
  - [Pre-allocated size](https://appspector.com/blog/how-to-improve-messagepack-javascript-parsing-speed-by-2-6-times)
  - [UTF-8 dncoding/decoding](https://zh.wikipedia.org/zh-tw/UTF-8#UTF-8%E7%9A%84%E7%B7%A8%E7%A2%BC%E6%96%B9%E5%BC%8F)
- Node.js
  - [Profiler](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Typescript](https://www.typescriptlang.org/cheatsheets)
  - Testing - [ts-jest](https://kulshekhar.github.io/ts-jest/docs/guides/esm-support)
  - Linter - [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) & [lint-staged](https://github.com/okonet/lint-staged)
  - Packaging for ESModule & CommonJS
- CI & CD
  - [Github Actions](https://github.com/artyomliou/msgpack-nodejs/actions)

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
I think the performance of this project would not be disappointing.

Runs on node.js 16 & R5-5625U.

| operation                                                 |      op |   ms |   op/s |
| --------------------------------------------------------- | ------: | ---: | -----: |
| buf = Buffer(JSON.stringify(obj));                        | 1015100 | 5000 | 203020 |
| obj = JSON.parse(buf);                                    | 1278000 | 5000 | 255600 |
| buf = require("msgpack-lite").encode(obj);                |  671400 | 5000 | 134280 |
| obj = require("msgpack-lite").decode(buf);                |  392800 | 5001 |  78544 |
| buf = Buffer(require("msgpack.codec").msgpack.pack(obj)); |  698900 | 5000 | 139780 |
| obj = require("msgpack.codec").msgpack.unpack(buf);       |  391700 | 5000 |  78340 |
| buf = require("msgpack-js-v5").encode(obj);               |  276800 | 5001 |  55348 |
| obj = require("msgpack-js-v5").decode(buf);               |  526600 | 5000 | 105320 |
| buf = require("msgpack-js").encode(obj);                  |  270200 | 5000 |  54040 |
| obj = require("msgpack-js").decode(buf);                  |  542700 | 5000 | 108540 |
| buf = require("msgpack5")().encode(obj);                  |  145300 | 5000 |  29060 |
| obj = require("msgpack5")().decode(buf);                  |  243200 | 5000 |  48640 |
| buf = require("notepack").encode(obj);                    | 1056300 | 5000 | 211260 |
| obj = require("notepack").decode(buf);                    |  651900 | 5000 | 130380 |
| obj = require("msgpack-unpack").decode(buf);              |  161600 | 5001 |  32313 |
| buf = require("msgpack-nodejs").encode(obj);              |  562700 | 5000 | 112540 |
| obj = require("msgpack-nodejs").decode(buf);              |  471800 | 5000 |  94360 |

## Limitation

1. Ext family does not have complete test cases for now.
2. Does not support float 32, because Javascript float is always 64-bit.

## TODO

1. Ext family fully tested

---

# References

- [[JS] TypedArray, ArrayBuffer 和 DataView](https://pjchender.dev/javascript/js-typedarray-buffer-dataview/)
- [使用 ESLint, Prettier, Husky, Lint-staged 以及 Commitizen 提升專案品質及一致性](https://medium.com/@danielhu95/set-up-eslint-pipeline-zh-tw-990d7d9eb68e)
- [samerbuna/efficient-node](https://github.com/samerbuna/efficient-node/blob/main/400-node-streams.adoc)
- [Best practices for creating a modern npm package](https://snyk.io/blog/best-practices-create-modern-npm-package/)
- [kriszyp/msgpackr](https://github.com/kriszyp/msgpackr/blob/master/pack.js#L636-L657) - For better buffer allocation strategy
- [How to improve MessagePack JavaScript decoder speed by 2.6 times.](https://appspector.com/blog/how-to-improve-messagepack-javascript-parsing-speed-by-2-6-times) - For pre-allocated array
