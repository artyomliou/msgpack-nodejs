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

  getBuffer(): Uint8Array {
    if (this.pos > stat.maxOutputSize) {
      stat.maxOutputSize = this.pos
    }
    return this.array.subarray(0, this.pos)
  }

  private ensureEnoughSpace(byteLength: number, cb: CallableFunction): void {
    const reqSize = this.pos + byteLength
    if (reqSize >= this.array.byteLength) {
      let newSize = reqSize
      while (newSize <= reqSize) {
        newSize += bufferAllocator.size(this.newBufferExponent++) // Incremental
      }

      // Create new buffer and copy content from original buffer
      const newArray = new Uint8Array(newSize)
      newArray.set(this.array)
      this.view = new DataView(newArray.buffer)
      this.array = newArray

      // Increment stat
      stat.copied++
    }

    cb()
    this.pos += byteLength
  }

  append(array: Uint8Array): void {
    this.ensureEnoughSpace(array.byteLength, () => {
      this.array.set(array, this.pos)
    })
  }

  writeUint8(number: number): void {
    this.ensureEnoughSpace(1, () => {
      this.view.setUint8(this.pos, number)
    })
  }

  writeUint16(number: number): void {
    this.ensureEnoughSpace(2, () => {
      this.view.setUint16(this.pos, number, false)
    })
  }

  writeUint32(number: number): void {
    this.ensureEnoughSpace(4, () => {
      this.view.setUint32(this.pos, number, false)
    })
  }

  writeUint64(number: bigint): void {
    this.ensureEnoughSpace(8, () => {
      this.view.setBigUint64(this.pos, number, false)
    })
  }

  writeInt8(number: number): void {
    this.ensureEnoughSpace(1, () => {
      this.view.setInt8(this.pos, number)
    })
  }

  writeInt16(number: number): void {
    this.ensureEnoughSpace(2, () => {
      this.view.setInt16(this.pos, number, false)
    })
  }

  writeInt32(number: number): void {
    this.ensureEnoughSpace(4, () => {
      this.view.setInt32(this.pos, number, false)
    })
  }

  writeInt64(number: bigint): void {
    this.ensureEnoughSpace(8, () => {
      this.view.setBigInt64(this.pos, number, false)
    })
  }

  writeFloat64(number: number): void {
    this.ensureEnoughSpace(8, () => {
      this.view.setFloat64(this.pos, number, false)
    })
  }
}
