const caches: LruCache<unknown>[] = []

export class LruCache<T> {
  stat = {
    hit: 0,
    missed: 0,
    evicted: 0,
  }
  // oneTimeKeys: Set<T> = new Set()
  cache: Map<T, Uint8Array> = new Map()

  constructor(public size = 30) {
    // For stat aggregation
    caches.push(this)
  }

  remember(cb: CallableFunction, key: T): Uint8Array {
    let val = this.cache.get(key)
    if (val instanceof Uint8Array) {
      // Move to last
      this.cache.delete(key)
      this.cache.set(key, val)
      this.stat.hit++
      return val
    }

    // Cache the value
    val = cb(key) as Uint8Array
    this.cache.set(key, val)
    this.stat.missed++

    // Evict the cache
    if (this.cache.size >= this.size) {
      this.cache.delete(this.cache.keys().next().value)
      this.stat.evicted++
    }

    return val
  }
}

export function cacheStatistic() {
  return caches.map((c) => c.stat)
}
