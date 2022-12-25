export default class TimeSpec {
  /**
   * @param {Date} date
   */
  static fromDate (date) {
    const sec = Math.floor(date.valueOf() / 1000)
    const nsec = (date.valueOf() - sec * 1000) * 1000000
    return new TimeSpec(sec, nsec)
  }

  /**
   * @param {Number} sec
   * @param {Number} nsec
   */
  constructor (sec, nsec = 0) {
    this.sec = sec
    this.nsec = nsec
  }

  /**
   * @returns {Date}
   */
  toDate () {
    return new Date(this.sec * 1000 + Math.floor(this.nsec / 1000000))
  }
}
