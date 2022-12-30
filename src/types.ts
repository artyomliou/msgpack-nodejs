import { Buffer } from "buffer"

export type EncodableValue =
  | boolean
  | number
  | bigint
  | string
  | Date
  | ArrayBuffer
  | JsonArray
  | JsonMap
  | Map<string, any>
  | null
export type DecodeOutput = Exclude<EncodableValue, Map<string, any>>
export type EncodeStreamInput = Exclude<EncodableValue, null>
export type EncodeStreamOutput = Buffer
export type DecodeStreamInput = Buffer | string
export type DecodeStreamOutput = Exclude<DecodeOutput, null>

export type JsonArray = Array<EncodableValue>
export interface JsonMap {
  [key: string]: any
}
