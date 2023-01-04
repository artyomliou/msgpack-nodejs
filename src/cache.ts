const caches: LruCache<unknown, unknown>[] = []

export function cacheStatistic() {
  return caches.map((c) => c.stat)
}

export class LruCache<K, C = Uint8Array> {
  stat = {
    hit: 0,
    missed: 0,
    evicted: 0,
  }
  cache: Map<K, C> = new Map()

  constructor(public size = 30) {
    // For stat aggregation
    caches.push(this)
  }

  remember(cb: CallableFunction, key: K): C {
    let val = this.cache.get(key)
    if (typeof val !== "undefined") {
      // Move to last
      this.cache.delete(key)
      this.cache.set(key, val)
      this.stat.hit++
      return val
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
}
