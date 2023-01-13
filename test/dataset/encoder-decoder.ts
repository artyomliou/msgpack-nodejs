import {
  BOOL_FALSE,
  BOOL_TRUE,
  NIL,
  UINT16_PREFIX,
  UINT32_PREFIX,
  UINT64_PREFIX,
  UINT8_PREFIX,
  INT16_PREFIX,
  INT32_PREFIX,
  INT64_PREFIX,
  INT8_PREFIX,
  FLOAT64_PREFIX,
  STR8_PREFIX,
  STR16_PREFIX,
  STR32_PREFIX,
  EXT8_PREFIX,
  FIXEXT4_PREFIX,
  FIXEXT8_PREFIX,
  ARRAY16_PREFIX,
  ARRAY32_PREFIX,
  FLOAT32_PREFIX,
  BIN8_PREFIX,
  BIN16_PREFIX,
  BIN32_PREFIX,
} from "../../src/constant"
import { DecodeOutput, EncodableValue } from "../../src/types"

interface TestCase {
  title: string
  data: Data[]
  encoderWillIgnore?: boolean
}

interface Data {
  value: EncodableValue
  encoded: Uint8Array
  decoderExpected?: DecodeOutput
}

function arrayRepeat<T>(array: T[], length: number): T[] {
  const output = []
  while (output.length < length) {
    output.push(...array)
  }
  return output
}

