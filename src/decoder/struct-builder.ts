import { DecodeOutput } from "src/types"

type Struct = Array<unknown> | Record<string, unknown>
type MapKey = string | null

export default class StructBuilder {
  struct!: Struct
  elementsLeft = 0
  stack: Array<[Struct, number, MapKey]> = []
  mapKey: MapKey = null

  /**
   * Insert new struct in current struct, then replace reference
   */
  newStruct(val: Struct, size = 0) {
    this.insertValue(val)

    // Optimize: We dont have to push and pop this empty struct
    if (this.struct && size === 0) {
      return
    }

    // Save current reference into stack
    if (this.struct) {
      this.stack.push([this.struct, this.elementsLeft, this.mapKey])
    }

    // Replace reference
    if (val instanceof Array) {
      this.elementsLeft = size
      this.struct = val
      this.mapKey = null
    } else if (val) {
      this.elementsLeft = size
      this.struct = val as Record<string | symbol, unknown>
      this.mapKey = null
    }
  }

  /**
   * Insert any value into current struct
   */
  insertValue(val: DecodeOutput): boolean {
    if (!this.struct) {
      return false
    } else if (this.struct instanceof Array) {
      this.struct[this.struct.length - this.elementsLeft] = val
      this.elementsLeft--
      this.#popStack()
    } else {
      if (this.mapKey) {
        this.struct[this.mapKey] = val
        this.mapKey = null
        this.elementsLeft--
        this.#popStack()
      } else {
        if (typeof val !== "string") {
          throw new Error("Map key should be string.")
        }
        this.mapKey = val
      }
    }
    return true
  }

  /**
   * If a struct got all elements it could have, leave current context
   */
  #popStack() {
    while (this.elementsLeft === 0 && this.stack.length > 0) {
      const parent = this.stack.pop() as [Struct, number, MapKey]
      this.struct = parent[0]
      this.elementsLeft = parent[1]
      this.mapKey = parent[2]
    }
  }
}
