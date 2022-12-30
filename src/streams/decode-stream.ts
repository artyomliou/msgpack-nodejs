import { Transform, TransformCallback } from "stream"
import { Buffer } from "buffer"
import msgPackDecode from "../decoder/decoder.js"
import { DecodeStreamInput } from "../types.js"

export default class DecodeStream extends Transform {
  constructor() {
    super({
      objectMode: true,
    })
  }

  _transform(
    chunk: DecodeStreamInput,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    if (Buffer.isBuffer(chunk)) {
      callback(null, msgPackDecode(chunk.buffer))
    } else {
      callback(null, msgPackDecode(new TextEncoder().encode(chunk).buffer))
    }
  }
}
