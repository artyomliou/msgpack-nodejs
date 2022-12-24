module.exports = class TimeSpec {

  /**
   * @param {Date} date 
   */
  static fromDate(date) {
    const sec = Math.floor(date.valueOf() / 1000);
    const nsec = (date.valueOf() - sec*1000) * 1000000;
    return new TimeSpec(sec, nsec);
  }

  /**
   * @param {Number|bigint} sec 
   * @param {Number} nsec 
   */
  constructor(sec, nsec = 0) {
    if (typeof sec == 'bigint') {
      sec = Number(sec);
    }
    this.sec = sec;
    this.nsec = nsec;
  }

  /**
   * @param {Number} nsec 
   * @returns 
   */
  setNsec(nsec = 0) {
    this.nsec = nsec;
    return this;
  }

  /**
   * @returns {Date}
   */
  toDate() {
    return new Date(this.sec * 1000 + Math.floor(this.nsec / 1000000));
  }

}