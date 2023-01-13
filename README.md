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
  - [Examples](#examples)
  - [API](#api)
  - [Options](#options)
- [Project status](#project-status)
  - [Compability](#compability)
  - [Limitation](#limitation)
  - [TODO](#todo)
  - [Benchmark](#benchmark)
- [Implementation detail](#implementation-detail)
  - [Encode](#encode)
  - [Decode](#decode)
  - [Lesson learned](#lessons-learned)
- [References](#references)

---

# Usage

```bash
npm i msgpack-nodejs
npm test
```

## Example

Please check [example.md](example.md)

## API

1. [encode()](src/encoder/encoder.ts): `any` => `Uint8Array`
2. [decode()](src/decoder/decoder.ts): `Uint8Array` => `Exclude<any, Map>`
3. [EncodeStream class](src/streams/encode-stream.ts): `Exclude<any, null>` => `Buffer`
4. [DecodeStream class](src/streams/decode-stream.ts): `Buffer` => `Exclude<any, null>` [^1]
5. [registerExtension()](src/extensions/registry.ts): Register your own extension
6. [lruCacheStat()](src/encoder/lru-cache.ts): Show cache hit/miss count
7. [bufferAllocatorStat()](src/encoder/byte-array.ts): Show how byte-array allocate new buffer
8. [prefixTrieStat()](src/decoder/prefix-trie.ts): Show prefix-trie hit/miss count
9. [applyOptions()](src/options.ts): Manually control caching

[^1]: After attaching another stream that does not expect a object as its input, you may encounter error

## Options

You can apply options [like this](example.md#apply-options)

| Key                               | type    | default | Description                                                                                                                    |
| --------------------------------- | ------- | :-----: | ------------------------------------------------------------------------------------------------------------------------------ |
| encoder.mapKeyCache.enabled       | boolean |  true   | Cache map-key or not                                                                                                           |
| encoder.mapKeyCache.size          | number  |   30    | How big is the mapKeyCache                                                                                                     |
| encoder.stringCache.enabled       | boolean |  true   | Cache any string except map-key or not                                                                                         |
| encoder.stringCache.size          | number  |   100   | How big is the stringCache                                                                                                     |
| encoder.byteArray.base            | number  |  1024   | How many bytes will be allocated for every execution. Setting this would increase performance when handling many big JSON data |
| decoder.shortStringCache.enabled  | boolean |  true   | Use prefix-trie or not                                                                                                         |
| decoder.shortStringCache.lessThan | number  |   10    | Only cache if string is shorter than this value                                                                                |
| decoder.jsUtf8Decode.enabled      | boolean |  true   | Use JS utf8-decode or not                                                                                                      |
| decoder.jsUtf8Decode.lessThan     | number  |   200   | Only use JS utf8-decode if string is shorter than this value                                                                   |

---

# Project status

## Compability

| Env        | Executable? |
| ---------- | ----------- |
| Node.js 18 | ✅          |
| Node.js 16 | ✅          |
| Node.js 14 | ✅          |
| Node.js 12 | ❌          |

## Limitation

1. Does not support float 32 encoding, because Javascript float is always 64-bit.

## TODO

1. Ext tests
2. Map 16/32 tests

## Benchmark

By utlizing the great [benchmark tool by msgpack-lite](https://github.com/kawanet/msgpack-lite/blob/master/lib/benchmark.js),
I thought the performance of this project would not be disappointing.

Runs on node.js 16 & R5-5625U.

| operation                                                 |      op |   ms |   op/s |
| --------------------------------------------------------- | ------: | ---: | -----: |
| buf = Buffer(JSON.stringify(obj));                        | 1001100 | 5000 | 200220 |
| obj = JSON.parse(buf);                                    | 1260300 | 5000 | 252060 |
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
| buf = require("notepack").encode(obj);                    | 1104300 | 5000 | 220860 |
| obj = require("notepack").decode(buf);                    |  670300 | 5000 | 134060 |
| obj = require("msgpack-unpack").decode(buf);              |  161600 | 5001 |  32313 |
| **buf = require("msgpack-nodejs").encode(obj);**          | 1075500 | 5000 | 215100 |
| **obj = require("msgpack-nodejs").decode(buf);**          |  621700 | 5000 | 124340 |

---

# Implementation detail

## Encode

[Encoder](src/encoder/encoder.ts) uses a recursive function `match()` to match JSON structure (primitive value, object, array or nested), and pushes anything encoded into [ByteArray](src/encoder/byte-array.ts) that responsible for allocating buffer. Encoded string may be cached in [LruCache](src/encoder/lru-cache.ts).

## Decode

[Decoder](src/decoder/decoder.ts) uses [TypedValueResolver](src/decoder/typed-value-resolver.ts) to read every value out, and push them into [StructBuilder](src/decoder/struct-builder.ts) to rebuild whole JSON object. For string less than 200 bytes, use pure JS [utf8Decode()](src/decoder/utf8-decode.ts), then cache in [prefix trie](src/decoder/prefix-trie.ts).

#### Optimization strategies:

Thanks to [AppSpector](https://appspector.com/blog/how-to-improve-messagepack-javascript-parsing-speed-by-2-6-times), this article gives very practical advices.  
And [kriszyp/msgpackr](https://github.com/kriszyp/msgpackr/blob/master/pack.js#L636-L657) for better buffer allocation strategy.

##### Cache

- To improve encoding performance, [LruCache](src/encoder/lru-cache.ts) was deployed.
- To improve decoding peformance, [prefix trie](src/decoder/prefix-trie.ts) was deployed for Uint8Array caching.
- To avoid evicting, map-key caching and string caching were separated.
- To reduce memory usage, cache [Object/array descriptor](src/decoder/typed-value-resolver.ts#L69-L91)

##### ArrayBuffer / TypedArray

- To efficiently allocate new buffer, every [ByteArray](src/encoder/byte-array.ts) begins with small buffer (1K).
- To efficiently handle unpredictable large JSON, [ByteArray](src/encoder/byte-array.ts) allocates exponentially.
- To avoid overhead on writing, [ByteArray](src/encoder/byte-array.ts) uses [`DataView` calls](https://v8.dev/blog/dataview) as much as possible.

##### Node.js

- To maximize performance of array, [pre-allocated array size](src/decoder/decoder.ts#L11-L12).
- To maximize performance, use [Generator function](src/decoder/typed-value-resolver.ts)
- To avoid overhead of `TextDecoder()`, [decode UTF-8 bytes with pure JS](src/decoder/utf8-decode.ts) when less than 200 bytes.
- To avoid syntax penalty of [private class fields](https://v8.dev/blog/faster-class-features) under node.js 18, use [TypeScript's syntax](https://www.typescriptlang.org/docs/handbook/2/classes.html#caveats) instead.

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

# References

- [[JS] TypedArray, ArrayBuffer 和 DataView](https://pjchender.dev/javascript/js-typedarray-buffer-dataview/)
- [使用 ESLint, Prettier, Husky, Lint-staged 以及 Commitizen 提升專案品質及一致性](https://medium.com/@danielhu95/set-up-eslint-pipeline-zh-tw-990d7d9eb68e)
- [samerbuna/efficient-node](https://github.com/samerbuna/efficient-node/blob/main/400-node-streams.adoc)
- [Best practices for creating a modern npm package](https://snyk.io/blog/best-practices-create-modern-npm-package/)
- [kriszyp/msgpackr](https://github.com/kriszyp/msgpackr/blob/master/pack.js#L636-L657)
- [How to improve MessagePack JavaScript decoder speed by 2.6 times.](https://appspector.com/blog/how-to-improve-messagepack-javascript-parsing-speed-by-2-6-times)
