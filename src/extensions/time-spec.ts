export default class TimeSpec {
  constructor (public sec: number, public nsec: number = 0) {}

  toDate (): Date {
    return new Date(this.sec * 1000 + Math.floor(this.nsec / 1000000))
  }

  static fromDate (date: Date): TimeSpec {
    const sec = Math.floor(date.valueOf() / 1000)
    const msec = (date.valueOf() - sec * 1000)
    const nsec = msec * 1000000
    return new TimeSpec(sec, nsec)
  }
}
