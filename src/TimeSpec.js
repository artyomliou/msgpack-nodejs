module.exports = class TimeSpec {
    /**
     * @param {Number|bigint} sec 
     * @param {Number} nsec 
     */
    constructor(sec, nsec = 0) {
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
     * @param {Date} date 
     */
    static fromDate(date) {
        const msec = date.getMilliseconds();
        const sec = Math.floor(date.getTime() / 1000);
        const nsec = msec * 1000000;
        return new TimeSpec(sec, nsec);
    }
}