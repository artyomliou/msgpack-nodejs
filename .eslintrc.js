module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  rules: {
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warning",
    "@typescript-eslint/no-var-requires": "warning",
  },
}
