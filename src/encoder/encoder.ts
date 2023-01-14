import ByteArray from "./byte-array.js"
import {
  NIL,
  BOOL_FALSE,
  BOOL_TRUE,
  BIN8_PREFIX,
  BIN16_PREFIX,
  BIN32_PREFIX,
  EXT8_PREFIX,
  EXT16_PREFIX,
  EXT32_PREFIX,
  // FLOAT32_PREFIX,
  FLOAT64_PREFIX,
  UINT8_PREFIX,
  UINT16_PREFIX,
  UINT32_PREFIX,
  UINT64_PREFIX,
  INT8_PREFIX,
  INT16_PREFIX,
  INT32_PREFIX,
  INT64_PREFIX,
  FIXEXT1_PREFIX,
  FIXEXT2_PREFIX,
  FIXEXT4_PREFIX,
  FIXEXT8_PREFIX,
  FIXEXT16_PREFIX,
  STR8_PREFIX,
  STR16_PREFIX,
  STR32_PREFIX,
  ARRAY16_PREFIX,
  ARRAY32_PREFIX,
  MAP16_PREFIX,
  MAP32_PREFIX,
} from "../constant.js"
import { EncodableValue } from "../types.js"
import { getExtension } from "../extensions/registry.js"
import { LruCache } from "./lru-cache.js"
import { Options } from "../options.js"
import { stringBuffer } from "./string-buffer.js"

/**
 * Opt in caches
 */
const mapKeyCache = new LruCache<string>("Map-key LruCache", 30)
const stringCache = new LruCache<string>("String LruCache", 100)
let mapkeyCacheEnabled = true
let stringCacheEnabled = true

export function optIn(opt: Options) {
  // mapkeyCache
  if (typeof opt?.encoder?.mapKeyCache?.enabled !== "undefined") {
    mapkeyCacheEnabled = opt.encoder.mapKeyCache.enabled
  }
  if (typeof opt?.encoder?.mapKeyCache?.size !== "undefined") {
    mapKeyCache.sizeLimit = opt.encoder.mapKeyCache.size
  }

  // stringCache
  if (typeof opt?.encoder?.stringCache?.enabled !== "undefined") {
    stringCacheEnabled = opt.encoder.stringCache.enabled
  }
  if (typeof opt?.encoder?.stringCache?.size !== "undefined") {
    stringCache.sizeLimit = opt.encoder.stringCache.size
  }
}

/**
 * Encode as MessagePack format
 */
export default function msgPackEncode(src: EncodableValue): Uint8Array {
  const byteArray = new ByteArray()
  match(byteArray, src)
  return byteArray.getWrittenBytes()
}

function isPlainObject(value: unknown): value is Object {
  return value?.constructor === Object
}
function match(byteArray: ByteArray, val: EncodableValue): void {
  if (typeof val === "string") {
    encodeString(byteArray, val)
  } else if (typeof val === "number") {
    if (Number.isInteger(val)) {
      encodeInteger(byteArray, val)
    } else {
      encodeFloat(byteArray, val)
    }
  } else if (val instanceof Array) {
    encodeArray(byteArray, val.length)
    for (const element of val) {
      match(byteArray, element)
    }
  } else if (val instanceof Map) {
    encodeMap(byteArray, val.size)
    for (const [k, v] of val.entries()) {
      encodeMapKey(byteArray, k)
      match(byteArray, v)
    }
  } else if (isPlainObject(val)) {
    encodeMap(byteArray, Object.keys(val).length)
    for (const [k, v] of Object.entries(val)) {
      encodeMapKey(byteArray, k)
      match(byteArray, v)
    }
  } else if (val === null) {
    byteArray.writeUint8(NIL)
  } else if (typeof val === "boolean") {
    byteArray.writeUint8(val ? BOOL_TRUE : BOOL_FALSE)
  } else if (typeof val === "bigint") {
    encodeBigint(byteArray, val)
  } else if (val instanceof Uint8Array) {
    encodeBin(byteArray, val)
  } else if (val?.constructor) {
    // Encode extension
    const ext = getExtension(val.constructor)
    if (typeof ext !== "undefined") {
      const array = ext.encode(val)
      encodeExt(byteArray, ext.type, array)
    }
  } else {
    throw new Error(`Unsupported value: ${typeof val}.`)
  }
}

