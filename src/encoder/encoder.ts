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
  EXT_TYPE_TIMESTAMP,
} from "../constants/index.js"
import TimeSpec from "../time-spec.js"
import { debugMode } from "../constants/debug.js"
import { EncodableValue, JsonArray, JsonMap } from "../types.js"

export default function msgPackEncode(src: EncodableValue): ArrayBuffer {
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
      handleBoolean(byteArray, val)
      break

    case "bigint":
      handleBigint(byteArray, val)
      break

    case "number":
      if (Number.isInteger(val)) {
        handleInteger(byteArray, val)
      } else {
        handleFloat(byteArray, val)
      }
      break

    case "string":
      handleString(byteArray, val)
      break

    case "object":
      if (val === null) {
        byteArray.writeUint8(NIL)
        break
      }
      if (val instanceof Date) {
        handleTimestamp(byteArray, val)
        break
      }
      if (val instanceof ArrayBuffer) {
        handleBuffer(byteArray, val)
        break
      }
      if (val instanceof Array) {
        handleArray(byteArray, val)
        for (const element of val) {
          match(byteArray, element)
        }
        break
      }

      // Handling typical object
      handleMap(byteArray, val)
      if (val instanceof Map) {
        for (const [k, v] of val.entries()) {
          handleString(byteArray, k)
          match(byteArray, v)
        }
      } else {
        for (const [k, v] of Object.entries(val)) {
          handleString(byteArray, k)
          match(byteArray, v)
        }
      }
      break

    default:
      // No support for Symbol, Function, Undefined
      break
  }
}

function handleBoolean(byteArray: ByteArray, val: boolean): void {
  if (val) {
    byteArray.writeUint8(BOOL_TRUE)
  } else {
    byteArray.writeUint8(BOOL_FALSE)
  }
}

function handleInteger(byteArray: ByteArray, number: number): void {
  // positive fixint stores 7-bit positive integer
  // 0b1111111 = 127
  if (number >= 0 && number <= 127) {
    byteArray.writeUint8(number)
    return
  }

  // negative fixint stores 5-bit negative integer
  if (number < 0 && number >= -32) {
    byteArray.writeInt8(number)
    return
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

    return
  }

  // signed
  if (number < 0) {
    if (-number <= 0xff) {
      byteArray.writeUint8(INT8_PREFIX)
      byteArray.writeInt8(number)
      return
    }
    if (-number <= 0xffff) {
      byteArray.writeUint8(INT16_PREFIX)
      byteArray.writeInt16(number)
      return
    }
    if (-number <= 0xffffffff) {
      byteArray.writeUint8(INT32_PREFIX)
      byteArray.writeInt32(number)
    }
  }
}

function handleBigint(byteArray: ByteArray, bigint: bigint): void {
  if (bigint > 0) {
    byteArray.writeUint8(UINT64_PREFIX)
    byteArray.writeUint64(bigint)
  } else {
    byteArray.writeUint8(INT64_PREFIX)
    byteArray.writeInt64(bigint)
  }
}

function handleFloat(byteArray: ByteArray, number: number): void {
  // Since all float in Javascript is double, it's not possible to have FLOAT32 type.
  byteArray.writeUint8(FLOAT64_PREFIX)
  byteArray.writeFloat64(number)
}

function handleString(byteArray: ByteArray, string: string): void {
  const strBuf = new TextEncoder().encode(string)
  const bytesCount = strBuf.byteLength
  if (bytesCount <= 31) {
    byteArray.writeUint8(0b10100000 + bytesCount)
    byteArray.writeBuffer(strBuf)
    return
  }
  // (2 ** 8) - 1
  if (bytesCount < 0xff) {
    byteArray.writeUint8(STR8_PREFIX)
    byteArray.writeUint8(bytesCount)
    byteArray.writeBuffer(strBuf)
    return
  }
  // (2 ** 16) - 1
  if (bytesCount < 0xffff) {
    byteArray.writeUint8(STR16_PREFIX)
    byteArray.writeUint16(bytesCount)
    byteArray.writeBuffer(strBuf)
    return
  }
  // (2 ** 32) - 1
  if (bytesCount < 0xffffffff) {
    byteArray.writeUint8(STR32_PREFIX)
    byteArray.writeUint32(bytesCount)
    byteArray.writeBuffer(strBuf)
    return
  }
  throw new Error("Length of string value cannot exceed (2^32)-1.")
}

