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
import { LruCache } from "../cache.js"

export interface TypedValueResolverResult {
  /**
   * Total length of bytes. For array/map, this value does not include its elements.
   * Deserializer may use this information to move outside position.
   */
  byteLength: number
  value: DecodeOutput

  isMap?: boolean
  isArray?: boolean
  /** (For array/map) Total count of elements. */
  elementCount?: number
}

export default function TypedValueResolver(
  view: DataView,
  uint8View: Uint8Array,
  pos: number
) {
  // Get first byte & ove pointer for resolving value
  // (Reminder: because of pass by value, increment happening here will not affect the outside one)
  const firstByte = view.getUint8(pos)
  pos++

  if (firstByte >= 0x00 && firstByte <= 0x7f) {
    return decodeFixintPositive(view, pos)
  } else if (firstByte >= 0xe0 && firstByte <= 0xff) {
    return decodeFixintNegative(view, pos)
  } else if (firstByte >= 0xa0 && firstByte <= 0xbf) {
    return decodeStrWithFlexibleSize(uint8View, pos, 0, firstByte - 0xa0)
  } else if (firstByte >= 0x90 && firstByte <= 0x9f) {
    return decodeFixArray(firstByte)
  } else if (firstByte >= 0x80 && firstByte <= 0x8f) {
    return decodeFixMap(firstByte)
  } else if (firstByte === STR8_PREFIX) {
    return decodeStrWithFlexibleSize(uint8View, pos, 1, view.getUint8(pos))
  } else if (firstByte === STR16_PREFIX) {
    return decodeStrWithFlexibleSize(
      uint8View,
      pos,
      2,
      view.getUint16(pos, false)
    )
  } else if (firstByte === STR32_PREFIX) {
    return decodeStrWithFlexibleSize(
      uint8View,
      pos,
      4,
      view.getUint32(pos, false)
    )
  } else if (firstByte === ARRAY16_PREFIX) {
    return decodeArray16(view, pos)
  } else if (firstByte === ARRAY32_PREFIX) {
    return decodeArray32(view, pos)
  } else if (firstByte === MAP16_PREFIX) {
    return decodeMap16(view, pos)
  } else if (firstByte === MAP32_PREFIX) {
    return decodeMap32(view, pos)
  } else if (firstByte === NIL) {
    return decodeNil()
  } else if (firstByte === BOOL_FALSE) {
    return decodeFalse()
  } else if (firstByte === BOOL_TRUE) {
    return decodeTrue()
  } else if (firstByte === UINT8_PREFIX) {
    return decodeUint8(view, pos)
  } else if (firstByte === UINT16_PREFIX) {
    return decodeUint16(view, pos)
  } else if (firstByte === UINT32_PREFIX) {
    return decodeUint32(view, pos)
  } else if (firstByte === UINT64_PREFIX) {
    return decodeUint64(view, pos)
  } else if (firstByte === INT8_PREFIX) {
    return decodeInt8(view, pos)
  } else if (firstByte === INT16_PREFIX) {
    return decodeInt16(view, pos)
  } else if (firstByte === INT32_PREFIX) {
    return decodeInt32(view, pos)
  } else if (firstByte === INT64_PREFIX) {
    return decodeInt64(view, pos)
  } else if (firstByte === FLOAT32_PREFIX) {
    return decodeFloat32(view, pos)
  } else if (firstByte === FLOAT64_PREFIX) {
    return decodeFloat64(view, pos)
  } else if (firstByte === BIN8_PREFIX) {
    return decodeBinWithFlexibleSize(uint8View, pos, 1, view.getUint8(pos))
  } else if (firstByte === BIN16_PREFIX) {
    return decodeBinWithFlexibleSize(
      uint8View,
      pos,
      2,
      view.getUint16(pos, false)
    )
  } else if (firstByte === BIN32_PREFIX) {
    return decodeBinWithFlexibleSize(
      uint8View,
      pos,
      4,
      view.getUint32(pos, false)
    )
  } else if (firstByte === EXT8_PREFIX) {
    return decodeExtWithFlexibleSize(
      view,
      uint8View,
      pos,
      1,
      view.getUint8(pos)
    )
  } else if (firstByte === EXT16_PREFIX) {
    return decodeExtWithFlexibleSize(
      view,
      uint8View,
      pos,
      2,
      view.getUint16(pos, false)
    )
  } else if (firstByte === EXT32_PREFIX) {
    return decodeExtWithFlexibleSize(
      view,
      uint8View,
      pos,
      4,
      view.getUint32(pos, false)
    )
  } else if (firstByte === FIXEXT1_PREFIX) {
    return decodeExtWithFlexibleSize(view, uint8View, pos, 0, 1)
  } else if (firstByte === FIXEXT2_PREFIX) {
    return decodeExtWithFlexibleSize(view, uint8View, pos, 0, 2)
  } else if (firstByte === FIXEXT4_PREFIX) {
    return decodeExtWithFlexibleSize(view, uint8View, pos, 0, 4)
  } else if (firstByte === FIXEXT8_PREFIX) {
    return decodeExtWithFlexibleSize(view, uint8View, pos, 0, 8)
  } else if (firstByte === FIXEXT16_PREFIX) {
    return decodeExtWithFlexibleSize(view, uint8View, pos, 0, 16)
  } else {
    const firtByteHex = firstByte.toString(16)
    console.error("Unknown first byte.", firtByteHex)
    throw new Error(`Unknown first byte. (${firtByteHex})`)
  }
}

