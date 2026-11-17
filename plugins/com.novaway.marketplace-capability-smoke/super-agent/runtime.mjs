export default {
  id: "capability-runtime",
  version: "1.0.0",
  runtimeType: "marketplace-smoke",
  capabilities: ["streaming", "pause", "resume", "cancellation"],
  supports: { streaming: true, pause: true, resume: true, cancellation: true },
  async discover() { return { id: "capability-runtime", available: true } },
  async start(input) {
    let stopped = false
    return {
      id: `capability-run:${input.threadID}`,
      type: "marketplace-smoke",
      async start() {},
      async send() {},
      async next() { return { kind: "done", summary: "capability runtime completed" } },
      async stop() { stopped = true; return { clean: stopped } },
    }
  },
  events() { return { [Symbol.asyncIterator]: async function* () {} } },
  dispose() {},
}
