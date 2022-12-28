import { encode, EncodeStream } from '../index.js'
import testCases from './StreamTestCases.js'
import assert from 'assert'

describe('EncodeStream', () => {
  for (const test of testCases) {
    it(test.title, (done) => {
      const transform = new EncodeStream()
      transform.on('data', (chunk) => {
        try {
          // 2. Expect that written data will be encoded
          assert.deepStrictEqual(chunk, encode(test.args))
        } finally {
          done()
        }
      })

      // 1. Write value into stream
      transform.write(test.args)
    })
  }
})
