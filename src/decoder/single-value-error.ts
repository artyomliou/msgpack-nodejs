export default class SingleValueError extends Error {
  constructor(public value: unknown) {
    super()
  }
}
