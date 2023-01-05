import { DecodeOutput } from "src/types"
import { TypedValueResolverResult } from "./typed-value-resolver"

type Container = Array<unknown> | Record<string, unknown>

export default class StructBuilder {
  stack: Array<[Container, number]> = []
  cur: Container | null = null
  elementsLeft = 0
  mapKey: string | null = null
  output?: DecodeOutput

  handle(res: TypedValueResolverResult) {
    if (this.cur === null && !res.isArray && !res.isMap) {
      this.output = res.value
      return
    }

    // Push value into current structure, if there's one
    if (this.cur instanceof Array) {
      this.cur.push(res.value)
      this.elementsLeft--
    } else if (this.cur !== null) {
      if (this.mapKey === null && typeof res.value === "string") {
        this.mapKey = res.value
        return
      } else if (this.mapKey !== null) {
        this.cur[this.mapKey] = res.value
        this.mapKey = null
        this.elementsLeft--
      }
    }

    // For a new map/array, in order to push subsequent resolved value in, we must switch context into this map/array.
    if (res.isArray || res.isMap) {
      if (this.cur != null) {
        this.stack.push([this.cur, this.elementsLeft])
      }
      this.cur = res.value as Container
      this.elementsLeft = res.elementCount as number
    }

    /**
     * If a map/array has all elements belonging to it, leave current context.
     */
    while (this.elementsLeft === 0 && this.stack.length > 0) {
      const prev = this.stack.pop()
      if (prev) {
        this.cur = prev[0]
        this.elementsLeft = prev[1]
      }
    }
    if (this.stack.length === 0) {
      this.output = this.cur
    }
  }
}
