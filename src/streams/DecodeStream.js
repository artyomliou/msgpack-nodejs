import { Transform } from 'node:stream'
import msgPackDecode from '../decoder/index.js'

export default class DecodeStream extends Transform {
  constructor () {
    super({
      objectMode: true
    })
  }

  /**
   * @protected
   * @param {Buffer|Uint8Array|string} chunk
   * @param {BufferEncoding} encoding
   * @param {import('node:stream').TransformCallback} callback
   */
  _transform (chunk, encoding, callback) {
    if (Buffer.isBuffer(chunk) || chunk instanceof Uint8Array) {
      callback(null, msgPackDecode(chunk.buffer))
    } else if (chunk instanceof ArrayBuffer) {
      callback(null, msgPackDecode(chunk))
    } else {
      callback(null, new TextEncoder().encode(chunk).buffer)
    }
  }
}
