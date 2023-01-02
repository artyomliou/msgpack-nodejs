# Versions

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
