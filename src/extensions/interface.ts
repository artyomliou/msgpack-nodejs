export interface CustomExtension<T> {
  readonly type: number
  readonly objConstructor: Function
  /**
   * Please transform your class object into plain object to prevent from recusion happening
   */
  encode(object: T): Uint8Array
  decode(data: Uint8Array): T
}
