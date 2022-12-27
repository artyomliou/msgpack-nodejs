import {
  NIL,
  BOOL_FALSE,
  BOOL_TRUE,
  BIN8_PREFIX,
  BIN16_PREFIX,
  BIN32_PREFIX,
  EXT8_PREFIX,
  EXT16_PREFIX,
  EXT32_PREFIX,
  FLOAT32_PREFIX,
  FLOAT64_PREFIX,
  UINT8_PREFIX,
  UINT16_PREFIX,
  UINT32_PREFIX,
  UINT64_PREFIX,
  INT8_PREFIX,
  INT16_PREFIX,
  INT32_PREFIX,
  INT64_PREFIX,
  FIXEXT1_PREFIX,
  FIXEXT2_PREFIX,
  FIXEXT4_PREFIX,
  FIXEXT8_PREFIX,
  FIXEXT16_PREFIX,
  STR8_PREFIX,
  STR16_PREFIX,
  STR32_PREFIX,
  ARRAY16_PREFIX,
  ARRAY32_PREFIX,
  MAP16_PREFIX,
  MAP32_PREFIX,
  EXT_TYPE_TIMESTAMP
} from '../constants/index.js'
import TimeSpec from '../TimeSpec.js'

export default class TypedValueResolver {
  static typeInt = 1
  static typeNil = 2
  static typeBool = 3
  static typeFloat = 4
  static typeStr = 5
  static typeBin = 6
  static typeArray = 7
  static typeMap = 8
  static typeExt = 9

  static prefixTypeMap = new Map([
    [UINT8_PREFIX, TypedValueResolver.typeInt],
    [UINT16_PREFIX, TypedValueResolver.typeInt],
    [UINT32_PREFIX, TypedValueResolver.typeInt],
    [UINT64_PREFIX, TypedValueResolver.typeInt],
    [INT8_PREFIX, TypedValueResolver.typeInt],
    [INT16_PREFIX, TypedValueResolver.typeInt],
    [INT32_PREFIX, TypedValueResolver.typeInt],
    [INT64_PREFIX, TypedValueResolver.typeInt],
    [NIL, TypedValueResolver.typeNil],
    [BOOL_FALSE, TypedValueResolver.typeBool],
    [BOOL_TRUE, TypedValueResolver.typeBool],
    [FLOAT32_PREFIX, TypedValueResolver.typeFloat],
    [FLOAT64_PREFIX, TypedValueResolver.typeFloat],
    [STR8_PREFIX, TypedValueResolver.typeStr],
    [STR16_PREFIX, TypedValueResolver.typeStr],
    [STR32_PREFIX, TypedValueResolver.typeStr],
    [BIN8_PREFIX, TypedValueResolver.typeBin],
    [BIN16_PREFIX, TypedValueResolver.typeBin],
    [BIN32_PREFIX, TypedValueResolver.typeBin],
    [ARRAY16_PREFIX, TypedValueResolver.typeArray],
    [ARRAY32_PREFIX, TypedValueResolver.typeArray],
    [MAP16_PREFIX, TypedValueResolver.typeMap],
    [MAP32_PREFIX, TypedValueResolver.typeMap],
    [EXT8_PREFIX, TypedValueResolver.typeExt],
    [EXT16_PREFIX, TypedValueResolver.typeExt],
    [EXT32_PREFIX, TypedValueResolver.typeExt],
    [FIXEXT1_PREFIX, TypedValueResolver.typeExt],
    [FIXEXT2_PREFIX, TypedValueResolver.typeExt],
    [FIXEXT4_PREFIX, TypedValueResolver.typeExt],
    [FIXEXT8_PREFIX, TypedValueResolver.typeExt],
    [FIXEXT16_PREFIX, TypedValueResolver.typeExt]
  ])

  /**
   * Resolved type
   */
  type = 0

