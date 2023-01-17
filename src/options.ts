import { applyOptions as byteArrayApplyOptions } from "./encoder/byte-array.js"
import { applyOptions as encoderApplyOptions } from "./encoder/encoder.js"
import { applyOptions as decoderApplyOptions } from "./decoder/decoder-fns.js"

const opt = {
  encoder: {
    mapKeyCache: {
      enabled: true,
      size: 30,
    },
    stringCache: {
      enabled: true,
      size: 200,
    },
    byteArray: {
      /** Controls the baseline of allocated buffer size */
      base: 1024,
    },
  },
  decoder: {
    /** Cache short string with Uint8Array as key and decoded string as value, may use exponential space complexity */
    shortStringCache: {
      enabled: true,
      lessThan: 10,
    },
    jsUtf8Decode: {
      enabled: true,
      lessThan: 200,
    },
  },
}

export type Options = typeof opt
export function applyOptions(newOpt: Partial<Options>) {
  opt.encoder.mapKeyCache = Object.assign(
    opt.encoder.mapKeyCache,
    newOpt?.encoder?.mapKeyCache
  )
  opt.encoder.stringCache = Object.assign(
    opt.encoder.stringCache,
    newOpt?.encoder?.stringCache
  )
  opt.encoder.byteArray = Object.assign(
    opt.encoder.byteArray,
    newOpt?.encoder?.byteArray
  )
  opt.decoder.shortStringCache = Object.assign(
    opt.decoder.shortStringCache,
    newOpt?.decoder?.shortStringCache
  )
  opt.decoder.jsUtf8Decode = Object.assign(
    opt.decoder.jsUtf8Decode,
    newOpt?.decoder?.jsUtf8Decode
  )
  byteArrayApplyOptions(opt)
  encoderApplyOptions(opt)
  decoderApplyOptions(opt)
}
