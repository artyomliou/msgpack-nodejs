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
} from "../constant.js"
import { utf8Decode } from "./utf8-decode.js"
import PrefixTrie from "./prefix-trie.js"
import { Options } from "../options.js"
import { DecodeOutput } from "../types.js"
import StructBuilder from "./struct-builder.js"
import { getExtension } from "../extensions/registry.js"
import SingleValueError from "./single-value-error.js"

export default function msgPackDecode(buffer: Uint8Array): DecodeOutput {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const builder = new StructBuilder()
  try {
    parseBuffer(buffer, view, builder)
    return builder.struct
  } catch (error) {
    return (error as SingleValueError)?.value
  }
}

/**
 * Parse buffer for typed value and insert it into builder directly
 */
function parseBuffer(
  buffer: Uint8Array,
  view: DataView,
  builder: StructBuilder
) {
  // Possiblly used variables
  let sizeByte: number
  let dataByte: number
  let size: number
  let bigint: bigint

  // Iteration
  let pos = 0
  READ_NEXT: while (pos < view.byteLength) {
    // Get first byte & move pointer for resolving value
    const firstByte = view.getUint8(pos)
    pos++

    // String, array, map, uint, int
    if (firstByte >= 0xa0 && firstByte <= 0xbf) {
      dataByte = firstByte - 0xa0
      builder.insertValue(
        decodeStrWithFlexibleSize(buffer.subarray(pos + 0, pos + 0 + dataByte))
      )
      pos += 0 + dataByte
      continue READ_NEXT
    } else if (firstByte >= 0x90 && firstByte <= 0x9f) {
      size = firstByte - 0b10010000
      builder.newStruct(new Array(size), size)
      continue READ_NEXT
    } else if (firstByte >= 0x80 && firstByte <= 0x8f) {
      builder.newStruct({}, firstByte - 0x80)
      continue READ_NEXT
    } else if (firstByte >= 0x00 && firstByte <= 0x7f) {
      builder.insertValue(firstByte)
      continue READ_NEXT
    } else if (firstByte >= 0xe0 && firstByte <= 0xff) {
      builder.insertValue(view.getInt8(pos - 1))
      continue READ_NEXT
    }

    // String, array, map, uint, int, float, null, bool, bin, ext
    switch (firstByte) {
      case STR8_PREFIX:
        dataByte = view.getUint8(pos)
        builder.insertValue(
          decodeStrWithFlexibleSize(
            buffer.subarray(pos + 1, pos + 1 + dataByte)
          )
        )
        pos += 1 + dataByte
        continue READ_NEXT

      case STR16_PREFIX:
        dataByte = view.getUint16(pos, false)
        builder.insertValue(
          decodeStrWithFlexibleSize(
            buffer.subarray(pos + 2, pos + 2 + dataByte)
          )
        )
        pos += 2 + dataByte
        continue READ_NEXT

      case STR32_PREFIX:
        dataByte = view.getUint32(pos, false)
        builder.insertValue(
          decodeStrWithFlexibleSize(
            buffer.subarray(pos + 4, pos + 4 + dataByte)
          )
        )
        pos += 4 + dataByte
        continue READ_NEXT

      case ARRAY16_PREFIX:
        size = view.getUint16(pos, false)
        builder.newStruct(new Array(size), size)
        pos += 2
        continue READ_NEXT

      case ARRAY32_PREFIX:
        size = view.getUint32(pos, false)
        builder.newStruct(new Array(size), size)
        pos += 4
        continue READ_NEXT

      case MAP16_PREFIX:
        size = view.getUint16(pos, false)
        builder.newStruct({}, size)
        pos += 2
        continue READ_NEXT

      case MAP32_PREFIX:
        size = view.getUint32(pos, false)
        builder.newStruct({}, size)
        pos += 4
        continue READ_NEXT

      case UINT8_PREFIX:
        builder.insertValue(view.getUint8(pos))
        pos += 1
        continue READ_NEXT

      case UINT16_PREFIX:
        builder.insertValue(view.getUint16(pos, false))
        pos += 2
        continue READ_NEXT

      case UINT32_PREFIX:
        builder.insertValue(view.getUint32(pos, false))
        pos += 4
        continue READ_NEXT

      case UINT64_PREFIX:
        bigint = view.getBigUint64(pos, false)
        builder.insertValue(bigint >> 53n > 0 ? bigint : Number(bigint))
        pos += 8
        continue READ_NEXT

      case INT8_PREFIX:
        builder.insertValue(view.getInt8(pos))
        pos += 1
        continue READ_NEXT

      case INT16_PREFIX:
        builder.insertValue(view.getInt16(pos, false))
        pos += 2
        continue READ_NEXT

      case INT32_PREFIX:
        builder.insertValue(view.getInt32(pos, false))
        pos += 4
        continue READ_NEXT

      case INT64_PREFIX:
        bigint = view.getBigInt64(pos, false)
        builder.insertValue(-bigint >> 53n > 0 ? bigint : Number(bigint))
        pos += 8
        continue READ_NEXT

      case FLOAT32_PREFIX:
        builder.insertValue(view.getFloat32(pos, false))
        pos += 4
        continue READ_NEXT

      case FLOAT64_PREFIX:
        builder.insertValue(view.getFloat64(pos, false))
        pos += 8
        continue READ_NEXT

      case NIL:
        builder.insertValue(null)
        continue READ_NEXT

      case BOOL_FALSE:
        builder.insertValue(false)
        continue READ_NEXT

      case BOOL_TRUE:
        builder.insertValue(true)
        continue READ_NEXT

      case BIN8_PREFIX:
        dataByte = view.getUint8(pos)
        builder.insertValue(buffer.subarray(pos + 1, pos + 1 + dataByte))
        pos += 1 + dataByte
        continue READ_NEXT

      case BIN16_PREFIX:
        dataByte = view.getUint16(pos, false)
        builder.insertValue(buffer.subarray(pos + 2, pos + 2 + dataByte))
        pos += 2 + dataByte
        continue READ_NEXT

      case BIN32_PREFIX:
        dataByte = view.getUint32(pos, false)
        builder.insertValue(buffer.subarray(pos + 4, pos + 4 + dataByte))
        pos += 4 + dataByte
        continue READ_NEXT

      case FIXEXT1_PREFIX:
        builder.insertValue(decodeExtWithFlexibleSize(buffer, view, pos, 0, 1))
        pos += 0 + 1 + 1
        continue READ_NEXT

      case FIXEXT2_PREFIX:
        builder.insertValue(decodeExtWithFlexibleSize(buffer, view, pos, 0, 2))
        pos += 0 + 1 + 2
        continue READ_NEXT

      case FIXEXT4_PREFIX:
        builder.insertValue(decodeExtWithFlexibleSize(buffer, view, pos, 0, 4))
        pos += 0 + 1 + 4
        continue READ_NEXT

      case FIXEXT8_PREFIX:
        builder.insertValue(decodeExtWithFlexibleSize(buffer, view, pos, 0, 8))
        pos += 0 + 1 + 8
        continue READ_NEXT

      case FIXEXT16_PREFIX:
        builder.insertValue(decodeExtWithFlexibleSize(buffer, view, pos, 0, 16))
        pos += 0 + 1 + 16
        continue READ_NEXT

      case EXT8_PREFIX:
        sizeByte = 1
        dataByte = view.getUint8(pos)
        builder.insertValue(
          decodeExtWithFlexibleSize(buffer, view, pos, sizeByte, dataByte)
        )
        pos += sizeByte + 1 + dataByte
        continue READ_NEXT

      case EXT16_PREFIX:
        sizeByte = 2
        dataByte = view.getUint16(pos, false)
        builder.insertValue(
          decodeExtWithFlexibleSize(buffer, view, pos, sizeByte, dataByte)
        )
        pos += sizeByte + 1 + dataByte
        continue READ_NEXT

      case EXT32_PREFIX:
        sizeByte = 4
        dataByte = view.getUint32(pos, false)
        builder.insertValue(
          decodeExtWithFlexibleSize(buffer, view, pos, sizeByte, dataByte)
        )
        pos += sizeByte + 1 + dataByte
        continue READ_NEXT
    }

    const firtByteHex = firstByte.toString(16)
    console.error("Unknown first byte.", firtByteHex)
    throw new Error(`Unknown first byte. (${firtByteHex})`)
  }
}

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

const trie = new PrefixTrie("Short key trie")
const textDecoder = new TextDecoder()

function decodeStrWithFlexibleSize(strBuf: Uint8Array): string {
  if (shortStringCacheEnabled && strBuf.byteLength < shortStringCacheLessThan) {
    let result = trie.search(strBuf)
    if (result) {
      return result
    }
    result = utf8Decode(strBuf)
    trie.insert(strBuf, result)
    return result
  } else if (jsUtf8DecodeEnabled && strBuf.byteLength < jsUtf8DecodeLessThan) {
    return utf8Decode(strBuf)
  } else {
    return textDecoder.decode(strBuf)
  }
}

// Extension decoding
function decodeExtWithFlexibleSize(
  buffer: Uint8Array,
  view: DataView,
  pos: number,
  sizeByte: number,
  dataByte: number
): unknown {
  const ext = getExtension(view.getInt8(pos + sizeByte))
  if (!ext) {
    throw new Error("Does not support unknown ext type.")
  }
  const typeByte = 1
  return ext.decode(
    buffer.subarray(
      pos + sizeByte + typeByte,
      pos + sizeByte + typeByte + dataByte
    )
  )
}
