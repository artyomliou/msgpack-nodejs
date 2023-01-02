import StructContext from "./struct-context.js"
import TypedValueResolver from "./typed-value-resolver.js"
import { debugMode } from "../constants/debug.js"
import { DecodeOutput, JsonArray, JsonMap } from "../types.js"

export default function msgPackDecode(src: Uint8Array): DecodeOutput {
  const view = new DataView(src.buffer, src.byteOffset, src.byteLength)
  if (debugMode) {
    console.log(
      `src length = ${src.byteLength}, view length = ${view.byteLength}, view buffer length = ${view.buffer.byteLength}`
    )
  }

  const contextStack: StructContext[] = []
  let cur: StructContext | null = null
  let res: TypedValueResolver | null = null
  let mapKey: string | null = null
  let pos = 0

  while (pos < view.byteLength) {
    res = new TypedValueResolver(view, pos)
    if (debugMode) {
      console.log(
        `pos = ${pos}, type = ${res.type}, byteLength = ${res.byteLength}`,
        res.value
      )
    }

    // Move position, based on reported scanned bytes
    pos += res.byteLength

    // Push value into current structure, if there's one
    if (cur != null) {
      if (cur.ref instanceof Array) {
        cur.ref.push(res.value)
        cur.elementsLeft--
      } else if (typeof cur.ref === "object") {
        if (mapKey === "" || mapKey === null) {
          if (typeof res.value !== "string") {
            throw new Error("Map key should be a string.")
          }
          mapKey = res.value
        } else {
          cur.ref[mapKey] = res.value
          mapKey = null
          cur.elementsLeft--
        }
      }
    }

    // For a new map/array, in order to push subsequent resolved value in, we must switch context into this map/array.
    if (
      res.type === TypedValueResolver.typeMap ||
      res.type === TypedValueResolver.typeArray
    ) {
      if (cur != null) {
        contextStack.push(cur)
      }
      cur = new StructContext(
        res.value as JsonMap | JsonArray,
        res.elementCount
      )
    }

    // If a map/array has all elements belonging to it, leave current context.
    while (cur?.elementsLeft === 0 && contextStack.length > 0) {
      const prev = contextStack.pop()
      if (prev != null) {
        cur = prev
      } else {
        cur = null
      }
    }
  }

  // If nothing was resolved
  if (res === null) {
    return null
  }

  // If there's no structure, then return primitive value
  if (cur === null) {
    return res.value
  }

  // Return current structure
  return cur.ref
}
