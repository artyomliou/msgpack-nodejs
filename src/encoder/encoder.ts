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

const stringCache = new LruCache<string>()
const mapCache = new LruCache<number>()

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
      byteArray.append(encodeBoolean(val))
      break

    case "bigint":
      byteArray.append(encodeBigint(val))
      break

    case "number":
      if (Number.isInteger(val)) {
        byteArray.append(encodeInteger(val))
      } else {
        byteArray.append(encodeFloat(val))
      }
      break

    case "string":
      byteArray.append(encodeString(val))
      break

    case "object":
      if (val === null) {
        byteArray.writeUint8(NIL)
        break
      }
      if (val instanceof Uint8Array) {
        byteArray.append(encodeBuffer(val))
        break
      }
      if (val instanceof Array) {
        byteArray.append(encodeArray(val.length))
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
          byteArray.append(encodeExt(ext.type, array))
          break
        }
      }

      // Handling typical object
      if (val instanceof Map) {
        byteArray.append(mapCache.remember(encodeMap, val.size))
        for (const [k, v] of val.entries()) {
          byteArray.append(stringCache.remember(encodeString, k))
          match(byteArray, v)
        }
      } else {
        byteArray.append(mapCache.remember(encodeMap, Object.keys(val).length))
        for (const [k, v] of Object.entries(val)) {
          byteArray.append(stringCache.remember(encodeString, k))
          match(byteArray, v)
        }
      }
      break

    default:
      // No support for Symbol, Function, Undefined
      break
  }
}

export function encodeBoolean(val: boolean): Uint8Array {
  const array = new Uint8Array(1)
  array[0] = val ? BOOL_TRUE : BOOL_FALSE
  return array
}

export function encodeInteger(number: number): Uint8Array {
  // positive fixint stores 7-bit positive integer
  // 0b1111111 = 127
  if (number >= 0 && number <= 127) {
    const array = new Uint8Array(1)
    array[0] = number
    return array
  }

  // negative fixint stores 5-bit negative integer
  if (number < 0 && number >= -32) {
    const view = new DataView(new ArrayBuffer(1))
    view.setInt8(0, number)
    return new Uint8Array(view.buffer)
  }

  // unsigned
  if (number > 0) {
    if (number <= 0xff) {
      const view = new DataView(new ArrayBuffer(2))
      view.setUint8(0, UINT8_PREFIX)
      view.setUint8(1, number)
      return new Uint8Array(view.buffer)
    }
    if (number <= 0xffff) {
      const view = new DataView(new ArrayBuffer(3))
      view.setUint8(0, UINT16_PREFIX)
      view.setUint16(1, number, false)
      return new Uint8Array(view.buffer)
    }
    if (number <= 0xffffffff) {
      const view = new DataView(new ArrayBuffer(5))
      view.setUint8(0, UINT32_PREFIX)
      view.setUint32(1, number, false)
      return new Uint8Array(view.buffer)
    }
  }

  // signed
  if (number < 0) {
    if (-number <= 0xff) {
      const view = new DataView(new ArrayBuffer(2))
      view.setUint8(0, INT8_PREFIX)
      view.setInt8(1, number)
      return new Uint8Array(view.buffer)
    }
    if (-number <= 0xffff) {
      const view = new DataView(new ArrayBuffer(3))
      view.setUint8(0, INT16_PREFIX)
      view.setInt16(1, number, false)
      return new Uint8Array(view.buffer)
    }
    if (-number <= 0xffffffff) {
      const view = new DataView(new ArrayBuffer(5))
      view.setUint8(0, INT32_PREFIX)
      view.setInt32(1, number, false)
      return new Uint8Array(view.buffer)
    }
  }

  throw new Error(
    "Cannot handle integer more than 4294967295 or less than -2147483648."
  )
}

export function encodeBigint(bigint: bigint): Uint8Array {
  const view = new DataView(new ArrayBuffer(9))
  if (bigint > 0) {
    view.setUint8(0, UINT64_PREFIX)
    view.setBigUint64(1, bigint, false)
  } else {
    view.setUint8(0, INT64_PREFIX)
    view.setBigInt64(1, bigint, false)
  }
  return new Uint8Array(view.buffer)
}

export function encodeFloat(number: number): Uint8Array {
  // Since all float in Javascript is double, it's not possible to have FLOAT32 type.
  const view = new DataView(new ArrayBuffer(9))
  view.setUint8(0, FLOAT64_PREFIX)
  view.setFloat64(1, number, false)
  return new Uint8Array(view.buffer)
}

