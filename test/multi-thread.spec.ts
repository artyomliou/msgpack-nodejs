import { encode } from "../src/index.js"
import { msgPackDecodeAsync } from "../src/decoder/decoder.js"
import assert from "assert"
import aws from "./dataset/aws-ip-ranges.json"

describe("Multi-thread basic", () => {
  it("different key order in map", () => {
    assert.deepEqual({ foo: 1, bar: 2 }, { bar: 2, foo: 1 })
  })
})

describe("Async decoder", () => {
  it("aws-ip-ranges", async () => {
    const v = aws
    const decoded = await msgPackDecodeAsync(encode(v))
    assert.deepStrictEqual(decoded, v)
  })
})