function encodeInteger(byteArray: ByteArray, number: number): void {
  if (number >= 0 && number <= 127) {
    // positive fixint stores 7-bit positive integer
    byteArray.writeUint8(number)
  } else if (number < 0 && number >= -32) {
    // negative fixint stores 5-bit negative integer
    byteArray.writeInt8(number)
  } else if (0 < number) {
    if (number <= 0xff) {
      byteArray.writeUint8(UINT8_PREFIX)
      byteArray.writeUint8(number)
    } else if (number <= 0xffff) {
      byteArray.writeUint8(UINT16_PREFIX)
      byteArray.writeUint16(number)
    } else if (number <= 0xffffffff) {
      byteArray.writeUint8(UINT32_PREFIX)
      byteArray.writeUint32(number)
    } else {
      byteArray.writeUint8(UINT64_PREFIX)
      byteArray.writeUint64(BigInt(number))
    }
  } else {
    if (-0x80 < number) {
      byteArray.writeUint8(INT8_PREFIX)
      byteArray.writeInt8(number)
    } else if (-0x8000 < number) {
      byteArray.writeUint8(INT16_PREFIX)
      byteArray.writeInt16(number)
    } else if (-0x80000000 < number) {
      byteArray.writeUint8(INT32_PREFIX)
      byteArray.writeInt32(number)
    } else {
      byteArray.writeUint8(INT64_PREFIX)
      byteArray.writeInt64(BigInt(number))
    }
  }
}

function encodeBigint(byteArray: ByteArray, bigint: bigint): void {
  if (bigint > 0) {
    byteArray.writeUint8(UINT64_PREFIX)
    byteArray.writeUint64(bigint)
  } else {
    byteArray.writeUint8(INT64_PREFIX)
    byteArray.writeInt64(bigint)
  }
}

function encodeFloat(byteArray: ByteArray, number: number): void {
  // Since all float in Javascript is double, it's not possible to have FLOAT32 type.
  byteArray.writeUint8(FLOAT64_PREFIX)
  byteArray.writeFloat64(number)
}

function encodeMapKey(byteArray: ByteArray, string: string): void {
  // If cache is enabled and hit, the cost of encoding, copying between buffer can be save
  if (mapkeyCacheEnabled) {
    const buffer = mapKeyCache.get(string)
    if (buffer) {
      byteArray.append(buffer)
      return
    }
  }

  // If cache is not enabled / cache is not hit
  const encoded = stringBuffer.encodeString(string)
  const headerBytes = writeStringHeader(byteArray, encoded.byteLength)
  byteArray.append(encoded)

  // Cache header and encoded string at once
  if (mapkeyCacheEnabled) {
    mapKeyCache.set(
      string,
      byteArray.subarrayBackward(headerBytes + encoded.byteLength)
    )
  }
}

function encodeString(byteArray: ByteArray, string: string): void {
  // If cache is enabled and hit, the cost of encoding, copying between buffer can be save
  if (stringCacheEnabled) {
    const buffer = stringCache.get(string)
    if (buffer) {
      byteArray.append(buffer)
      return
    }
  }

  // If cache is not enabled / cache is not hit
  const encoded = stringBuffer.encodeString(string)
  const headerBytes = writeStringHeader(byteArray, encoded.byteLength)
  byteArray.append(encoded)

  // Cache header and encoded string at once
  if (stringCacheEnabled) {
    stringCache.set(
      string,
      byteArray.subarrayBackward(headerBytes + encoded.byteLength)
    )
  }
}

