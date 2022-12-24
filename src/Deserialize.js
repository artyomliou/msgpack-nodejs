const StructContext = require('./StructContext')
const TypedValueResolver = require('./TypedValueResolver')

/**
 * @param {Buffer} srcBuffer
 * @param {boolean} debug
 */
module.exports = function messagePackDeserialize (srcBuffer, debug = false) {
  // It's important to slice() the srcBuffer, otherwise, you may get dirty data

  const view = new DataView(srcBuffer.buffer.slice(srcBuffer.byteOffset, srcBuffer.byteOffset + srcBuffer.byteLength))
  if (debug) {
    // console.debug([
    //   {var: 'srcBuffer.byteOffset', value: srcBuffer.byteOffset},
    //   {var: 'srcBuffer.byteLength', value: srcBuffer.byteLength},
    //   {var: 'view.byteOffset', value: view.byteOffset},
    //   {var: 'view.byteLength', value: view.byteLength},
    //   {var: 'view.buffer.byteLength', value: view.buffer.byteLength},
    // ]);
  }

  /** @type {StructContext[]} */
  const contextStack = []

  /** @type {StructContext|null} */
  let cur = null

  /** @type {TypedValueResolver|null} */
  let res = null

  /** @type {string|null} */
  let mapKey = null

  let pos = 0
  while (pos < view.byteLength) {
    res = new TypedValueResolver(view, pos)
    if (debug) {
      console.log(`pos = ${pos}, type = ${res.type}, val = ${res.value}, byteLength = ${res.byteLength}`)
    }

    // Move position, based on reported scanned bytes
    pos += res.byteLength

    // Push value into current structure, if there's one
    if (cur?.isMap) {
      if (!mapKey) {
        if (res.type !== TypedValueResolver.typeStr) {
          throw new Error('Map key should be a string.')
        }
        mapKey = res.value
      } else if (mapKey) {
        cur.ref[mapKey] = res.value
        mapKey = null
        cur.elementsLeft--
      }
    } else if (cur?.isArray) {
      cur.ref.push(res.value)
      cur.elementsLeft--
    }

    // For a new map/array, in order to push subsequent resolved value in, we must switch context into this map/array.
    if (res.type === TypedValueResolver.typeMap || res.type === TypedValueResolver.typeArray) {
      if (cur) {
        contextStack.push(cur)
      }
      cur = new StructContext(res.value, res.type === TypedValueResolver.typeMap, res.type === TypedValueResolver.typeArray, res.elementCount)
    }

    // If a map/array has all elements belonging to it, leave current context.
    while (cur?.elementsLeft === 0 && contextStack.length) {
      cur = contextStack.pop()
    }
  }

  // Result primitive value
  if (!cur?.ref) {
    return res.value
  }

  // If stack is not empty, return ref of first element
  return cur.ref
}