  /**
   * Resolved value
   * @type {Number|BigInt|null|boolean|string|Buffer|Array|Object|null}
   */
  value = null

  /**
   * Total length of bytes. For array/map, this value does not include its elements.
   * Deserializer may use this information to move outside position.
   */
  byteLength = 0

  /**
   * (For array/map) Total count of elements.
   */
  elementCount = 0

  /**
   * @param {DataView} view
   * @param {Number} pos
   */
  constructor (view, pos = 0) {
    // Get first byte & ove pointer for resolving value
    // (Reminder: because of pass by value, increment happening here will not affect the outside one)
    const firstByte = view.getUint8(pos)
    pos++

    // Match first byte with prefixes
    const searchResult = TypedValueResolver.prefixTypeMap.get(firstByte)
    if (searchResult) {
      switch (searchResult) {
        case TypedValueResolver.typeInt: this.#handleInteger(view, pos, firstByte); return
        case TypedValueResolver.typeNil: this.#handleNil(view, pos, firstByte); return
        case TypedValueResolver.typeBool: this.#handleBool(view, pos, firstByte); return
        case TypedValueResolver.typeFloat: this.#handleFloat(view, pos, firstByte); return
        case TypedValueResolver.typeStr: this.#handleStr(view, pos, firstByte); return
        case TypedValueResolver.typeBin: this.#handleBin(view, pos, firstByte); return
        case TypedValueResolver.typeArray: this.#handleArray(view, pos, firstByte); return
        case TypedValueResolver.typeMap: this.#handleMap(view, pos, firstByte); return
        case TypedValueResolver.typeExt: this.#handleExt(view, pos, firstByte); return
        default: throw new Error('Should match exactly one type.')
      }
    }

    // Match first byte for these single byte data (fix-)
    if (firstByte >= 0x00 && firstByte <= 0x7f) {
      this.#handleInteger(view, pos, firstByte) // fixint
    } else if (firstByte >= 0xe0 && firstByte <= 0xff) {
      this.#handleInteger(view, pos, firstByte) // fixint
    } else if (firstByte >= 0xa0 && firstByte <= 0xbf) {
      this.#handleStr(view, pos, firstByte) // fixstr
    } else if (firstByte >= 0x90 && firstByte <= 0x9f) {
      this.#handleArray(view, pos, firstByte) // fixarray
    } else if (firstByte >= 0x80 && firstByte <= 0x8f) {
      this.#handleMap(view, pos, firstByte) // fixmap
    } else {
      const firtByteHex = firstByte.toString(16)
      console.error('Unknown first byte.', firtByteHex)
      throw new Error(`Unknown first byte. (${firtByteHex})`)
    }
  }

  /**
   * @param {DataView} view
   * @param {Number} pos
   * @param {Number} firstByte
   */
  #handleInteger (view, pos, firstByte) {
    this.type = TypedValueResolver.typeInt

