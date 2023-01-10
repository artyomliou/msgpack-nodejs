export function uint8TreeStat() {
  return Object.assign({}, stat, {
    avgRoundTrip: stat.totalRoundTrip / (stat.missed + stat.hit),
  })
}
const stat = {
  hit: 0,
  missed: 0,
  totalRoundTrip: 0,
}

interface Uint8TreeNode {
  [num: number]: Uint8TreeNode
}
const root: Uint8TreeNode = {}
const map: Map<Uint8TreeNode, string> = new Map()

export function remember(
  buf: Uint8Array,
  cb: (bytes: Uint8Array) => string
): string {
  let node = root
  let i = 0
  for (; i < buf.byteLength; i++) {
    const key = buf[i]
    if (!(key in node)) {
      node[key] = {} as Uint8TreeNode
    }
    node = node[key]
  }
  stat.totalRoundTrip += i

  let value = map.get(node)
  if (value) {
    stat.hit++
    return value
  }

  value = cb(buf)
  map.set(node, value)
  stat.missed++
  return value
}
