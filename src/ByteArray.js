const {Buffer} = require('node:buffer');

/**
 * @ref https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 * @ref https://nodejs.org/api/buffer.html
 * @ref https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
 */
module.exports = class ByteArray {
  #buffers = [];

  getBuffer() {
    return Buffer.concat(this.#buffers);
  }

  writeBuffer(buffer) {
    this.#buffers.push(buffer);
  }

  /**
   * Cast ArrayBuffer as Uint8Array, and append it into #buffers
   * @param {ArrayBuffer} arrayBuffer 
   */
  #writeArrayBuffer(arrayBuffer) {
    this.#buffers.push(new Uint8Array(arrayBuffer));
  }

  writeUint8(number) {
    const buf = new ArrayBuffer(1);
    (new DataView(buf)).setUint8(0, number);
    this.#writeArrayBuffer(buf);
  }

  writeUint16(number) {
    const buf = new ArrayBuffer(2);
    (new DataView(buf)).setUint16(0, number, false);
    this.#writeArrayBuffer(buf);
  }

  writeUint32(number) {
    const buf = new ArrayBuffer(4);
    (new DataView(buf)).setUint32(0, number, false);
    this.#writeArrayBuffer(buf);
  }

  writeUint64(number) {
    const buf = new ArrayBuffer(8);
    (new DataView(buf)).setBigUint64(0, number, false);
    this.#writeArrayBuffer(buf);
  }

  writeInt8(number) {
    const buf = new ArrayBuffer(1);
    (new DataView(buf)).setInt8(0, number);
    this.#writeArrayBuffer(buf);
  }

  writeInt16(number) {
    const buf = new ArrayBuffer(2);
    (new DataView(buf)).setInt16(0, number, false);
    this.#writeArrayBuffer(buf);
  }

  writeInt32(number) {
    const buf = new ArrayBuffer(4);
    (new DataView(buf)).setInt32(0, number, false);
    this.#writeArrayBuffer(buf);
  }

  writeInt64(number) {
    const buf = new ArrayBuffer(8);
    (new DataView(buf)).setBigInt64(0, number, false);
    this.#writeArrayBuffer(buf);
  }

  writeFloat64(number) {
    const buf = new ArrayBuffer(8);
    (new DataView(buf)).setFloat64(0, number, false);
    this.#writeArrayBuffer(buf);
  }
}