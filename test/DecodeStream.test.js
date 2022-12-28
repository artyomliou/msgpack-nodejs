import { encode, DecodeStream } from '../index.js'
import testCases from './StreamTestCases.js'
import assert from 'assert'

describe('DecodeStream', () => {
  for (const test of testCases) {
    it(test.title, (done) => {
      const transform = new DecodeStream()
      transform.on('data', (chunk) => {
        try {
          // 2. Expect that written data will be decoded
          assert.deepStrictEqual(chunk, test.args)
        } finally {
          done()
        }
      })

      // 1. Write encoded data (Buffer) into stream
      transform.write(encode(test.args))
    })
  }
})
