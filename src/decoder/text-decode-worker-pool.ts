// @link https://nodejs.org/api/async_context.html#using-asyncresource-for-a-worker-thread-pool
import { AsyncResource } from "node:async_hooks"
import { EventEmitter } from "node:events"
import { Worker } from "node:worker_threads"

/**
 * Definitions for typescript
 */
type Task = {
  task: Uint8Array[]
  callback: Callback
}
type Callback = (err: Error | null, result: string[] | null) => void
type NodeWorker = Worker & {
  [index: symbol]: WorkerPoolTaskInfo | null
}

/**
 * WorkerPool
 */
export default class WorkerPool extends EventEmitter {
  workerPathname: string
  numThreads: number
  workers: NodeWorker[]
  freeWorkers: NodeWorker[]

  /** Task queue */
  tasks: Task[]

  constructor(workerPathname: string, numThreads: number) {
    super()
    this.workerPathname = workerPathname
    this.numThreads = numThreads
    this.workers = []
    this.freeWorkers = []
    this.tasks = []

    for (let i = 0; i < numThreads; i++) this.addNewWorker()

    // Any time the kWorkerFreedEvent is emitted, dispatch
    // the next task pending in the queue, if any.
    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const { task, callback } = this.tasks.shift()!
        this.runTask(task, callback)
      }
    })
  }

  addNewWorker() {
    const worker = new Worker(this.workerPathname) as NodeWorker
    worker.on("message", (result: string) => {
      // In case of success: Call the callback that was passed to `runTask`,
      // remove the `TaskInfo` associated with the Worker, and mark it as free
      // again.
      worker[kTaskInfo]!.done(null, result)
      worker[kTaskInfo] = null
      this.freeWorkers.push(worker)
      this.emit(kWorkerFreedEvent)
    })
    worker.on("error", (err) => {
      // In case of an uncaught exception: Call the callback that was passed to
      // `runTask` with the error.
      if (worker[kTaskInfo]) worker[kTaskInfo].done(err, null)
      else this.emit("error", err)
      // Remove the worker from the list and start a new Worker to replace the
      // current one.
      this.workers.splice(this.workers.indexOf(worker), 1)
      this.addNewWorker()
    })
    this.workers.push(worker)
    this.freeWorkers.push(worker)
    this.emit(kWorkerFreedEvent)
  }

  runTask(task: Uint8Array[], callback: Callback) {
    if (this.freeWorkers.length === 0) {
      // No free threads, wait until a worker thread becomes free.
      this.tasks.push({ task, callback })
      return
    }

    const worker = this.freeWorkers.pop()!
    worker[kTaskInfo] = new WorkerPoolTaskInfo(callback)
    worker.postMessage(task)
  }

  close() {
    for (const worker of this.workers) worker.terminate()
  }
}

/**
 * WorkerPoolTaskInfo
 */
const kTaskInfo = Symbol("kTaskInfo")
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent")

class WorkerPoolTaskInfo extends AsyncResource {
  constructor(public callback: Callback) {
    super("WorkerPoolTaskInfo")
    this.callback = callback
  }

  done(err: Error | null, result: string | null) {
    this.runInAsyncScope(this.callback, null, err, result)
    this.emitDestroy() // `TaskInfo`s are used only once.
  }
}