    if (firstByte >= 0x00 && firstByte <= 0x7f) {
      this.byteLength = 1
      this.value = view.getUint8(pos - 1)
    } else if (firstByte >= 0xe0 && firstByte <= 0xff) {
      this.byteLength = 1
      this.value = view.getInt8(pos - 1)
    } else if (firstByte === UINT8_PREFIX) {
      this.byteLength = 2
      this.value = view.getUint8(pos)
    } else if (firstByte === UINT16_PREFIX) {
      this.byteLength = 3
      this.value = view.getUint16(pos, false)
    } else if (firstByte === UINT32_PREFIX) {
      this.byteLength = 5
      this.value = view.getUint32(pos, false)
    } else if (firstByte === UINT64_PREFIX) {
      this.byteLength = 9
      this.value = view.getBigUint64(pos, false)
    } else if (firstByte === INT8_PREFIX) {
      this.byteLength = 2
      this.value = view.getInt8(pos)
    } else if (firstByte === INT16_PREFIX) {
      this.byteLength = 3
      this.value = view.getInt16(pos, false)
    } else if (firstByte === INT32_PREFIX) {
      this.byteLength = 5
      this.value = view.getInt32(pos, false)
    } else if (firstByte === INT64_PREFIX) {
      this.byteLength = 9
      this.value = view.getBigInt64(pos, false)
    }
  }

  /**
   * @param {DataView} view
   * @param {Number} pos
   * @param {Number} firstByte
   */
  #handleNil (view, pos, firstByte) {
    this.type = TypedValueResolver.typeNil
    this.byteLength = 1
    this.value = null
  }

  /**
   * @param {DataView} view
   * @param {Number} pos
   * @param {Number} firstByte
   */
  #handleBool (view, pos, firstByte) {
    this.type = TypedValueResolver.typeBool
    this.byteLength = 1
    this.value = (firstByte === BOOL_TRUE)
  }

  /**
   * @param {DataView} view
   * @param {Number} pos
   * @param {Number} firstByte
   */
  #handleFloat (view, pos, firstByte) {
    this.type = TypedValueResolver.typeFloat

    if (firstByte === FLOAT32_PREFIX) {
      this.byteLength = 5
      this.value = view.getFloat32(pos, false)
    } else if (firstByte === FLOAT64_PREFIX) {
      this.byteLength = 9
      this.value = view.getFloat64(pos, false)
    }
  }

  /**
   * @param {DataView} view
   * @param {Number} pos
   * @param {Number} firstByte
   */
  #handleStr (view, pos, firstByte) {
    this.type = TypedValueResolver.typeStr

    let sizeByteLength
    let dataByteLength
    if (firstByte >= 0xa0 && firstByte <= 0xbf) {
      sizeByteLength = 0
      dataByteLength = firstByte - 0xa0
    } else if (firstByte === STR8_PREFIX) {
      sizeByteLength = 1
      dataByteLength = view.getUint8(pos)
    } else if (firstByte === STR16_PREFIX) {
      sizeByteLength = 2
      dataByteLength = view.getUint16(pos)
    } else if (firstByte === STR32_PREFIX) {
      sizeByteLength = 4
      dataByteLength = view.getUint32(pos)
    }

    // Calculate total length of this string value, so we can move outside position properly
    this.byteLength = 1 + sizeByteLength + dataByteLength

    // Calculate the range
    const strDataRange = this.#calculateDataRange(pos, sizeByteLength, dataByteLength)
    this.value = new TextDecoder().decode(view.buffer.slice(strDataRange.start, strDataRange.end))
  }

  /**
   * @param {DataView} view
   * @param {Number} pos
   * @param {Number} firstByte
   */
  #handleBin (view, pos, firstByte) {
    this.type = TypedValueResolver.typeBin

    let sizeByteLength
    let dataByteLength
    if (firstByte === BIN8_PREFIX) {
      sizeByteLength = 1
      dataByteLength = view.getUint8(pos)
    } else if (firstByte === BIN16_PREFIX) {
      sizeByteLength = 2
      dataByteLength = view.getUint16(pos)
    } else if (firstByte === BIN32_PREFIX) {
      sizeByteLength = 4
      dataByteLength = view.getUint32(pos)
    }

    this.byteLength = 1 + sizeByteLength + dataByteLength
    const binDataRange = this.#calculateDataRange(pos, sizeByteLength, dataByteLength)
    this.value = view.buffer.slice(binDataRange.start, binDataRange.end)
  }

  /**
   * @param {DataView} view
   * @param {Number} pos
   * @param {Number} firstByte
   */
  #handleArray (view, pos, firstByte) {
    this.type = TypedValueResolver.typeArray
    this.value = []

    if (firstByte >= 0x90 && firstByte <= 0x9f) {
      this.byteLength = 1
      this.elementCount = (firstByte - 0b10010000)
    } else if (firstByte === ARRAY16_PREFIX) {
      this.byteLength = 3
      this.elementCount = view.getUint16(pos)
    } else if (firstByte === ARRAY32_PREFIX) {
      this.byteLength = 5
      this.elementCount = view.getUint32(pos)
    }
  }

  /**
   * @param {DataView} view
   * @param {Number} pos
   * @param {Number} firstByte
   */
  #handleMap (view, pos, firstByte) {
    this.type = TypedValueResolver.typeMap
    this.value = {}

    if (firstByte >= 0x80 && firstByte <= 0x8f) {
      this.byteLength = 1
      this.elementCount = (firstByte - 0x80)
    } else if (firstByte === MAP16_PREFIX) {
      this.byteLength = 3
      this.elementCount = view.getUint16(pos)
    } else if (firstByte === MAP32_PREFIX) {
      this.byteLength = 5
      this.elementCount = view.getUint32(pos)
    }
  }

  /**
   * @param {DataView} view
   * @param {Number} pos
   * @param {Number} firstByte
   */
  #handleExt (view, pos, firstByte) {
    this.type = TypedValueResolver.typeExt

    let sizeByteLength
    let dataByteLength
    if (firstByte === FIXEXT1_PREFIX) {
      sizeByteLength = 0
      dataByteLength = 1
    } else if (firstByte === FIXEXT2_PREFIX) {
      sizeByteLength = 0
      dataByteLength = 2
    } else if (firstByte === FIXEXT4_PREFIX) {
      sizeByteLength = 0
      dataByteLength = 4
    } else if (firstByte === FIXEXT8_PREFIX) {
      sizeByteLength = 0
      dataByteLength = 8
    } else if (firstByte === FIXEXT16_PREFIX) {
      sizeByteLength = 0
      dataByteLength = 16
    } else if (firstByte === EXT8_PREFIX) {
      sizeByteLength = 1
      dataByteLength = view.getUint8(pos)
    } else if (firstByte === EXT16_PREFIX) {
      sizeByteLength = 2
      dataByteLength = view.getUint16(pos)
    } else if (firstByte === EXT32_PREFIX) {
      sizeByteLength = 4
      dataByteLength = view.getUint32(pos)
    }

    this.byteLength = 1 + sizeByteLength + 1 + dataByteLength

    // Reminder: At this point, pos is after firstByte
    const extType = view.getInt8(pos + sizeByteLength)

    // Offset should include "size" and "type"
    const extDataRange = this.#calculateDataRange(pos, (sizeByteLength + 1), dataByteLength)
    const data = view.buffer.slice(extDataRange.start, extDataRange.end)

    // Postprocess for supported extType
    // [Important] Because Javascript does not support nanoseconds, so nanoseconds will be discard.
    if (extType === EXT_TYPE_TIMESTAMP) {
      const view = new DataView(data)
      if (data.byteLength === 4) {
        const sec = view.getUint32(0, false)
        this.value = new TimeSpec(sec, 0).toDate()
        return
      }
      if (data.byteLength === 8) {
        const data64 = view.getBigUint64(0, false)
        const nsec = Number(data64 >> 34n)
        const sec = Number(data64 & 0x00000003ffffffffn)
        this.value = new TimeSpec(sec, nsec).toDate()
        return
      }
      if (data.byteLength === 12) {
        const nsec = view.getUint32(0, false)
        const sec = Number(view.getBigInt64(4, false)) // signed
        this.value = new TimeSpec(sec, nsec).toDate()
        return
      }
      throw new Error('Timestamp family only supports 32/64/96 bit.')
    } else {
      throw new Error('Does not support unknown ext type.')
    }
  }

  /**
   * @param {Number} pos
   * @param {Number} offset
   * @param {Number} dataByteLength
   * @returns
   */
  #calculateDataRange (pos, offset = 0, dataByteLength = 0) {
    return {
      start: pos + offset, // inclusive
      end: (pos + offset) + dataByteLength // exclusive
    }
  }
}
