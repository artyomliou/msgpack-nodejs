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
import { remember } from "./uint8-tree.js"
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

// /**
//  * Describe size of array
//  */
// export class ArrayDescriptor {
//   constructor(public size: number) {}
// }

// /**
//  * Describe size of object
//  */
// export class ObjectDescriptor {
//   constructor(public size: number) {}
// }

// /**
//  * Caching ArrayDescriptor
//  */
// const arrayDescPool: Record<number, ArrayDescriptor> = {}

// /**
//  * Caching ObjectDescriptor
//  */
// const objDescPool: Record<number, ObjectDescriptor> = {}

export default function* parseBuffer(buffer: Uint8Array) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  if (debugMode) {
    console.log(
      `buffer length = ${buffer.byteLength}, view length = ${view.byteLength}, view buffer length = ${view.buffer.byteLength}`
    )
  }

  let pos = 0
  let stringNodes: Array<StringNode> = []
  while (pos < view.byteLength) {
    // Get first byte & move pointer for resolving value
    const firstByte = view.getUint8(pos)
    pos++

    if (firstByte >= 0xa0 && firstByte <= 0xbf) {
      const sizeByte = 0
      const dataByte = firstByte - 0xa0
      const node = StringNode.fromRangeSlice(buffer, pos, sizeByte, dataByte)
      yield node
      stringNodes.push(node)
      pos += sizeByte + dataByte
    } else if (firstByte === STR8_PREFIX) {
      const sizeByte = 1
      const dataByte = view.getUint8(pos)
      const node = StringNode.fromRangeSlice(buffer, pos, sizeByte, dataByte)
      yield node
      stringNodes.push(node)
      pos += sizeByte + dataByte
    } else if (firstByte === STR16_PREFIX) {
      const sizeByte = 2
      const dataByte = view.getUint16(pos, false)
      const node = StringNode.fromRangeSlice(buffer, pos, sizeByte, dataByte)
      yield node
      stringNodes.push(node)
      pos += sizeByte + dataByte
    } else if (firstByte === STR32_PREFIX) {
      const sizeByte = 4
      const dataByte = view.getUint32(pos, false)
      const node = StringNode.fromRangeSlice(buffer, pos, sizeByte, dataByte)
      yield node
      stringNodes.push(node)
      pos += sizeByte + dataByte
    } else if (firstByte >= 0x00 && firstByte <= 0x7f) {
      yield new ValueNode(firstByte)
    } else if (firstByte >= 0xe0 && firstByte <= 0xff) {
      yield new ValueNode(view.getInt8(pos - 1))
    } else if (firstByte >= 0x90 && firstByte <= 0x9f) {
      const elementsLeft = firstByte - 0b10010000
      yield new ArrayNode(elementsLeft)
    } else if (firstByte === ARRAY16_PREFIX) {
      const elementsLeft = view.getUint16(pos, false)
      yield new ArrayNode(elementsLeft)
      pos += 2
    } else if (firstByte === ARRAY32_PREFIX) {
      const elementsLeft = view.getUint32(pos, false)
      yield new ArrayNode(elementsLeft)
      pos += 4
    } else if (firstByte >= 0x80 && firstByte <= 0x8f) {
      const elementsLeft = firstByte - 0x80
      yield new MapNode(elementsLeft)
    } else if (firstByte === MAP16_PREFIX) {
      const elementsLeft = view.getUint16(pos, false)
      yield new MapNode(elementsLeft)
      pos += 2
    } else if (firstByte === MAP32_PREFIX) {
      const elementsLeft = view.getUint32(pos, false)
      yield new MapNode(elementsLeft)
      pos += 4
    } else if (firstByte === UINT8_PREFIX) {
      const val = view.getUint8(pos)
      yield new ValueNode(val)
      pos += 1
    } else if (firstByte === UINT16_PREFIX) {
      const val = view.getUint16(pos, false)
      yield new ValueNode(val)
      pos += 2
    } else if (firstByte === UINT32_PREFIX) {
      const val = view.getUint32(pos, false)
      yield new ValueNode(val)
      pos += 4
    } else if (firstByte === UINT64_PREFIX) {
      const val = view.getBigUint64(pos, false)
      yield new ValueNode(val)
      pos += 8
    } else if (firstByte === INT8_PREFIX) {
      const val = view.getInt8(pos)
      yield new ValueNode(val)
      pos += 1
    } else if (firstByte === INT16_PREFIX) {
      const val = view.getInt16(pos, false)
      yield new ValueNode(val)
      pos += 2
    } else if (firstByte === INT32_PREFIX) {
      const val = view.getInt32(pos, false)
      yield new ValueNode(val)
      pos += 4
    } else if (firstByte === INT64_PREFIX) {
      const val = view.getBigInt64(pos, false)
      yield new ValueNode(val)
      pos += 8
    } else if (firstByte === FLOAT32_PREFIX) {
      const val = view.getFloat32(pos, false)
      yield new ValueNode(val)
      pos += 4
    } else if (firstByte === FLOAT64_PREFIX) {
      const val = view.getFloat64(pos, false)
      yield new ValueNode(val)
      pos += 8
    } else if (firstByte === NIL) {
      yield new ValueNode(null)
    } else if (firstByte === BOOL_FALSE) {
      yield new ValueNode(false)
    } else if (firstByte === BOOL_TRUE) {
      yield new ValueNode(true)
    } else if (firstByte === BIN8_PREFIX) {
      const sizeByte = 1
      const dataByte = view.getUint8(pos)
      yield new ValueNode(
        decodeBinWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      )
      pos += sizeByte + dataByte
    } else if (firstByte === BIN16_PREFIX) {
      const sizeByte = 2
      const dataByte = view.getUint16(pos, false)
      yield new ValueNode(
        decodeBinWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      )
      pos += sizeByte + dataByte
    } else if (firstByte === BIN32_PREFIX) {
      const sizeByte = 4
      const dataByte = view.getUint32(pos, false)
      yield new ValueNode(
        decodeBinWithFlexibleSize(buffer, pos, sizeByte, dataByte)
      )
      pos += sizeByte + dataByte
    } else if (firstByte === FIXEXT1_PREFIX) {
      const val = decodeExtWithFlexibleSize(view, buffer, pos, 0, 1)
      yield new ValueNode(val)
      pos += 0 + 1 + 1
    } else if (firstByte === FIXEXT2_PREFIX) {
      const val = decodeExtWithFlexibleSize(view, buffer, pos, 0, 2)
      yield new ValueNode(val)
      pos += 0 + 1 + 2
    } else if (firstByte === FIXEXT4_PREFIX) {
      const val = decodeExtWithFlexibleSize(view, buffer, pos, 0, 4)
      yield new ValueNode(val)
      pos += 0 + 1 + 2
    } else if (firstByte === FIXEXT8_PREFIX) {
      const val = decodeExtWithFlexibleSize(view, buffer, pos, 0, 8)
      yield new ValueNode(val)
      pos += 0 + 1 + 8
    } else if (firstByte === FIXEXT16_PREFIX) {
      const val = decodeExtWithFlexibleSize(view, buffer, pos, 0, 16)
      yield new ValueNode(val)
      pos += 0 + 1 + 16
    } else if (firstByte === EXT8_PREFIX) {
      const sizeByte = 1
      const dataByte = view.getUint8(pos)
      const val = decodeExtWithFlexibleSize(
        view,
        buffer,
        pos,
        sizeByte,
        dataByte
      )
      yield new ValueNode(val)
      pos += sizeByte + 1 + dataByte
    } else if (firstByte === EXT16_PREFIX) {
      const sizeByte = 2
      const dataByte = view.getUint16(pos, false)
      const val = decodeExtWithFlexibleSize(
        view,
        buffer,
        pos,
        sizeByte,
        dataByte
      )
      yield new ValueNode(val)
      pos += sizeByte + 1 + dataByte
    } else if (firstByte === EXT32_PREFIX) {
      const sizeByte = 4
      const dataByte = view.getUint32(pos, false)
      const val = decodeExtWithFlexibleSize(
        view,
        buffer,
        pos,
        sizeByte,
        dataByte
      )
      yield new ValueNode(val)
      pos += sizeByte + 1 + dataByte
    } else {
      const firtByteHex = firstByte.toString(16)
      console.error("Unknown first byte.", firtByteHex)
      throw new Error(`Unknown first byte. (${firtByteHex})`)
    }
  }

  return stringNodes
}

