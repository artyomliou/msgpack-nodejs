import { Buffer } from "buffer"

export type ExtensionClass = unknown

export type EncodableValue =
  | boolean
  | number
  | bigint
  | string
  | Date
  | Uint8Array
  | JsonArray
  | JsonMap
  | JsMap
  | null
  | ExtensionClass
export type DecodeOutput = Exclude<EncodableValue, JsMap> | ExtensionClass
export type EncodeStreamInput = Exclude<EncodableValue, null>
export type EncodeStreamOutput = Buffer
export type DecodeStreamInput = Buffer
export type DecodeStreamOutput = Exclude<DecodeOutput, null>

export type JsonArray = Array<unknown>
export type JsonMap = Record<string, unknown>
export type JsMap = Map<unknown, unknown>
