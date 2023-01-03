import { getExtension } from "../extensions/registry.js"
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
  FLOAT32_PREFIX,
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
import { DecodeOutput } from "../types.js"

export default class TypedValueResolver {
  isMap = false
  isArray = false
  value: DecodeOutput = null

  /**
   * Total length of bytes. For array/map, this value does not include its elements.
   * Deserializer may use this information to move outside position.
   */
  byteLength = 0

  /**
   * (For array/map) Total count of elements.
   */
  elementCount = 0

  constructor(protected view: DataView, protected pos: number) {
    // Get first byte & ove pointer for resolving value
    // (Reminder: because of pass by value, increment happening here will not affect the outside one)
    const firstByte = this.view.getUint8(this.pos)
    this.pos++

    // Match first byte with prefixes
    const decoder = firstByteDecoder.get(firstByte)
    if (typeof decoder !== "undefined") {
      decoder.call(this)
      return
    }

    // Match first byte for these single byte data (fix-)
    if (firstByte >= 0x00 && firstByte <= 0x7f) {
      decodeFixintPositive.call(this)
    } else if (firstByte >= 0xe0 && firstByte <= 0xff) {
      decodeFixintNegative.call(this)
    } else if (firstByte >= 0xa0 && firstByte <= 0xbf) {
      decodeFixStr.call(this, firstByte)
    } else if (firstByte >= 0x90 && firstByte <= 0x9f) {
      decodeFixArray.call(this, firstByte)
    } else if (firstByte >= 0x80 && firstByte <= 0x8f) {
      decodeFixMap.call(this, firstByte)
    } else {
      const firtByteHex = firstByte.toString(16)
      console.error("Unknown first byte.", firtByteHex)
      throw new Error(`Unknown first byte. (${firtByteHex})`)
    }
  }
}

type NonFixDecoder = (this: TypedValueResolver) => void
const firstByteDecoder: Map<number, NonFixDecoder> = new Map([
  [UINT8_PREFIX, decodeUint8],
  [UINT16_PREFIX, decodeUint16],
  [UINT32_PREFIX, decodeUint32],
  [UINT64_PREFIX, decodeUint64],
  [INT8_PREFIX, decodeInt8],
  [INT16_PREFIX, decodeInt16],
  [INT32_PREFIX, decodeInt32],
  [INT64_PREFIX, decodeInt64],
  [NIL, decodeNil],
  [BOOL_FALSE, decodeFalse],
  [BOOL_TRUE, decodeTrue],
  [FLOAT32_PREFIX, decodeFloat32],
  [FLOAT64_PREFIX, decodeFloat64],
  [STR8_PREFIX, decodeStr8],
  [STR16_PREFIX, decodeStr16],
  [STR32_PREFIX, decodeStr32],
  [BIN8_PREFIX, decodeBin8],
  [BIN16_PREFIX, decodeBin16],
  [BIN32_PREFIX, decodeBin32],
  [ARRAY16_PREFIX, decodeArray16],
  [ARRAY32_PREFIX, decodeArray32],
  [MAP16_PREFIX, decodeMap16],
  [MAP32_PREFIX, decodeMap32],
  [EXT8_PREFIX, decodeExt8],
  [EXT16_PREFIX, decodeExt16],
  [EXT32_PREFIX, decodeExt32],
  [FIXEXT1_PREFIX, decodeFixExt1],
  [FIXEXT2_PREFIX, decodeFixExt2],
  [FIXEXT4_PREFIX, decodeFixExt4],
  [FIXEXT8_PREFIX, decodeFixExt8],
  [FIXEXT16_PREFIX, decodeFixExt16],
])

function decodeFixintPositive(this: TypedValueResolver) {
  this.byteLength = 1
  this.value = this.view.getUint8(this.pos - 1)
}
function decodeFixintNegative(this: TypedValueResolver) {
  this.byteLength = 1
  this.value = this.view.getInt8(this.pos - 1)
}
function decodeUint8(this: TypedValueResolver) {
  this.byteLength = 2
  this.value = this.view.getUint8(this.pos)
}
function decodeUint16(this: TypedValueResolver) {
  this.byteLength = 3
  this.value = this.view.getUint16(this.pos, false)
}
function decodeUint32(this: TypedValueResolver) {
  this.byteLength = 5
  this.value = this.view.getUint32(this.pos, false)
}
function decodeUint64(this: TypedValueResolver) {
  this.byteLength = 9
  this.value = this.view.getBigUint64(this.pos, false)
}
function decodeInt8(this: TypedValueResolver) {
  this.byteLength = 2
  this.value = this.view.getInt8(this.pos)
}
function decodeInt16(this: TypedValueResolver) {
  this.byteLength = 3
  this.value = this.view.getInt16(this.pos, false)
}
function decodeInt32(this: TypedValueResolver) {
  this.byteLength = 5
  this.value = this.view.getInt32(this.pos, false)
}
function decodeInt64(this: TypedValueResolver) {
  this.byteLength = 9
  this.value = this.view.getBigInt64(this.pos, false)
}

function decodeNil(this: TypedValueResolver): void {
  this.byteLength = 1
  this.value = null
}

function decodeTrue(this: TypedValueResolver): void {
  this.byteLength = 1
  this.value = true
}
function decodeFalse(this: TypedValueResolver): void {
  this.byteLength = 1
  this.value = false
}

function decodeFloat32(this: TypedValueResolver): void {
  this.byteLength = 5
  this.value = this.view.getFloat32(this.pos, false)
}

