import { DecodeStream, encode } from "../src/index.js"
import testCases from "./dataset/stream-test-cases.js"
import assert from "assert"
import { DecodeStreamOutput } from "../src/types.js"

describe("DecodeStream", () => {
  for (const test of testCases) {
    it(test.title, (done) => {
      const transform = new DecodeStream()
      transform.on("data", (chunk: DecodeStreamOutput) => {
        try {
          // 2. Expect that written data will be decoded
          assert.deepStrictEqual(chunk, test?.expected || test.args)
        } finally {
          done()
        }
      })

      // 1. Write encoded data (Buffer) into stream
      transform.write(Buffer.from(encode(test.args)))
    })
  }
})