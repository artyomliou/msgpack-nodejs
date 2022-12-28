# msgpack-nodejs

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com/)

This implementation follows [MsgPack Spec](https://github.com/msgpack/msgpack/blob/master/spec.md).  

---

## Usage
```
npm i msgpack-nodejs
```

### Encode / Decode
There are 2 API:
1. [encode](blob/main/src/encoder/index.js): Expect anything, return ```ArrayBuffer```
2. [decode](blob/main/src/decoder/index.js): Expect ```ArrayBuffer```, return anything
```javascript
import { encode } from 'msgpack-nodejs'
console.log(encode({ "compact": true, "schema": 0 }))
// return
// ArrayBuffer {
//  [Uint8Contents]: <82 a7 63 6f 6d 70 61 63 74 c3 a6 73 63 68 65 6d 61 00>,
//  byteLength: 18
//}
```

```javascript
import { decode } from 'msgpack-nodejs'
console.log(decode(new Uint8Array([ 0x82, 0xa7, 0x63, 0x6f, 0x6d, 0x70, 0x61, 0x63, 0x74, 0xc3, 0xa6, 0x73, 0x63, 0x68, 0x65, 0x6d, 0x61, 0x00, ]).buffer))
// return { compact: true, schema: 0 }
```

### Stream (Node.js only)
There are 2 API:
1. [EncodeStream](blob/main/src/streams/EncodeStream.js): Expect anything except ```null```, output ```Buffer```
2. [DecodeStream](blob/main/src/streams/DecodeStream.js): Expect ```Buffer``` or ```ArrayBuffer```, output anything except ```null```. Sometimes you may encounter error after you attached another stream that does not expect a object as its input. 

Example below demostrates how to put these stream together.
You can find separate usage at [test/EncodeStream.test.js](blob/main/test/EncodeStream.test.js) or [test/DecodeStream.test.js](blob/main/test/DecodeStream.test.js)

```javascript
import { EncodeStream, DecodeStream } from 'msgpack-nodejs'
import { Writable } from 'node:stream'

const testCases = [
  { title: 'bool (true)', args: true },
  { title: 'bool (false)', args: false },
  { title: 'number (0)', args: 0 },
  { title: 'number (127)', args: 127 },
  { title: 'number (65535)', args: 65535 },
  { title: 'number (MAX)', args: BigInt(Number.MAX_SAFE_INTEGER) },
  { title: 'number (MIN)', args: BigInt(Number.MIN_SAFE_INTEGER) },
  { title: 'float (1.1)', args: 1.1 },
  { title: 'bigint (1 << 54)', args: BigInt(1) << BigInt(54) },
  { title: 'string', args: 'hello world! 嗨 😂' },
  { title: 'date', args: new Date() },
  { title: 'ArrayBuffer', args: new TextEncoder().encode('hello world').buffer },
  { title: 'Array', args: [[[[[]]]]] },
  { title: 'Object', args: { compact: true, schema: 0 } },
  { title: 'Map', args: new Map([['compact', true], ['schema', 0]]) }
]

// Declare streams
const encodeStream = new EncodeStream()
const decodeStream = new DecodeStream()
const outStream = new Writable({
  objectMode: true,
  write(chunk, encoding, callback) {
    console.log(chunk)
    callback()
  }
})
encodeStream.pipe(decodeStream).pipe(outStream)

// Write data into first encodeStream
for (const testCase of testCases) {
  console.info(testCase.title)
  encodeStream.write(testCase.args)
}
```

### Testing
1. Run ```npm test```
2. Include ```dist/index.js``` in HTML files as ```test.html``` did

## Compability
| Env                                          | Executable? |
|----------------------------------------------|-------------|
| Firefox 108                                  | ✅          |
| Node.js 16                                   | ✅          |
| Node.js 14                                   | ✅          |
| Node.js 12                                   | ❌          |

## Limitation
1. Does not support custom extension
2. Ext family does not have complete test cases for now.
3. Does not support float 32, because Javascript float is always 64-bit.

## TODO
1. Migrate to typescript


---


## Implementation detail
### Serialization
[Serializer](blob/main/src/Serialize.js) uses a recursive function ```match()``` to match JSON structure (primitive value, object, array or nested).

```match()``` function always get a argument ```val```. It will use different handler to handle ```val``` after determining its type. 
For each map/array encountered, it will be iterated, then each elements will be passed into ```match``` and return its serialization.
If it's a primitive value then it will be simply serialized and returned.
If it's a map/array then it will be serialized too, but only with information like "what type is this value?" and "how many elements it has?".
Then ```match()``` will dive into (aka iterate) each elements.

All serialized (binary) will be pushed into [ByteArray](blob/main/src/ByteArray.js).
After all ```match()``` were executed, this ByteArray will be concatenated and returned.

### Deserialization
There's 2 files handling with different concerns.
- [Deserializer](blob/main/src/Deserialize.js) will compose typed values in proper structure. It utlizes [TypedValueResolver](blob/main/src/TypedValueResolver.js) for resolving typed value. If it get a map/array, then initialize a new [StructContext](blob/main/src/StructContext.js) and push subsequent values into the structure (map/array), with the maximum limit of elements that it could possess. If this limit were met, leave current context, pop previous context from stack.
- [TypedValueResolver](blob/main/src/TypedValueResolver.js) are full of byte resolving logic. To be specific, resolve first byte for type, based on this, we can resolve remaining bytes with type-specific procedure.


### Inspiration
1. [kriszyp/msgpackr](https://github.com/kriszyp/msgpackr/blob/master/pack.js#L636-L657) - For better buffer allocation strategy

### Lesson learned
- The difference between [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) and the node.js API [Buffer](https://nodejs.org/api/buffer.html)
- The limitation of JS [left shift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Left_shift) and [right shift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift)
- [Operators of BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#operators)
- The performance benefit of better buffer allocation strategy
- [Private class features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)
- Another unit test framework - [Mocha](https://mochajs.org/)
- Another coding style formatter and linter - [StandardJS](https://standardjs.com/index.html)
- Pre-commit tool - [Husky](https://github.com/typicode/husky)
  
  
  
# References
- [[JS] TypedArray, ArrayBuffer 和 DataView](https://pjchender.dev/javascript/js-typedarray-buffer-dataview/)
- [使用ESLint, Prettier, Husky, Lint-staged以及Commitizen提升專案品質及一致性](https://medium.com/@danielhu95/set-up-eslint-pipeline-zh-tw-990d7d9eb68e)
- [samerbuna/efficient-node](https://github.com/samerbuna/efficient-node/blob/main/400-node-streams.adoc)
- [Best practices for creating a modern npm package](https://snyk.io/blog/best-practices-create-modern-npm-package/)