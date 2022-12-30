import { JsonArray, JsonMap } from "../types.js"

export default class StructContext {
  constructor(
    public ref: JsonMap | JsonArray,
    public elementsLeft: number = 0
  ) {}
}
