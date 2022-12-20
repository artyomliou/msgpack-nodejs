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

  writeUint8(number) {
    this.#buffers.push(Uint8Array.from([number]));
  }

  writeUint16(number) {
    this.#buffers.push(Uint16Array.from([number]));
  }

  writeUint32(number) {
    this.#buffers.push(Uint32Array.from([number]));
  }

  writeUint64(number) {
    this.#buffers.push(BigUint64Array.from([number]));
  }

  writeInt8(number) {
    this.#buffers.push(Int8Array.from([number]));
  }

  writeInt16(number) {
    this.#buffers.push(Int16Array.from([number]));
  }

  writeInt32(number) {
    this.#buffers.push(Int32Array.from([number]));
  }

  writeInt64(number) {
    this.#buffers.push(BigInt64Array.from([number]));
  }

  writeFloat32(number) {
    this.#buffers.push(Float32Array.from([number]));
  }

  writeFloat64(number) {
    this.#buffers.push(Float64Array.from([number]));
  }

  writeBuffer(buffer) {
    this.#buffers.push(buffer);
  }
}