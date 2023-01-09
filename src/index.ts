import { applyOptions } from "./encoder/encoder.js"
applyOptions({
  useStringCache: true,
  useMapKeyCache: true,
})

export { default as encode, applyOptions } from "./encoder/encoder.js"
export { default as decode } from "./decoder/decoder.js"
export { default as EncodeStream } from "./streams/encode-stream.js"
export { default as DecodeStream } from "./streams/decode-stream.js"
export { CustomExtension } from "./extensions/interface.js"
export { registerExtension } from "./extensions/registry.js"
export { cacheStatistic } from "./cache.js"
export * from "./constants/debug.js"