export type AllNode = MapNode | ArrayNode | StringNode | ValueNode

export class MapNode {
  elementsLeft: number
  elements: Array<StringNode> = []
  constructor(public readonly size: number) {
    this.elementsLeft = size
    this.elements = new Array(size)
  }
}

export class ArrayNode {
  elementsLeft: number
  elements: Array<AllNode>
  constructor(public readonly size: number) {
    this.elementsLeft = size
    this.elements = new Array(size)
  }
}

/**
 * Contains any value except string
 */
export class ValueNode {
  constructor(public val: unknown) {}
}

/**
 * String node could be seen as plain value node or a map-key node of map. Buffers in both of them need text-decoding.
 */
export class StringNode {
  /**
   * Must use a fresh copy of buffer, otherwise the buffer being read will be transfer to worker thread, and not readable to main thread.
   */
  constructor(public buf: Uint8Array) {}
  val?: string
  next?: AllNode

  static fromRangeSlice(
    buf: Uint8Array,
    pos: number,
    sizeByte: number,
    dataByte: number
  ) {
    const { start, end } = calculateDataRange(pos, sizeByte, dataByte)
    return new StringNode(buf.subarray(start, end))
  }
}

function decodeBinWithFlexibleSize(
  buffer: Uint8Array,
  pos: number,
  sizeByteLength: number,
  dataByteLength: number
): Uint8Array {
  const binDataRange = calculateDataRange(pos, sizeByteLength, dataByteLength)
  return buffer.subarray(binDataRange.start, binDataRange.end)
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
