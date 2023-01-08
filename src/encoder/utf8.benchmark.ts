import { utf8Decode } from "../decoder/utf8-decode"
import { utf8Encode } from "./utf8-encode"
import { performance } from "perf_hooks"

const testBase =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
const testCases = {
  10: testBase.slice(0, 10),
  100: testBase.slice(0, 100),
  200: testBase.slice(0, 200),
  300: testBase.slice(0, 300),
}
const types: Array<{ title: string; run: (data: string) => void }> = [
  {
    title: "TextEncoder",
    run(data: string): void {
      const textEncoder = new TextEncoder()
      for (let i = 0; i < 100; i++) {
        textEncoder.encode(data)
      }
    },
  },
  {
    title: "TextDecoder",
    run(data: string): void {
      const buf = new TextEncoder().encode(data)
      const textDecoder = new TextDecoder()
      for (let i = 0; i < 100; i++) {
        textDecoder.decode(buf)
      }
    },
  },
  {
    title: "utf8Encode",
    run(data: string): void {
      for (let i = 0; i < 100; i++) {
        utf8Encode(data)
      }
    },
  },
  {
    title: "utf8Decode",
    run(data: string): void {
      const buf = new TextEncoder().encode(data)
      for (let i = 0; i < 100; i++) {
        utf8Decode(buf)
      }
    },
  },
]
const result: Record<string, Record<string, number>> = {
  TextEncoder: {
    10: 0,
    100: 0,
    200: 0,
    300: 0,
  },
  TextDecoder: {
    10: 0,
    100: 0,
    200: 0,
    300: 0,
  },
  utf8Encode: {
    10: 0,
    100: 0,
    200: 0,
    300: 0,
  },
  utf8Decode: {
    10: 0,
    100: 0,
    200: 0,
    300: 0,
  },
}

for (const type of types) {
  for (const [k, v] of Object.entries(testCases)) {
    const start = performance.now()
    type.run(v)
    const end = performance.now()
    result[type.title][k] = Math.trunc((end - start) * 1000)
  }
}

console.table(result)