function decodeFixintPositive(
  view: DataView,
  pos: number
): TypedValueResolverResult {
  return {
    byteLength: 1,
    value: view.getUint8(pos - 1),
  }
}
function decodeFixintNegative(
  view: DataView,
  pos: number
): TypedValueResolverResult {
  return {
    byteLength: 1,
    value: view.getInt8(pos - 1),
  }
}
function decodeUint8(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 2,
    value: view.getUint8(pos),
  }
}
function decodeUint16(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 3,
    value: view.getUint16(pos, false),
  }
}
function decodeUint32(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 5,
    value: view.getUint32(pos, false),
  }
}
function decodeUint64(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 9,
    value: view.getBigUint64(pos, false),
  }
}
function decodeInt8(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 2,
    value: view.getInt8(pos),
  }
}
function decodeInt16(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 3,
    value: view.getInt16(pos, false),
  }
}
function decodeInt32(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 5,
    value: view.getInt32(pos, false),
  }
}
function decodeInt64(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 9,
    value: view.getBigInt64(pos, false),
  }
}

function decodeNil(): TypedValueResolverResult {
  return {
    byteLength: 1,
    value: null,
  }
}

function decodeTrue(): TypedValueResolverResult {
  return {
    byteLength: 1,
    value: true,
  }
}
function decodeFalse(): TypedValueResolverResult {
  return {
    byteLength: 1,
    value: false,
  }
}

function decodeFloat32(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 5,
    value: view.getFloat32(pos, false),
  }
}

function decodeFloat64(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 9,
    value: view.getFloat64(pos, false),
  }
}

const textDecoder = new TextDecoder()
function decodeStrWithFlexibleSize(
  uint8View: Uint8Array,
  pos: number,
  sizeByteLength: number,
  dataByteLength: number
): TypedValueResolverResult {
  // Calculate total length of this string value, so we can move outside position properly
  const byteLength = 1 + sizeByteLength + dataByteLength

  // Calculate the range
  const strDataRange = calculateDataRange(pos, sizeByteLength, dataByteLength)
  const value = textDecoder.decode(
    uint8View.subarray(strDataRange.start, strDataRange.end)
  )
  return {
    byteLength,
    value,
  }
}

function decodeBinWithFlexibleSize(
  uint8View: Uint8Array,
  pos: number,
  sizeByteLength: number,
  dataByteLength: number
): TypedValueResolverResult {
  const byteLength = 1 + sizeByteLength + dataByteLength
  const binDataRange = calculateDataRange(pos, sizeByteLength, dataByteLength)
  const value = uint8View.subarray(binDataRange.start, binDataRange.end)
  return {
    byteLength,
    value,
  }
}

function decodeFixArray(firstByte: number): TypedValueResolverResult {
  return {
    byteLength: 1,
    value: [],
    isArray: true,
    elementCount: firstByte - 0b10010000,
  }
}

function decodeArray16(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 3,
    value: [],
    isArray: true,
    elementCount: view.getUint16(pos, false),
  }
}

function decodeArray32(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 5,
    value: [],
    isArray: true,
    elementCount: view.getUint32(pos, false),
  }
}

function decodeFixMap(firstByte: number): TypedValueResolverResult {
  return {
    byteLength: 1,
    value: {},
    isMap: true,
    elementCount: firstByte - 0x80,
  }
}

function decodeMap16(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 3,
    value: {},
    isMap: true,
    elementCount: view.getUint16(pos, false),
  }
}

function decodeMap32(view: DataView, pos: number): TypedValueResolverResult {
  return {
    byteLength: 5,
    value: {},
    isMap: true,
    elementCount: view.getUint32(pos, false),
  }
}

function decodeExtWithFlexibleSize(
  view: DataView,
  uint8View: Uint8Array,
  pos: number,
  sizeByteLength: number,
  dataByteLength: number
): TypedValueResolverResult {
  const byteLength = 1 + sizeByteLength + 1 + dataByteLength

  // Reminder: At this point, pos is after firstByte
  const extType = view.getInt8(pos + sizeByteLength)

  // Offset should include "size" and "type"
  const extDataRange = calculateDataRange(
    pos,
    sizeByteLength + 1,
    dataByteLength
  )
  const data = uint8View.subarray(extDataRange.start, extDataRange.end)

  // Postprocess for supported extType
  const ext = getExtension(extType)
  if (typeof ext === "undefined") {
    throw new Error("Does not support unknown ext type.")
  }
  const value = ext.decode(data)
  return {
    byteLength,
    value,
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
