import { CustomExtension } from "./interface.js"
import TimestampExtension from "./timestamp-extension.js"

type MapKey = number | Function
const registeredExtensions: Map<MapKey, CustomExtension<unknown>> = new Map()

/**
 * Predefined extensions
 * @link https://github.com/msgpack/msgpack/blob/master/spec.md#extension-types
 */
const predefinedExtensions = [TimestampExtension]
for (const ext of predefinedExtensions) {
  registeredExtensions.set(ext.objConstructor, ext)
  registeredExtensions.set(ext.type, ext)
}

/**
 * Register custom extension (Valid type (number) ranges from 0 to 127.)
 */
export function registerExtension(ext: CustomExtension<unknown>) {
  if (ext.type < 0 || ext.type > 127) {
    throw new Error(
      "Extension registration failed. Valid type (number) ranges from 0 to 127."
    )
  }
  if (ext.objConstructor === {}.constructor) {
    throw new Error("Cannot use the constructor of plain object.")
  }
  if (registeredExtensions.has(ext.objConstructor)) {
    throw new Error(
      `Extension registration failed. The object's class was registered. (${ext.objConstructor.name}).`
    )
  }
  if (registeredExtensions.has(ext.type)) {
    throw new Error(
      `Extension registration failed. The type (number) was registered. (${ext.type}).`
    )
  }
  registeredExtensions.set(ext.objConstructor, ext)
  registeredExtensions.set(ext.type, ext)
}

/**
 * Get registered extension using object's constructor (function) or extension's type (number)
 */
export function getExtension(key: MapKey) {
  return registeredExtensions.get(key)
}
