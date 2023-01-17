import { DecodeOutput } from "../types.js"
import StructBuilder from "./struct-builder.js"
import SingleValueError from "./single-value-error.js"
import { parseBuffer } from "./decoder-fns.js"

export default function msgPackDecode(buffer: Uint8Array): DecodeOutput {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const builder = new StructBuilder()
  try {
    parseBuffer(buffer, view, builder)
    return builder.struct
  } catch (error) {
    return (error as SingleValueError)?.value
  }
}
