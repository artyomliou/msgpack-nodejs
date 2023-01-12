import { encode, EncodeStream } from "../src/index.js"
import testCases from "./dataset/stream.js"
import assert from "assert"
import { EncodeStreamOutput } from "../src/types.js"

describe("EncodeStream", () => {
  for (const test of testCases) {
    it(test.title, (done) => {
      const transform = new EncodeStream()
      transform.on("data", (chunk: EncodeStreamOutput) => {
        try {
          // 2. Expect both side are identical
          assert.deepStrictEqual(chunk, Buffer.from(encode(test.data)))
        } finally {
          done()
        }
      })

      // 1. Write value into stream
      transform.write(test.data)
    })
  }
})
