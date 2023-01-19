import ByteArray from "./byte-array.js"
import {
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
import { LruCache } from "./lru-cache.js"
import { stringBuffer } from "./string-buffer.js"

export function encodeInteger(byteArray: ByteArray, number: number): void {
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

export function encodeBigint(byteArray: ByteArray, bigint: bigint): void {
  if (bigint > 0) {
    byteArray.writeUint8(UINT64_PREFIX)
    byteArray.writeUint64(bigint)
  } else {
    byteArray.writeUint8(INT64_PREFIX)
    byteArray.writeInt64(bigint)
  }
}

export function encodeFloat(byteArray: ByteArray, number: number): void {
  // Since all float in Javascript is double, it's not possible to have FLOAT32 type.
  byteArray.writeUint8(FLOAT64_PREFIX)
  byteArray.writeFloat64(number)
}

export function encodeStringFactory(
  cacheEnabled: boolean,
  cache: LruCache<string>
) {
  return function encodeStringClosure(byteArray: ByteArray, string: string) {
    // If cache is enabled and hit, the cost of encoding, copying between buffer can be save
    if (cacheEnabled) {
      const buffer = cache.get(string)
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
    if (cacheEnabled) {
      cache.set(
        string,
        byteArray.subarrayBackward(headerBytes + encoded.byteLength)
      )
    }
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

export function encodeBin(byteArray: ByteArray, buffer: Uint8Array): void {
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

export function encodeArray(byteArray: ByteArray, arraySize: number): void {
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

export function encodeMap(byteArray: ByteArray, mapSize: number): void {
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

export function encodeExt(
  byteArray: ByteArray,
  type: number,
  data: Uint8Array
): void {
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
