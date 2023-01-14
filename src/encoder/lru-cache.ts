export function lruCacheStat() {
  const output: Record<string, Stat> = {}
  for (const [name, cache] of Object.entries(caches)) {
    output[name] = cache.stat
  }
  return output
}
const caches: Record<string, LruCache<unknown, unknown>> = {}

interface Stat {
  hit: number
  missed: number
  evicted: number
  rare: number
}

export class LruCache<K, C = Uint8Array> {
  public stat: Stat
  private cache: Map<K, C> = new Map()
  private rareKeys?: Set<K>

  constructor(public name: string, public sizeLimit = 30) {
    caches[name] = this
    this.stat = {
      hit: 0,
      missed: 0,
      evicted: 0,
      rare: 0,
    }
  }

  noRareKeys() {
    if (!this.rareKeys) {
      this.rareKeys = new Set()
    }
    return this
  }

  get(key: K): C | undefined {
    const val = this.cache.get(key)
    if (typeof val !== "undefined") {
      // Move to last
      this.cache.delete(key)
      this.cache.set(key, val)
      this.stat.hit++
      return val
    }

    this.stat.missed++
    return undefined
  }

  set(key: K, val: C): void {
    // Prevent rare keys
    if (this.rareKeys) {
      // If this key appears first time, we keep record of it.
      if (!this.rareKeys.has(key)) {
        // Evict then insert
        if (this.rareKeys.size >= 500) {
          this.stat.rare += this.rareKeys.size
          this.rareKeys.clear()
        }
        this.rareKeys.add(key)
        return
      }
      // If this key appears second time, we can cache it.
      // And dont bother to delete the value in Set
    }

    // Cache the value
    this.cache.set(key, val)

    // Evict the cache
    if (this.cache.size >= this.sizeLimit) {
      this.cache.delete(this.cache.keys().next().value)
      this.stat.evicted++
    }
  }
}
