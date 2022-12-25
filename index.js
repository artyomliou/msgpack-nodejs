import encode from './src/Serialize.js'
import decode from './src/Deserialize.js'
import * as constants from './src/constants/index.js'

export {
  encode,
  decode,
  constants
}

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-undef
  window.MessagePackNodejs = {
    encode,
    decode,
    ...constants
  }
}