export default [
  {
    title: "null",
    data: [{ value: null, encoded: Uint8Array.of(NIL) }],
  },
  {
    title: "true",
    data: [{ value: true, encoded: Uint8Array.of(BOOL_TRUE) }],
  },
  {
    title: "false",
    data: [{ value: false, encoded: Uint8Array.of(BOOL_FALSE) }],
  },
  {
    title: "fixint positive",
    data: [
      { value: 0, encoded: Uint8Array.of(0x00) },
      { value: 63, encoded: Uint8Array.of(0x3f) },
      { value: 127, encoded: Uint8Array.of(0x7f) },
    ],
  },
  {
    title: "fixint negative",
    data: [
      { value: -1, encoded: Uint8Array.of(0xff) },
      { value: -32, encoded: Uint8Array.of(0xe0) },
    ],
  },
  {
    title: "uint 8",
    data: [
      { value: 128, encoded: Uint8Array.of(UINT8_PREFIX, 0x80) },
      { value: 255, encoded: Uint8Array.of(UINT8_PREFIX, 0xff) },
    ],
  },
  {
    title: "uint 16",
    data: [
      { value: 256, encoded: Uint8Array.of(UINT16_PREFIX, 0x01, 0x00) },
      { value: 65535, encoded: Uint8Array.of(UINT16_PREFIX, 0xff, 0xff) },
    ],
  },
  {
    title: "uint 32",
    data: [
      {
        value: 65536,
        encoded: Uint8Array.of(UINT32_PREFIX, 0x00, 0x01, 0x00, 0x00),
      },
      {
        value: 4294967295,
        encoded: Uint8Array.of(UINT32_PREFIX, 0xff, 0xff, 0xff, 0xff),
      },
    ],
  },
  {
    title: "uint 64",
    data: [
      {
        value: 4294967296,
        encoded: Uint8Array.of(
          UINT64_PREFIX,
          0x00,
          0x00,
          0x00,
          0x01,
          0x00,
          0x00,
          0x00,
          0x00
        ),
      },
      {
        value: Number.MAX_SAFE_INTEGER,
        encoded: Uint8Array.of(
          UINT64_PREFIX,
          0x00,
          0x1f,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff
        ),
      },
      {
        value: 0x2fffffffffffffn, // 54 bits
        encoded: Uint8Array.of(
          UINT64_PREFIX,
          0x00,
          0x2f,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff
        ),
      },
    ],
  },
  {
    title: "int 8",
    data: [
      { value: -33, encoded: Uint8Array.of(INT8_PREFIX, 0xdf) },
      { value: -127, encoded: Uint8Array.of(INT8_PREFIX, 0x81) },
    ],
  },
  {
    title: "int 16",
    data: [
      { value: -128, encoded: Uint8Array.of(INT16_PREFIX, 0xff, 0x80) },
      { value: -32767, encoded: Uint8Array.of(INT16_PREFIX, 0x80, 0x01) },
    ],
  },
  {
    title: "int 32",
    data: [
      {
        value: -32768,
        encoded: Uint8Array.of(INT32_PREFIX, 0xff, 0xff, 0x80, 0x00),
      },
      {
        value: -2147483647,
        encoded: Uint8Array.of(INT32_PREFIX, 0x80, 0x00, 0x00, 0x01),
      },
    ],
  },
  {
    title: "int 64",
    data: [
      {
        value: -2147483648,
        encoded: Uint8Array.of(
          INT64_PREFIX,
          0xff,
          0xff,
          0xff,
          0xff,
          0x80,
          0x00,
          0x00,
          0x00
        ),
      },
      {
        value: Number.MIN_SAFE_INTEGER,
        encoded: Uint8Array.of(
          INT64_PREFIX,
          0xff,
          0xe0,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x01
        ),
      },
      {
        value: BigInt(-(2 ** 53)),
        encoded: Uint8Array.of(
          INT64_PREFIX,
          0xff,
          0xe0,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00
        ),
      },
    ],
  },
  {
    title: "float 32",
    encoderWillIgnore: true,
    data: [
      {
        value: Math.fround(3.4028234e38),
        encoded: Uint8Array.of(FLOAT32_PREFIX, 0x7f, 0x7f, 0xff, 0xff),
      },
    ],
  },
  {
    title: "float 64",
    data: [
      {
        value: 1.1,
        encoded: Uint8Array.of(
          FLOAT64_PREFIX,
          0x3f,
          0xf1,
          0x99,
          0x99,
          0x99,
          0x99,
          0x99,
          0x9a
        ),
      },
    ],
  },
  {
    title: "fixstr",
    data: [
      { value: "0", encoded: Uint8Array.of(0xa1, 0x30) },
      { value: "9", encoded: Uint8Array.of(0xa1, 0x39) },
      { value: "A", encoded: Uint8Array.of(0xa1, 0x41) },
      { value: "Z", encoded: Uint8Array.of(0xa1, 0x5a) },
      { value: "a", encoded: Uint8Array.of(0xa1, 0x61) },
      { value: "z", encoded: Uint8Array.of(0xa1, 0x7a) },
      {
        value: "😂",
        encoded: Uint8Array.of(0xa4, 0xf0, 0x9f, 0x98, 0x82),
        // TODO investigate the inconsistency from msgpack.org and nodejs TextEncoder()
        // encoded: Uint8Array.of(0xa6, 0xed, 0xa0, 0xbd, 0xed, 0xb8, 0x82),
      },
    ],
  },
  {
    title: "str 8",
    data: [
      {
        value: "Hey google give me a bubble tea.",
        encoded: Uint8Array.of(
          STR8_PREFIX,
          0x20,
          0x48,
          0x65,
          0x79,
          0x20,
          0x67,
          0x6f,
          0x6f,
          0x67,
          0x6c,
          0x65,
          0x20,
          0x67,
          0x69,
          0x76,
          0x65,
          0x20,
          0x6d,
          0x65,
          0x20,
          0x61,
          0x20,
          0x62,
          0x75,
          0x62,
          0x62,
          0x6c,
          0x65,
          0x20,
          0x74,
          0x65,
          0x61,
          0x2e
        ),
      },
    ],
  },
  {
    title: "str 16",
    data: [
      {
        value: "測".repeat(Math.ceil(256 / 3)), // 258 bytes
        encoded: Uint8Array.of(
          STR16_PREFIX,
          0x01,
          0x02,
          ...arrayRepeat([0xe6, 0xb8, 0xac], 258)
        ),
      },
    ],
  },
  {
    title: "str 32",
    data: [
      {
        value: "測".repeat(Math.ceil(65536 / 3)), // 65538 bytes
        encoded: Uint8Array.of(
          STR32_PREFIX,
          0x00,
          0x01,
          0x00,
          0x02,
          ...arrayRepeat([0xe6, 0xb8, 0xac], 65538)
        ),
      },
    ],
  },
  {
    title: "bin 8",
    data: [
      {
        value: Uint8Array.of(...new Array(255).fill(NIL)),
        encoded: Uint8Array.of(BIN8_PREFIX, 0xff, ...new Array(255).fill(NIL)),
      },
    ],
  },
  {
    title: "bin 16",
    data: [
      {
        value: Uint8Array.of(...new Array(65535).fill(NIL)),
        encoded: Uint8Array.of(
          BIN16_PREFIX,
          0xff,
          0xff,
          ...new Array(65535).fill(NIL)
        ),
      },
    ],
  },
  {
    title: "bin 32",
    data: [
      {
        value: Uint8Array.of(...new Array(65536).fill(NIL)),
        encoded: Uint8Array.of(
          BIN32_PREFIX,
          0x00,
          0x01,
          0x00,
          0x00,
          ...new Array(65536).fill(NIL)
        ),
      },
    ],
  },
  {
    title: "timestamp 32",
    data: [
      {
        value: new Date(1970, 0, 1, 0, 0, 0, 0),
        encoded: Uint8Array.of(FIXEXT4_PREFIX, 0xff, 0x0, 0x0, 0x0, 0x0),
      },
      {
        value: new Date(2106, 1, 7, 6, 28, 15, 0),
        encoded: Uint8Array.of(FIXEXT4_PREFIX, 0xff, 0xff, 0xff, 0xff, 0xff),
      },
    ],
  },
  {
    title: "timestamp 64",
    data: [
      {
        value: new Date(1970, 0, 1, 0, 0, 0, 1),
        encoded: Uint8Array.of(
          FIXEXT8_PREFIX,
          0xff,
          0x0,
          0x3d,
          0x9,
          0x0,
          0x0,
          0x0,
          0x0,
          0x0
        ),
      },
      {
        value: new Date(2514, 4, 30, 1, 53, 3, 0),
        encoded: Uint8Array.of(
          FIXEXT8_PREFIX,
          0xff,
          0x0,
          0x0,
          0x0,
          0x3,
          0xff,
          0xff,
          0xff,
          0xff
        ),
      },
    ],
  },
  {
    title: "timestamp 96",
    data: [
      {
        value: new Date(2600, 0, 1, 0, 0, 0, 0),
        encoded: Uint8Array.of(
          EXT8_PREFIX,
          0xc,
          0xff,
          0x0,
          0x0,
          0x0,
          0x0,
          0x0,
          0x0,
          0x0,
          0x4,
          0xa0,
          0xfe,
          0x72,
          0x80
        ),
      },
      {
        value: new Date(-2600, 0, 1, 0, 0, 0, 0),
        encoded: Uint8Array.of(
          EXT8_PREFIX,
          0xc,
          0xff,
          0x0,
          0x0,
          0x0,
          0x0,
          0xff,
          0xff,
          0xff,
          0xde,
          0x6c,
          0x19,
          0xe7,
          0x0
        ),
      },
    ],
  },
  {
    title: "fixmap",
    data: [
      { value: {}, encoded: Uint8Array.of(0x80) },
      {
        value: { compact: true, schema: 0 },
        encoded: Uint8Array.of(
          0x82,
          0xa7,
          0x63,
          0x6f,
          0x6d,
          0x70,
          0x61,
          0x63,
          0x74,
          0xc3,
          0xa6,
          0x73,
          0x63,
          0x68,
          0x65,
          0x6d,
          0x61,
          0x00
        ),
      },
      { value: new Map(), encoded: Uint8Array.of(0x80), decoderExpected: {} },
      {
        value: new Map().set("compact", true).set("schema", 0),
        encoded: Uint8Array.of(
          0x82,
          0xa7,
          0x63,
          0x6f,
          0x6d,
          0x70,
          0x61,
          0x63,
          0x74,
          0xc3,
          0xa6,
          0x73,
          0x63,
          0x68,
          0x65,
          0x6d,
          0x61,
          0x00
        ),
        decoderExpected: { compact: true, schema: 0 },
      },
    ],
  },
  // TODO map 16
  // TODO map 32
  {
    title: "fixarray",
    data: [{ value: [], encoded: Uint8Array.of(0x90) }],
  },
  {
    title: "array 16",
    data: [
      {
        value: new Array(65535).fill(null),
        encoded: Uint8Array.of(
          ARRAY16_PREFIX,
          0xff,
          0xff,
          ...new Array(65535).fill(NIL)
        ),
      },
    ],
  },
  {
    title: "array 32",
    data: [
      {
        value: new Array(65536).fill(null),
        encoded: Uint8Array.of(
          ARRAY32_PREFIX,
          0x00,
          0x01,
          0x00,
          0x00,
          ...new Array(65536).fill(NIL)
        ),
      },
    ],
  },
] as TestCase[]
