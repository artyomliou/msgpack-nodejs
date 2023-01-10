import { optIn as byteArrayOptIn } from "./encoder/byte-array.js"
import { optIn as encoderOptIn } from "./encoder/encoder.js"
import { optIn as typedValueResolverOptIn } from "./decoder/typed-value-resolver.js"

export function applyOptions(opt: Options) {
  byteArrayOptIn(opt)
  encoderOptIn(opt)
  typedValueResolverOptIn(opt)
}
export type Options = Partial<AvailableOptions>
interface AvailableOptions {
  encoder: {
    mapKeyCache: {
      enabled: boolean
      size: number
    }
    stringCache: {
      enabled: boolean
      size: number
    }
    byteArray: {
      /** Controls the baseline of allocated buffer size */
      base: number
    }
  }
  decoder: {
    /** Cache short string with Uint8Array as key and decoded string as value, may use exponential space complexity */
    shortStringCache: {
      enabled: boolean
      lessThan: number
    }
    jsUtf8Decode: {
      enabled: boolean
      lessThan: number
    }
  }
}
