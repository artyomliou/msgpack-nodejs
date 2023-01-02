import { Transform, TransformCallback } from "stream"
import msgPackEncode from "../encoder/encoder.js"
import { EncodeStreamInput } from "../types.js"

export default class EncodeStream extends Transform {
  constructor() {
    super({
      writableObjectMode: true,
    })
  }

  _transform(
    chunk: EncodeStreamInput,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    callback(null, msgPackEncode(chunk))
  }
}
