import { decode, encode } from "../src/index.js"
import assert from "assert"
import awsIpRanges from "./dataset/aws-ip-ranges.json"
import googleMapsDistanceMatrix from "./dataset/google-maps-distance-matrix.json"
import { cacheStatistic } from "../src/cache.js"

describe("Realworld", () => {
  it("AWS IP Ranges", () => {
    const v = awsIpRanges
    assert.deepStrictEqual(decode(encode(v)), v)
    console.log(cacheStatistic())
  })
  it("Google Maps Distance Matrix API", () => {
    const v = googleMapsDistanceMatrix
    assert.deepStrictEqual(decode(encode(v)), v)
    console.log(cacheStatistic())
  })
})
