import { decode, encode } from "../src/index.js"
import assert from "assert"
import awsIpRanges from "./dataset/aws-ip-ranges.json"
import googleMapsDistanceMatrix from "./dataset/google-maps-distance-matrix.json"

describe("Realworld", () => {
  it("AWS IP Ranges", () => {
    const v = awsIpRanges
    assert.deepStrictEqual(decode(encode(v)), v)
  })
  it("Google Maps Distance Matrix API", () => {
    const v = googleMapsDistanceMatrix
    assert.deepStrictEqual(decode(encode(v)), v)
  })
})
