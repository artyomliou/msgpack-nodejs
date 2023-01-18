import ByteArray from "./byte-array.js"
import { NIL, BOOL_FALSE, BOOL_TRUE } from "../constant.js"
import { EncodableValue } from "../types.js"
import { getExtension } from "../extensions/registry.js"
import { Options } from "../options.js"
import {
  encodeInteger,
  encodeFloat,
  encodeArray,
  encodeMap,
  encodeBigint,
  encodeBin,
  encodeExt,
  encodeStringFactory,
} from "./encoder-fns.js"
import { LruCache } from "./lru-cache.js"

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

/**
 * Recursive function to encode every value inside object/array
 */
function match(byteArray: ByteArray, val: EncodableValue): void {
  if (typeof val === "string") {
    encodeString(byteArray, val)
  } else if (typeof val === "number") {
    if (Number.isInteger(val)) {
      encodeInteger(byteArray, val)
    } else {
      encodeFloat(byteArray, val)
    }
  } else if (typeof val === "boolean") {
    if (val) {
      byteArray.writeUint8(BOOL_TRUE)
    } else {
      byteArray.writeUint8(BOOL_FALSE)
    }
  } else if (typeof val === "bigint") {
    encodeBigint(byteArray, val)
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

/**
 * string encoding & caching
 */
const mapKeyCache = new LruCache<string>("Map-key LruCache", 30)
const stringCache = new LruCache<string>("String LruCache", 100)
let encodeMapKey = encodeStringFactory(true, mapKeyCache)
let encodeString = encodeStringFactory(true, stringCache)

export function applyOptions(opt: Options) {
  // mapkeyCache
  encodeMapKey = encodeStringFactory(
    opt.encoder.mapKeyCache.enabled,
    mapKeyCache
  )
  mapKeyCache.sizeLimit = opt.encoder.mapKeyCache.size

  // stringCache
  encodeString = encodeStringFactory(
    opt.encoder.stringCache.enabled,
    stringCache
  )
  stringCache.sizeLimit = opt.encoder.stringCache.size
}
