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
import { debugMode } from "../constants/debug.js"
import { utf8Decode } from "./utf8-decode.js"
import PrefixTrie from "../prefix-trie.js"
import { Options } from "../options.js"

/**
 * Opt in uint8-tree cache
 */
let shortStringCacheEnabled = true
let shortStringCacheLessThan = 10
let jsUtf8DecodeEnabled = true
let jsUtf8DecodeLessThan = 200
export function optIn(opt: Options) {
  // shortStringCache
  if (typeof opt?.decoder?.shortStringCache?.enabled !== "undefined") {
    shortStringCacheEnabled = opt.decoder.shortStringCache.enabled
  }
  if (typeof opt?.decoder?.shortStringCache?.lessThan !== "undefined") {
    shortStringCacheLessThan = opt.decoder.shortStringCache.lessThan
  }

  // jsUtf8Decode
  if (typeof opt?.decoder?.jsUtf8Decode?.enabled !== "undefined") {
    jsUtf8DecodeEnabled = opt.decoder.jsUtf8Decode.enabled
  }
  if (typeof opt?.decoder?.jsUtf8Decode?.lessThan !== "undefined") {
    jsUtf8DecodeLessThan = opt.decoder.jsUtf8Decode.lessThan
  }
}

/**
 * Prefix trie that always initialized
 */
const trie = new PrefixTrie()

/**
 * Describe size of array
 */
export class ArrayDescriptor {
  constructor(public size: number) {}
}

/**
 * Describe size of object
 */
export class ObjectDescriptor {
  constructor(public size: number) {}
}

/**
 * Caching ArrayDescriptor
 */
const arrayDescPool: Record<number, ArrayDescriptor> = {}

/**
 * Caching ObjectDescriptor
 */
const objDescPool: Record<number, ObjectDescriptor> = {}

