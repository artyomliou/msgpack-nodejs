import encode from "./encoder/encoder.js"
import decode from "./decoder/decoder.js"

export { encode, decode }

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-undef
  // window.MessagePackNodejs = {
  //   encode,
  //   decode
  // }
}