export function encodeString(string: string): Uint8Array {
  const strBuf = new TextEncoder().encode(string)
  const bytesCount = strBuf.byteLength

  if (bytesCount <= 31) {
    const array = new Uint8Array(1 + bytesCount)
    const view = new DataView(array.buffer)
    view.setUint8(0, 0b10100000 + bytesCount)
    array.set(strBuf, 1)
    return array
  }

  // (2 ** 8) - 1
  if (bytesCount < 0xff) {
    const array = new Uint8Array(2 + bytesCount)
    const view = new DataView(array.buffer)
    view.setUint8(0, STR8_PREFIX)
    view.setUint8(1, bytesCount)
    array.set(strBuf, 2)
    return array
  }

  // (2 ** 16) - 1
  if (bytesCount < 0xffff) {
    const array = new Uint8Array(3 + bytesCount)
    const view = new DataView(array.buffer)
    view.setUint8(0, STR16_PREFIX)
    view.setUint16(1, bytesCount, false)
    array.set(strBuf, 3)
    return array
  }

  // (2 ** 32) - 1
  if (bytesCount < 0xffffffff) {
    const array = new Uint8Array(5 + bytesCount)
    const view = new DataView(array.buffer)
    view.setUint8(0, STR32_PREFIX)
    view.setUint32(1, bytesCount, false)
    array.set(strBuf, 5)
    return array
  }
  throw new Error("String's length cannot exceed (2^32)-1.")
}

export function encodeBuffer(buffer: Uint8Array): Uint8Array {
  const bytesCount = buffer.byteLength

  // (2 ** 8) - 1
  if (bytesCount < 0xff) {
    const array = new Uint8Array(2 + bytesCount)
    const view = new DataView(array.buffer)
    view.setUint8(0, BIN8_PREFIX)
    view.setUint8(1, bytesCount)
    array.set(buffer, 2)
    return array
  }

  // (2 ** 16) - 1
  if (bytesCount < 0xffff) {
    const array = new Uint8Array(3 + bytesCount)
    const view = new DataView(array.buffer)
    view.setUint8(0, BIN16_PREFIX)
    view.setUint16(1, bytesCount)
    array.set(buffer, 3)
    return array
  }

  // (2 ** 32) - 1
  if (bytesCount < 0xffffffff) {
    const array = new Uint8Array(5 + bytesCount)
    const view = new DataView(array.buffer)
    view.setUint8(0, BIN32_PREFIX)
    view.setUint32(1, bytesCount)
    array.set(buffer, 5)
    return array
  }

  throw new Error("Length of binary value cannot exceed (2^32)-1.")
}

export function encodeArray(arraySize: number): Uint8Array {
  // fixarray
  if (arraySize < 0xf) {
    const array = new Uint8Array(1)
    array[0] = 0b10010000 + arraySize
    return array
  }

  // array 16
  if (arraySize < 0xffff) {
    const view = new DataView(new ArrayBuffer(3))
    view.setUint8(0, ARRAY16_PREFIX)
    view.setUint16(1, arraySize, false)
    return new Uint8Array(view.buffer)
  }

  // array 32
  if (arraySize < 0xffffffff) {
    const view = new DataView(new ArrayBuffer(5))
    view.setUint8(0, ARRAY32_PREFIX)
    view.setUint32(1, arraySize, false)
    return new Uint8Array(view.buffer)
  }

  throw new Error("Number of elements cannot exceed (2^32)-1.")
}

export function encodeMap(mapSize: number): Uint8Array {
  // fixmap
  if (mapSize < 0xf) {
    const array = new Uint8Array(1)
    array[0] = 0b10000000 + mapSize
    return array
  }

  // map 16
  if (mapSize < 0xffff) {
    const view = new DataView(new ArrayBuffer(3))
    view.setUint8(0, MAP16_PREFIX)
    view.setUint16(1, mapSize, false)
    return new Uint8Array(view.buffer)
  }

  // map 32
  if (mapSize < 0xffffffff) {
    const view = new DataView(new ArrayBuffer(5))
    view.setUint8(0, MAP32_PREFIX)
    view.setUint32(1, mapSize, false)
    return new Uint8Array(view.buffer)
  }

  throw new Error("Number of pairs cannot exceed (2^32)-1.")
}

export function encodeExt(type: number, data: Uint8Array): Uint8Array {
  const byteLength = data.byteLength

  let firstByte: number | undefined
  let byteLengthLength = 0
  let byteLengthPos: number | undefined
  let typePos = 1
  let dataPos = 2

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
    typePos = 2
    dataPos = 3
  } else if (byteLength < 0xffff) {
    firstByte = EXT16_PREFIX
    byteLengthLength = 2
    byteLengthPos = 1
    typePos = 3
    dataPos = 4
  } else if (byteLength < 0xffffffff) {
    firstByte = EXT32_PREFIX
    byteLengthLength = 4
    byteLengthPos = 1
    typePos = 5
    dataPos = 6
  } else {
    throw new Error("Ext does not support data exceeding 2**32-1 bytes.")
  }

  const buffer = new ArrayBuffer(1 + byteLengthLength + 1 + data.byteLength)
  const array = new Uint8Array(buffer)
  const view = new DataView(buffer)
  view.setUint8(0, firstByte)
  if (
    typeof byteLengthPos !== "undefined" &&
    typeof byteLengthLength !== "undefined"
  ) {
    if (byteLengthLength === 1) {
      view.setUint8(byteLengthPos, byteLength)
    } else if (byteLengthLength === 2) {
      view.setUint16(byteLengthPos, byteLength, false)
    } else {
      view.setUint32(byteLengthPos, byteLength, false)
    }
  }
  view.setInt8(typePos, type)
  array.set(data, dataPos)
  return array
}
