# msgpack-nodejs

This implementation follows [MsgPack Spec](https://github.com/msgpack/msgpack/blob/master/spec.md).

## Prerequisites

1. Node.js

## Installation

1. Fork/Clone
2. Run `npm i`
3. Run the tests `npm test`

## Usage
Because of the nature that JSON is basically a valid Javascript object, this library aims to transform Javascript object to MessagePack format.  


### Serialize
```javascript
serialize({ "compact": true, "schema": 0 });
// return <Buffer 82 a7 63 6f 6d 70 61 63 74 c3 a6 73 63 68 65 6d 61 00>
```

### Deserialize
```javascript
const arrayBuffer = new ArrayBuffer(18);
const buf = new Uint8Array(arrayBuffer);
let pos = 0;
buf[pos++] = 0x82;
buf[pos++] = 0xa7;
buf[pos++] = 0x63;
buf[pos++] = 0x6f;
buf[pos++] = 0x6d;
buf[pos++] = 0x70;
buf[pos++] = 0x61;
buf[pos++] = 0x63;
buf[pos++] = 0x74;
buf[pos++] = 0xc3;
buf[pos++] = 0xa6;
buf[pos++] = 0x73;
buf[pos++] = 0x63;
buf[pos++] = 0x68;
buf[pos++] = 0x65;
buf[pos++] = 0x6d;
buf[pos++] = 0x61;
buf[pos++] = 0x00;
deserialize(Buffer.from(buf));
// return { compact: true, schema: 0 }
```

## Limitation
- This library does not support ext/timestamp for now.