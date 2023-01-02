export default class ByteArray {
  static blockByteLength = 64

  #array: Uint8Array
  #view: DataView
  #pos: number

  constructor() {
    this.#array = new Uint8Array(ByteArray.blockByteLength)
    this.#view = new DataView(this.#array.buffer)
    this.#pos = 0
  }

  getBuffer(): Uint8Array {
    return this.#array.subarray(0, this.#pos)
  }

  #ensureEnoughSpace(byteLength: number, cb: CallableFunction): void {
    if (this.#pos + byteLength >= this.#array.byteLength) {
      // Calculate new byteLength of whole buffer
      const newBlockLength =
        Math.ceil((this.#pos + byteLength) / ByteArray.blockByteLength) *
        ByteArray.blockByteLength

      // Create new buffer and copy content from original buffer
      const newArray = new Uint8Array(newBlockLength)
      newArray.set(this.#array)
      this.#view = new DataView(newArray.buffer)
      this.#array = newArray
    }

    cb()
    this.#pos += byteLength
  }

  append(array: Uint8Array): void {
    this.#ensureEnoughSpace(array.byteLength, () => {
      this.#array.set(array, this.#pos)
    })
  }

  writeUint8(number: number): void {
    this.#ensureEnoughSpace(1, () => {
      this.#view.setUint8(this.#pos, number)
    })
  }
}
