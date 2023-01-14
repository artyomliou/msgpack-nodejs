import { Options } from "../options.js"

// Stat
export function bufferAllocatorStat() {
  return stat
}
const stat: Stat = {
  copied: 0,
  maxAllocatedSize: 0,
  maxOutputSize: 0,
}
interface Stat {
  copied: number
  maxAllocatedSize: number
  maxOutputSize: number
}

// Options
export function optIn(opt: Options) {
  if (typeof opt?.encoder?.byteArray?.base !== "undefined") {
    bufferAllocator.base = opt.encoder.byteArray.base
  }
}

/**
 * Control buffer allocation for more than one ByteArray
 */
const bufferAllocator = {
  base: 1024,
  size(exponent = 0) {
    const val = this.base * 2 ** exponent
    if (val > stat.maxAllocatedSize) {
      stat.maxAllocatedSize = val
    }
    return val
  },
}

/**
 * For easier memory operation
 */
export default class ByteArray {
  private array: Uint8Array
  private view: DataView
  private pos: number
  private newBufferExponent = 0

  constructor() {
    this.array = new Uint8Array(bufferAllocator.size())
    this.view = new DataView(this.array.buffer)
    this.pos = 0
  }

  private ensureEnoughSpace(reqSize: number): void {
    const totalReqSize = this.pos + reqSize
    if (totalReqSize >= this.array.byteLength) {
      // Decide how many buffer will be allocated, normally one iteration is enough
      let newSize = totalReqSize
      while (newSize <= totalReqSize) {
        newSize += bufferAllocator.size(this.newBufferExponent++) // exponential
      }

      // Create new buffer and copy content from original buffer
      const newArray = new Uint8Array(newSize)
      newArray.set(this.array)
      this.view = new DataView(newArray.buffer)
      this.array = newArray

      // Increment stat
      stat.copied++
    }
  }

  writeUint8(number: number): void {
    this.ensureEnoughSpace(1)
    this.view.setUint8(this.pos, number)
    this.pos += 1
  }

  writeUint16(number: number): void {
    this.ensureEnoughSpace(2)
    this.view.setUint16(this.pos, number, false)
    this.pos += 2
  }

  writeUint32(number: number): void {
    this.ensureEnoughSpace(4)
    this.view.setUint32(this.pos, number, false)
    this.pos += 4
  }

  writeUint64(number: bigint): void {
    this.ensureEnoughSpace(8)
    this.view.setBigUint64(this.pos, number, false)
    this.pos += 8
  }

  writeInt8(number: number): void {
    this.ensureEnoughSpace(1)
    this.view.setInt8(this.pos, number)
    this.pos += 1
  }

  writeInt16(number: number): void {
    this.ensureEnoughSpace(2)
    this.view.setInt16(this.pos, number, false)
    this.pos += 2
  }

  writeInt32(number: number): void {
    this.ensureEnoughSpace(4)
    this.view.setInt32(this.pos, number, false)
    this.pos += 4
  }

  writeInt64(number: bigint): void {
    this.ensureEnoughSpace(8)
    this.view.setBigInt64(this.pos, number, false)
    this.pos += 8
  }

  writeFloat64(number: number): void {
    this.ensureEnoughSpace(8)
    this.view.setFloat64(this.pos, number, false)
    this.pos += 8
  }

  append(array: Uint8Array): void {
    this.ensureEnoughSpace(array.byteLength)
    this.array.set(array, this.pos)
    this.pos += array.byteLength
  }

  subarrayBackward(byteLength: number): Uint8Array {
    return this.array.subarray(this.pos - byteLength, this.pos)
  }

  /**
   * After writing all encoded data, use this function to create reference to those written bytes in buffer.
   */
  getWrittenBytes(): Uint8Array {
    if (this.pos > stat.maxOutputSize) {
      stat.maxOutputSize = this.pos
    }
    return this.array.subarray(0, this.pos)
  }
}
