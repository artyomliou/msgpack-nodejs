import parseBuffer, {
  AllNode,
  ArrayNode,
  MapNode,
  StringNode,
} from "./typed-value-resolver.js"
import { DecodeOutput } from "../types.js"
import StructBuilder from "./struct-builder.js"
import WorkerPool from "./text-decode-worker-pool.js"
import { textDecode } from "./text-decode.js"
import { resolve } from "path"

export default function msgPackDecode(buffer: Uint8Array): DecodeOutput {
  console.time("decode as tree")
  const [root, stringNodes] = decodeBinaryAsTree(buffer)
  console.timeEnd("decode as tree")

  console.time("decode all string node")
  for (const stringNode of stringNodes) {
    stringNode.val = textDecode(stringNode.buf)
  }
  console.timeEnd("decode all string node")

  if (root instanceof MapNode || root instanceof ArrayNode) {
    console.time("tree to primitive")
    const output = treeToPrimitive(root)
    console.timeEnd("tree to primitive")
    return output
  } else if (root instanceof StringNode) {
    return textDecode(root.buf)
  } else {
    return root.val
  }
}

export async function msgPackDecodeAsync(
  buffer: Uint8Array
): Promise<DecodeOutput> {
  console.time("decode as tree")
  const [root, stringNodes] = decodeBinaryAsTree(buffer)
  console.timeEnd("decode as tree")

  if (root instanceof MapNode || root instanceof ArrayNode) {
    console.time("decode all string node")
    await decodeAllStringNodeNoFind(stringNodes)
    console.timeEnd("decode all string node")

    console.time("tree to primitive")
    const output = treeToPrimitive(root)
    console.timeEnd("tree to primitive")

    return output
  } else if (root instanceof StringNode) {
    return textDecode(root.buf)
  } else {
    return root.val
  }
}

/**
 * Decode one-dimensional buffer to two-dimensional tree
 */
function decodeBinaryAsTree(buffer: Uint8Array): [AllNode, StringNode[]] {
  const builder = new StructBuilder()
  const generator = parseBuffer(buffer)
  while (true) {
    const iteration = generator.next()
    if (iteration.done) {
      return [builder.struct, iteration.value]
    }
    const node = iteration.value
    // Initiate a struct in StructBuilder
    if (node instanceof ArrayNode || node instanceof MapNode) {
      builder.newStruct(node) // will also call insertValue()
      continue
    }
    // If the buffer only contains this value, then return it directly
    if (!builder.insertValue(node)) {
      return [node, []]
    }
  }
}

async function decodeAllStringNodeNoFind(nodes: StringNode[]) {
  const workerCount = 5
  const chunkSize = Math.ceil(nodes.length / workerCount)

  // Prepare worker for text-decoding
  console.time("create workers")
  const pool = new WorkerPool(
    resolve(__dirname, "./text-decode-worker.js"),
    workerCount
  )
  console.timeEnd("create workers")

  console.time("schedule all tasks")
  let promises = []
  for (let i = 0; i < nodes.length; i += chunkSize) {
    const promise = new Promise<void>((resolve, reject) => {
      pool.runTask(
        nodes.slice(i, i + chunkSize).map((node) => node.buf.slice().buffer),
        (err, result) => {
          if (result) {
            for (let j = 0; j < result.length; j++) {
              nodes[i + j].val = result[j]
            }
            resolve()
          } else if (err) {
            reject(err)
          }
        }
      )
    })
    promises.push(promise)
  }
  console.timeEnd("schedule all tasks")

  console.time("run all tasks")
  await Promise.allSettled(promises)
  console.timeEnd("run all tasks")

  pool.close()
}

/**
 * Recursive replace node with its primitive value
 * (Every encountered StringNode with a undefined "val", this function will use ```textDecode()``` to decode it.)
 */
function treeToPrimitive(root: AllNode): DecodeOutput {
  if (root instanceof MapNode) {
    const output: Record<string, DecodeOutput> = {}
    for (const key of root.elements) {
      if (key.next instanceof MapNode || key.next instanceof ArrayNode) {
        output[key.val!] = treeToPrimitive(key.next)
      } else {
        output[key.val!] = key.next?.val
      }
    }
    return output
  } else if (root instanceof ArrayNode) {
    return root.elements.map((elm) => {
      if (elm instanceof MapNode || elm instanceof ArrayNode) {
        return treeToPrimitive(elm)
      } else {
        return elm.val
      }
    })
  } else {
    return root
  }
}
