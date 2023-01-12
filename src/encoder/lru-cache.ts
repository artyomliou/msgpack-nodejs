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

  constructor(public name: string, public size = 30) {
    caches[name] = this
    this.stat = {
      hit: 0,
      missed: 0,
      evicted: 0,
      rare: 0,
    }
  }

  remember(key: K, cb: CallableFunction): C {
    let val = this.cache.get(key)
    if (typeof val !== "undefined") {
      // Move to last
      this.cache.delete(key)
      this.cache.set(key, val)
      this.stat.hit++
      return val
    }

    // Prevent rare keys
    if (this.rareKeys) {
      // If this key appears first time, we keep record of it.
      if (!this.rareKeys.has(key)) {
        this.rareKeys.add(key)
        // Evict
        if (this.rareKeys.size >= 500) {
          this.stat.rare += this.rareKeys.size
          this.rareKeys.clear()
        }
        return cb(key) as C
      }

      // If this key appears second time, we can cache it.
      this.rareKeys.delete(key)
    }

    // Cache the value
    val = cb(key) as C
    this.cache.set(key, val)
    this.stat.missed++

    // Evict the cache
    if (this.cache.size >= this.size) {
      this.cache.delete(this.cache.keys().next().value)
      this.stat.evicted++
    }

    return val
  }

  noRareKeys() {
    if (!this.rareKeys) {
      this.rareKeys = new Set()
    }
    return this
  }
}
