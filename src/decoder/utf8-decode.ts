/**
 * Decode UTF-8 bytes to code point
 * Inspired by https://appspector.com/blog/how-to-improve-messagepack-javascript-parsing-speed-by-2-6-times
 * Follow instruction by https://zh.wikipedia.org/wiki/UTF-8#UTF-8%E7%9A%84%E7%B7%A8%E7%A2%BC%E6%96%B9%E5%BC%8F
 */
export function utf8Decode(bytes: Uint8Array): string {
  let offset = 0
  const end = bytes.byteLength
  const out: Array<number> = []
  while (offset < end) {
    const firstByte = bytes[offset++]
    if ((firstByte & 0b10000000) === 0) {
      // Byte 1
      out.push(firstByte)
      continue
    }

    let firstByteMask = 0
    let sixBitsPadding = 0
    if ((firstByte & 0b11100000) === 0b11000000) {
      // Byte 2
      firstByteMask = 0b00011111
      sixBitsPadding = 1
    } else if ((firstByte & 0b11110000) === 0b11100000) {
      // Byte 3
      firstByteMask = 0b00001111
      sixBitsPadding = 2
    } else if ((firstByte & 0b11111000) === 0b11110000) {
      // Byte 4
      firstByteMask = 0b00000111
      sixBitsPadding = 3
    } else if ((firstByte & 0b11111100) === 0b11111000) {
      // Byte 5
      firstByteMask = 0b00000011
      sixBitsPadding = 4
    } else if ((firstByte & 0b11111110) === 0b11111100) {
      // Byte 6
      firstByteMask = 0b00000001
      sixBitsPadding = 5
    }
    let sum = firstByte & firstByteMask
    while (sixBitsPadding > 0) {
      sum = (sum << 6) | (bytes[offset++] & 0b00111111)
      sixBitsPadding--
    }
    out.push(sum)
  }

  return String.fromCodePoint(...out)
}
