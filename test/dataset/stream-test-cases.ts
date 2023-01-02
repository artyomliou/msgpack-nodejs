import { DecodeOutput, EncodableValue } from "../../src/types"

interface StreamTestCase {
  title: string
  args: EncodableValue
  expected?: DecodeOutput
}

const cases: StreamTestCase[] = [
  { title: "bool (true)", args: true },
  { title: "bool (false)", args: false },
  { title: "number (0)", args: 0 },
  { title: "number (127)", args: 127 },
  { title: "number (65535)", args: 65535 },
  { title: "number (MAX)", args: BigInt(Number.MAX_SAFE_INTEGER) },
  { title: "number (MIN)", args: BigInt(Number.MIN_SAFE_INTEGER) },
  { title: "float (1.1)", args: 1.1 },
  { title: "bigint (1 << 54)", args: BigInt(1) << BigInt(54) },
  { title: "string", args: "hello world! 嗨 😂" },
  { title: "date", args: new Date() },
  {
    title: "Uint8Array",
    args: new TextEncoder().encode("hello world"),
  },
  { title: "Array", args: [[[[[]]]]] },
  { title: "Object", args: { compact: true, schema: 0 } },
  { title: "Map", args: new Map(), expected: {} },
]

export default cases
