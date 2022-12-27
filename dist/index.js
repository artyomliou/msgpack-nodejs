(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg);
  };
  var __privateGet = (obj, member, getter) => {
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateSet = (obj, member, value, setter) => {
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
  };
  var __privateMethod = (obj, member, method) => {
    __accessCheck(obj, member, "access private method");
    return method;
  };

  // src/ByteArray.js
  var _view, _pos, _ensureEnoughSpace, ensureEnoughSpace_fn;
  var _ByteArray = class {
    constructor() {
      __privateAdd(this, _ensureEnoughSpace);
      __privateAdd(this, _view, void 0);
      __privateAdd(this, _pos, void 0);
      __privateSet(this, _view, new DataView(new ArrayBuffer(_ByteArray.blockByteLength)));
      __privateSet(this, _pos, 0);
    }
    getBuffer() {
      return __privateGet(this, _view).buffer.slice(0, __privateGet(this, _pos));
    }
    writeBuffer(buffer) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, buffer.byteLength, () => {
        const view = new Uint8Array(buffer);
        let localPos = __privateGet(this, _pos);
        for (let i = 0; i < view.length; i++) {
          __privateGet(this, _view).setUint8(localPos++, view[i]);
        }
      });
    }
    writeUint8(number) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, 1, () => {
        __privateGet(this, _view).setUint8(__privateGet(this, _pos), number);
      });
    }
    writeUint16(number) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, 2, () => {
        __privateGet(this, _view).setUint16(__privateGet(this, _pos), number, false);
      });
    }
    writeUint32(number) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, 4, () => {
        __privateGet(this, _view).setUint32(__privateGet(this, _pos), number, false);
      });
    }
    writeUint64(number) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, 8, () => {
        __privateGet(this, _view).setBigUint64(__privateGet(this, _pos), number, false);
      });
    }
    writeInt8(number) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, 1, () => {
        __privateGet(this, _view).setInt8(__privateGet(this, _pos), number);
      });
    }
    writeInt16(number) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, 2, () => {
        __privateGet(this, _view).setInt16(__privateGet(this, _pos), number, false);
      });
    }
    writeInt32(number) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, 4, () => {
        __privateGet(this, _view).setInt32(__privateGet(this, _pos), number, false);
      });
    }
    writeInt64(number) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, 8, () => {
        __privateGet(this, _view).setBigInt64(__privateGet(this, _pos), number, false);
      });
    }
    writeFloat64(number) {
      __privateMethod(this, _ensureEnoughSpace, ensureEnoughSpace_fn).call(this, 8, () => {
        __privateGet(this, _view).setFloat64(__privateGet(this, _pos), number, false);
      });
    }
  };
  var ByteArray = _ByteArray;
  _view = new WeakMap();
  _pos = new WeakMap();
  _ensureEnoughSpace = new WeakSet();
  ensureEnoughSpace_fn = function(byteLength = 0, cb) {
    if (__privateGet(this, _pos) + byteLength >= __privateGet(this, _view).buffer.byteLength) {
      const newBlockLength = Math.ceil((__privateGet(this, _view).buffer.byteLength + byteLength) / _ByteArray.blockByteLength) * _ByteArray.blockByteLength;
      const newBuffer = new ArrayBuffer(newBlockLength);
      new Uint8Array(newBuffer).set(new Uint8Array(__privateGet(this, _view).buffer));
      __privateSet(this, _view, new DataView(newBuffer));
    }
    cb();
    __privateSet(this, _pos, __privateGet(this, _pos) + byteLength);
  };
  __publicField(ByteArray, "blockByteLength", 256);

  // src/constants/index.js
  var NIL = 192;
  var BOOL_FALSE = 194;
  var BOOL_TRUE = 195;
  var BIN8_PREFIX = 196;
  var BIN16_PREFIX = 197;
  var BIN32_PREFIX = 198;
  var EXT8_PREFIX = 199;
  var EXT16_PREFIX = 200;
  var EXT32_PREFIX = 201;
  var FLOAT32_PREFIX = 202;
  var FLOAT64_PREFIX = 203;
  var UINT8_PREFIX = 204;
  var UINT16_PREFIX = 205;
  var UINT32_PREFIX = 206;
  var UINT64_PREFIX = 207;
  var INT8_PREFIX = 208;
  var INT16_PREFIX = 209;
  var INT32_PREFIX = 210;
  var INT64_PREFIX = 211;
  var FIXEXT1_PREFIX = 212;
  var FIXEXT2_PREFIX = 213;
  var FIXEXT4_PREFIX = 214;
  var FIXEXT8_PREFIX = 215;
  var FIXEXT16_PREFIX = 216;
  var STR8_PREFIX = 217;
  var STR16_PREFIX = 218;
  var STR32_PREFIX = 219;
  var ARRAY16_PREFIX = 220;
  var ARRAY32_PREFIX = 221;
  var MAP16_PREFIX = 222;
  var MAP32_PREFIX = 223;
  var EXT_TYPE_TIMESTAMP = -1;

  // src/TimeSpec.js
  var TimeSpec = class {
    static fromDate(date) {
      const sec = Math.floor(date.valueOf() / 1e3);
      const nsec = (date.valueOf() - sec * 1e3) * 1e6;
      return new TimeSpec(sec, nsec);
    }
    constructor(sec, nsec = 0) {
      this.sec = sec;
      this.nsec = nsec;
    }
    toDate() {
      return new Date(this.sec * 1e3 + Math.floor(this.nsec / 1e6));
    }
  };

  // src/Serialize.js
  function messagePackSerialize(srcObject, debug = false) {
    const byteArray = new ByteArray();
    match(byteArray, srcObject);
    const buffer = byteArray.getBuffer();
    if (debug) {
      console.debug(buffer);
    }
    return buffer;
  }
  function match(byteArray, val) {
    switch (typeof val) {
      case "boolean":
        handleBoolean(byteArray, val);
        break;
      case "bigint":
        handleInteger(byteArray, val);
        break;
      case "number":
        if (Number.isInteger(val)) {
          handleInteger(byteArray, val);
        } else {
          handleFloat(byteArray, val);
        }
        break;
      case "string":
        handleString(byteArray, val);
        break;
      case "object":
        if (val === null) {
          byteArray.writeUint8(NIL);
          break;
        }
        if (val instanceof Date) {
          handleTimestamp(byteArray, val);
          break;
        }
        if (val instanceof ArrayBuffer) {
          handleBuffer(byteArray, val);
          break;
        }
        if (Array.isArray(val)) {
          handleArray(byteArray, val);
          for (const element of val) {
            match(byteArray, element);
          }
          break;
        }
        handleMap(byteArray, val);
        for (const [k, v] of val instanceof Map ? val.entries() : Object.entries(val)) {
          handleString(byteArray, k);
          match(byteArray, v);
        }
        break;
      default:
        console.debug("noop", val);
        break;
    }
  }
  function handleBoolean(byteArray, val = true) {
    if (val) {
      byteArray.writeUint8(BOOL_TRUE);
    } else {
      byteArray.writeUint8(BOOL_FALSE);
    }
  }
  function handleInteger(byteArray, number = 0) {
    if (number >= 0 && number <= 127) {
      byteArray.writeUint8(number);
      return;
    }
    if (number < 0 && number >= -32) {
      byteArray.writeInt8(number);
      return;
    }
    if (number > 0) {
      if (number <= 255) {
        byteArray.writeUint8(UINT8_PREFIX);
        byteArray.writeUint8(number);
        return;
      }
      if (number <= 65535) {
        byteArray.writeUint8(UINT16_PREFIX);
        byteArray.writeUint16(number);
        return;
      }
      if (number <= 4294967295) {
        byteArray.writeUint8(UINT32_PREFIX);
        byteArray.writeUint32(number);
        return;
      }
      byteArray.writeUint8(UINT64_PREFIX);
      byteArray.writeUint64(number);
      return;
    }
    if (number < 0) {
      if (-number <= 255) {
        byteArray.writeUint8(INT8_PREFIX);
        byteArray.writeInt8(number);
        return;
      }
      if (-number <= 65535) {
        byteArray.writeUint8(INT16_PREFIX);
        byteArray.writeInt16(number);
        return;
      }
      if (-number <= 4294967295) {
        byteArray.writeUint8(INT32_PREFIX);
        byteArray.writeInt32(number);
        return;
      }
      byteArray.writeUint8(INT64_PREFIX);
      byteArray.writeInt64(number);
    }
  }
  function handleFloat(byteArray, number = 0) {
    byteArray.writeUint8(FLOAT64_PREFIX);
    byteArray.writeFloat64(number);
  }
  function handleString(byteArray, string = "") {
    const strBuf = new TextEncoder().encode(string);
    const bytesCount = strBuf.byteLength;
    if (bytesCount <= 31) {
      byteArray.writeUint8(160 + bytesCount);
      byteArray.writeBuffer(strBuf);
      return;
    }
    if (bytesCount < 255) {
      byteArray.writeUint8(STR8_PREFIX);
      byteArray.writeUint8(bytesCount);
      byteArray.writeBuffer(strBuf);
      return;
    }
    if (bytesCount < 65535) {
      byteArray.writeUint8(STR16_PREFIX);
      byteArray.writeUint16(bytesCount);
      byteArray.writeBuffer(strBuf);
      return;
    }
    if (bytesCount < 4294967295) {
      byteArray.writeUint8(STR32_PREFIX);
      byteArray.writeUint32(bytesCount);
      byteArray.writeBuffer(strBuf);
      return;
    }
    throw new Error("Length of string value cannot exceed (2^32)-1.");
  }
  function handleBuffer(byteArray, buffer) {
    const bytesCount = buffer.byteLength;
    if (bytesCount < 255) {
      byteArray.writeUint8(BIN8_PREFIX);
      byteArray.writeUint8(bytesCount);
      byteArray.writeBuffer(buffer);
      return;
    }
    if (bytesCount < 65535) {
      byteArray.writeUint8(BIN16_PREFIX);
      byteArray.writeUint16(bytesCount);
      byteArray.writeBuffer(buffer);
      return;
    }
    if (bytesCount < 4294967295) {
      byteArray.writeUint8(BIN32_PREFIX);
      byteArray.writeUint32(bytesCount);
      byteArray.writeBuffer(buffer);
      return;
    }
    throw new Error("Length of binary value cannot exceed (2^32)-1.");
  }
  function handleArray(byteArray, array = {}) {
    const arraySize = array.length;
    if (arraySize < 15) {
      byteArray.writeUint8(144 + arraySize);
      return;
    }
    if (arraySize < 65535) {
      byteArray.writeUint8(ARRAY16_PREFIX);
      byteArray.writeUint16(arraySize);
      return;
    }
    if (arraySize < 4294967295) {
      byteArray.writeUint8(ARRAY32_PREFIX);
      byteArray.writeUint32(arraySize);
      return;
    }
    throw new Error("Number of elements cannot exceed (2^32)-1.");
  }
  function handleMap(byteArray, map = {}) {
    const mapSize = map instanceof Map ? map.size : Object.keys(map).length;
    if (mapSize < 15) {
      byteArray.writeUint8(128 + mapSize);
      return;
    }
    if (mapSize < 65535) {
      byteArray.writeUint8(MAP16_PREFIX);
      byteArray.writeUint16(mapSize);
      return;
    }
    if (mapSize < 4294967295) {
      byteArray.writeUint8(MAP32_PREFIX);
      byteArray.writeUint32(mapSize);
      return;
    }
    throw new Error("Number of pairs cannot exceed (2^32)-1.");
  }
  function handleTimestamp(byteArray, date) {
    const time = TimeSpec.fromDate(date);
    if (time.nsec > 1e9) {
      throw new Error("Nanoseconds cannot be larger than 999999999.");
    }
    if (time.sec >= 0 && time.sec <= 4294967295) {
      if (time.nsec === 0) {
        const view = new DataView(new ArrayBuffer(4));
        view.setUint32(0, Number(time.sec), false);
        handleExt(byteArray, EXT_TYPE_TIMESTAMP, view.buffer);
      } else {
        const data64 = (BigInt(time.nsec) << 34n) + BigInt(time.sec);
        const view = new DataView(new ArrayBuffer(8));
        view.setBigUint64(0, data64, false);
        handleExt(byteArray, EXT_TYPE_TIMESTAMP, view.buffer);
      }
    } else {
      const view = new DataView(new ArrayBuffer(12));
      view.setUint32(0, time.nsec, false);
      view.setBigInt64(4, BigInt(time.sec), false);
      handleExt(byteArray, EXT_TYPE_TIMESTAMP, view.buffer);
    }
  }
  function handleExt(byteArray, type, data) {
    const byteLength = data.byteLength;
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
    if (byteLength < 255) {
      byteArray.writeUint8(EXT8_PREFIX);
      byteArray.writeUint8(byteLength);
      byteArray.writeInt8(type);
      byteArray.writeBuffer(data);
      return;
    } else if (byteLength < 65535) {
      byteArray.writeUint8(EXT16_PREFIX);
      byteArray.writeUint16(byteLength);
      byteArray.writeInt8(type);
      byteArray.writeBuffer(data);
      return;
    } else if (byteLength < 4294967295) {
      byteArray.writeUint8(EXT32_PREFIX);
      byteArray.writeUint32(byteLength);
      byteArray.writeInt8(type);
      byteArray.writeBuffer(data);
      return;
    }
    throw new Error("Ext does not support data exceeding 2**32-1 bytes.");
  }

  // src/StructContext.js
  var StructContext = class {
    constructor(ref, isMap = true, isArray = false, elementsLeft = 0) {
      this.ref = ref;
      this.isMap = isMap;
      this.isArray = isArray;
      this.elementsLeft = elementsLeft;
    }
  };

  // src/TypedValueResolver.js
  var _handleInteger, handleInteger_fn, _handleNil, handleNil_fn, _handleBool, handleBool_fn, _handleFloat, handleFloat_fn, _handleStr, handleStr_fn, _handleBin, handleBin_fn, _handleArray, handleArray_fn, _handleMap, handleMap_fn, _handleExt, handleExt_fn, _calculateDataRange, calculateDataRange_fn;
  var _TypedValueResolver = class {
    constructor(view, pos = 0) {
      __privateAdd(this, _handleInteger);
      __privateAdd(this, _handleNil);
      __privateAdd(this, _handleBool);
      __privateAdd(this, _handleFloat);
      __privateAdd(this, _handleStr);
      __privateAdd(this, _handleBin);
      __privateAdd(this, _handleArray);
      __privateAdd(this, _handleMap);
      __privateAdd(this, _handleExt);
      __privateAdd(this, _calculateDataRange);
      __publicField(this, "type", 0);
      __publicField(this, "value", null);
      __publicField(this, "byteLength", 0);
      __publicField(this, "elementCount", 0);
      const firstByte = view.getUint8(pos);
      pos++;
      const searchResult = _TypedValueResolver.prefixTypeMap.get(firstByte);
      if (searchResult) {
        switch (searchResult) {
          case _TypedValueResolver.typeInt:
            __privateMethod(this, _handleInteger, handleInteger_fn).call(this, view, pos, firstByte);
            return;
          case _TypedValueResolver.typeNil:
            __privateMethod(this, _handleNil, handleNil_fn).call(this, view, pos, firstByte);
            return;
          case _TypedValueResolver.typeBool:
            __privateMethod(this, _handleBool, handleBool_fn).call(this, view, pos, firstByte);
            return;
          case _TypedValueResolver.typeFloat:
            __privateMethod(this, _handleFloat, handleFloat_fn).call(this, view, pos, firstByte);
            return;
          case _TypedValueResolver.typeStr:
            __privateMethod(this, _handleStr, handleStr_fn).call(this, view, pos, firstByte);
            return;
          case _TypedValueResolver.typeBin:
            __privateMethod(this, _handleBin, handleBin_fn).call(this, view, pos, firstByte);
            return;
          case _TypedValueResolver.typeArray:
            __privateMethod(this, _handleArray, handleArray_fn).call(this, view, pos, firstByte);
            return;
          case _TypedValueResolver.typeMap:
            __privateMethod(this, _handleMap, handleMap_fn).call(this, view, pos, firstByte);
            return;
          case _TypedValueResolver.typeExt:
            __privateMethod(this, _handleExt, handleExt_fn).call(this, view, pos, firstByte);
            return;
          default:
            throw new Error("Should match exactly one type.");
        }
      }
      if (firstByte >= 0 && firstByte <= 127) {
        __privateMethod(this, _handleInteger, handleInteger_fn).call(this, view, pos, firstByte);
      } else if (firstByte >= 224 && firstByte <= 255) {
        __privateMethod(this, _handleInteger, handleInteger_fn).call(this, view, pos, firstByte);
      } else if (firstByte >= 160 && firstByte <= 191) {
        __privateMethod(this, _handleStr, handleStr_fn).call(this, view, pos, firstByte);
      } else if (firstByte >= 144 && firstByte <= 159) {
        __privateMethod(this, _handleArray, handleArray_fn).call(this, view, pos, firstByte);
      } else if (firstByte >= 128 && firstByte <= 143) {
        __privateMethod(this, _handleMap, handleMap_fn).call(this, view, pos, firstByte);
      } else {
        const firtByteHex = firstByte.toString(16);
        console.error("Unknown first byte.", firtByteHex);
        throw new Error(`Unknown first byte. (${firtByteHex})`);
      }
    }
  };
  var TypedValueResolver = _TypedValueResolver;
  _handleInteger = new WeakSet();
  handleInteger_fn = function(view, pos, firstByte) {
    this.type = _TypedValueResolver.typeInt;
    if (firstByte >= 0 && firstByte <= 127) {
      this.byteLength = 1;
      this.value = view.getUint8(pos - 1);
    } else if (firstByte >= 224 && firstByte <= 255) {
      this.byteLength = 1;
      this.value = view.getInt8(pos - 1);
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
  };
  _handleNil = new WeakSet();
  handleNil_fn = function(view, pos, firstByte) {
    this.type = _TypedValueResolver.typeNil;
    this.byteLength = 1;
    this.value = null;
  };
  _handleBool = new WeakSet();
  handleBool_fn = function(view, pos, firstByte) {
    this.type = _TypedValueResolver.typeBool;
    this.byteLength = 1;
    this.value = firstByte === BOOL_TRUE;
  };
  _handleFloat = new WeakSet();
  handleFloat_fn = function(view, pos, firstByte) {
    this.type = _TypedValueResolver.typeFloat;
    if (firstByte === FLOAT32_PREFIX) {
      this.byteLength = 5;
      this.value = view.getFloat32(pos, false);
    } else if (firstByte === FLOAT64_PREFIX) {
      this.byteLength = 9;
      this.value = view.getFloat64(pos, false);
    }
  };
  _handleStr = new WeakSet();
  handleStr_fn = function(view, pos, firstByte) {
    this.type = _TypedValueResolver.typeStr;
    let sizeByteLength;
    let dataByteLength;
    if (firstByte >= 160 && firstByte <= 191) {
      sizeByteLength = 0;
      dataByteLength = firstByte - 160;
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
    this.byteLength = 1 + sizeByteLength + dataByteLength;
    const strDataRange = __privateMethod(this, _calculateDataRange, calculateDataRange_fn).call(this, pos, sizeByteLength, dataByteLength);
    this.value = new TextDecoder().decode(view.buffer.slice(strDataRange.start, strDataRange.end));
  };
  _handleBin = new WeakSet();
  handleBin_fn = function(view, pos, firstByte) {
    this.type = _TypedValueResolver.typeBin;
    let sizeByteLength;
    let dataByteLength;
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
    this.byteLength = 1 + sizeByteLength + dataByteLength;
    const binDataRange = __privateMethod(this, _calculateDataRange, calculateDataRange_fn).call(this, pos, sizeByteLength, dataByteLength);
    this.value = view.buffer.slice(binDataRange.start, binDataRange.end);
  };
  _handleArray = new WeakSet();
  handleArray_fn = function(view, pos, firstByte) {
    this.type = _TypedValueResolver.typeArray;
    this.value = [];
    if (firstByte >= 144 && firstByte <= 159) {
      this.byteLength = 1;
      this.elementCount = firstByte - 144;
    } else if (firstByte === ARRAY16_PREFIX) {
      this.byteLength = 3;
      this.elementCount = view.getUint16(pos);
    } else if (firstByte === ARRAY32_PREFIX) {
      this.byteLength = 5;
      this.elementCount = view.getUint32(pos);
    }
  };
  _handleMap = new WeakSet();
  handleMap_fn = function(view, pos, firstByte) {
    this.type = _TypedValueResolver.typeMap;
    this.value = {};
    if (firstByte >= 128 && firstByte <= 143) {
      this.byteLength = 1;
      this.elementCount = firstByte - 128;
    } else if (firstByte === MAP16_PREFIX) {
      this.byteLength = 3;
      this.elementCount = view.getUint16(pos);
    } else if (firstByte === MAP32_PREFIX) {
      this.byteLength = 5;
      this.elementCount = view.getUint32(pos);
    }
  };
  _handleExt = new WeakSet();
  handleExt_fn = function(view, pos, firstByte) {
    this.type = _TypedValueResolver.typeExt;
    let sizeByteLength;
    let dataByteLength;
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
    this.byteLength = 1 + sizeByteLength + 1 + dataByteLength;
    const extType = view.getInt8(pos + sizeByteLength);
    const extDataRange = __privateMethod(this, _calculateDataRange, calculateDataRange_fn).call(this, pos, sizeByteLength + 1, dataByteLength);
    const data = view.buffer.slice(extDataRange.start, extDataRange.end);
    if (extType === EXT_TYPE_TIMESTAMP) {
      const view2 = new DataView(data);
      if (data.byteLength === 4) {
        const sec = view2.getUint32(0, false);
        this.value = new TimeSpec(sec, 0).toDate();
        return;
      }
      if (data.byteLength === 8) {
        const data64 = view2.getBigUint64(0, false);
        const nsec = Number(data64 >> 34n);
        const sec = Number(data64 & 0x00000003ffffffffn);
        this.value = new TimeSpec(sec, nsec).toDate();
        return;
      }
      if (data.byteLength === 12) {
        const nsec = view2.getUint32(0, false);
        const sec = Number(view2.getBigInt64(4, false));
        this.value = new TimeSpec(sec, nsec).toDate();
        return;
      }
      throw new Error("Timestamp family only supports 32/64/96 bit.");
    } else {
      throw new Error("Does not support unknown ext type.");
    }
  };
  _calculateDataRange = new WeakSet();
  calculateDataRange_fn = function(pos, offset = 0, dataByteLength = 0) {
    return {
      start: pos + offset,
      end: pos + offset + dataByteLength
    };
  };
  __publicField(TypedValueResolver, "typeInt", 1);
  __publicField(TypedValueResolver, "typeNil", 2);
  __publicField(TypedValueResolver, "typeBool", 3);
  __publicField(TypedValueResolver, "typeFloat", 4);
  __publicField(TypedValueResolver, "typeStr", 5);
  __publicField(TypedValueResolver, "typeBin", 6);
  __publicField(TypedValueResolver, "typeArray", 7);
  __publicField(TypedValueResolver, "typeMap", 8);
  __publicField(TypedValueResolver, "typeExt", 9);
  __publicField(TypedValueResolver, "prefixTypeMap", /* @__PURE__ */ new Map([
    [UINT8_PREFIX, _TypedValueResolver.typeInt],
    [UINT16_PREFIX, _TypedValueResolver.typeInt],
    [UINT32_PREFIX, _TypedValueResolver.typeInt],
    [UINT64_PREFIX, _TypedValueResolver.typeInt],
    [INT8_PREFIX, _TypedValueResolver.typeInt],
    [INT16_PREFIX, _TypedValueResolver.typeInt],
    [INT32_PREFIX, _TypedValueResolver.typeInt],
    [INT64_PREFIX, _TypedValueResolver.typeInt],
    [NIL, _TypedValueResolver.typeNil],
    [BOOL_FALSE, _TypedValueResolver.typeBool],
    [BOOL_TRUE, _TypedValueResolver.typeBool],
    [FLOAT32_PREFIX, _TypedValueResolver.typeFloat],
    [FLOAT64_PREFIX, _TypedValueResolver.typeFloat],
    [STR8_PREFIX, _TypedValueResolver.typeStr],
    [STR16_PREFIX, _TypedValueResolver.typeStr],
    [STR32_PREFIX, _TypedValueResolver.typeStr],
    [BIN8_PREFIX, _TypedValueResolver.typeBin],
    [BIN16_PREFIX, _TypedValueResolver.typeBin],
    [BIN32_PREFIX, _TypedValueResolver.typeBin],
    [ARRAY16_PREFIX, _TypedValueResolver.typeArray],
    [ARRAY32_PREFIX, _TypedValueResolver.typeArray],
    [MAP16_PREFIX, _TypedValueResolver.typeMap],
    [MAP32_PREFIX, _TypedValueResolver.typeMap],
    [EXT8_PREFIX, _TypedValueResolver.typeExt],
    [EXT16_PREFIX, _TypedValueResolver.typeExt],
    [EXT32_PREFIX, _TypedValueResolver.typeExt],
    [FIXEXT1_PREFIX, _TypedValueResolver.typeExt],
    [FIXEXT2_PREFIX, _TypedValueResolver.typeExt],
    [FIXEXT4_PREFIX, _TypedValueResolver.typeExt],
    [FIXEXT8_PREFIX, _TypedValueResolver.typeExt],
    [FIXEXT16_PREFIX, _TypedValueResolver.typeExt]
  ]));

  // src/Deserialize.js
  function messagePackDeserialize(srcBuffer, debug = false) {
    const view = new DataView(srcBuffer);
    const contextStack = [];
    let cur = null;
    let res = null;
    let mapKey = null;
    let pos = 0;
    while (pos < view.byteLength) {
      res = new TypedValueResolver(view, pos);
      if (debug) {
        console.log(`pos = ${pos}, type = ${res.type}, val = ${res.value}, byteLength = ${res.byteLength}`);
      }
      pos += res.byteLength;
      if (cur == null ? void 0 : cur.isMap) {
        if (!mapKey) {
          if (res.type !== TypedValueResolver.typeStr) {
            throw new Error("Map key should be a string.");
          }
          mapKey = res.value;
        } else if (mapKey) {
          cur.ref[mapKey] = res.value;
          mapKey = null;
          cur.elementsLeft--;
        }
      } else if (cur == null ? void 0 : cur.isArray) {
        cur.ref.push(res.value);
        cur.elementsLeft--;
      }
      if (res.type === TypedValueResolver.typeMap || res.type === TypedValueResolver.typeArray) {
        if (cur) {
          contextStack.push(cur);
        }
        cur = new StructContext(res.value, res.type === TypedValueResolver.typeMap, res.type === TypedValueResolver.typeArray, res.elementCount);
      }
      while ((cur == null ? void 0 : cur.elementsLeft) === 0 && contextStack.length) {
        cur = contextStack.pop();
      }
    }
    if (!(cur == null ? void 0 : cur.ref)) {
      return res.value;
    }
    return cur.ref;
  }

  // browser.js
  if (typeof window !== "undefined") {
    window.MessagePackNodejs = {
      encode: messagePackSerialize,
      decode: messagePackDeserialize
    };
  }
})();
