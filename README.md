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
  - [Inspiration](#inspiration)
  - [Lesson learned](#lessons-learned)
- [Project status](#project-status)
  - [Compability](#compability)
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

1. [encode](src/encoder/encoder.ts): `any` => `ArrayBuffer`
2. [decode](src/decoder/decoder.ts): `ArrayBuffer` => `Exclude<any, Map>`
3. [EncodeStream](src/streams/encode-stream.ts): `Exclude<any, null>` => `Buffer`
4. [DecodeStream](src/streams/decode-stream.ts): `Buffer` | `ArrayBuffer` => `Exclude<any, null>` <br> _Sometimes you may encounter error after you attached another stream that does not expect a object as its input._

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

---

# Implementation detail

## Encode

[Encoder](src/encoder/encoder.ts) uses a recursive function `match()` to match JSON structure (primitive value, object, array or nested).

`match()` function always get a argument `val`. It will use different handler to handle `val` after determining its type.
For each map/array encountered, it will be iterated, then each elements will be passed into `match` and return its serialization.
If it's a primitive value then it will be simply serialized and returned.
If it's a map/array then it will be serialized too, but only with information like "what type is this value?" and "how many elements it has?".
Then `match()` will dive into (aka iterate) each elements.

All serialized (binary) will be pushed into [ByteArray](src/encoder/byte-array.ts).
After all `match()` were executed, this ByteArray will be concatenated and returned.

## Decode

There's 2 files handling with different concerns.

- [Decoder](src/decoder/decoder.ts) will compose typed values in proper structure. It utlizes [TypedValueResolver](src/decoder/typed-value-resolver.ts) for resolving typed value. If it get a map/array, then initialize a new [StructContext](src/decoder/struct-context.ts) and push subsequent values into the structure (map/array), with the maximum limit of elements that it could possess. If this limit were met, leave current context, pop previous context from stack.
- [TypedValueResolver](src/decoder/typed-value-resolver.ts) are full of byte resolving logic. To be specific, resolve first byte for type, based on this, we can resolve remaining bytes with type-specific procedure.

## Inspiration

1. [kriszyp/msgpackr](https://github.com/kriszyp/msgpackr/blob/master/pack.js#L636-L657) - For better buffer allocation strategy

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

## Limitation

1. Ext family does not have complete test cases for now.
2. Does not support float 32, because Javascript float is always 64-bit.

## TODO

1. Dependency injection of ArrayBuffer/Buffer
2. Support custom extension
3. Ext family fully tested

---

# References

- [[JS] TypedArray, ArrayBuffer 和 DataView](https://pjchender.dev/javascript/js-typedarray-buffer-dataview/)
- [使用 ESLint, Prettier, Husky, Lint-staged 以及 Commitizen 提升專案品質及一致性](https://medium.com/@danielhu95/set-up-eslint-pipeline-zh-tw-990d7d9eb68e)
- [samerbuna/efficient-node](https://github.com/samerbuna/efficient-node/blob/main/400-node-streams.adoc)
- [Best practices for creating a modern npm package](https://snyk.io/blog/best-practices-create-modern-npm-package/)
