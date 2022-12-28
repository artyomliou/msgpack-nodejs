import { Transform } from 'node:stream'
import msgPackEncode from '../encoder/index.js'

export default class EncodeStream extends Transform {
  constructor () {
    super({
      writableObjectMode: true
    })
  }

  /**
   * @protected
   * @param {boolean|number|bigint|string|Date|ArrayBuffer|Array|Object|Map} chunk Everything except null
   * @param {BufferEncoding} encoding
   * @param {import('node:stream').TransformCallback} callback
   */
  _transform (chunk, encoding, callback) {
    callback(null, Buffer.from(msgPackEncode(chunk)))
  }
}
