# Versions

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
