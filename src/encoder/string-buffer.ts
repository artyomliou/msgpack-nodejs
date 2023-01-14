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
  private ensureEnoughSpace(byteLength: number): void {
    const reqSize = this.pos + byteLength
    if (reqSize >= this.array.byteLength) {
      let newSize = reqSize
      while (newSize <= reqSize) {
        newSize += this.allocateSize * 2 ** this.stat.copied
      }

      // Create new buffer and copy content from original buffer
      const newArray = new Uint8Array(newSize)
      newArray.set(this.array)
      this.array = newArray

      // Stat
      this.stat.size = newSize
      this.stat.copied++
    }
  }

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