export default function* parseBuffer(buffer: Uint8Array) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  if (debugMode) {
    console.log(
      `buffer length = ${buffer.byteLength}, view length = ${view.byteLength}, view buffer length = ${view.buffer.byteLength}`
    )
  }

  let pos = 0
  while (pos < view.byteLength) {
    // Get first byte & move pointer for resolving value
    const firstByte = view.getUint8(pos)
    pos++

    if (firstByte >= 0xa0 && firstByte <= 0xbf) {
      const sizeByte = 0
      const dataByte = firstByte - 0xa0
      yield decodeStrWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      pos += sizeByte + dataByte
    } else if (firstByte === STR8_PREFIX) {
      const sizeByte = 1
      const dataByte = view.getUint8(pos)
      yield decodeStrWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      pos += sizeByte + dataByte
    } else if (firstByte === STR16_PREFIX) {
      const sizeByte = 2
      const dataByte = view.getUint16(pos, false)
      yield decodeStrWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      pos += sizeByte + dataByte
    } else if (firstByte === STR32_PREFIX) {
      const sizeByte = 4
      const dataByte = view.getUint32(pos, false)
      yield decodeStrWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      pos += sizeByte + dataByte
    } else if (firstByte >= 0x00 && firstByte <= 0x7f) {
      yield view.getUint8(pos - 1)
    } else if (firstByte >= 0xe0 && firstByte <= 0xff) {
      yield view.getInt8(pos - 1)
    } else if (firstByte >= 0x90 && firstByte <= 0x9f) {
      const size = firstByte - 0b10010000
      yield size in arrayDescPool
        ? arrayDescPool[size]
        : (arrayDescPool[size] = new ArrayDescriptor(size))
    } else if (firstByte === ARRAY16_PREFIX) {
      const size = view.getUint16(pos, false)
      yield size in arrayDescPool
        ? arrayDescPool[size]
        : (arrayDescPool[size] = new ArrayDescriptor(size))
      pos += 2
    } else if (firstByte === ARRAY32_PREFIX) {
      const size = view.getUint32(pos, false)
      yield size in arrayDescPool
        ? arrayDescPool[size]
        : (arrayDescPool[size] = new ArrayDescriptor(size))
      pos += 4
    } else if (firstByte >= 0x80 && firstByte <= 0x8f) {
      const size = firstByte - 0x80
      yield size in objDescPool
        ? objDescPool[size]
        : (objDescPool[size] = new ObjectDescriptor(size))
    } else if (firstByte === MAP16_PREFIX) {
      const size = view.getUint16(pos, false)
      yield size in objDescPool
        ? objDescPool[size]
        : (objDescPool[size] = new ObjectDescriptor(size))
      pos += 2
    } else if (firstByte === MAP32_PREFIX) {
      const size = view.getUint32(pos, false)
      yield size in objDescPool
        ? objDescPool[size]
        : (objDescPool[size] = new ObjectDescriptor(size))
      pos += 4
    } else if (firstByte === UINT8_PREFIX) {
      yield view.getUint8(pos)
      pos += 1
    } else if (firstByte === UINT16_PREFIX) {
      yield view.getUint16(pos, false)
      pos += 2
    } else if (firstByte === UINT32_PREFIX) {
      yield view.getUint32(pos, false)
      pos += 4
    } else if (firstByte === UINT64_PREFIX) {
      yield view.getBigUint64(pos, false)
      pos += 8
    } else if (firstByte === INT8_PREFIX) {
      yield view.getInt8(pos)
      pos += 1
    } else if (firstByte === INT16_PREFIX) {
      yield view.getInt16(pos, false)
      pos += 2
    } else if (firstByte === INT32_PREFIX) {
      yield view.getInt32(pos, false)
      pos += 4
    } else if (firstByte === INT64_PREFIX) {
      yield view.getBigInt64(pos, false)
      pos += 8
    } else if (firstByte === FLOAT32_PREFIX) {
      yield view.getFloat32(pos, false)
      pos += 4
    } else if (firstByte === FLOAT64_PREFIX) {
      yield view.getFloat64(pos, false)
      pos += 8
    } else if (firstByte === NIL) {
      yield null
    } else if (firstByte === BOOL_FALSE) {
      yield false
    } else if (firstByte === BOOL_TRUE) {
      yield true
    } else if (firstByte === BIN8_PREFIX) {
      const sizeByte = 1
      const dataByte = view.getUint8(pos)
      yield decodeBinWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      pos += sizeByte + dataByte
    } else if (firstByte === BIN16_PREFIX) {
      const sizeByte = 2
      const dataByte = view.getUint16(pos, false)
      yield decodeBinWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      pos += sizeByte + dataByte
    } else if (firstByte === BIN32_PREFIX) {
      const sizeByte = 4
      const dataByte = view.getUint32(pos, false)
      yield decodeBinWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      pos += sizeByte + dataByte
    } else if (firstByte === FIXEXT1_PREFIX) {
      yield decodeExtWithFlexibleSize(view, buffer, pos, 0, 1)
      pos += 0 + 1 + 1
    } else if (firstByte === FIXEXT2_PREFIX) {
      yield decodeExtWithFlexibleSize(view, buffer, pos, 0, 2)
      pos += 0 + 1 + 2
    } else if (firstByte === FIXEXT4_PREFIX) {
      yield decodeExtWithFlexibleSize(view, buffer, pos, 0, 4)
      pos += 0 + 1 + 2
    } else if (firstByte === FIXEXT8_PREFIX) {
      yield decodeExtWithFlexibleSize(view, buffer, pos, 0, 8)
      pos += 0 + 1 + 8
    } else if (firstByte === FIXEXT16_PREFIX) {
      yield decodeExtWithFlexibleSize(view, buffer, pos, 0, 16)
      pos += 0 + 1 + 16
    } else if (firstByte === EXT8_PREFIX) {
      const sizeByte = 1
      const dataByte = view.getUint8(pos)
      yield decodeExtWithFlexibleSize(view, buffer, pos, sizeByte, dataByte)
      pos += sizeByte + 1 + dataByte
    } else if (firstByte === EXT16_PREFIX) {
      const sizeByte = 2
      const dataByte = view.getUint16(pos, false)
      yield decodeExtWithFlexibleSize(view, buffer, pos, sizeByte, dataByte)
      pos += sizeByte + 1 + dataByte
    } else if (firstByte === EXT32_PREFIX) {
      const sizeByte = 4
      const dataByte = view.getUint32(pos, false)
      yield decodeExtWithFlexibleSize(view, buffer, pos, sizeByte, dataByte)
      pos += sizeByte + 1 + dataByte
    } else {
      const firtByteHex = firstByte.toString(16)
      console.error("Unknown first byte.", firtByteHex)
      throw new Error(`Unknown first byte. (${firtByteHex})`)
    }
  }
}

const textDecoder = new TextDecoder()
function decodeStrWithFlexibleSize(
  buffer: Uint8Array,
  pos: number,
  sizeByteLength: number,
  dataByteLength: number
): string {
  const strDataRange = calculateDataRange(pos, sizeByteLength, dataByteLength)
  const buf = buffer.subarray(strDataRange.start, strDataRange.end)
  if (shortStringCacheEnabled && dataByteLength < shortStringCacheLessThan) {
    let result = trie.search(buf)
    if (result) {
      return result
    }
    result = utf8Decode(buf)
    trie.insert(buf, result)
    return result
  } else if (jsUtf8DecodeEnabled && dataByteLength < jsUtf8DecodeLessThan) {
    return utf8Decode(buf)
  } else {
    return textDecoder.decode(buf)
  }
}

function decodeBinWithFlexibleSize(
  uint8View: Uint8Array,
  pos: number,
  sizeByteLength: number,
  dataByteLength: number
): Uint8Array {
  const binDataRange = calculateDataRange(pos, sizeByteLength, dataByteLength)
  return uint8View.subarray(binDataRange.start, binDataRange.end)
}

function decodeExtWithFlexibleSize(
  view: DataView,
  uint8View: Uint8Array,
  pos: number,
  sizeByteLength: number,
  dataByteLength: number
): unknown {
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
  return ext.decode(data)
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