function decodeFloat64(this: TypedValueResolver): void {
  this.byteLength = 9
  this.value = this.view.getFloat64(this.pos, false)
}

function decodeFixStr(this: TypedValueResolver, firstByte: number): void {
  decodeStrWithFlexibleSize.call(this, 0, firstByte - 0xa0)
}

function decodeStr8(this: TypedValueResolver): void {
  decodeStrWithFlexibleSize.call(this, 1, this.view.getUint8(this.pos))
}

function decodeStr16(this: TypedValueResolver): void {
  decodeStrWithFlexibleSize.call(this, 2, this.view.getUint16(this.pos, false))
}

function decodeStr32(this: TypedValueResolver): void {
  decodeStrWithFlexibleSize.call(this, 4, this.view.getUint32(this.pos, false))
}

function decodeStrWithFlexibleSize(
  this: TypedValueResolver,
  sizeByteLength: number,
  dataByteLength: number
): void {
  // Calculate total length of this string value, so we can move outside position properly
  this.byteLength = 1 + sizeByteLength + dataByteLength

  // Calculate the range
  const strDataRange = calculateDataRange(
    this.pos,
    sizeByteLength,
    dataByteLength
  )
  this.value = new TextDecoder().decode(
    this.view.buffer.slice(strDataRange.start, strDataRange.end)
  )
}

function decodeBin8(this: TypedValueResolver): void {
  decodeBinWithFlexibleSize.call(this, 1, this.view.getUint8(this.pos))
}

function decodeBin16(this: TypedValueResolver): void {
  decodeBinWithFlexibleSize.call(this, 2, this.view.getUint16(this.pos, false))
}

function decodeBin32(this: TypedValueResolver): void {
  decodeBinWithFlexibleSize.call(this, 4, this.view.getUint32(this.pos, false))
}

function decodeBinWithFlexibleSize(
  this: TypedValueResolver,
  sizeByteLength: number,
  dataByteLength: number
): void {
  this.byteLength = 1 + sizeByteLength + dataByteLength
  const binDataRange = calculateDataRange(
    this.pos,
    sizeByteLength,
    dataByteLength
  )
  this.value = new Uint8Array(
    this.view.buffer.slice(binDataRange.start, binDataRange.end)
  )
}

function decodeFixArray(this: TypedValueResolver, firstByte: number): void {
  this.isArray = true
  this.value = []
  this.byteLength = 1
  this.elementCount = firstByte - 0b10010000
}

function decodeArray16(this: TypedValueResolver): void {
  this.isArray = true
  this.value = []
  this.byteLength = 3
  this.elementCount = this.view.getUint16(this.pos, false)
}

function decodeArray32(this: TypedValueResolver): void {
  this.isArray = true
  this.value = []
  this.byteLength = 5
  this.elementCount = this.view.getUint32(this.pos, false)
}

function decodeFixMap(this: TypedValueResolver, firstByte: number): void {
  this.isMap = true
  this.value = {}
  this.byteLength = 1
  this.elementCount = firstByte - 0x80
}

function decodeMap16(this: TypedValueResolver): void {
  this.isMap = true
  this.value = {}
  this.byteLength = 3
  this.elementCount = this.view.getUint16(this.pos, false)
}

function decodeMap32(this: TypedValueResolver): void {
  this.isMap = true
  this.value = {}
  this.byteLength = 5
  this.elementCount = this.view.getUint32(this.pos, false)
}

function decodeFixExt1(this: TypedValueResolver): void {
  decodeExtWithFlexibleSize.call(this, 0, 1)
}
function decodeFixExt2(this: TypedValueResolver): void {
  decodeExtWithFlexibleSize.call(this, 0, 2)
}
function decodeFixExt4(this: TypedValueResolver): void {
  decodeExtWithFlexibleSize.call(this, 0, 4)
}
function decodeFixExt8(this: TypedValueResolver): void {
  decodeExtWithFlexibleSize.call(this, 0, 8)
}
function decodeFixExt16(this: TypedValueResolver): void {
  decodeExtWithFlexibleSize.call(this, 0, 16)
}
function decodeExt8(this: TypedValueResolver): void {
  decodeExtWithFlexibleSize.call(this, 1, this.view.getUint8(this.pos))
}
function decodeExt16(this: TypedValueResolver): void {
  decodeExtWithFlexibleSize.call(this, 2, this.view.getUint16(this.pos, false))
}
function decodeExt32(this: TypedValueResolver): void {
  decodeExtWithFlexibleSize.call(this, 4, this.view.getUint32(this.pos, false))
}

function decodeExtWithFlexibleSize(
  this: TypedValueResolver,
  sizeByteLength: number,
  dataByteLength: number
): void {
  this.byteLength = 1 + sizeByteLength + 1 + dataByteLength

  // Reminder: At this point, pos is after firstByte
  const extType = this.view.getInt8(this.pos + sizeByteLength)

  // Offset should include "size" and "type"
  const extDataRange = calculateDataRange(
    this.pos,
    sizeByteLength + 1,
    dataByteLength
  )
  const data = this.view.buffer.slice(extDataRange.start, extDataRange.end)

  // Postprocess for supported extType
  const ext = getExtension(extType)
  if (typeof ext === "undefined") {
    throw new Error("Does not support unknown ext type.")
  } else {
    this.value = ext.decode(new Uint8Array(data))
  }
}

function calculateDataRange(
  pos: number,
  offset = 0,
  dataByteLength = 0
): { start: number; end: number } {
  return {
    start: pos + offset, // inclusive
    end: pos + offset + dataByteLength, // exclusive
  }
}
