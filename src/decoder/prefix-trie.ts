// Stat
interface Stat {
  hit: number
  missed: number
  totalRoundTrip: number
  avgRoundTrip?: number
}

const tries: Record<string, PrefixTrie> = {}

export function prefixTrieStat() {
  const output: Record<string, Stat> = {}
  for (const [name, trie] of Object.entries(tries)) {
    output[name] = Object.assign({}, trie.stat, {
      avgRoundTrip:
        trie.stat.totalRoundTrip / (trie.stat.missed + trie.stat.hit),
    })
  }
  return output
}

// Prefix trie
interface Node {
  value: string | null
  [num: number]: Node
}

export default class PrefixTrie {
  public stat: Stat
  private root: Node

  constructor(name: string) {
    tries[name] = this
    this.stat = {
      hit: 0,
      missed: 0,
      totalRoundTrip: 0,
    }
    this.root = {
      value: null,
    } as Node
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
