export default class ByteArray {
  static blockByteLength = 256

  #view: DataView
  #pos: number

  constructor () {
    this.#view = new DataView(new ArrayBuffer(ByteArray.blockByteLength))
    this.#pos = 0
  }

  getBuffer (): ArrayBuffer {
    return this.#view.buffer.slice(0, this.#pos)
  }

  #ensureEnoughSpace (byteLength: number, cb: CallableFunction): void {
    if (this.#pos + byteLength >= this.#view.buffer.byteLength) {
      // Calculate new byteLength of whole buffer
      const newBlockLength = Math.ceil((this.#view.buffer.byteLength + byteLength) / ByteArray.blockByteLength) * ByteArray.blockByteLength

      // Create new buffer and copy content from original buffer
      const newBuffer = new ArrayBuffer(newBlockLength)
      new Uint8Array(newBuffer).set(new Uint8Array(this.#view.buffer))
      this.#view = new DataView(newBuffer)
    }

    cb()
    this.#pos += byteLength
  }

  writeBuffer (buffer: ArrayBuffer): void {
    this.#ensureEnoughSpace(buffer.byteLength, () => {
      // https://stackoverflow.com/a/36312116
      const view = new Uint8Array(buffer)
      let localPos = this.#pos
      for (let i = 0; i < view.length; i++) {
        this.#view.setUint8(localPos++, view[i])
      }
    })
  }

  writeUint8 (number: number): void {
    this.#ensureEnoughSpace(1, () => {
      this.#view.setUint8(this.#pos, number)
    })
  }

  writeUint16 (number: number): void {
    this.#ensureEnoughSpace(2, () => {
      this.#view.setUint16(this.#pos, number, false)
    })
  }

  writeUint32 (number: number): void {
    this.#ensureEnoughSpace(4, () => {
      this.#view.setUint32(this.#pos, number, false)
    })
  }

  writeUint64 (number: bigint): void {
    this.#ensureEnoughSpace(8, () => {
      this.#view.setBigUint64(this.#pos, number, false)
    })
  }

  writeInt8 (number: number): void {
    this.#ensureEnoughSpace(1, () => {
      this.#view.setInt8(this.#pos, number)
    })
  }

  writeInt16 (number: number): void {
    this.#ensureEnoughSpace(2, () => {
      this.#view.setInt16(this.#pos, number, false)
    })
  }

  writeInt32 (number: number): void {
    this.#ensureEnoughSpace(4, () => {
      this.#view.setInt32(this.#pos, number, false)
    })
  }

  writeInt64 (number: bigint): void {
    this.#ensureEnoughSpace(8, () => {
      this.#view.setBigInt64(this.#pos, number, false)
    })
  }

  writeFloat64 (number: number): void {
    this.#ensureEnoughSpace(8, () => {
      this.#view.setFloat64(this.#pos, number, false)
    })
  }
}
