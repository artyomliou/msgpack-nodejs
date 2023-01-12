import { encode } from "../src/index.js"
import testCases from "./dataset/encoder-decoder.js"
import assert from "assert"

describe("Encoder", () => {
  for (const test of testCases.filter(
    (testCase) => !testCase.encoderWillIgnore
  )) {
    it(test.title, () => {
      for (const datum of test.data) {
        assert.deepStrictEqual(encode(datum.value), datum.encoded)
      }
    })
  }
})
