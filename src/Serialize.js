const ByteArray = require('./ByteArray');
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
  // FLOAT32_PREFIX,
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


/**
 * @param {Object} srcObject
 * @param {boolean} debug
 */
module.exports = function messagePackSerialize(srcObject, debug = false) {
  let byteArray = new ByteArray();
  match(byteArray, srcObject);
  
  const buffer = byteArray.getBuffer();
  if (debug) {
    console.debug(buffer);
  }
  return buffer;
};

/**
 * @param {ByteArray} byteArray
 * @param {*} val
 * @returns 
 */
function match(byteArray, val) {
  switch (typeof val) {
    case 'boolean':
      handleBoolean(byteArray, val);
      break;

    case 'bigint':
      handleInteger(byteArray, val);
      break;
    
    case 'number':
      if (Number.isInteger(val)) {
        handleInteger(byteArray, val);
      } else {
        handleFloat(byteArray, val);
      }
      break;
    
    case 'string':
      handleString(byteArray, val);
      break;

    case 'object':
      if (val === null) {
        byteArray.writeUint8(NIL);
        break;
      }
      if (val instanceof Date) {
        handleTimestamp(byteArray, val);
        break;
      }
      if (Buffer.isBuffer(val)) {
        handleBuffer(byteArray, val);
        break;
      }
      if (Array.isArray(val)) {
        handleArray(byteArray, val);
        for (const element of val) {
          match(byteArray, element)
        }
        break;
      }

      // Handling typical object
      handleMap(byteArray, val);
      for (const [k, v] of Object.entries(val)) {
        handleString(byteArray, k);
        match(byteArray, v)
      }
      break;
  
    default:
      console.debug('noop', val);
      // No support for Symbol, Function, Undefined
      break;
  }
}

/**
 * @param {ByteArray} byteArray
 * @param {Number} number
 * @returns 
 */
function handleBoolean(byteArray, val = true) {
  if (val) {
    byteArray.writeUint8(BOOL_TRUE);
  } else {
    byteArray.writeUint8(BOOL_FALSE);
  }
}

/**
 * @param {ByteArray} byteArray
 * @param {Number} number
 * @returns 
 */
function handleInteger(byteArray, number = 0) {
  // positive fixint stores 7-bit positive integer
  // 0b1111111 = 127
  if (number >= 0 && number <= 127) {
    byteArray.writeUint8(number);
    return;
  }

  // negative fixint stores 5-bit negative integer
  if (number < 0 && number >= -32) {
    byteArray.writeInt8(number);
    return;
  }

  // unsigned
  if (number > 0) {
    if (number <= 0xFF) {
      byteArray.writeUint8(UINT8_PREFIX);
      byteArray.writeUint8(number);
      return;
    }
    if (number <= 0xFFFF) {
      byteArray.writeUint8(UINT16_PREFIX);
      byteArray.writeUint16(number);
      return;
    }
    if (number <= 0xFFFFFFFF) {
      byteArray.writeUint8(UINT32_PREFIX);
      byteArray.writeUint32(number);
      return;
    }
    byteArray.writeUint8(UINT64_PREFIX);
    byteArray.writeUint64(number);
    return;
  }

  // signed
  if (number < 0) {
    if (-number <= 0xFF) {
      byteArray.writeInt8(INT8_PREFIX);
      byteArray.writeInt8(number);
      return;
    }
    if (-number <= 0xFFFF) {
      byteArray.writeUint8(INT16_PREFIX);
      byteArray.writeInt16(number);
      return;
    }
    if (-number <= 0xFFFFFFFF) {
      byteArray.writeUint8(INT32_PREFIX);
      byteArray.writeInt32(number);
      return;
    }
    byteArray.writeUint8(INT64_PREFIX);
    byteArray.writeInt64(number);
    return;
  }
}

/**
 * @param {ByteArray} byteArray
 * @param {Number} number
 * @returns 
 */
function handleFloat(byteArray, number = 0) {
  // Since all float in Javascript is double, it's not possible to have FLOAT32 type.
  byteArray.writeUint8(FLOAT64_PREFIX);
  byteArray.writeFloat64(number);
}

/**
 * @param {ByteArray} byteArray
 * @param {String} string
 * @returns 
 */
function handleString(byteArray, string = '') {
  const strBuf = Buffer.from(string, "utf-8");
  const bytesCount = strBuf.byteLength;
  if (bytesCount <= 31) {
    byteArray.writeUint8(0b10100000 + bytesCount);
    byteArray.writeBuffer(strBuf);
    return;
  }
  if (bytesCount <= (2**8)-1) {
    byteArray.writeUint8(STR8_PREFIX);
    byteArray.writeUint8(bytesCount);
    byteArray.writeBuffer(strBuf);
    return;
  }
  if (bytesCount <= (2**16)-1) {
    byteArray.writeUint8(STR16_PREFIX);
    byteArray.writeUint16(bytesCount);
    byteArray.writeBuffer(strBuf);
    return;
  }
  if (bytesCount <= (2**32)-1) {
    byteArray.writeUint8(STR32_PREFIX);
    byteArray.writeUint32(bytesCount);
    byteArray.writeBuffer(strBuf);
    return;
  }
}

/**
 * @param {ByteArray} byteArray
 * @param {Buffer} buffer
 * @returns 
 */
