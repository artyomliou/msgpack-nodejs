# Versions

## Pending

- feat: more available options

## 1.3.6

- optimize: use typescript's private class field. [^1]
- optimize: lower cost of passing cb into LruCache remember()
- optimize(encoder): exponential buffer allocation
- optimize(encoder): separated cache of map-key & string
- optimize(decoder): cache short string(<10) in tree [^2]
- feat: applyOptions()
- fix: remove utf8 encoding implementation

Again, encoding and decoding [aws-ip-ranges.json](test/dataset/aws-ip-ranges.json).

encoding: 40ms -> 35ms

[^1]: [The performance of private class fields was bad before Node.js 18](https://v8.dev/blog/faster-class-features), and [private and protected in Typescript are only are only enforced during type checking](https://www.typescriptlang.org/docs/handbook/2/classes.html#caveats), so it's possible that this change would bring performance improvement.<br>
[^2]: [Inserting numeric integer key in object was pretty fast](https://github.com/artyomliou/benchmark-js-object-addition), and uint8 is great candidate. To avoid too many random access bring negative optimization, just cache short string.

## 1.3.5

- refactor(decoder): for better readability & performance
- feat(decoder): implemented UTF-8 decoding for optimization
- optimize(encoder): better and simpler allocating strategy
- optimize: encoder/decoder perf

Again, encoding and decoding [aws-ip-ranges.json](test/dataset/aws-ip-ranges.json).

encoding: 50ms -> 40ms
decoding: 100ms -> 45ms

## 1.3.4

- optimize: encoder/decoder perf

Again, encoding and decoding [aws-ip-ranges.json](test/dataset/aws-ip-ranges.json).

encoding: 50ms
decoding: 150ms -> 100ms

## 1.3.3

- optimize: encoder/decoder perf with caching and profiler

Again, encoding and decoding [aws-ip-ranges.json](test/dataset/aws-ip-ranges.json).

encoding: 60ms -> 50ms
decoding: 250ms -> 150ms

## 1.3.2

- fix: ESM module import
- fix: **truly improve encoder performance** with larger page & caching map

For example, encoding [aws-ip-ranges.json](test/dataset/aws-ip-ranges.json) in previous release takes 1 second.
Now it takes only 60ms, which improve by 94%.

## 1.3.1

- optimize: improve encoder performance by caching on map and its string key

## 1.3.0

- feat: support custom extension
- BREAKING CHANGE: use Uint8Arry for most encoding/decoding

## 1.2.0

- **refactor: migration to Typescript**
- style: use **typescript-eslint** instead
- style: **prettify on save** (through [.vscode/settings.json](.vscode/settings.json))
- style: use **lint-staged**
- style: use **kebab case** for .ts files
- test: use **ts-jest** instead because of integrating Mocha with typescript is difficult
- build: temporarily suspend support of browser
- build: support both **ES module** & **CommonJS module**

## 1.1.0

- ci: Create node.js.yml
- feat: supports stream
- fix: re-structure this project
- fix(docs): updated with runnable code
- feat(build): Separate entries of browser & server

## 1.0.1

- Support browser with esbuild
- Minify dependency size with .npmignore
