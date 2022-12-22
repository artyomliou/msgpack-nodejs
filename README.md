# msgpack-nodejs

This implementation follows [MsgPack Spec](https://github.com/msgpack/msgpack/blob/master/spec.md).  
  
### Serialization implementation detail
[Serializer](blob/main/src/Serialize.js) uses a recursive function ```match()``` to match JSON structure (primitive value, object, array or nested).

```match()``` function always get a argument ```val```. It will use different handler to handle ```val``` after determining its type. 
For each map/array encountered, it will be iterated, then each elements will be passed into ```match``` and return its serialization.
If it's a primitive value then it will be simply serialized and returned.
If it's a map/array then it will be serialized too, but only with information like "what type is this value?" and "how many elements it has?".
Then ```match()``` will dive into (aka iterate) each elements.

All serialized (binary) will be pushed into [ByteArray](blob/main/src/ByteArray.js).
After all ```match()``` were executed, this ByteArray will be concatenated and returned.

### Deserialization implementation detail
There's 2 files handling with different concerns.
- [Deserializer](blob/main/src/Deserialize.js) utlizes [TypedValueResolver](blob/main/src/TypedValueResolver.js) for resolving typed value. If it's a map/array, initialize a new [StructContext](blob/main/src/StructContext.js) and push subsequent values into it, with the limit of elements that it could have. If this limit matches, leave current context, pop previous context from stack.
- [TypedValueResolver](blob/main/src/TypedValueResolver.js) are full of byte resolving logic. To be specific, resolve first byte for type, based on this, we can resolve remaining bytes with type-specific procedure.
 use [DataView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView) to parse ```srcBuffer``` argument. The resolving logic was encapsulated into .

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
- Ext family does not have complete test cases for now.
- Does not support float 32, because Javascript float is always 64-bit.
- Does not support stream
- Does not run on browser