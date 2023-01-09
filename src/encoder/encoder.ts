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
} from "../constants/index.js"
import { debugMode } from "../constants/debug.js"
import { EncodableValue } from "../types.js"
import { getExtension } from "../extensions/registry.js"
import { LruCache } from "../cache.js"

export default function msgPackEncode(src: EncodableValue): Uint8Array {
  const byteArray = new ByteArray()
  match(byteArray, src)

  const buffer = byteArray.getBuffer()
  if (debugMode) {
    console.debug(buffer)
  }
  return buffer
}

function match(byteArray: ByteArray, val: EncodableValue): void {
  switch (typeof val) {
    case "boolean":
      byteArray.writeUint8(val ? BOOL_TRUE : BOOL_FALSE)
      break

    case "bigint":
      encodeBigint(byteArray, val)
      break

    case "number":
      if (Number.isInteger(val)) {
        encodeInteger(byteArray, val)
      } else {
        encodeFloat(byteArray, val)
      }
      break

    case "string":
      encodeString(byteArray, val)
      break

    case "object":
      if (val === null) {
        byteArray.writeUint8(NIL)
        break
      }
      if (val instanceof Uint8Array) {
        encodeBuffer(byteArray, val)
        break
      }
      if (val instanceof Array) {
        encodeArray(byteArray, val.length)
        for (const element of val) {
          match(byteArray, element)
        }
        break
      }

      // Encode extension
      if ("constructor" in val) {
        const ext = getExtension(val.constructor)
        if (typeof ext !== "undefined") {
          const array = ext.encode(val)
          encodeExt(byteArray, ext.type, array)
          break
        }
      }

      // Handling typical object
      if (val instanceof Map) {
        encodeMap(byteArray, val.size)
        for (const [k, v] of val.entries()) {
          encodeString(byteArray, k, true)
          match(byteArray, v)
        }
      } else {
        encodeMap(byteArray, Object.keys(val).length)
        for (const [k, v] of Object.entries(val)) {
          encodeString(byteArray, k, true)
          match(byteArray, v)
        }
      }
      break

    default:
      // No support for Symbol, Function, Undefined
      break
  }
}

