import { Transform, TransformCallback } from "stream"
import msgPackDecode from "../decoder/decoder.js"
import { DecodeStreamInput } from "../types.js"

export default class DecodeStream extends Transform {
  constructor() {
    super({
      readableObjectMode: true,
    })
  }

  _transform(
    chunk: DecodeStreamInput,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    callback(null, msgPackDecode(chunk))
  }
}
