module.exports = async () => {
  // This setting ensures tests of Date() wont fail
  process.env.TZ = "UTC"
}
