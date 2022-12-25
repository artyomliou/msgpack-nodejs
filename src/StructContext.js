export default class StructContext {
  constructor (ref, isMap = true, isArray = false, elementsLeft = 0) {
    this.ref = ref
    this.isMap = isMap
    this.isArray = isArray
    this.elementsLeft = elementsLeft
  }
}
