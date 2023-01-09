export const HOP_LIMIT = 10
const root: Uint8TreeNode = {}

interface Uint8TreeNode {
  value?: string
  [num: number]: Uint8TreeNode
}

type RememberCallback = (buf?: Uint8Array) => string

export function remember(buf: Uint8Array, cb: RememberCallback): string {
  let node = root
  for (let i = 0; i < buf.byteLength; i++) {
    const key = buf[i]
    if (!(key in node)) {
      node[key] = {} as Uint8TreeNode
    }
    node = node[key]
  }
  return node.value || (node.value = cb(buf))
}
