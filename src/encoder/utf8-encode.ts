/**
 * My UTF-8 encoding implementation
 * Follow instruction by https://zh.wikipedia.org/wiki/UTF-8#UTF-8%E7%9A%84%E7%B7%A8%E7%A2%BC%E6%96%B9%E5%BC%8F
 */
export function utf8Encode(str: string): Uint8Array {
  const out: Array<number> = []

  const mask = 0b00111111
  const prefix = 0x80

  for (const char of str) {
    const code = char.codePointAt(0)
    if (!code) {
      continue
    }
    if (code <= 0x7f) {
      // Byte 1
      out.push(code)
    } else if (code <= 0x7ff) {
      // Byte 2
      out.push(0b11000000 + (code >>> 6), prefix + (code & mask))
    } else if (code <= 0xffff) {
      // Byte 3
      out.push(
        0b11100000 + (code >>> 12),
        prefix + ((code >>> 6) & mask),
        prefix + (code & mask)
      )
    } else if (code <= 0x1fffff) {
      // Byte 4
      out.push(
        0b11110000 + (code >>> 18),
        prefix + ((code >>> 12) & mask),
        prefix + ((code >>> 6) & mask),
        prefix + (code & mask)
      )
    } else if (code <= 0x3ffffff) {
      // Byte 5
      out.push(
        0b11111000 + (code >>> 24),
        prefix + ((code >>> 18) & mask),
        prefix + ((code >>> 12) & mask),
        prefix + ((code >>> 6) & mask),
        prefix + (code & mask)
      )
    } else {
      // Byte 6
      out.push(
        0b11111100 + (code >>> 30),
        prefix + ((code >>> 24) & mask),
        prefix + ((code >>> 18) & mask),
        prefix + ((code >>> 12) & mask),
        prefix + ((code >>> 6) & mask),
        prefix + (code & mask)
      )
    }
  }
  return Uint8Array.of(...out)
}
