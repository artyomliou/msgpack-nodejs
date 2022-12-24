const assert = require('assert');
const { serialize, deserialize } = require('../index');
const TimeSpec = require('../src/TimeSpec');

/**
 * Optimized way to create object with many keys
 * @param {Number} size 
 */
const generateMap = (size = 1) => {
  const pairs = new Array(size).fill(0).map((v, i) => [String(i) , v]);
  return Object.fromEntries(pairs);
}

describe('Serializer', () => {
  describe('Primitive value', () => {
    it('nil', () => {
      assert.deepEqual(deserialize(serialize(null)), null);
    });

    it('bool true', () => {
      assert.deepEqual(deserialize(serialize(true)), true);
    });
    it('bool false', () => {
      assert.deepEqual(deserialize(serialize(false)), false);
    });

    it('integer positive fixint 7-bit', () => {
      const values = [
        0,
        64,
        128,
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('integer negative fixint 5-bit', () => {
      const values = [
        -1,
        -32,
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('integer uint 8', () => {
      const values = [
        2**8-1,
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('integer uint 16', () => {
      const values = [
        2**16-1,
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('integer uint 32', () => {
      const values = [
        2**32-1,
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('integer uint 64', () => {
      const values = [
        BigInt(0x1fffffffffffff),
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('integer int 8', () => {
      const values = [
        -128,
        127,
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('integer int 16', () => {
      const values = [
        -32768,
        32767,
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('integer int 32', () => {
      const values = [
        -(2**31),
        (2**31)-1,
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('integer int 64', () => {
      const values = [
        BigInt(-(2**63)),
        BigInt((2**63)-1),
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });

    it('float 64', () => {
      const values = [
        1.1,
        BigInt(Number.MAX_SAFE_INTEGER),
        BigInt(Number.MIN_SAFE_INTEGER),
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });

    it('str fixstr', () => {
      const values = [
        'a',
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('str 8', () => {
      const values = [
        // per CJK character should be 3 to 4 bytes, we need 63 chars to achieve (2**8-1) bytes
        '一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三',
        '😂',
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('str 16', () => {
      const values = [
        // 64 characters (Reason: 64 * 4 bytes > 2**8-1 bytes) 
        '一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四',
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    // TODO str 32

    it('bin 8', () => {
      const values = [
        // basically same as str 8
        Buffer.from('一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三', 'binary'),
        Buffer.from('😂'),
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('bin 16', () => {
      const values = [
        // basically same as str 16
        Buffer.from('一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四五六七八九十壹貳參肆伍陸柒捌玖拾一二三四', 'binary'),
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    // TODO bin 32

    // timestamp
    it('timestamp 32', () => {
      const msec = 0;
      const values = [
        new Date(2022, 1, 1, 1, 1, 1, msec),
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('timestamp 64', () => {
      const msec = 1;
      const values = [
        new Date(1970, 7, 1, 0, 0, 1, msec),
        new Date(2077, 0, 1, 0, 0, 1, msec),
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    })
    it('timestamp 96', () => {
      const msec = 123;
      const values = [
        new Date(2600, 0),
        new Date(1800, 0),
        new Date(0, 0),
        new Date(-1, 0),
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v, true), true), v);
      }
    })

    // TODO ext
  });

  describe('Nestable structure', () => {
    it('array', () => {
      const values = [
        [],
        [[]],
        [[],[],[]],
        [{},{},{}],
        [[{"a": [{}]}]],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // maximum
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('array 16', () => {
      const values = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], // minimum
        new Array(65535).fill(0), // maximum
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('array 32', () => {
      const values = [
        new Array(65536).fill(0), // minimum
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });

    it('map fixmap', () => {
      const values = [
        {},
        {"a": {}},
        {"a": [{"b": {}}]},
        generateMap(15), // maximum
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('map 16', () => {
      const values = [
        generateMap(16), //minimum
        generateMap(65535), // maximum
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
    it('map 32', () => {
      const values = [
        generateMap(65536), //minimum
      ];
      for (const v of values) {
        assert.deepEqual(deserialize(serialize(v)), v);
      }
    });
  })
});
