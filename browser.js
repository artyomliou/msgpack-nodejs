import encode from './src/Serialize.js'
import decode from './src/Deserialize.js'

export {
  encode,
  decode
}

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-undef
  window.MessagePackNodejs = {
    encode,
    decode
  }
}