function writeStringHeader(byteArray: ByteArray, utf8ByteCount: number) {
  if (utf8ByteCount <= 31) {
    byteArray.writeUint8(0b10100000 + utf8ByteCount)
    return 1
  } else if (utf8ByteCount <= 0xff) {
    byteArray.writeUint8(STR8_PREFIX)
    byteArray.writeUint8(utf8ByteCount)
    return 2
  } else if (utf8ByteCount <= 0xffff) {
    byteArray.writeUint8(STR16_PREFIX)
    byteArray.writeUint16(utf8ByteCount)
    return 3
  } else if (utf8ByteCount <= 0xffffffff) {
    byteArray.writeUint8(STR32_PREFIX)
    byteArray.writeUint32(utf8ByteCount)
    return 5
  } else {
    throw new Error("String's length cannot exceed (2^32)-1.")
  }
}

function encodeBin(byteArray: ByteArray, buffer: Uint8Array): void {
  const bytesCount = buffer.byteLength

  if (bytesCount <= 0xff) {
    byteArray.writeUint8(BIN8_PREFIX)
    byteArray.writeUint8(bytesCount)
    byteArray.append(buffer)
  } else if (bytesCount <= 0xffff) {
    byteArray.writeUint8(BIN16_PREFIX)
    byteArray.writeUint16(bytesCount)
    byteArray.append(buffer)
  } else if (bytesCount <= 0xffffffff) {
    byteArray.writeUint8(BIN32_PREFIX)
    byteArray.writeUint32(bytesCount)
    byteArray.append(buffer)
  } else {
    throw new Error("Length of binary value cannot exceed (2^32)-1.")
  }
}

function encodeArray(byteArray: ByteArray, arraySize: number): void {
  if (arraySize <= 0xf) {
    byteArray.writeUint8(0b10010000 + arraySize)
  } else if (arraySize <= 0xffff) {
    byteArray.writeUint8(ARRAY16_PREFIX)
    byteArray.writeUint16(arraySize)
  } else if (arraySize <= 0xffffffff) {
    byteArray.writeUint8(ARRAY32_PREFIX)
    byteArray.writeUint32(arraySize)
  } else {
    throw new Error("Number of elements cannot exceed (2^32)-1.")
  }
}

function encodeMap(byteArray: ByteArray, mapSize: number): void {
  if (mapSize < 0xf) {
    byteArray.writeUint8(0b10000000 + mapSize)
  } else if (mapSize <= 0xffff) {
    byteArray.writeUint8(MAP16_PREFIX)
    byteArray.writeUint16(mapSize)
  } else if (mapSize <= 0xffffffff) {
    byteArray.writeUint8(MAP32_PREFIX)
    byteArray.writeUint32(mapSize)
  } else {
    throw new Error("Number of elements cannot exceed (2^32)-1.")
  }
}

function encodeExt(byteArray: ByteArray, type: number, data: Uint8Array): void {
  const dataByte = data.byteLength

  let firstByte: number | undefined
  let dataByteLength: number | undefined

  if (dataByte === 1) {
    firstByte = FIXEXT1_PREFIX
  } else if (dataByte === 2) {
    firstByte = FIXEXT2_PREFIX
  } else if (dataByte === 4) {
    firstByte = FIXEXT4_PREFIX
  } else if (dataByte === 8) {
    firstByte = FIXEXT8_PREFIX
  } else if (dataByte === 16) {
    firstByte = FIXEXT16_PREFIX
  } else if (dataByte <= 0xff) {
    // ext 8
    firstByte = EXT8_PREFIX
    dataByteLength = 1
  } else if (dataByte <= 0xffff) {
    // ext 16
    firstByte = EXT16_PREFIX
    dataByteLength = 2
  } else if (dataByte <= 0xffffffff) {
    // ext 32
    firstByte = EXT32_PREFIX
    dataByteLength = 4
  } else {
    throw new Error("Ext does not support data exceeding 2**32-1 bytes.")
  }

  byteArray.writeUint8(firstByte)
  if (typeof dataByteLength !== "undefined") {
    if (dataByteLength === 1) {
      byteArray.writeUint8(dataByte)
    } else if (dataByteLength === 2) {
      byteArray.writeUint16(dataByte)
    } else {
      byteArray.writeUint32(dataByte)
    }
  }
  byteArray.writeInt8(type)
  byteArray.append(data)
}