function encodeInteger(byteArray: ByteArray, number: number): void {
  // positive fixint stores 7-bit positive integer
  // 0b1111111 = 127
  if (number >= 0 && number <= 127) {
    return byteArray.writeUint8(number)
  }

  // negative fixint stores 5-bit negative integer
  if (number < 0 && number >= -32) {
    return byteArray.writeInt8(number)
  }

  // unsigned
  if (number > 0) {
    if (number <= 0xff) {
      byteArray.writeUint8(UINT8_PREFIX)
      byteArray.writeUint8(number)
      return
    }
    if (number <= 0xffff) {
      byteArray.writeUint8(UINT16_PREFIX)
      byteArray.writeUint16(number)
      return
    }
    if (number <= 0xffffffff) {
      byteArray.writeUint8(UINT32_PREFIX)
      byteArray.writeUint32(number)
      return
    }
  }

  // signed
  if (number < 0) {
    if (-0x80 <= number) {
      byteArray.writeUint8(INT8_PREFIX)
      byteArray.writeInt8(number)
      return
    }
    if (-0x8000 <= number) {
      byteArray.writeUint8(INT16_PREFIX)
      byteArray.writeInt16(number)
      return
    }
    if (-0x80000000 <= number) {
      byteArray.writeUint8(INT32_PREFIX)
      byteArray.writeInt32(number)
      return
    }
  }

  throw new Error(
    "Cannot handle integer more than 4294967295 or less than -2147483648."
  )
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

// These 3 variables are created for encodeString()
const textEncoder = new TextEncoder()
const textEncoderEncode = textEncoder.encode.bind(textEncoder)
const stringCache = new LruCache<string>(60)

function encodeString(
  byteArray: ByteArray,
  string: string,
  useCache = false
): void {
  const strBuf = useCache
    ? stringCache.remember(string, textEncoderEncode)
    : textEncoderEncode(string)
  const bytesCount = strBuf.byteLength

  if (bytesCount <= 31) {
    byteArray.writeUint8(0b10100000 + bytesCount)
    byteArray.append(strBuf)
    return
  }

  // (2 ** 8) - 1
  if (bytesCount < 0xff) {
    byteArray.writeUint8(STR8_PREFIX)
    byteArray.writeUint8(bytesCount)
    byteArray.append(strBuf)
    return
  }

  // (2 ** 16) - 1
  if (bytesCount < 0xffff) {
    byteArray.writeUint8(STR16_PREFIX)
    byteArray.writeUint16(bytesCount)
    byteArray.append(strBuf)
    return
  }

  // (2 ** 32) - 1
  if (bytesCount < 0xffffffff) {
    byteArray.writeUint8(STR32_PREFIX)
    byteArray.writeUint32(bytesCount)
    byteArray.append(strBuf)
    return
  }
  throw new Error("String's length cannot exceed (2^32)-1.")
}

function encodeBuffer(byteArray: ByteArray, buffer: Uint8Array): void {
  const bytesCount = buffer.byteLength

  // (2 ** 8) - 1
  if (bytesCount < 0xff) {
    byteArray.writeUint8(BIN8_PREFIX)
    byteArray.writeUint8(bytesCount)
    byteArray.append(buffer)
    return
  }

  // (2 ** 16) - 1
  if (bytesCount < 0xffff) {
    byteArray.writeUint8(BIN16_PREFIX)
    byteArray.writeUint16(bytesCount)
    byteArray.append(buffer)
    return
  }

  // (2 ** 32) - 1
  if (bytesCount < 0xffffffff) {
    byteArray.writeUint8(BIN32_PREFIX)
    byteArray.writeUint32(bytesCount)
    byteArray.append(buffer)
    return
  }

  throw new Error("Length of binary value cannot exceed (2^32)-1.")
}

function encodeArray(byteArray: ByteArray, arraySize: number): void {
  // fixarray
  if (arraySize < 0xf) {
    byteArray.writeUint8(0b10010000 + arraySize)
    return
  }

  // array 16
  if (arraySize < 0xffff) {
    byteArray.writeUint8(ARRAY16_PREFIX)
    byteArray.writeUint16(arraySize)
    return
  }

  // array 32
  if (arraySize < 0xffffffff) {
    byteArray.writeUint8(ARRAY32_PREFIX)
    byteArray.writeUint32(arraySize)
    return
  }

  throw new Error("Number of elements cannot exceed (2^32)-1.")
}

function encodeMap(byteArray: ByteArray, mapSize: number): void {
  // fixmap
  if (mapSize < 0xf) {
    byteArray.writeUint8(0b10000000 + mapSize)
    return
  }

  // map 16
  if (mapSize < 0xffff) {
    byteArray.writeUint8(MAP16_PREFIX)
    byteArray.writeUint16(mapSize)
    return
  }

  // map 32
  if (mapSize < 0xffffffff) {
    byteArray.writeUint8(MAP32_PREFIX)
    byteArray.writeUint32(mapSize)
    return
  }

  throw new Error("Number of pairs cannot exceed (2^32)-1.")
}

function encodeExt(byteArray: ByteArray, type: number, data: Uint8Array): void {
  const byteLength = data.byteLength

  let firstByte: number | undefined
  let byteLengthLength = 0
  let byteLengthPos: number | undefined
  // let typePos = 1
  // let dataPos = 2

  // fixint
  if (byteLength === 1) {
    firstByte = FIXEXT1_PREFIX
  } else if (byteLength === 2) {
    firstByte = FIXEXT2_PREFIX
  } else if (byteLength === 4) {
    firstByte = FIXEXT4_PREFIX
  } else if (byteLength === 8) {
    firstByte = FIXEXT8_PREFIX
  } else if (byteLength === 16) {
    firstByte = FIXEXT16_PREFIX
  }

  // ext 8
  if (byteLength < 0xff) {
    firstByte = EXT8_PREFIX
    byteLengthLength = 1
    byteLengthPos = 1
    // typePos = 2
    // dataPos = 3
  } else if (byteLength < 0xffff) {
    firstByte = EXT16_PREFIX
    byteLengthLength = 2
    byteLengthPos = 1
    // typePos = 3
    // dataPos = 4
  } else if (byteLength < 0xffffffff) {
    firstByte = EXT32_PREFIX
    byteLengthLength = 4
    byteLengthPos = 1
    // typePos = 5
    // dataPos = 6
  } else {
    throw new Error("Ext does not support data exceeding 2**32-1 bytes.")
  }

  byteArray.writeUint8(firstByte)
  if (
    typeof byteLengthPos !== "undefined" &&
    typeof byteLengthLength !== "undefined"
  ) {
    if (byteLengthLength === 1) {
      byteArray.writeUint8(byteLength)
    } else if (byteLengthLength === 2) {
      byteArray.writeUint16(byteLength)
    } else {
      byteArray.writeUint32(byteLength)
    }
  }
  byteArray.writeInt8(type)
  byteArray.append(data)
}
