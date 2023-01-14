import { decode, encode } from "../src/index.js"
import assert from "assert"
import awsIpRanges from "./dataset/aws-ip-ranges.json"
import googleMapsDistanceMatrix from "./dataset/google-maps-distance-matrix.json"
import { lruCacheStat } from "../src/encoder/lru-cache.js"
import { bufferAllocatorStat } from "../src/encoder/byte-array.js"
import { prefixTrieStat } from "../src/decoder/prefix-trie.js"
import { stringBufferStat } from "../src/encoder/string-buffer.js"

afterAll(() => {
  console.log(lruCacheStat())
  console.log(bufferAllocatorStat())
  console.log(prefixTrieStat())
  console.log(stringBufferStat())
})

describe("Realworld", () => {
  it("AWS IP Ranges", () => {
    const v = awsIpRanges
    assert.deepStrictEqual(decode(encode(v)), v)
  })
  it("Google Maps Distance Matrix API", () => {
    const v = googleMapsDistanceMatrix
    assert.deepStrictEqual(decode(encode(v)), v)
  })
})
