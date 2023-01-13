# Examples

# Encode / Decode

```javascript
import { encode, decode } from "msgpack-nodejs"
console.log(encode({ compact: true, schema: 0 }))
console.log(
  decode(
    Uint8Array.of(
      0x82,
      0xa7,
      0x63,
      0x6f,
      0x6d,
      0x70,
      0x61,
      0x63,
      0x74,
      0xc3,
      0xa6,
      0x73,
      0x63,
      0x68,
      0x65,
      0x6d,
      0x61,
      0x00
    )
  )
)
```

---

# Stream

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

# Custom extension

You can register extension, with a number (0 ~ 127) as its type, and a object constructor that encoder and decoder will use.

- [Example](test/extension.spec.ts)
- [Built-in Date() extension](src/extensions/timestamp-extension.ts)

---

# Apply options

```javascript
import { applyOptions } from "msgpack-nodejs"

applyOptions({
  encoder: {
    mapKeyCache: {
      enabled: true,
      size: 40,
    },
    stringCache: {
      enabled: true,
      size: 100,
    },
    byteArray: {
      base: 900000,
    },
  },
  decoder: {
    shortStringCache: {
      enabled: true,
      lessThan: 10,
    },
    jsUtf8Decode: {
      enabled: true,
      lessThan: 200,
    },
  },
})
```
