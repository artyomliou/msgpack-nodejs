import TimeSpec from "./time-spec.js"
import { CustomExtension } from "./interface.js"

export const EXT_TYPE_TIMESTAMP = -1

/**
 * @link https://github.com/msgpack/msgpack/blob/master/spec.md#timestamp-extension-type
 * [Important] Because Javascript does not support nanoseconds, so nanoseconds will be discard.
 */
const ext: CustomExtension<Date> = {
  type: EXT_TYPE_TIMESTAMP,
  objConstructor: Date,

  encode(date: Date): Uint8Array {
    const time = TimeSpec.fromDate(date)
    if (time.nsec > 1000000000) {
      throw new Error("Nanoseconds cannot be larger than 999999999.")
    }

    if (time.sec >= 0 && time.sec <= 0xffffffff) {
      // (data64 & 0xffffffff00000000L == 0)
      // It is basically doing masking on the data64 variable, which only keep nsec, and decide if it equals to 0.
      if (time.nsec === 0) {
        // timestamp 32
        const view = new DataView(new ArrayBuffer(4))
        view.setUint32(0, Number(time.sec), false) // unsigned
        return new Uint8Array(view.buffer)
      } else {
        // timestamp 64
        const data64 = (BigInt(time.nsec) << 34n) + BigInt(time.sec)
        const view = new DataView(new ArrayBuffer(8))
        view.setBigUint64(0, data64, false) // unsigned
        return new Uint8Array(view.buffer)
      }
    } else {
      // timestamp 96
      const view = new DataView(new ArrayBuffer(12))
      view.setUint32(0, time.nsec, false) // unsigned
      view.setBigInt64(4, BigInt(time.sec), false) // signed
      return new Uint8Array(view.buffer)
    }
  },

  decode(data: Uint8Array): Date {
    const view = new DataView(data.buffer)
    if (data.byteLength === 4) {
      const sec = view.getUint32(0, false)
      return new TimeSpec(sec, 0).toDate()
    }
    if (data.byteLength === 8) {
      const data64 = view.getBigUint64(0, false)
      const nsec = Number(data64 >> 34n)
      const sec = Number(data64 & 0x00000003ffffffffn)
      return new TimeSpec(sec, nsec).toDate()
    }
    if (data.byteLength === 12) {
      const nsec = view.getUint32(0, false)
      const sec = Number(view.getBigInt64(4, false)) // signed
      return new TimeSpec(sec, nsec).toDate()
    }
    throw new Error("Timestamp family only supports 32/64/96 bit.")
  },
}

export default ext
