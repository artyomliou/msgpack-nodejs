export function prefixTrieStat() {
  return tries.map(({ stat }) => {
    return Object.assign({}, stat, {
      avgRoundTrip: stat.totalRoundTrip / (stat.missed + stat.hit),
    })
  })
}
const tries: Array<PrefixTrie> = []

interface Node {
  value: string | null
  [num: number]: Node
}

export default class PrefixTrie {
  private root: Node
  public stat: { hit: number; missed: number; totalRoundTrip: number }
  constructor() {
    this.root = {
      value: null,
    } as Node
    this.stat = {
      hit: 0,
      missed: 0,
      totalRoundTrip: 0,
    }
    tries.push(this)
  }
  insert(seq: Uint8Array, value: string) {
    let node = this.root
    for (let i = 0; i < seq.byteLength; i++) {
      const key = seq[i]
      if (!(key in node)) {
        node[key] = { value: null } as Node
      }
      node = node[key]
    }
    node.value = value
  }
  search(seq: Uint8Array): string | null {
    let node = this.root
    let i = 0
    for (; i < seq.byteLength; i++) {
      const key = seq[i]
      if (!(key in node)) {
        this.stat.missed++
        this.stat.totalRoundTrip += i
        return null
      }
      node = node[key]
    }
    this.stat.totalRoundTrip += i
    this.stat.hit++
    return node.value
  }
}
