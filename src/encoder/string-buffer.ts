class StringBuffer {
  private array: Uint8Array
  private pos: number
  private allocateSize = 10240
  private encoder = new TextEncoder()
  public stat = {
    copied: 0,
    size: 0,
  }

  constructor() {
    this.array = new Uint8Array(this.allocateSize)
    this.pos = 0
  }

  /**
   * A simpler version of ensureEnoughSpace() of ByteArray
   */
  private ensureEnoughSpace(reqSize: number): void {
    const totalReqSize = this.pos + reqSize
    if (totalReqSize >= this.array.byteLength) {
      // Decide how many buffer will be allocated, normally one iteration is enough
      let newSize = totalReqSize
      while (newSize <= totalReqSize) {
        newSize += this.allocateSize * 2 ** this.stat.copied // exponential
      }

      // Allocate new buffer and copy into it
      // The reason that we cant simply allocate and use another brand new buffer is,
      // those encoded string in cache are still referenced to data in original buffer.
      const newArray = new Uint8Array(newSize)
      newArray.set(this.array)
      this.array = newArray

      // Stat
      this.stat.size = newSize
      this.stat.copied++
    }
  }

  /**
   * Ensure buffer has space for encoded string, which may take at most 3x string's length.
   * Then use encodeInto() to encode and write into buffer **directly**.
   * And most important part is, use subarray() to create reference, then we can copy data from StringBuffer to ByteArray efficiently.
   * @link https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto
   * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/set
   */
  encodeString(string: string): Uint8Array {
    this.ensureEnoughSpace(string.length * 3)
    const { written } = this.encoder.encodeInto(
      string,
      this.array.subarray(this.pos)
    )
    const encoded = this.array.subarray(this.pos, this.pos + written)
    this.pos += written
    return encoded
  }
}

// Singleton
export const stringBuffer = new StringBuffer()

// Stat
export function stringBufferStat() {
  return stringBuffer.stat
}
