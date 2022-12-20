const ByteArray = require('./ByteArray');

const NIL = 0xc0;
const BOOL_FALSE = 0xc2;
const BOOL_TRUE = 0xc3;
const BIN8_PREFIX = 0xc4;
const BIN16_PREFIX = 0xc5;
const BIN32_PREFIX = 0xc6;
const EXT8_PREFIX = 0xc7;
const EXT16_PREFIX = 0xc8;
const EXT32_PREFIX = 0xc9;
const UINT8_PREFIX = 0xcc;
const UINT16_PREFIX = 0xcd;
const UINT32_PREFIX = 0xce;
const UINT64_PREFIX = 0xcf;
const INT8_PREFIX = 0xd0;
const INT16_PREFIX = 0xd1;
const INT32_PREFIX = 0xd2;
const INT64_PREFIX = 0xd3;
const FIXEXT1_PREFIX = 0xd4;
const FIXEXT2_PREFIX = 0xd5;
const FIXEXT4_PREFIX = 0xd6;
const FIXEXT8_PREFIX = 0xd7;
const FIXEXT16_PREFIX = 0xd8;
const STR8_PREFIX = 0xd9;
const STR16_PREFIX = 0xda;
const STR32_PREFIX = 0xdb;
const ARRAY16_PREFIX = 0xdc;
const ARRAY32_PREFIX = 0xdd;
const MAP16_PREFIX = 0xde;
const MAP32_PREFIX = 0xdf;

/**
 * @param {Object} srcObject
 */
module.exports = function messagePackSerialize(srcObject) {
  let byteArray = new ByteArray();
  match(byteArray, srcObject);
  return byteArray.getBuffer();
};

/**
 * @param {ByteArray} byteArray
 * @param {*} val
 * @returns 
 */
function match(byteArray, val) {
  const type = typeof val;

  if (val === null) {
    byteArray.writeUint8(NIL);

  } else if (type == 'boolean') {
    if (val) {
      byteArray.writeUint8(BOOL_TRUE);
    } else {
      byteArray.writeUint8(BOOL_FALSE);
    }

  } else if (type == 'number' || type == 'bigint') {
    if (Number.isInteger(val)) {
      handleInteger(byteArray, val);
    } else {
      handleFloat(byteArray, val);
    }
  } else if (type == 'string') {
    handleString(byteArray, val);

  } else if (Buffer.isBuffer(val)) {
    handleBuffer(byteArray, val);

  } else if (Array.isArray(val)) {
    handleArray(byteArray, val);
    for (const element of val) {
      match(byteArray, element)
    }

  } else if (type == 'object') {
    handleMap(byteArray, val);
    for (const [k, v] of Object.entries(val)) {
      handleString(byteArray, k);
      match(byteArray, v)
    }

  } else {
    console.debug('noop', val);
    // TODO No support for Symbol, Function, Undefined
  }
  // TODO ext
  // TODO timestamp
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
      byteArray.writeUint16(UINT16_PREFIX);
      byteArray.writeUint16(number);
      return;
    }
    if (number <= 0xFFFFFF) {
      byteArray.writeUint32(UINT32_PREFIX);
      byteArray.writeUint32(number);
      return;
    }
    if (number <= 0xFFFFFFFF) {
      byteArray.writeUint64(UINT64_PREFIX);
      byteArray.writeUint64(number);
      return;
    }
  }

  // signed
  if (number < 0) {
    if (-number <= 0xFF) {
      byteArray.writeInt8(INT8_PREFIX);
      byteArray.writeInt8(number);
      return;
    }
    if (-number <= 0xFFFF) {
      byteArray.writeInt16(INT16_PREFIX);
      byteArray.writeInt16(number);
      return;
    }
    if (-number <= 0xFFFFFF) {
      byteArray.writeInt32(INT32_PREFIX);
      byteArray.writeInt32(number);
      return;
    }
    if (-number <= 0xFFFFFFFF) {
      byteArray.writeInt64(INT64_PREFIX);
      byteArray.writeInt64(number);
      return;
    }
  }
}

/**
 * @param {ByteArray} byteArray
 * @param {Number} number
 * @returns 
 */
function handleFloat(byteArray, number = 0) {
  // TODO 32bit float
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