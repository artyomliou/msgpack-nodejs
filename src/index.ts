export { default as encode } from "./encoder/encoder.js"
export { default as decode } from "./decoder/decoder.js"
export { default as EncodeStream } from "./streams/encode-stream.js"
export { default as DecodeStream } from "./streams/decode-stream.js"
export { CustomExtension } from "./extensions/interface.js"
export { registerExtension } from "./extensions/registry.js"
export { applyOptions } from "./options.js"
export { lruCacheStat } from "./encoder/lru-cache.js"
export { bufferAllocatorStat } from "./encoder/byte-array.js"
export { prefixTrieStat } from "./decoder/prefix-trie.js"