function handleBuffer(byteArray, buffer) {
  const bytesCount = buffer.byteLength;
  if (bytesCount <= (2**8)-1) {
    byteArray.writeUint8(BIN8_PREFIX);
    byteArray.writeUint8(bytesCount);
    byteArray.writeBuffer(buffer);
    return;
  }
  if (bytesCount <= (2**16)-1) {
    byteArray.writeUint8(BIN16_PREFIX);
    byteArray.writeUint16(bytesCount);
    byteArray.writeBuffer(buffer);
    return;
  }
  if (bytesCount <= (2**32)-1) {
    byteArray.writeUint8(BIN32_PREFIX);
    byteArray.writeUint32(bytesCount);
    byteArray.writeBuffer(buffer);
    return;
  }
}

/**
 * @param {ByteArray} byteArray
 * @param {Array} array
 * @returns 
 */
function handleArray(byteArray, array = {}) {
  const arraySize = array.length;

  // fixarray
  if (arraySize < 0xF) {
    byteArray.writeUint8(0b10010000 + arraySize);
    return;
  }
  
  // map 16
  if (arraySize < 0xFFFF) {
    byteArray.writeUint8(ARRAY16_PREFIX);
    byteArray.writeUint16(arraySize);
    return;
  }
  
  // map 32
  if (arraySize < 0xFFFFFFFF) {
    byteArray.writeUint8(ARRAY32_PREFIX);
    byteArray.writeUint32(arraySize);
    return;
  }

  throw new Error('Cannot handle array with more than (2^32)-1 elements.');
}

/**
 * @param {ByteArray} byteArray
 * @param {Object} map
 * @returns 
 */
function handleMap(byteArray, map = {}) {
  const mapSize = Object.keys(map).length;

  // fixmap
  if (mapSize < 0xF) {
    byteArray.writeUint8(0b10000000 + mapSize);
    return;
  }
  
  // map 16
  if (mapSize < 0xFFFF) {
    byteArray.writeUint8(MAP16_PREFIX);
    byteArray.writeUint16(mapSize);
    return;
  }
  
  // map 32
  if (mapSize < 0xFFFFFFFF) {
    byteArray.writeUint8(MAP32_PREFIX);
    byteArray.writeUint32(mapSize);
    return;
  }

  throw new Error('Cannot handle map with more than (2^32)-1 pairs.');
}

/**
 * @param {ByteArray} byteArray
 * @param {Date} date
 * @returns 
 * @ref https://github.com/msgpack/msgpack/blob/master/spec.md#timestamp-extension-type
 */
function handleTimestamp(byteArray, date) {
  const time = TimeSpec.fromDate(date);
  if (time.nsec > 1000000000) {
    throw new Error("Nanoseconds cannot be larger than 999999999.");
  }
  if (time.sec >= 0) {
    if (time.nsec == 0) {
      // timestamp 32
      const buf = new ArrayBuffer(4);
      const view = new DataView(buf);
      view.setUint32(0, time.sec, false); // unsigned
      handleExt(byteArray, EXT_TYPE_TIMESTAMP, buf);
    } else {
      // timestamp 64
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      view.setUint32(0, time.nsec, false); // unsigned
      view.setUint32(4, time.sec, false); // unsigned
      handleExt(byteArray, EXT_TYPE_TIMESTAMP, buf);
    } 
  } else {
    // timestamp 96
    const buf = new ArrayBuffer(12);
    const view = new DataView(buf);
    view.setUint32(0, time.nsec, false); // unsigned
    view.setBigInt64(0, BigInt(time.sec), false); // signed
    handleExt(byteArray, EXT_TYPE_TIMESTAMP, buf);
  }
}

/**
 * @param {ByteArray} byteArray
 * @param {Number} type
 * @param {ArrayBuffer|Buffer} data
 * @returns 
 */
function handleExt(byteArray, type, data) {
  if (data instanceof ArrayBuffer) {
    data = Buffer.from(data);
  }
  const byteLength = data.byteLength;

  // fixint
  if (byteLength === 1) {
    byteArray.writeUint8(FIXEXT1_PREFIX);
    byteArray.writeInt8(type);
    byteArray.writeBuffer(data);
    return;

  } else if (byteLength === 2) {
    byteArray.writeUint8(FIXEXT2_PREFIX);
    byteArray.writeInt8(type);
    byteArray.writeBuffer(data);
    return;

  } else if (byteLength === 4) {
    byteArray.writeUint8(FIXEXT4_PREFIX);
    byteArray.writeInt8(type);
    byteArray.writeBuffer(data);
    return;

  } else if (byteLength === 8) {
    byteArray.writeUint8(FIXEXT8_PREFIX);
    byteArray.writeInt8(type);
    byteArray.writeBuffer(data);
    return;

  } else if (byteLength === 16) {
    byteArray.writeUint8(FIXEXT16_PREFIX);
    byteArray.writeInt8(type);
    byteArray.writeBuffer(data);
    return;
  }

  // ext 8
  if (byteLength <= 2**8-1) {
    byteArray.writeUint8(EXT8_PREFIX);
    byteArray.writeUint8(byteLength);
    byteArray.writeInt8(type);
    byteArray.writeBuffer(data);
    return;

  } else if (byteLength <= 2**16-1) {
    byteArray.writeUint8(EXT16_PREFIX);
    byteArray.writeUint16(byteLength);
    byteArray.writeInt8(type);
    byteArray.writeBuffer(data);
    return;

  } else if (byteLength <= 2**32-1) {
    byteArray.writeUint8(EXT32_PREFIX);
    byteArray.writeUint32(byteLength);
    byteArray.writeInt8(type);
    byteArray.writeBuffer(data);
    return;

  }

  throw new Error("Ext does not support data exceeding 2**32-1 bytes.");
}