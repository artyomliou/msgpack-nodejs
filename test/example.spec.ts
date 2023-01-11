import { decode, encode } from "../src/index.js"
import assert from "assert"
import example from "./dataset/example.json"
import { lruCacheStat } from "../src/cache.js"
import { bufferAllocatorStat } from "../src/encoder/byte-array.js"
import { uint8TreeStat } from "../src/decoder/uint8-tree.js"

afterAll(() => {
  console.log(lruCacheStat())
  console.log(bufferAllocatorStat())
  console.log(uint8TreeStat())
})

describe("Example", () => {
  it("Example", () => {
    const v = example
    assert.deepStrictEqual(decode(encode(v)), v)
  })
})
