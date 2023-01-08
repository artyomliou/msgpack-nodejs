import assert from "assert"
import { utf8Encode } from "../src/encoder/utf8-encode.js"
import { utf8Decode } from "../src/decoder/utf8-decode.js"

// https://zh.wikipedia.org/wiki/%E7%B6%AD%E5%9F%BA%E7%99%BE%E7%A7%91%E6%A8%99%E8%AA%8C
const textCases = [
  "Վ",
  "វិ",
  "উ",
  "वि",
  "ვ",
  "Ω",
  "維",
  "ವಿ",
  "ཝི",
  "ウィ",
  "W",
  "И",
  "ו",
  "வி",
  "ው",
  "و",
  "위",
  "วิ",
  "😋",
]

describe("UTF-8", () => {
  describe("Encode", () => {
    const encoder = new TextEncoder()
    for (const text of textCases) {
      it(text, () => {
        assert.deepEqual(utf8Encode(text), encoder.encode(text))
      })
    }
  })
  describe("Decode", () => {
    const encoder = new TextEncoder()
    for (const text of textCases) {
      it(text, () => {
        assert.deepEqual(utf8Decode(encoder.encode(text)), text)
      })
    }
  })
})
