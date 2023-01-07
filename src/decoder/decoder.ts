import parseBuffer, {
  ArrayDescriptor,
  ObjectDescriptor,
} from "./typed-value-resolver.js"
import { DecodeOutput } from "../types.js"
import StructBuilder from "./struct-builder.js"

export default function msgPackDecode(buffer: Uint8Array): DecodeOutput {
  const builder = new StructBuilder()
  for (const res of parseBuffer(buffer)) {
    if (res instanceof ArrayDescriptor) {
      builder.newStruct(new Array(res.size), res.size)
    } else if (res instanceof ObjectDescriptor) {
      builder.newStruct({}, res.size)
    } else if (!builder.insertValue(res)) {
      return res
    }
  }
  return builder.struct
}
