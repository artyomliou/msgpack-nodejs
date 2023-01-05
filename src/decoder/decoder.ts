import TypedValueResolver from "./typed-value-resolver.js"
import { debugMode } from "../constants/debug.js"
import { DecodeOutput } from "../types.js"
import StructBuilder from "./struct-builder.js"

export default function msgPackDecode(buffer: Uint8Array): DecodeOutput {
  const builder = new StructBuilder()
  for (const res of parseBuffer(buffer)) {
    builder.handle(res)
  }
  return builder.output
}

function* parseBuffer(buffer: Uint8Array) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  if (debugMode) {
    console.log(
      `buffer length = ${buffer.byteLength}, view length = ${view.byteLength}, view buffer length = ${view.buffer.byteLength}`
    )
  }

  let pos = 0
  while (pos < view.byteLength) {
    const res = TypedValueResolver(view, buffer, pos)
    pos += res.byteLength
    yield res
  }
}
