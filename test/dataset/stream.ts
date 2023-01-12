import { DecodeOutput, EncodableValue } from "../../src/types"

interface TestCase {
  title: string
  data: EncodableValue
  expected?: DecodeOutput
}

export default [
  { title: "bool (true)", data: true },
  { title: "bool (false)", data: false },
  { title: "number (0)", data: 0 },
  { title: "number (127)", data: 127 },
  { title: "number (65535)", data: 65535 },
  { title: "number (MAX)", data: Number.MAX_SAFE_INTEGER },
  { title: "number (MIN)", data: Number.MIN_SAFE_INTEGER },
  { title: "float (1.1)", data: 1.1 },
  { title: "bigint (1 << 54)", data: BigInt(1) << BigInt(54) },
  { title: "string", data: "hello world! 嗨 😂" },
  { title: "date", data: new Date() },
  {
    title: "Uint8Array",
    data: new TextEncoder().encode("hello world"),
    expected: Buffer.from(new TextEncoder().encode("hello world")),
  },
  { title: "Array", data: [[[[[]]]]] },
  { title: "Object", data: { compact: true, schema: 0 } },
  { title: "Map", data: new Map(), expected: {} },
] as TestCase[]