function handleBuffer(byteArray: ByteArray, buffer: ArrayBuffer): void {
  const bytesCount = buffer.byteLength
  // (2 ** 8) - 1
  if (bytesCount < 0xff) {
    byteArray.writeUint8(BIN8_PREFIX)
    byteArray.writeUint8(bytesCount)
    byteArray.writeBuffer(buffer)
    return
  }
  // (2 ** 16) - 1
  if (bytesCount < 0xffff) {
    byteArray.writeUint8(BIN16_PREFIX)
    byteArray.writeUint16(bytesCount)
    byteArray.writeBuffer(buffer)
    return
  }
  // (2 ** 32) - 1
  if (bytesCount < 0xffffffff) {
    byteArray.writeUint8(BIN32_PREFIX)
    byteArray.writeUint32(bytesCount)
    byteArray.writeBuffer(buffer)
    return
  }
  throw new Error("Length of binary value cannot exceed (2^32)-1.")
}

function handleArray(byteArray: ByteArray, array: JsonArray): void {
  const arraySize = array.length

  // fixarray
  if (arraySize < 0xf) {
    byteArray.writeUint8(0b10010000 + arraySize)
    return
  }

  // map 16
  if (arraySize < 0xffff) {
    byteArray.writeUint8(ARRAY16_PREFIX)
    byteArray.writeUint16(arraySize)
    return
  }

  // map 32
  if (arraySize < 0xffffffff) {
    byteArray.writeUint8(ARRAY32_PREFIX)
    byteArray.writeUint32(arraySize)
    return
  }

  throw new Error("Number of elements cannot exceed (2^32)-1.")
}

function handleMap(
  byteArray: ByteArray,
  map: JsonMap | Map<string, any>
): void {
  const mapSize = map instanceof Map ? map.size : Object.keys(map).length

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

/**
 * @link https://github.com/msgpack/msgpack/blob/master/spec.md#timestamp-extension-type
 */
function handleTimestamp(byteArray: ByteArray, date: Date): void {
  const time = TimeSpec.fromDate(date)
  if (time.nsec > 1000000000) {
    throw new Error("Nanoseconds cannot be larger than 999999999.")
  }

  if (time.sec >= 0 && time.sec <= 0xffffffff) {
    // (data64 & 0xffffffff00000000L == 0)
    // It is basically doing masking on the data64 variable, which only keep nsec, and decide if it equals to 0.
    if (time.nsec === 0) {
      // timestamp 32
      const view = new DataView(new ArrayBuffer(4))
      view.setUint32(0, Number(time.sec), false) // unsigned
      handleExt(byteArray, EXT_TYPE_TIMESTAMP, view.buffer)
    } else {
      // timestamp 64
      const data64 = (BigInt(time.nsec) << 34n) + BigInt(time.sec)
      const view = new DataView(new ArrayBuffer(8))
      view.setBigUint64(0, data64, false) // unsigned
      handleExt(byteArray, EXT_TYPE_TIMESTAMP, view.buffer)
    }
  } else {
    // timestamp 96
    const view = new DataView(new ArrayBuffer(12))
    view.setUint32(0, time.nsec, false) // unsigned
    view.setBigInt64(4, BigInt(time.sec), false) // signed
    handleExt(byteArray, EXT_TYPE_TIMESTAMP, view.buffer)
  }
}

function handleExt(
  byteArray: ByteArray,
  type: number,
  data: ArrayBuffer
): void {
  const byteLength = data.byteLength

  // fixint
  if (byteLength === 1) {
    byteArray.writeUint8(FIXEXT1_PREFIX)
    byteArray.writeInt8(type)
    byteArray.writeBuffer(data)
    return
  } else if (byteLength === 2) {
    byteArray.writeUint8(FIXEXT2_PREFIX)
    byteArray.writeInt8(type)
    byteArray.writeBuffer(data)
    return
  } else if (byteLength === 4) {
    byteArray.writeUint8(FIXEXT4_PREFIX)
    byteArray.writeInt8(type)
    byteArray.writeBuffer(data)
    return
  } else if (byteLength === 8) {
    byteArray.writeUint8(FIXEXT8_PREFIX)
    byteArray.writeInt8(type)
    byteArray.writeBuffer(data)
    return
  } else if (byteLength === 16) {
    byteArray.writeUint8(FIXEXT16_PREFIX)
    byteArray.writeInt8(type)
    byteArray.writeBuffer(data)
    return
  }

  // ext 8
  if (byteLength < 0xff) {
    byteArray.writeUint8(EXT8_PREFIX)
    byteArray.writeUint8(byteLength)
    byteArray.writeInt8(type)
    byteArray.writeBuffer(data)
    return
  } else if (byteLength < 0xffff) {
    byteArray.writeUint8(EXT16_PREFIX)
    byteArray.writeUint16(byteLength)
    byteArray.writeInt8(type)
    byteArray.writeBuffer(data)
    return
  } else if (byteLength < 0xffffffff) {
    byteArray.writeUint8(EXT32_PREFIX)
    byteArray.writeUint32(byteLength)
    byteArray.writeInt8(type)
    byteArray.writeBuffer(data)
    return
  }

  throw new Error("Ext does not support data exceeding 2**32-1 bytes.")
}