export { default as encode } from "./encoder/encoder.js"
export { default as decode } from "./decoder/decoder.js"
export { default as EncodeStream } from "./streams/encode-stream.js"
export { default as DecodeStream } from "./streams/decode-stream.js"
export { CustomExtension } from "./extensions/interface.js"
export { registerExtension } from "./extensions/registry.js"
export { applyOptions } from "./options.js"
export { lruCacheStat } from "./cache.js"
export { bufferAllocatorStat } from "./encoder/byte-array.js"
export { prefixTrieStat } from "./prefix-trie.js"
export * from "./constants/debug.js"
