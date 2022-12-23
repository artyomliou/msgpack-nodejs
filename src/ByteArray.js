const {Buffer} = require('node:buffer');

/**
 * @ref https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 * @ref https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
 * @ref https://nodejs.org/api/buffer.html
 * @ref https://pjchender.dev/javascript/js-typedarray-buffer-dataview/
 */
module.exports = class ByteArray {

  static blockSize = 8192;

  #buffers;
  #pos;

  constructor() {
    this.#buffers = Buffer.allocUnsafe(ByteArray.blockSize);
    this.#pos = 0;
  }

  getBuffer() {
    return this.#buffers.subarray(0, this.#pos);
  }

  #ensureEnoughSpace(byteLength = 0, cb) {
    if (this.#pos + byteLength >= this.#buffers.byteLength) {

      // Calculate new byteLength of whole buffer
      const currentBlockLength = Math.floor(this.#buffers.byteLength / ByteArray.blockSize);
      const newBlockLength = currentBlockLength + Math.ceil(byteLength / ByteArray.blockSize);

      // Create new buffer and copy content from original buffer
      const newBuffer = Buffer.allocUnsafe(newBlockLength * ByteArray.blockSize);
      this.#buffers.copy(newBuffer, undefined, 0, this.#pos);
      this.#buffers = newBuffer;

    }

    cb();
    this.#pos += byteLength;
  }

  /**
   * @param {Buffer} buffer 
   */
  writeBuffer(buffer) {
    this.#ensureEnoughSpace(buffer.byteLength, () => {
      buffer.copy(this.#buffers, this.#pos);
    });
  }

  writeUint8(number) {
    this.#ensureEnoughSpace(1, () => {
      this.#buffers.writeUint8(number, this.#pos)
    });
  }

  writeUint16(number) {
    this.#ensureEnoughSpace(2, () => {
      this.#buffers.writeUint16BE(number, this.#pos)
    });
  }

  writeUint32(number) {
    this.#ensureEnoughSpace(4, () => {
      this.#buffers.writeUint32BE(number, this.#pos)
    });
  }

  writeUint64(number) {
    this.#ensureEnoughSpace(8, () => {
      this.#buffers.writeBigUint64BE(number, this.#pos)
    });
  }

  writeInt8(number) {
    this.#ensureEnoughSpace(1, () => {
      this.#buffers.writeInt8(number, this.#pos)
    });
  }

  writeInt16(number) {
    this.#ensureEnoughSpace(2, () => {
      this.#buffers.writeInt16BE(number, this.#pos)
    });
  }

  writeInt32(number) {
    this.#ensureEnoughSpace(4, () => {
      this.#buffers.writeInt32BE(number, this.#pos)
    });
  }

  writeInt64(number) {
    this.#ensureEnoughSpace(8, () => {
      this.#buffers.writeBigInt64BE(number, this.#pos)
    });
  }

  writeFloat64(number) {
    this.#ensureEnoughSpace(8, () => {
      this.#buffers.writeDoubleBE(number, this.#pos)
    });
  }
}