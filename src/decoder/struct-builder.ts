import {
  AllNode,
  ArrayNode,
  MapNode,
  StringNode,
} from "./typed-value-resolver.js"

export default class StructBuilder {
  public struct!: ArrayNode | MapNode
  private stack: Array<[ArrayNode | MapNode, StringNode | null]> = []
  private mapKey: StringNode | null = null

  /**
   * Insert new struct in current struct, then replace reference
   */
  newStruct(node: ArrayNode | MapNode) {
    this.insertValue(node)

    // Optimize: We dont have to push and pop this empty struct
    if (this.struct && node.size === 0) {
      return
    }

    // Save current reference into stack
    if (this.struct) {
      this.stack.push([this.struct, this.mapKey])
    }

    // Replace reference
    this.struct = node
    this.mapKey = null
  }

  /**
   * Insert any value into current struct
   */
  insertValue(node: AllNode): boolean {
    if (!this.struct) {
      return false
    } else if (this.struct instanceof ArrayNode) {
      this.struct.elements[this.struct.size - this.struct.elementsLeft] = node
      this.struct.elementsLeft--
      if (this.struct.elementsLeft === 0) {
        this.popStack()
      }
    } else if (this.struct instanceof MapNode) {
      if (!this.mapKey) {
        if (!(node instanceof StringNode)) {
          console.debug(this.struct)
          throw new Error(`Map key should be StringNode, got ${typeof node}.`)
        }
        this.mapKey = node
        return true
      }

      this.struct.elements[this.struct.size - this.struct.elementsLeft] =
        this.mapKey
      this.mapKey.next = node
      this.mapKey = null
      this.struct.elementsLeft--
      if (this.struct.elementsLeft === 0) {
        this.popStack()
      }
    }
    return true
  }

  /**
   * If a struct got all elements it could have, leave current context
   */
  private popStack() {
    while (this.struct.elementsLeft === 0 && this.stack.length > 0) {
      const parent = this.stack.pop() as [ArrayNode | MapNode, StringNode]
      this.struct = parent[0]
      this.mapKey = parent[1]
    }
  }
}
