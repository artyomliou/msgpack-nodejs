import encode from './src/encoder/index.js'
import decode from './src/decoder/index.js'

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
