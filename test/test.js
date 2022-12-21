const assert = require('assert');
const { serialize } = require('../index');
const {
  NIL,
  BOOL_FALSE,
  BOOL_TRUE,
  BIN8_PREFIX,
  BIN16_PREFIX,
  BIN32_PREFIX,
  // EXT8_PREFIX,
  // EXT16_PREFIX,
  // EXT32_PREFIX,
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
  // FINEXT1_PREFIX,
  // FINEXT2_PREFIX,
  // FINEXT4_PREFIX,
  // FINEXT8_PREFIX,
  // FINEXT16_PREFIX,
  STR8_PREFIX,
  STR16_PREFIX,
  STR32_PREFIX,
  ARRAY16_PREFIX,
  ARRAY32_PREFIX,
  MAP16_PREFIX,
  MAP32_PREFIX,
} = require('../index').constants;

describe('Serializer', () => {
  describe('Primitive value', () => {
    it('nil', () => {
      assert.deepEqual(serialize(null), Buffer.from([ NIL ]));
    });

    it('bool true', () => {
      assert.deepEqual(serialize(true), Buffer.from([ BOOL_TRUE ]));
    });
    it('bool false', () => {
      assert.deepEqual(serialize(false), Buffer.from([ BOOL_FALSE ]));
    });

    it('integer positive fixint 7-bit', () => {
      assert.deepEqual(serialize(0), Buffer.from([ 0x00 ]));
      assert.deepEqual(serialize(127), Buffer.from([ 0x7f ]));
    });
    it('integer negative fixint 5-bit', () => {
      assert.deepEqual(serialize(-1), Buffer.from([ 0b11111111 ]));
      assert.deepEqual(serialize(-32), Buffer.from([ 0b11100000 ]));
    });
    it('integer uint 8', () => {
      assert.deepEqual(serialize(2**8-1), Buffer.from([ UINT8_PREFIX,  0xff ]));
    });
    it('integer uint 16', () => {
      assert.deepEqual(serialize(2**16-1), Buffer.from([ UINT16_PREFIX,  0xff, 0xff ]));
    });
    it('integer uint 32', () => {
      assert.deepEqual(serialize(2**32-1), Buffer.from([ UINT32_PREFIX,  0xff, 0xff, 0xff, 0xff, ]));
    });
    it('integer uint 64', () => {
      assert.deepEqual(serialize(BigInt(0x1fffffffffffff)), Buffer.from([ UINT64_PREFIX,  0x00, 0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, ]));
    });
    it('integer int 8', () => {
      assert.deepEqual(serialize(-(2**8/2-1)), Buffer.from([ INT8_PREFIX, 0x81 ]));
    });
    it('integer int 16', () => {
      assert.deepEqual(serialize(-(2**16/2-1)), Buffer.from([ INT16_PREFIX, 0x80, 0x01 ]));
    });
    it('integer int 32', () => {
      assert.deepEqual(serialize(-(2**32/2-1)), Buffer.from([ INT32_PREFIX, 0x80, 0x00, 0x00, 0x01 ]));
    });
    it('integer int 64', () => {
      assert.deepEqual(serialize(BigInt(-(2**64/2-1))), Buffer.from([ INT64_PREFIX, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]));
    });

    it('float 64', () => {
      assert.deepEqual(serialize(1.1), Buffer.from([ FLOAT64_PREFIX, 0x3f, 0xf1, 0x99, 0x99, 0x99, 0x99, 0x99, 0x9a, ]));
    });

    // it('str', () => {
    //   assert(serialize(null).equals(Buffer.from([])));
    // });

    // it('bin', () => {
    //   assert(serialize(null).equals(Buffer.from([])));
    // });

    // it('array', () => {
    //   assert(serialize(null).equals(Buffer.from([])));
    // });

    // it('map', () => {
    //   assert(serialize(null).equals(Buffer.from([])));
    // });

    // TODO ext
    // TODO timestamp
  })

  describe('Object', () => {
    it('"{"compact":true,"schema":0}"', () => {
      const obj = {
        compact: true,
        schema: 0,
      };
      const result = serialize(obj);
      assert.deepEqual(serialize(obj), Buffer.from([
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
        0x00,
      ]));
    });
  });

  describe('Array', () => {})

  describe('Complex', () => {})
});
