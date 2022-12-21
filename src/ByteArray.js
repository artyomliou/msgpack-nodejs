const {Buffer} = require('node:buffer');

/**
 * @ref https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 * @ref https://nodejs.org/api/buffer.html
 */
module.exports = class ByteArray {
  #buffers = [];

  getBuffer() {
    return Buffer.concat(this.#buffers);
  }

  writeBuffer(buffer) {
    this.#buffers.push(buffer);
  }

  writeUint8(number) {
    const buf = new ArrayBuffer(1);
    (new DataView(buf)).setUint8(0, number);
    this.#buffers.push(new Uint8Array(buf));
  }

  writeUint16(number) {
    const buf = new ArrayBuffer(2);
    (new DataView(buf)).setUint16(0, number, false);
    this.#buffers.push(new Uint8Array(buf));
  }

  writeUint32(number) {
    const buf = new ArrayBuffer(4);
    (new DataView(buf)).setUint32(0, number, false);
    this.#buffers.push(new Uint8Array(buf));
  }

  writeUint64(number) {
    const buf = new ArrayBuffer(8);
    (new DataView(buf)).setBigUint64(0, number, false);
    this.#buffers.push(new Uint8Array(buf));
  }

  writeInt8(number) {
    const buf = new ArrayBuffer(1);
    (new DataView(buf)).setInt8(0, number);
    this.#buffers.push(new Uint8Array(buf));
  }

  writeInt16(number) {
    const buf = new ArrayBuffer(2);
    (new DataView(buf)).setInt16(0, number, false);
    this.#buffers.push(new Uint8Array(buf));
  }

  writeInt32(number) {
    const buf = new ArrayBuffer(4);
    (new DataView(buf)).setInt32(0, number, false);
    this.#buffers.push(new Uint8Array(buf));
  }

  writeInt64(number) {
    const buf = new ArrayBuffer(8);
    (new DataView(buf)).setBigInt64(0, number, false);
    this.#buffers.push(new Uint8Array(buf));
  }

  writeFloat64(number) {
    const buf = new ArrayBuffer(8);
    (new DataView(buf)).setFloat64(0, number, false);
    this.#buffers.push(new Uint8Array(buf));
  }
}