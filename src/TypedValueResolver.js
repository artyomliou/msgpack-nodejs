const {
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
  EXT_TYPE_TIMESTAMP,
} = require('./constants');
const TimeSpec = require('./TimeSpec');

module.exports = class TypedValueResolver {

  static typeInt = 1;
  static typeNil = 2;
  static typeBool = 3;
  static typeFloat = 4;
  static typeStr = 5;
  static typeBin = 6;
  static typeArray = 7;
  static typeMap = 8;
  static typeExt = 9;

  /**
   * Resolved type
   */
  type;

  /**
   * Resolved value
   * @type {Number|BigInt|null|boolean|string|Buffer|Array|Object|null}
   */
  value;

  /**
   * Total length of bytes. For array/map, this value does not include its elements.
   * Deserializer may use this information to move outside position.
   */
  byteLength;

  /**
   * (For array/map) Total count of elements.
   */
  elementCount;

  /**
   * @param {DataView} view 
   * @param {Number} pos 
   */
  constructor(view, pos = 0) {
    this.type = 0;
    this.value = null;
    this.byteLength = 0;
    this.elementCount = 0;

    // Get first byte
    const firstByte = view.getUint8(pos);

    // Move pointer for resolving value
    // (Do remember, because of pass by value, increment happening here will not affect the outside one)
    pos++;

    // integer
    if (firstByte >= 0x00 && firstByte <= 0x7f) {
      this.byteLength = 1;
      this.value = view.getUint8(pos-1);

    } else if (firstByte >= 0xe0 && firstByte <= 0xff) {
      this.byteLength = 1;
      this.value = view.getInt8(pos-1);

    } else if (firstByte === UINT8_PREFIX) {
      this.byteLength = 2;
      this.value = view.getUint8(pos);

    } else if (firstByte === UINT16_PREFIX) {
      this.byteLength = 3;
      this.value = view.getUint16(pos, false);

    } else if (firstByte === UINT32_PREFIX) {
      this.byteLength = 5;
      this.value = view.getUint32(pos, false);

    } else if (firstByte === UINT64_PREFIX) {
      this.byteLength = 9;
      this.value = view.getBigUint64(pos, false);

    } else if (firstByte === INT8_PREFIX) {
      this.byteLength = 2;
      this.value = view.getInt8(pos);

    } else if (firstByte === INT16_PREFIX) {
      this.byteLength = 3;
      this.value = view.getInt16(pos, false);

    } else if (firstByte === INT32_PREFIX) {
      this.byteLength = 5;
      this.value = view.getInt32(pos, false);

    } else if (firstByte === INT64_PREFIX) {
      this.byteLength = 9;
      this.value = view.getBigInt64(pos, false);

    }
    if (this.byteLength) {
      this.type = TypedValueResolver.typeInt;
      return;
    }

    // null
    if (firstByte === NIL) {
      this.byteLength = 1;
      this.value = null;
      this.type = TypedValueResolver.typeNil;
      return;
    }

    // bool
    if (firstByte === BOOL_TRUE || firstByte === BOOL_FALSE) {
      this.byteLength = 1;
      this.value = (firstByte === BOOL_TRUE);
      this.type = TypedValueResolver.typeBool;
      return;
    }

    // float
    if (firstByte === FLOAT32_PREFIX) {
      this.byteLength = 5;
      this.value = view.getFloat32(pos, false);
      this.type = TypedValueResolver.typeFloat;
      return;
    }
    if (firstByte === FLOAT64_PREFIX) {
      this.byteLength = 9;
      this.value = view.getFloat64(pos, false);
      this.type = TypedValueResolver.typeFloat;
      return;
    }

    // These 2 variables are declard for str & bin, because they share same resolving logic
    let sizeByteLength;
    let dataByteLength;

    // str
    if (firstByte >= 0xa0 && firstByte <= 0xbf) {
      sizeByteLength = 0;
      dataByteLength = firstByte - 0xa0;
    } else if (firstByte === STR8_PREFIX) {
      sizeByteLength = 1;
      dataByteLength = view.getUint8(pos);
    } else if (firstByte === STR16_PREFIX) {
      sizeByteLength = 2;
      dataByteLength = view.getUint16(pos);
    } else if (firstByte === STR32_PREFIX) {
      sizeByteLength = 4;
      dataByteLength = view.getUint32(pos);
    }
    if (sizeByteLength || dataByteLength) {
      // Calculate total length of this string value, so we can move outside position properly
      this.byteLength = 1 + sizeByteLength + dataByteLength;

      // Calculate the range
      const strDataRange = this.#calculateDataRange(pos, sizeByteLength, dataByteLength);

      const txt = new TextDecoder();
      this.value = txt.decode(view.buffer.slice(strDataRange.start, strDataRange.end));
      this.type = TypedValueResolver.typeStr;
      return;
    }

    // bin
    if (firstByte === BIN8_PREFIX) {
      sizeByteLength = 1;
      dataByteLength = view.getUint8(pos);
    } else if (firstByte === BIN16_PREFIX) {
      sizeByteLength = 2;
      dataByteLength = view.getUint16(pos);
    } else if (firstByte === BIN32_PREFIX) {
      sizeByteLength = 4;
      dataByteLength = view.getUint32(pos);
    }
    if (sizeByteLength || dataByteLength) {
      this.byteLength = 1 + sizeByteLength + dataByteLength;
      const binDataRange = this.#calculateDataRange(pos, sizeByteLength, dataByteLength);

      this.value = Buffer.from(view.buffer.slice(binDataRange.start, binDataRange.end));
      this.type = TypedValueResolver.typeBin;
      return;
    }

    // array
    if (firstByte >= 0x90 && firstByte <= 0x9f) {
      this.byteLength = 1;
      this.elementCount = (firstByte - 0b10010000);
    } else if (firstByte === ARRAY16_PREFIX) {
      this.byteLength = 3;
      this.elementCount = view.getUint16(pos);
    } else if (firstByte === ARRAY32_PREFIX) {
      this.byteLength = 5;
      this.elementCount = view.getUint32(pos);
    }
    if (this.byteLength) {
      this.value = [];
      this.type = TypedValueResolver.typeArray;
      return;
    }

    // map
    if (firstByte >= 0x80 && firstByte <= 0x8f) {
      this.byteLength = 1;
      this.elementCount = (firstByte - 0x80);
    } else if (firstByte === MAP16_PREFIX) {
      this.byteLength = 3;
      this.elementCount = view.getUint16(pos);
    } else if (firstByte === MAP32_PREFIX) {
      this.byteLength = 5;
      this.elementCount = view.getUint32(pos);
    }
    if (this.byteLength) {
      this.value = {};
      this.type = TypedValueResolver.typeMap;
      return;
    }

    // ext
    if (firstByte === FIXEXT1_PREFIX) {
      sizeByteLength = 0;
      dataByteLength = 1;
    } else if (firstByte === FIXEXT2_PREFIX) {
      sizeByteLength = 0;
      dataByteLength = 2;
    } else if (firstByte === FIXEXT4_PREFIX) {
      sizeByteLength = 0;
      dataByteLength = 4;
    } else if (firstByte === FIXEXT8_PREFIX) {
      sizeByteLength = 0;
      dataByteLength = 8;
    } else if (firstByte === FIXEXT16_PREFIX) {
      sizeByteLength = 0;
      dataByteLength = 16;
    } else if (firstByte === EXT8_PREFIX) {
      sizeByteLength = 1;
      dataByteLength = view.getUint8(pos);
    } else if (firstByte === EXT16_PREFIX) {
      sizeByteLength = 2;
      dataByteLength = view.getUint16(pos);
    } else if (firstByte === EXT32_PREFIX) {
      sizeByteLength = 4;
      dataByteLength = view.getUint32(pos);
    }
    if (dataByteLength) {
      // Reminder: At this point, pos is after firstByte
      const extType = view.getInt8(pos + sizeByteLength);

      // Offset should include "size" and "type"
      const extDataRange = this.#calculateDataRange(pos, (sizeByteLength + 1), dataByteLength);
      const data = view.buffer.slice(extDataRange.start, extDataRange.end);

      // Must-have settings 
      this.byteLength = 1 + sizeByteLength + 1 + dataByteLength;
      this.type = TypedValueResolver.typeExt;

      // Postprocess for supported extType
      // [Important] Because Javascript does not support nanoseconds, so nanoseconds will be discard.
      if (extType === EXT_TYPE_TIMESTAMP) {
        if (data.byteLength === 4) {
          const sec = (new DataView(data)).getUint8(0);
          this.value = new TimeSpec(sec, 0);
          return;

        } else if (data.byteLength === 8) {
          const view = new DataView(data);
          const nsec = view.getUint32(0, false);
          const sec = view.getUint32(4, false);
          this.value = new TimeSpec(sec, nsec);
          return;

        } else if (data.byteLength === 12) {
          const view = new DataView(data);
          const nsec = view.getUint32(0, false);
          const sec = view.getBigInt64(4, false);
          this.value = new TimeSpec(sec, nsec);
          return;

        } else {
          throw new Error(`Timestamp family only supports 32/64/96 bit.`);
        }
      } else {
        throw new Error(`Does not support unknown ext type.`);
      }
    }
  }

  /**
   * @param {Number} pos 
   * @param {Number} offset
   * @param {Number} dataByteLength 
   * @returns 
   */
  #calculateDataRange(pos, offset = 0, dataByteLength = 0) {
    return {
      start: pos + offset, // inclusive
      end: (pos + offset) + dataByteLength, // exclusive
    }
  }
}