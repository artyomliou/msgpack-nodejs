import { decode } from "../src/index.js"
import testCases from "./dataset/encoder-decoder.js"
import assert from "assert"

describe("Decoder", () => {
  for (const test of testCases) {
    it(test.title, () => {
      for (const datum of test.data) {
        assert.deepStrictEqual(decode(datum.encoded), datum.value)
      }
    })
  }
})
