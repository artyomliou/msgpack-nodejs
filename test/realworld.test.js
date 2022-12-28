import { encode, decode } from '../index.js'
import assert from 'assert'
import { readFileSync } from 'fs'

describe('Realworld', () => {
  it('AWS IP Ranges', () => {
    const v = JSON.parse(readFileSync('test/aws-ip-ranges.json'))
    assert.deepStrictEqual(decode(encode(v)), v)
  })
  it('Google Maps Distance Matrix API', () => {
    const v = JSON.parse(readFileSync('test/google-maps-distance-matrix.json'))
    assert.deepStrictEqual(decode(encode(v)), v)
  })
})
