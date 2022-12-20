const assert = require('assert');
const { serialize } = require('../index');

describe('Serializer', () => {
  describe('serialize', () => {
    it('"{"compact":true,"schema":0}"', () => {
      const obj = {
        compact: true,
        schema: 0,
      };
      const result = serialize(obj);
      assert(result.equals(Buffer.from([
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
      ])));
    });
  });
});
